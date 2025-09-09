import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Plus, Settings, BarChart3, Leaf, Music } from 'lucide-react';
import { useTasks, useUserProgress } from '../helpers/useTaskQueries';
import { useSettings } from '../helpers/useSettingsQueries';
import { useNotifications } from '../helpers/useNotifications';
import { Button } from '../components/Button';
import { TaskList } from '../components/TaskList';
import { AddTaskDialog } from '../components/AddTaskDialog';
import { Skeleton } from '../components/Skeleton';
import styles from './dashboard.module.css';

const DashboardSkeleton = () => (
  <div className={styles.container}>
    <header className={styles.header}>
      <Skeleton style={{ height: '2rem', width: '120px' }} />
      <Skeleton style={{ height: '2rem', width: '100px' }} />
    </header>
    <main className={styles.mainContent}>
      <div className={styles.taskListContainer}>
        <Skeleton style={{ height: '3.5rem', marginBottom: 'var(--spacing-3)' }} />
        <Skeleton style={{ height: '3.5rem', marginBottom: 'var(--spacing-3)' }} />
        <Skeleton style={{ height: '3.5rem', marginBottom: 'var(--spacing-3)' }} />
        <Skeleton style={{ height: '3.5rem', width: '80%' }} />
      </div>
    </main>
  </div>
);

const DashboardPage = () => {
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const { data: tasks, isFetching: isFetchingTasks, error: tasksError } = useTasks();
  const { data: userProgress, isFetching: isFetchingProgress, error: progressError } = useUserProgress();
  const { data: settings } = useSettings();
  const { showDailyCheckIn, requestPermission } = useNotifications();

  const isLoading = isFetchingTasks || isFetchingProgress;

  // Daily check-in functionality
  useEffect(() => {
    const checkDailyCheckIn = async () => {
      // Only proceed if settings are loaded and daily check-in is enabled
      if (!settings?.dailyCheckinEnabled) {
        return;
      }

      const today = new Date().toDateString();
      const lastCheckIn = localStorage.getItem('kaikoon-last-checkin');
      
      // If we haven't checked in today, show the daily check-in
      if (lastCheckIn !== today) {
        // Small delay to allow the page to load first
        setTimeout(async () => {
          // Request permission if not already granted
          await requestPermission();
          
          // Show the daily check-in notification
          showDailyCheckIn();
          
          // Update localStorage to prevent repeated prompts today
          localStorage.setItem('kaikoon-last-checkin', today);
        }, 2000); // 2 second delay to allow dashboard to load
      }
    };

    // Only run if we have settings data (avoid running during initial load)
    if (settings !== undefined) {
      checkDailyCheckIn();
    }
  }, [settings, showDailyCheckIn, requestPermission]);

  const handleAddTaskSuccess = () => {
    setAddDialogOpen(false);
  };

  const handleKaibeatClick = () => {
    if (settings?.kaibeatPlaylistUrl) {
      window.open(settings.kaibeatPlaylistUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    }
  };

  return (
    <>
      <Helmet>
        <title>Dashboard | KAIKOON</title>
        <meta name="description" content="Your personal dashboard to manage tasks and track progress." />
      </Helmet>

      {isLoading && !tasks && !userProgress ? (
        <DashboardSkeleton />
      ) : (
        <div className={styles.container}>
          <header className={styles.header}>
            <div className={styles.titleContainer}>
              <img 
                src="https://assets.floot.app/f2f6c53b-4f49-4b32-8826-0c9dc3d3ed07/f67b4d46-fc5f-4f72-abe4-5db0e2a43382.png" 
                alt="KAIKOON logo" 
                className={styles.logo}
              />
              <h1 className={styles.title}>KAIKOON</h1>
            </div>
            <div className={styles.headerRight}>
              <div className={styles.pointsCounter}>
                <img 
                  src="https://assets.floot.app/f2f6c53b-4f49-4b32-8826-0c9dc3d3ed07/2dccdf8e-81e5-41bf-ac41-78c535495933.png" 
                  alt="Kaibloom currency" 
                  className={styles.pointsLogo}
                />
                <span className={styles.pointsValue}>{userProgress?.kaibloomsPoints ?? 0}</span>
                <span className={styles.pointsLabel}>KAIBLOOMS</span>
              </div>
              {settings?.kaibeatPlaylistUrl ? (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  aria-label="Open Kaibeat playlist"
                  className={styles.kaibeatButton}
                  onClick={handleKaibeatClick}
                >
                  <Music size={20} />
                </Button>
              ) : null}
              <Button 
                asChild 
                variant="ghost" 
                size="icon" 
                aria-label="View collectibles"
                className={styles.settingsButton}
              >
                <Link to="/collectibles">
                  <Leaf size={20} />
                </Link>
              </Button>
              <Button 
                asChild 
                variant="ghost" 
                size="icon" 
                aria-label="View reflection logs"
                className={styles.settingsButton}
              >
                <Link to="/reflection-logs">
                  <BarChart3 size={20} />
                </Link>
              </Button>
              <Button 
                asChild 
                variant="ghost" 
                size="icon" 
                aria-label="Open settings"
                className={styles.settingsButton}
              >
                <Link to="/settings">
                  <Settings size={20} />
                </Link>
              </Button>
            </div>
          </header>

          <main className={styles.mainContent}>
            {tasksError ? (
              <div className={styles.errorState}>Failed to load tasks. Please try again later.</div>
            ) : progressError ? (
              <div className={styles.errorState}>Failed to load user progress.</div>
            ) : (
              <TaskList tasks={tasks ?? []} />
            )}
          </main>

          <AddTaskDialog
            open={isAddDialogOpen}
            onOpenChange={setAddDialogOpen}
            onSuccess={handleAddTaskSuccess}
          />

          <div className={styles.fabContainer}>
            <Button
              size="lg"
              className={styles.fab}
              onClick={() => setAddDialogOpen(true)}
              aria-label="Add new task"
            >
              <Plus size={24} />
              Add Task
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardPage;