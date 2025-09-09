import { useState, useEffect, useCallback, useRef } from 'react';
import { useSettings } from './useSettingsQueries';

import { useHapticFeedback } from './useHapticFeedback';

// --- Constants for Notification Content ---
const NOTIFICATION_DEFAULTS = {
  icon: '/logo-192.png', // A default app icon
  vibrate: [200, 100, 200], // A standard vibration pattern
};

const NOTIFICATION_TYPES = {
  BREAK_REMINDER: {
    title: 'Time for a break!',
    body: 'Stretch your legs, grab some water, and rest your eyes for a few minutes.',
    sound: '/sounds/break-reminder.mp3',
  },
  TASK_COMPLETION: {
    title: 'Great Job!',
    body: (taskTitle: string) => `You've successfully completed "${taskTitle}". Keep up the amazing work!`,
    sound: '/sounds/celebration.mp3',
  },
  DAILY_CHECK_IN: {
    title: 'Ready for a new day?',
    body: 'Let\'s check in and see what tasks are on your plate today.',
    sound: '/sounds/check-in.mp3',
  },
};

// --- Types ---
export type NotificationType = 'break' | 'celebration' | 'check-in';

export interface NotificationRecord {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: number;
}

interface CustomNotificationOptions extends NotificationOptions {
  type: NotificationType;
  sound?: string;
}

/**
 * A comprehensive hook to manage browser notifications for the KAIKOON app.
 * It handles permissions, respects user settings, and provides functions
 * to show different types of notifications.
 */
export const useNotifications = () => {
  const { data: settings } = useSettings();
  const { triggerHapticFeedback } = useHapticFeedback();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [history, setHistory] = useState<NotificationRecord[]>([]);
  const breakTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Effect to initialize and update notification permission status
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Generate browser-compatible unique IDs
  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback: timestamp + random number
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const addToHistory = (record: Omit<NotificationRecord, 'id' | 'timestamp'>) => {
    const newRecord: NotificationRecord = {
      ...record,
      id: generateId(),
      timestamp: Date.now(),
    };
    setHistory(prev => [newRecord, ...prev]);
  };

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.error('This browser does not support desktop notification');
      return 'denied';
    }

    const status = await Notification.requestPermission();
    setPermission(status);
    return status;
  }, []);

  const playNotificationSound = useCallback((soundUrl: string) => {
    try {
      const audio = new Audio(soundUrl);
      audio.volume = 0.6; // Set a reasonable volume level
      audio.play().catch(e => console.error("Error playing notification sound:", e));
    } catch (error) {
      console.error("Error creating audio object:", error);
    }
  }, []);

  const showNotification = useCallback((title: string, options: CustomNotificationOptions) => {
    if (permission !== 'granted' || !settings?.notificationsEnabled) {
      return;
    }

    const { type, sound, ...notificationOptions } = options;
    
    const notification = new Notification(title, {
      ...NOTIFICATION_DEFAULTS,
      ...notificationOptions,
    });

    // Play sound separately from the notification
    if (sound) {
      playNotificationSound(sound);
    }
    
    triggerHapticFeedback();
    addToHistory({ type, title, body: notificationOptions.body ?? '' });

    return notification;
  }, [permission, settings?.notificationsEnabled, triggerHapticFeedback, playNotificationSound]);

  const showBreakReminder = useCallback(() => {
    if (!settings?.breakRemindersEnabled) return;
    
    const { title, body, sound } = NOTIFICATION_TYPES.BREAK_REMINDER;
    showNotification(title, { body, sound, type: 'break' });
  }, [settings?.breakRemindersEnabled, showNotification]);

  const showCelebration = useCallback((taskTitle: string) => {
    if (!settings?.celebrationNotificationsEnabled) return;

    const { title, sound } = NOTIFICATION_TYPES.TASK_COMPLETION;
    const body = NOTIFICATION_TYPES.TASK_COMPLETION.body(taskTitle);
    showNotification(title, { body, sound, type: 'celebration' });
  }, [settings?.celebrationNotificationsEnabled, showNotification]);

  const showDailyCheckIn = useCallback(() => {
    if (!settings?.dailyCheckinEnabled) return;

    const { title, body, sound } = NOTIFICATION_TYPES.DAILY_CHECK_IN;
    showNotification(title, { body, sound, type: 'check-in' });
  }, [settings?.dailyCheckinEnabled, showNotification]);

  const startBreakTimer = useCallback(() => {
    if (breakTimerRef.current) {
      clearTimeout(breakTimerRef.current);
    }
    if (!settings?.breakRemindersEnabled || !settings.breakReminderInterval) {
      return;
    }
    
    const intervalMs = settings.breakReminderInterval * 60 * 1000;
    breakTimerRef.current = setTimeout(() => {
      showBreakReminder();
      // Optionally, restart the timer for continuous reminders during long sessions
      // startBreakTimer(); 
    }, intervalMs);
  }, [settings?.breakRemindersEnabled, settings?.breakReminderInterval, showBreakReminder]);

  const stopBreakTimer = useCallback(() => {
    if (breakTimerRef.current) {
      clearTimeout(breakTimerRef.current);
      breakTimerRef.current = null;
    }
  }, []);

  return {
    permission,
    history,
    requestPermission,
    showBreakReminder,
    showCelebration,
    showDailyCheckIn,
    startBreakTimer,
    stopBreakTimer,
    clearHistory,
  };
};