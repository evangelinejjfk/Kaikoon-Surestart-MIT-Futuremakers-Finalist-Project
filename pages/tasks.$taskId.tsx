import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Timer, Play, Pause, RotateCcw, Check, Clock, ListChecks } from 'lucide-react';

import { useTasks, useUpdateTask } from '../helpers/useTaskQueries';
import { useTimer } from '../helpers/useTimer';
import { useNotifications } from '../helpers/useNotifications';
import { type TaskWithSteps } from '../endpoints/tasks_GET.schema';
import { Button } from '../components/Button';
import { StepItem } from '../components/StepItem';
import { ReflectionDialog } from '../components/ReflectionDialog';
import { Skeleton } from '../components/Skeleton';
import { formatTime } from '../helpers/formatTime';
import { useHapticFeedbackContext } from '../helpers/HapticFeedbackContext';

import styles from './tasks.$taskId.module.css';

const TaskDetailSkeleton = () => (
  <div className={styles.container}>
    <header className={styles.header}>
      <Skeleton style={{ height: '2.5rem', width: '2.5rem', borderRadius: 'var(--radius)' }} />
      <div className={styles.headerTitleContainer}>
        <Skeleton style={{ height: '1.75rem', width: '70%' }} />
        <Skeleton style={{ height: '1rem', width: '40%' }} />
      </div>
    </header>
    <main className={styles.mainContent}>
      <div className={styles.timerCard}>
        <Skeleton style={{ height: '3rem', width: '150px', margin: '0 auto' }} />
        <div className={styles.timerControls}>
          <Skeleton style={{ height: '2.5rem', width: '80px', borderRadius: 'var(--radius-full)' }} />
          <Skeleton style={{ height: '2.5rem', width: '80px', borderRadius: 'var(--radius-full)' }} />
        </div>
      </div>
      <div className={styles.stepsContainer}>
        <Skeleton style={{ height: '1.5rem', width: '120px', marginBottom: 'var(--spacing-4)' }} />
        <div className={styles.stepsList}>
          <Skeleton style={{ height: '4rem', marginBottom: 'var(--spacing-3)' }} />
          <Skeleton style={{ height: '4rem', marginBottom: 'var(--spacing-3)' }} />
          <Skeleton style={{ height: '4rem', width: '80%' }} />
        </div>
      </div>
    </main>
  </div>
);

