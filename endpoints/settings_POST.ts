import { db } from '../helpers/db';
import { schema, type OutputType } from "./settings_POST.schema";
import superjson from 'superjson';
import { getServerUserSession } from '../helpers/getServerUserSession';

export async function handle(request: Request) {
  try {
    // Get authenticated user
    const { user } = await getServerUserSession(request);

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const updatedSettings = await db
      .updateTable('userSettings')
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where('userId', '=', user.id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify(updatedSettings satisfies OutputType));
  } catch (error) {
    console.error("Error updating settings:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}