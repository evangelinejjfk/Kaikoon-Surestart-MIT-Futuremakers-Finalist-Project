import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTasks, type TaskWithSteps } from "../endpoints/tasks_GET.schema";
import { postTasks, type InputType as CreateTaskInput } from "../endpoints/tasks_POST.schema";
import { postTasksUpdate, type InputType as UpdateTaskInput } from "../endpoints/tasks/update_POST.schema";
import { getUserProgress } from "../endpoints/user-progress_GET.schema";

const TASKS_QUERY_KEY = ['tasks'];
const USER_PROGRESS_QUERY_KEY = ['userProgress'];

export const useTasks = () => {
  return useQuery({
    queryKey: TASKS_QUERY_KEY,
    queryFn: () => getTasks(),
  });
};

export const useUserProgress = () => {
  return useQuery({
    queryKey: USER_PROGRESS_QUERY_KEY,
    queryFn: () => getUserProgress(),
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newTask: CreateTaskInput) => postTasks(newTask),
    onSuccess: (data) => {
      queryClient.setQueryData(TASKS_QUERY_KEY, (oldData: TaskWithSteps[] | undefined) => {
        return oldData ? [data, ...oldData] : [data];
      });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updatedTask: UpdateTaskInput) => postTasksUpdate(updatedTask),
    onSuccess: (data) => {
      // Invalidate both tasks and user progress as points might have changed
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: USER_PROGRESS_QUERY_KEY });
    },
  });
};