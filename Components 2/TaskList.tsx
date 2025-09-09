import React from 'react';
import { type TaskWithSteps } from '../endpoints/tasks_GET.schema';
import { TaskItem } from './TaskItem';
import styles from './TaskList.module.css';
import { ClipboardList } from 'lucide-react';

interface TaskListProps {
  tasks: TaskWithSteps[];
}

export const TaskList = ({ tasks }: TaskListProps) => {
  if (tasks.length === 0) {
    return (
      <div className={styles.emptyState}>
        <ClipboardList size={48} className={styles.emptyIcon} />
        <h2 className={styles.emptyTitle}>No tasks yet!</h2>
        <p className={styles.emptyText}>Tap the "Add Task" button to get started.</p>
      </div>
    );
  }

  const incompleteTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  return (
    <div className={styles.taskList}>
      {incompleteTasks.map(task => (
        <TaskItem key={task.id} task={task} />
      ))}
      {completedTasks.length > 0 && (
        <>
          <div className={styles.completedHeader}>
            Completed
          </div>
          {completedTasks.map(task => (
            <TaskItem key={task.id} task={task} />
          ))}
        </>
      )}
    </div>
  );
};