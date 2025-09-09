import { useQuery } from "@tanstack/react-query";
import { getReflectionLogs } from "../endpoints/reflection-logs_GET.schema";

const REFLECTION_LOGS_QUERY_KEY = ['reflectionLogs'];

export const useReflectionLogs = () => {
  return useQuery({
    queryKey: REFLECTION_LOGS_QUERY_KEY,
    queryFn: getReflectionLogs,
  });
};