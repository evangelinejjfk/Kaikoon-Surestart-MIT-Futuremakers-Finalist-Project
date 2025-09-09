import React from 'react';
import styles from './SettingsSection.module.css';

interface SettingsSectionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

export const SettingsSection = ({
  icon,
  title,
  description,
  children,
  className,
}: SettingsSectionProps) => {
  return (
    <section className={`${styles.section} ${className || ''}`}>
      <div className={styles.header}>
        <div className={styles.iconWrapper}>{icon}</div>
        <div>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.description}>{description}</p>
        </div>
      </div>
      <div className={styles.content}>{children}</div>
    </section>
  );
};