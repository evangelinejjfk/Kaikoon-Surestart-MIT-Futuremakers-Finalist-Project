import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type Reflections } from "../helpers/schema";

export const schema = z.object({
  taskId: z.number().int().positive(),
  emojiRating: z.number().int().min(1).max(5),
  reflectionText: z.string().min(1, "Reflection cannot be empty."),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = Selectable<Reflections> & { sentiment: string };

export const postReflections = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/reflections`, {
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