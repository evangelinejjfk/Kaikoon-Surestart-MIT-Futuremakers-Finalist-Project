import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "./Tooltip";
import { SonnerToaster } from "./SonnerToaster";
import { ScrollToHashElement } from "./ScrollToHashElement";
import { useAccessibility } from "../helpers/useAccessibility";
import { HapticFeedbackProvider } from "../helpers/HapticFeedbackContext";
import { AuthProvider } from "../helpers/useAuth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute “fresh” window
    },
  },
});

const AccessibilityProvider = ({ children }: { children: ReactNode }) => {
  useAccessibility();
  return <>{children}</>;
};

export const GlobalContextProviders = ({
  children,
}: {
  children: ReactNode;
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ScrollToHashElement />
        <AccessibilityProvider>
          <HapticFeedbackProvider>
            <TooltipProvider>
              {children}
              <SonnerToaster />
            </TooltipProvider>
          </HapticFeedbackProvider>
        </AccessibilityProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};
