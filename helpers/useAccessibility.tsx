import { useEffect } from 'react';
import { useSettings } from './useSettingsQueries';

const BIGGER_TEXT_CLASS = 'kaikoon-bigger-text';

/**
 * A hook to manage and apply global accessibility settings.
 * Currently, it handles the "Bigger Text" preference by adding or removing
 * a CSS class to the document's root element (`<html>`).
 * This hook should be called once in a global layout component.
 */
export const useAccessibility = () => {
  const { data: settings, isLoading } = useSettings();

  useEffect(() => {
    if (isLoading) {
      // Don't make any changes while settings are loading to avoid flashes of style changes.
      return;
    }

    const rootElement = document.documentElement;

    if (settings?.biggerText) {
      rootElement.classList.add(BIGGER_TEXT_CLASS);
    } else {
      rootElement.classList.remove(BIGGER_TEXT_CLASS);
    }

    // Cleanup function to remove the class when the component unmounts
    // or before the effect re-runs.
    return () => {
      rootElement.classList.remove(BIGGER_TEXT_CLASS);
    };
  }, [settings?.biggerText, isLoading]);
};