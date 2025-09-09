import { createContext, useContext, ReactNode } from 'react';
import { useHapticFeedback } from './useHapticFeedback';

interface HapticFeedbackContextType {
  triggerHapticFeedback: (pattern?: VibratePattern) => void;
}

const HapticFeedbackContext = createContext<HapticFeedbackContextType | undefined>(undefined);

export const HapticFeedbackProvider = ({ children }: { children: ReactNode }) => {
  const { triggerHapticFeedback } = useHapticFeedback();

  return (
    <HapticFeedbackContext.Provider value={{ triggerHapticFeedback }}>
      {children}
    </HapticFeedbackContext.Provider>
  );
};

export const useHapticFeedbackContext = () => {
  const context = useContext(HapticFeedbackContext);
  if (context === undefined) {
    throw new Error('useHapticFeedbackContext must be used within a HapticFeedbackProvider');
  }
  return context;
};