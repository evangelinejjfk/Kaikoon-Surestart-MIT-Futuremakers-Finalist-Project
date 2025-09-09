import { useMutation } from "@tanstack/react-query";
import { postTasksGenerateSteps, type InputType as GenerateStepsInput } from "../endpoints/tasks/generate-steps_POST.schema";

/**
 * A React Query hook for generating task steps using the AI service.
 * This is a mutation because it triggers a server-side action that creates new data (the steps).
 *
 * @returns A mutation object from React Query. Use `mutate` or `mutateAsync` to trigger the generation.
 *
 * @example
 * const { mutate, data: steps, isPending, isError, error } = useGenerateTaskSteps();
 *
 * const handleGenerate = (title: string) => {
 *   mutate({ title });
 * };
 */
export const useGenerateTaskSteps = () => {
  return useMutation({
    mutationFn: (taskDetails: GenerateStepsInput) => postTasksGenerateSteps(taskDetails),
    // No cache invalidation is needed here as this hook doesn't modify existing persistent data like tasks or user progress.
    // It's used to fetch suggestions for a new task before it's created.
  });
};