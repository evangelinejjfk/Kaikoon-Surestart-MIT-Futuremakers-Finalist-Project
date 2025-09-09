import React from 'react';
import { Link } from 'react-router-dom';
import { type TaskWithSteps } from '../endpoints/tasks_GET.schema';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { useHapticFeedbackContext } from '../helpers/HapticFeedbackContext';
import styles from './TaskItem.module.css';

interface TaskItemProps {
  task: TaskWithSteps;
}

export const TaskItem = ({ task }: TaskItemProps) => {
  const { triggerHapticFeedback } = useHapticFeedbackContext();

  const handleClick = () => {
    triggerHapticFeedback(50); // Light tap feedback for task selection
  };

  return (
    <Link 
      to={`/tasks/${task.id}`} 
      className={`${styles.taskItem} ${task.completed ? styles.completed : ''}`}
      onClick={handleClick}
    >
      <div className={styles.statusIcon}>
        {task.completed ? (
          <CheckCircle size={20} className={styles.completedIcon} />
        ) : (
          <Circle size={20} className={styles.pendingIcon} />
        )}
      </div>
      <div className={styles.taskDetails}>
        <span className={styles.taskTitle}>{task.title}</span>
        {task.estimatedMinutes && (
          <div className={styles.taskMeta}>
            <Clock size={14} />
            <span>{task.estimatedMinutes} min</span>
          </div>
        )}
      </div>
    </Link>
  );
};