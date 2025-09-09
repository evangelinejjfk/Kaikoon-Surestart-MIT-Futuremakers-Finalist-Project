import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSettings } from "../endpoints/settings_GET.schema";
import { postSettings, type InputType as UpdateSettingsInput, type OutputType as SettingsType } from "../endpoints/settings_POST.schema";
import { postSettingsClearData } from "../endpoints/settings/clear-data_POST.schema";

const SETTINGS_QUERY_KEY = ['settings'];

export const useSettings = () => {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: () => getSettings(),
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updatedSettings: UpdateSettingsInput) => postSettings(updatedSettings),
    onSuccess: (data) => {
      queryClient.setQueryData(SETTINGS_QUERY_KEY, data);
    },
  });
};

export const useClearData = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => postSettingsClearData(),
    onSuccess: () => {
      // Invalidate all user-specific data
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['userProgress'] });
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
    },
  });
};