import React from 'react';
import { NotificationCenter } from './NotificationCenter';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className={styles.appContainer}>
      <div className={styles.contentWrapper}>
        <header className={styles.navigationHeader}>
          <NotificationCenter className={styles.notificationCenter} />
        </header>
        <main className={styles.mainContent}>{children}</main>
      </div>
    </div>
  );
};