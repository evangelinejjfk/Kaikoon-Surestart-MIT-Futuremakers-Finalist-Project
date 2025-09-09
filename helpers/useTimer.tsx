import { useState, useEffect, useRef, useCallback } from 'react';
import { useNotifications } from './useNotifications';
import { useSettings } from './useSettingsQueries';

export const useTimer = (initialTime: number = 0) => {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const breakReminderRef = useRef<NodeJS.Timeout | null>(null);
  
  const { showBreakReminder } = useNotifications();
  const { data: settings } = useSettings();

  const start = useCallback(() => {
    if (!isRunning) {
      setIsRunning(true);
    }
  }, [isRunning]);

  const startBreakReminders = useCallback(() => {
    // Clear any existing break reminder
    if (breakReminderRef.current) {
      clearInterval(breakReminderRef.current);
      breakReminderRef.current = null;
    }

    // Only start break reminders if all conditions are met
    if (
      settings?.notificationsEnabled &&
      settings?.breakRemindersEnabled &&
      settings?.breakReminderInterval &&
      settings.breakReminderInterval > 0
    ) {
      const intervalMs = settings.breakReminderInterval * 60 * 1000; // Convert minutes to milliseconds
      breakReminderRef.current = setInterval(() => {
        showBreakReminder();
      }, intervalMs);
    }
  }, [settings?.notificationsEnabled, settings?.breakRemindersEnabled, settings?.breakReminderInterval, showBreakReminder]);

  const stopBreakReminders = useCallback(() => {
    if (breakReminderRef.current) {
      clearInterval(breakReminderRef.current);
      breakReminderRef.current = null;
    }
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
    stopBreakReminders();
  }, [stopBreakReminders]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTime(initialTime);
    stopBreakReminders();
  }, [initialTime, stopBreakReminders]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
      startBreakReminders();
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      stopBreakReminders();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      stopBreakReminders();
    };
  }, [isRunning, startBreakReminders, stopBreakReminders]);

  return { time, isRunning, start, pause, reset };
};