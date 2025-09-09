import { useCallback } from 'react';
import { useSettings } from './useSettingsQueries';

/**
 * A hook to provide haptic feedback functionality based on user settings.
 * It checks if the user has enabled 'hapticBuzz' and if the browser supports the Vibration API.
 *
 * @returns An object containing the `triggerHapticFeedback` function.
 */
export const useHapticFeedback = () => {
  const { data: settings } = useSettings();

  /**
   * Triggers haptic feedback if enabled by the user and supported by the browser.
   * @param pattern - A vibration pattern. Can be a single value (duration in ms) or an array of durations. Defaults to a short 100ms buzz.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API
   */
  const triggerHapticFeedback = useCallback((pattern: VibratePattern = 100) => {
    if (settings?.hapticBuzz && 'vibrate' in navigator && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        // This can happen if the document is not focused, etc.
        // We can safely ignore it.
        console.log("Could not trigger haptic feedback:", error);
      }
    }
  }, [settings?.hapticBuzz]);

  return { triggerHapticFeedback };
};