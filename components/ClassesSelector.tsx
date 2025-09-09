import React from 'react';
import { Checkbox } from './Checkbox';
import styles from './ClassesSelector.module.css';

interface ClassesSelectorProps {
  selectedClasses: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
  className?: string;
}

const availableClasses = [
  "Math",
  "English",
  "Science",
  "History",
  "Art",
  "Music",
  "P.E.",
  "Foreign Language",
];

export const ClassesSelector = ({ selectedClasses, onChange, disabled, className }: ClassesSelectorProps) => {
  const handleClassToggle = (className: string) => {
    const newSelectedClasses = selectedClasses.includes(className)
      ? selectedClasses.filter((c) => c !== className)
      : [...selectedClasses, className];
    onChange(newSelectedClasses);
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {availableClasses.map((className) => (
        <label key={className} className={styles.classItem}>
          <Checkbox
            checked={selectedClasses.includes(className)}
            onChange={() => handleClassToggle(className)}
            disabled={disabled}
          />
          <span className={styles.label}>{className}</span>
        </label>
      ))}
    </div>
  );
};