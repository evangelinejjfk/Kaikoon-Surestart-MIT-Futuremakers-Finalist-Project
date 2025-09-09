import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type Tasks, type TaskSteps } from "../helpers/schema";

// No input schema needed for a simple GET request
export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type TaskWithSteps = Selectable<Tasks> & {
  steps: Selectable<TaskSteps>[];
};

export type OutputType = TaskWithSteps[];

export const getTasks = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/tasks`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    const errorMessage = typeof errorObject === 'object' && errorObject !== null && 'error' in errorObject && typeof errorObject.error === 'string' 
      ? errorObject.error 
      : 'An unknown error occurred';
    throw new Error(errorMessage);
  }
  return superjson.parse<OutputType>(await result.text());
};