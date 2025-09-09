import { useMutation } from "@tanstack/react-query";
import { useSettings, useUpdateSettings } from "./useSettingsQueries";

interface SetupData {
  grade: string;
  classes: string[];
}

export const useSetupFlow = () => {
  const { data: settings, isLoading: isLoadingSettings, error } = useSettings();
  const updateSettingsMutation = useUpdateSettings();

  const completeSetup = async (
    setupData: SetupData,
    options?: {
      onSuccess?: () => void;
      onError?: (error: Error) => void;
    }
  ) => {
    try {
      await updateSettingsMutation.mutateAsync({
        grade: setupData.grade,
        classes: setupData.classes,
      });
      options?.onSuccess?.();
    } catch (error) {
      options?.onError?.(error instanceof Error ? error : new Error('Setup failed'));
    }
  };

  const needsSetup = settings ? (!settings.grade || !settings.classes || settings.classes.length === 0) : false;

  return {
    settings,
    isLoadingSettings,
    completeSetup,
    isUpdatingSettings: updateSettingsMutation.isPending,
    needsSetup,
    error,
  };
};