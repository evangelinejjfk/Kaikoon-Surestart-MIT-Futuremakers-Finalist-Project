import React from 'react';
import { Checkbox } from './Checkbox';
import { Package } from 'lucide-react';
import { type Selectable } from 'kysely';
import { type TaskSteps } from '../helpers/schema';
import { useHapticFeedbackContext } from '../helpers/HapticFeedbackContext';
import styles from './StepItem.module.css';

interface StepItemProps {
  step: Selectable<TaskSteps>;
  isChecked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export const StepItem: React.FC<StepItemProps> = ({ step, isChecked, onCheckedChange, className }) => {
  const { triggerHapticFeedback } = useHapticFeedbackContext();
  const stepId = `step-${step.id}`;

  const handleCheckedChange = (checked: boolean) => {
    triggerHapticFeedback(checked ? [100, 50] : 75); // Double tap for completion, single tap for unchecking
    onCheckedChange(checked);
  };

  return (
    <div className={`${styles.stepItem} ${isChecked ? styles.completed : ''} ${className || ''}`}>
      <Checkbox
        id={stepId}
        checked={isChecked}
        onChange={(e) => handleCheckedChange(e.target.checked)}
        aria-labelledby={`${stepId}-label`}
      />
      <div className={styles.stepContent}>
        <label htmlFor={stepId} id={`${stepId}-label`} className={styles.stepLabel}>
          {step.description}
        </label>
        {step.materials && (
          <div className={styles.materials}>
            <Package size={14} className={styles.materialsIcon} />
            <span className={styles.materialsText}>{step.materials}</span>
          </div>
        )}
      </div>
    </div>
  );
};