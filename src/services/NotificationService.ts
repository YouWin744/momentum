import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { Task } from '../../types';

const CHANNEL_ID = 'momentum-task-reminder';

/**
 * 初始化通知系统：请求权限 + 创建通知渠道
 */
export async function initNotifications(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
        // 浏览器端：请求 Web Notification 权限
        if (!('Notification' in window)) return false;
        if (Notification.permission === 'granted') return true;
        if (Notification.permission === 'denied') return false;
        return (await Notification.requestPermission()) === 'granted';
    }

    // Android/iOS：创建通知渠道 + 请求权限
    await LocalNotifications.createChannel({
        id: CHANNEL_ID,
        name: '任务提醒',
        description: '当任务到达目标时间时发送提醒',
        importance: 5,
        visibility: 1,
        vibration: true,
        sound: 'default',
    });

    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
}

/**
 * 将字符串 ID 哈希为正整数（Capacitor 要求通知 id 为 number）
 */
function hashStringToInt(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return Math.abs(hash) || 1;
}

/**
 * 为单个任务预约通知到 Android 系统闹钟
 * - 如果目标时间已过，不预约
 * - 如果目标时间在未来，预约到该时间点
 */
export async function scheduleTaskNotification(task: Task): Promise<void> {
    const targetTime = new Date(task.targetTime).getTime();
    const now = Date.now();

    // 已过期的不预约
    if (targetTime <= now) return;

    const notifId = hashStringToInt(task.id);

    if (Capacitor.isNativePlatform()) {
        try {
            await LocalNotifications.schedule({
                notifications: [
                    {
                        title: `⏰ ${task.name}`,
                        body: task.description || '任务时间到了！',
                        id: notifId,
                        channelId: CHANNEL_ID,
                        smallIcon: 'ic_launcher_foreground',
                        iconColor: '#4CAF50',
                        schedule: {
                            at: new Date(targetTime),
                            allowWhileIdle: true,
                            repeats: false,
                        },
                        // 确保 Android 端显式开启 allowWhileIdle
                        extra: {
                            allowWhileIdle: true,
                        }
                    },
                ],
            });
            console.log(`[Notification] 任务 "${task.name}" 预约成功: ${new Date(targetTime).toLocaleString()}`);
        } catch (err) {
            console.error('[Notification] 预约失败:', err);
        }
    } else {
        // 浏览器 fallback：用 setTimeout
        const delay = targetTime - now;
        setTimeout(() => {
            if (Notification.permission !== 'granted') return;
            new Notification(`⏰ ${task.name}`, {
                body: task.description || '任务时间到了！',
                tag: `task-${task.id}`,
            });
        }, delay);
    }
}

/**
 * 取消某个任务的预约通知
 */
export async function cancelTaskNotification(taskId: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
        const notifId = hashStringToInt(taskId);
        await LocalNotifications.cancel({ notifications: [{ id: notifId }] });
    } catch (err) {
        console.error('[Notification] 取消失败:', err);
    }
}

/**
 * 同步所有任务的通知：取消全部旧通知，重新预约未过期的任务
 * 适用于 App 启动时调用
 */
export async function syncAllNotifications(tasks: Task[]): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
        // 清除所有已有的本地通知
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
            await LocalNotifications.cancel({ notifications: pending.notifications });
        }
    } catch (err) {
        console.error('[Notification] 清除旧通知失败:', err);
    }

    // 重新预约所有未过期的任务
    for (const task of tasks) {
        await scheduleTaskNotification(task);
    }
}