const TaskDetailPage = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { triggerHapticFeedback } = useHapticFeedbackContext();
  const { showCelebration } = useNotifications();

  const { data: tasks, isFetching, error: tasksError } = useTasks();
  const updateTaskMutation = useUpdateTask();

  const task = useMemo(() => {
    if (!tasks || !taskId) return undefined;
    return tasks.find(t => t.id === parseInt(taskId, 10));
  }, [tasks, taskId]);

  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const [isReflectionDialogOpen, setReflectionDialogOpen] = useState(false);

  const timer = useTimer(0);

  useEffect(() => {
    if (task) {
      const initiallyChecked = new Set<number>();
      task.steps.forEach(step => {
        if (step.completed) {
          initiallyChecked.add(step.id);
        }
      });
      setCheckedSteps(initiallyChecked);
    }
  }, [task]);

  const handleCheckChange = (stepId: number, isChecked: boolean) => {
    setCheckedSteps(prev => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(stepId);
      } else {
        newSet.delete(stepId);
      }
      return newSet;
    });
  };

  const handleFinishTask = () => {
    if (task) {
      showCelebration(task.title); // Show celebration notification for task accomplishment
    }
    triggerHapticFeedback([200, 100, 200]); // Celebration pattern for task completion  
    setReflectionDialogOpen(true);
  };

  const handleReflectionSuccess = () => {
    if (!task) return;

    const updatedSteps = task.steps.map(step => ({
      id: step.id,
      completed: checkedSteps.has(step.id),
    }));

    updateTaskMutation.mutate(
      {
        taskId: task.id,
        completed: true,
        steps: updatedSteps,
      },
      {
        onSuccess: () => {
          if (task) {
            showCelebration(task.title); // Final celebration notification after reflection completion
          }
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          navigate('/');
        },
        onError: (error) => {
          console.error("Failed to mark task as complete:", error);
          // Optionally show a toast notification to the user
        }
      }
    );
  };

  const allStepsCompleted = task ? task.steps.every(step => checkedSteps.has(step.id)) : false;
  const canFinishTask = allStepsCompleted && !timer.isRunning;

  if (isFetching && !task) {
    return <TaskDetailSkeleton />;
  }

  if (tasksError) {
    return (
      <div className={styles.errorState}>
        <p>Error loading task data.</p>
        <Button asChild variant="outline">
          <Link to="/">Go Back</Link>
        </Button>
      </div>
    );
  }

  if (!task) {
    return (
      <div className={styles.errorState}>
        <p>Task not found.</p>
        <Button asChild variant="outline">
          <Link to="/">Go Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{task.title} | KAIKOON</title>
        <meta name="description" content={`Work on your task: ${task.title}`} />
      </Helmet>

      <div className={styles.container}>
        <header className={styles.header}>
          <Button asChild variant="ghost" size="icon" className={styles.backButton}>
            <Link to="/" aria-label="Back to dashboard">
              <ArrowLeft size={24} />
            </Link>
          </Button>
          <div className={styles.headerTitleContainer}>
            <h1 className={styles.taskTitle}>{task.title}</h1>
            <div className={styles.estimatedTime}>
              <Clock size={14} />
              <span>Estimated: {task.estimatedMinutes} minutes</span>
            </div>
          </div>
        </header>

        <main className={styles.mainContent}>
          <div className={styles.timerCard}>
            <div className={styles.timerDisplay}>
              <Timer size={20} className={styles.timerIcon} />
              <span className={styles.timerText}>{formatTime(timer.time)}</span>
            </div>
            <div className={styles.timerControls}>
              <Button
                variant="secondary"
                onClick={() => {
                  triggerHapticFeedback(100); // Medium feedback for timer control
                  timer.isRunning ? timer.pause() : timer.start();
                }}
                className={styles.timerButton}
              >
                {timer.isRunning ? <Pause size={16} /> : <Play size={16} />}
                <span>{timer.isRunning ? 'Pause' : 'Start'}</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  triggerHapticFeedback(150); // Stronger feedback for reset action
                  timer.reset();
                }}
                className={styles.timerButton}
                disabled={timer.time === 0 && !timer.isRunning}
              >
                <RotateCcw size={16} />
                <span>Reset</span>
              </Button>
            </div>
          </div>

          <div className={styles.stepsContainer}>
            <h2 className={styles.stepsHeader}>
              <ListChecks size={20} />
              <span>Checklist</span>
            </h2>
            {task.steps.length > 0 ? (
              <div className={styles.stepsList}>
                {task.steps.map(step => (
                  <StepItem
                    key={step.id}
                    step={step}
                    isChecked={checkedSteps.has(step.id)}
                    onCheckedChange={(checked) => handleCheckChange(step.id, checked)}
                  />
                ))}
              </div>
            ) : (
              <p className={styles.noSteps}>This task has no steps.</p>
            )}
          </div>
        </main>

        {canFinishTask && (
          <footer className={styles.footer}>
            <Button
              size="lg"
              className={styles.finishButton}
              onClick={handleFinishTask}
              disabled={updateTaskMutation.isPending}
            >
              <Check size={20} />
              Finish Task
            </Button>
          </footer>
        )}
      </div>

      <ReflectionDialog
        open={isReflectionDialogOpen}
        onOpenChange={setReflectionDialogOpen}
        taskId={task.id}
        onSuccess={handleReflectionSuccess}
      />
    </>
  );
};

export default TaskDetailPage;