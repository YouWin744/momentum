import React, { useState, useEffect, useMemo } from 'react';
import { Task, CompletedTask, ViewType, TaskStatus, TaskType, GroupedCompletedTasks } from './types';
import BottomNav from './components/BottomNav';
import ShortTermPage from './pages/ShortTermPage';
import LongTermPage from './pages/LongTermPage';
import MilestonesPage from './pages/MilestonesPage';
import CompletedPage from './pages/CompletedPage';
import TaskModal from './components/TaskModal';
import { api } from './api';
import {
  initNotifications,
  scheduleTaskNotification,
  cancelTaskNotification,
  syncAllNotifications,
} from './src/services/NotificationService';
import { syncWidgetMilestones, syncWidgetTasks } from './src/services/WidgetService';
import { MilestoneService } from './src/services/MilestoneService';

const INITIAL_HEALTH = 60; // 1 hour

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('short');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<GroupedCompletedTasks>({ expired: [], today: [], tomorrow: [], future: [] });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Load data from Backend
  const refreshData = async () => {
    try {
      const [fetchedTasks, fetchedCompleted] = await Promise.all([
        api.fetchTasks(),
        api.fetchCompletedTasks()
      ]);
      setTasks(fetchedTasks);
      setCompletedTasks(fetchedCompleted);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      const tasksData = await api.fetchTasks();
      const completedData = await api.fetchCompletedTasks();
      const milestonesData = await MilestoneService.getAllMilestones();
      setTasks(tasksData);
      setCompletedTasks(completedData);
      await syncWidgetMilestones(milestonesData);

      // 初始化通知系统并同步所有任务通知
      await initNotifications();
      await syncAllNotifications(tasksData);
    };
    init();

    // Poll for updates every minute to keep health synced roughly
    const interval = setInterval(refreshData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Local ticker for smooth UI health updates between server syncs
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prevTasks => prevTasks.map(task => {
        let newHealth = task.health;
        // Simple client-side simulation
        if (task.status === 'positive') {
          newHealth = Math.min(task.maxHealth, newHealth + 1);
        } else {
          newHealth = Math.max(0, newHealth - 2);
        }
        return { ...task, health: newHealth };
      }));
    }, 60000); // Ticks every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    syncWidgetTasks(tasks).catch(err => console.error('Failed to sync widget tasks:', err));
  }, [tasks]);

  const handleCreateTask = async (data: Partial<Task>) => {
    const newTask: Task = {
      id: Math.random().toString(36).substring(2, 9),
      name: data.name || 'Untitled Task',
      description: data.description || '',
      targetTime: data.targetTime || new Date().toISOString(),
      status: 'positive',
      maxHealth: data.maxHealth || 180,
      health: Math.min(INITIAL_HEALTH, data.maxHealth || 180),
      type: data.type || (activeView === 'short' ? 'short-term' : 'long-term'),
      createdAt: Date.now(),
    };

    await api.createTask(newTask);
    await scheduleTaskNotification(newTask); // 预约通知到系统闹钟
    setTasks([...tasks, newTask]); // Optimistic
    setModalOpen(false);
    refreshData(); // Sync to be sure
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    // 取消旧通知并重新预约
    await cancelTaskNotification(updatedTask.id);
    await scheduleTaskNotification(updatedTask);
    // Optimistic update
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    setModalOpen(false);
    setEditingTask(null);

    await api.updateTask(updatedTask);
    refreshData();
  };

  const handleDeleteTask = async (id: string) => {
    await cancelTaskNotification(id); // 取消已预约的通知
    setTasks(tasks.filter(t => t.id !== id));
    setModalOpen(false);
    setEditingTask(null);

    await api.deleteTask(id);
  };

  const toggleTaskStatus = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newStatus: TaskStatus = task.status === 'positive' ? 'negative' : 'positive';
    const updatedTask = { ...task, status: newStatus };

    setTasks(tasks.map(t => t.id === id ? updatedTask : t));

    // We send the updated task. Server will recalculate health based on previous status time diff, then save new status.
    await api.updateTask(updatedTask);
    refreshData();
  };

  // Final Completion (Short-term check OR Long-term double check)
  const completeTaskFinal = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newCompleted: CompletedTask = {
      ...task,
      completedAt: Date.now(),
      statusAtCompletion: task.status,
      isHistoryRecord: false,
    };

    // Optimistic UI? Complex for grouped. Just wait for refresh or try to patch locally?
    // Let's just refresh. Deleting from tasks is easy.
    await cancelTaskNotification(id); // 取消已预约的通知
    setTasks(tasks.filter(t => t.id !== id));

    await Promise.all([
      api.createCompletedTask(newCompleted),
      api.deleteTask(id)
    ]);

    refreshData();
  };

  // Single Log Completion (Long-term single check)
  const completeTaskLog = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newCompleted: CompletedTask = {
      ...task,
      id: Math.random().toString(36).substring(2, 9), // New ID for the log record
      completedAt: Date.now(),
      statusAtCompletion: task.status,
      isHistoryRecord: true,
    };

    await api.createCompletedTask(newCompleted);
    refreshData();
  };

  const restoreTask = async (id: string) => {
    // Find in completed tasks structure
    let completedTask: CompletedTask | undefined;
    Object.values(completedTasks).forEach((group: CompletedTask[]) => {
      const found = group.find(t => t.id === id);
      if (found) completedTask = found;
    });

    if (!completedTask || completedTask.isHistoryRecord) return;

    const { completedAt, statusAtCompletion, isHistoryRecord, ...originalTask } = completedTask;
    const restoredTask = originalTask as Task;
    // We need to re-create it in tasks and delete from completed

    await Promise.all([
      api.createTask(restoredTask),
      api.deleteCompletedTask(id)
    ]);
    await scheduleTaskNotification(restoredTask); // 恢复的任务重新预约通知

    refreshData();
  };

  const deleteCompletedTaskPermanent = async (id: string) => {
    await api.deleteCompletedTask(id);
    refreshData();
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const shortTermTasks = useMemo(() => tasks.filter(t => t.type === 'short-term'), [tasks]);
  const longTermTasks = useMemo(() => tasks.filter(t => t.type === 'long-term'), [tasks]);

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div className="fixed inset-0 z-0">
        <img
          src={activeView === 'short'
            ? "/assets/images/bg-short.png"
            : activeView === 'long'
              ? "/assets/images/bg-long.png"
              : "/assets/images/bg-completed.png"}
          alt="background"
          className="w-full h-full object-cover transition-opacity duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40"></div>
      </div>

      <main className="relative h-full overflow-y-auto overscroll-contain p-5 pb-32 max-w-2xl mx-auto">
        {activeView === 'short' && (
          <ShortTermPage
            tasks={shortTermTasks}
            onToggleStatus={toggleTaskStatus}
            onComplete={completeTaskFinal}
            onEdit={openEditModal}
          />
        )}
        {activeView === 'long' && (
          <LongTermPage
            tasks={longTermTasks}
            onToggleStatus={toggleTaskStatus}
            onCompleteOnce={completeTaskLog}
            onCompleteFinal={completeTaskFinal}
            onEdit={openEditModal}
          />
        )}
        {activeView === 'completed' && (
          <CompletedPage
            completedTasks={completedTasks}
            onRestore={restoreTask}
            onDeletePermanent={deleteCompletedTaskPermanent}
          />
        )}
        {activeView === 'milestones' && <MilestonesPage />}
      </main>

      <BottomNav activeView={activeView} onViewChange={setActiveView} />

      {(activeView === 'short' || activeView === 'long') && (
        <button
          onClick={openCreateModal}
          className="fixed bottom-28 right-6 w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform z-30"
        >
          <span className="material-symbols-outlined text-3xl font-bold">add</span>
        </button>
      )}

      {modalOpen && (
        <TaskModal
          task={editingTask}
          onSave={editingTask ? handleUpdateTask : handleCreateTask}
          onDelete={handleDeleteTask}
          onClose={() => setModalOpen(false)}
          defaultType={activeView === 'short' ? 'short-term' : 'long-term'}
        />
      )}
    </div>
  );
};

export default App;
