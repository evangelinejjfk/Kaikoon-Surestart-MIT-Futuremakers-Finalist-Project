import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type UserSettings } from "../helpers/schema";

export const schema = z.object({
  grade: z.string().nullable().optional(),
  classes: z.array(z.string()).nullable().optional(),
  biggerText: z.boolean().nullable().optional(),
  hapticBuzz: z.boolean().nullable().optional(),
  kaibeatPlaylistUrl: z.string().nullable().optional(),
  notificationsEnabled: z.boolean().nullable().optional(),
  breakRemindersEnabled: z.boolean().nullable().optional(),
  breakReminderInterval: z.number().int().min(15).max(60).nullable().optional(),
  celebrationNotificationsEnabled: z.boolean().nullable().optional(),
  dailyCheckinEnabled: z.boolean().nullable().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = Selectable<UserSettings>;

export const postSettings = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/settings`, {
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