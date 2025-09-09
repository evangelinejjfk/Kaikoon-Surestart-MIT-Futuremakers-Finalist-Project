import React from 'react';
import { Bell, Settings, Coffee, PartyPopper, CalendarCheck, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Popover, PopoverTrigger, PopoverContent } from './Popover';
import { Button } from './Button';
import { Separator } from './Separator';
import { useNotifications, NotificationRecord, NotificationType } from '../helpers/useNotifications';
import { formatTimeAgo } from '../helpers/formatTimeAgo';
import styles from './NotificationCenter.module.css';

const NotificationIcon = ({ type }: { type: NotificationType }) => {
  const icons: Record<NotificationType, React.ReactElement> = {
    break: <Coffee size={20} />,
    celebration: <PartyPopper size={20} />,
    'check-in': <CalendarCheck size={20} />,
  };
  const iconStyles: Record<NotificationType, string> = {
    break: styles.iconBreak,
    celebration: styles.iconCelebration,
    'check-in': styles.iconCheckIn,
  };

  return <div className={`${styles.iconWrapper} ${iconStyles[type]}`}>{icons[type]}</div>;
};

const NotificationItem = ({ notification }: { notification: NotificationRecord }) => (
  <li className={styles.notificationItem}>
    <NotificationIcon type={notification.type} />
    <div className={styles.notificationContent}>
      <p className={styles.notificationTitle}>{notification.title}</p>
      <p className={styles.notificationBody}>{notification.body}</p>
      <time className={styles.notificationTimestamp}>{formatTimeAgo(notification.timestamp)}</time>
    </div>
  </li>
);

const PermissionStatus = () => {
  const { permission, requestPermission } = useNotifications();

  if (permission === 'granted') {
    return <p className={styles.permissionText}>Notifications are enabled.</p>;
  }

  if (permission === 'denied') {
    return <p className={styles.permissionText}>Notifications are blocked. You can enable them in your browser settings.</p>;
  }

  return (
    <div className={styles.permissionRequest}>
      <p className={styles.permissionText}>Enable notifications to get reminders.</p>
      <Button size="sm" onClick={requestPermission}>
        Enable
      </Button>
    </div>
  );
};

export const NotificationCenter = ({ className }: { className?: string }) => {
  const { history, clearHistory } = useNotifications();
  const hasNotifications = history.length > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={`${styles.triggerButton} ${className ?? ''}`}>
          <Bell size={20} />
          {hasNotifications && <div className={styles.notificationDot} />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={styles.popoverContent} align="end" sideOffset={8}>
        <header className={styles.header}>
          <h3 className={styles.title}>Notifications</h3>
          <div className={styles.headerActions}>
            {hasNotifications && (
              <Button variant="ghost" size="icon-sm" onClick={clearHistory} aria-label="Clear all notifications">
                <Trash2 size={16} />
              </Button>
            )}
            <Button asChild variant="ghost" size="icon-sm" aria-label="Notification Settings">
              <Link to="/settings#notifications">
                <Settings size={16} />
              </Link>
            </Button>
          </div>
        </header>
        <Separator className={styles.separator} />
        <div className={styles.contentArea}>
          {hasNotifications ? (
            <ul className={styles.notificationList}>
              {history.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </ul>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Bell size={32} />
              </div>
              <p className={styles.emptyTitle}>All caught up</p>
              <p className={styles.emptyText}>You have no new notifications.</p>
            </div>
          )}
        </div>
        <footer className={styles.footer}>
          <PermissionStatus />
        </footer>
      </PopoverContent>
    </Popover>
  );
};