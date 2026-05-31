package com.momentum.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

public class PendingTasksWidgetRefreshReceiver extends BroadcastReceiver {
    private static final String ACTION_REFRESH = "com.momentum.app.widget.REFRESH";
    private static final int ALARM_TYPE = AlarmManager.RTC;
    private static final long REFRESH_INTERVAL_MILLIS = 60_000L;

    @Override
    public void onReceive(Context context, Intent intent) {
        if (!hasWidgets(context)) {
            cancelRefresh(context);
            return;
        }

        PendingTasksWidgetProvider.updateAllWidgets(context);
        MilestoneWidgetProvider.updateAllWidgets(context);
    }

    public static void scheduleNextRefresh(Context context) {
        if (!hasWidgets(context)) {
            cancelRefresh(context);
            return;
        }

        AlarmManager alarmManager = context.getSystemService(AlarmManager.class);
        if (alarmManager == null) {
            return;
        }

        long triggerAtMillis = System.currentTimeMillis() + REFRESH_INTERVAL_MILLIS;
        PendingIntent refreshIntent = createRefreshIntent(context);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !alarmManager.canScheduleExactAlarms()) {
            alarmManager.setAndAllowWhileIdle(ALARM_TYPE, triggerAtMillis, refreshIntent);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(ALARM_TYPE, triggerAtMillis, refreshIntent);
        } else {
            alarmManager.setExact(ALARM_TYPE, triggerAtMillis, refreshIntent);
        }
    }

    public static void cancelRefresh(Context context) {
        AlarmManager alarmManager = context.getSystemService(AlarmManager.class);
        if (alarmManager != null) {
            alarmManager.cancel(createRefreshIntent(context));
        }
    }

    private static PendingIntent createRefreshIntent(Context context) {
        Intent intent = new Intent(context, PendingTasksWidgetRefreshReceiver.class);
        intent.setAction(ACTION_REFRESH);
        return PendingIntent.getBroadcast(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private static boolean hasWidgets(Context context) {
        return PendingTasksWidgetProvider.hasWidgets(context) || MilestoneWidgetProvider.hasWidgets(context);
    }
}
