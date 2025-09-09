import { z } from "zod";
import superjson from 'superjson';
import { type TaskWithSteps } from "./tasks_GET.schema";

const stepSchema = z.object({
  description: z.string().min(1, "Step description cannot be empty."),
  materials: z.string().nullable().optional(),
});

export const schema = z.object({
  title: z.string().min(1, "Task title cannot be empty."),
  estimatedMinutes: z.number().int().positive("Estimated minutes must be a positive number."),
  steps: z.array(stepSchema).optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = TaskWithSteps;

export const postTasks = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/tasks`, {
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