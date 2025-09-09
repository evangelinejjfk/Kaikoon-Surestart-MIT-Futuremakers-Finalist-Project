import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postReflections, type InputType as CreateReflectionInput } from "../endpoints/reflections_POST.schema";

const TASKS_QUERY_KEY = ['tasks'];
const USER_PROGRESS_QUERY_KEY = ['userProgress'];

export const useCreateReflection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newReflection: CreateReflectionInput) => postReflections(newReflection),
    onSuccess: () => {
      // When a reflection is added, the task is implicitly updated (completed),
      // and user points have changed. Invalidate both.
      console.log("Reflection created. Invalidating tasks and user progress queries.");
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: USER_PROGRESS_QUERY_KEY });
    },
    onError: (error) => {
        console.error("Failed to create reflection:", error);
    }
  });
};