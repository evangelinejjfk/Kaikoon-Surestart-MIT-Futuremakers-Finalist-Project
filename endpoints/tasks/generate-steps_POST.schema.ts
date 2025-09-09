import { z } from "zod";
import superjson from 'superjson';

export const schema = z.object({
  title: z.string().min(1, "Task title cannot be empty."),
});

export type InputType = z.infer<typeof schema>;

export type Step = {
  description: string;
  materials: string | null;
};

export type OutputType = Step[];

export const postTasksGenerateSteps = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/tasks/generate-steps`, {
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
      : 'An unknown error occurred while generating steps.';
    throw new Error(errorMessage);
  }
  return superjson.parse<OutputType>(await result.text());
};