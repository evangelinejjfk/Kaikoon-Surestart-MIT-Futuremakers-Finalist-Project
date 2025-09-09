import { z } from "zod";
import superjson from 'superjson';
import { type TaskWithSteps } from "../tasks_GET.schema";

const stepUpdateSchema = z.object({
  id: z.number().int(),
  completed: z.boolean(),
});

export const schema = z.object({
  taskId: z.number().int(),
  completed: z.boolean().optional(),
  steps: z.array(stepUpdateSchema).optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = TaskWithSteps;

export const postTasksUpdate = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/tasks/update`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
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