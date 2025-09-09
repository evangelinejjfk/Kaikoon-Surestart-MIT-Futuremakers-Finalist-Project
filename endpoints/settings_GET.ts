import { db } from '../helpers/db';
import { type OutputType } from "./settings_GET.schema";
import superjson from 'superjson';
import { getServerUserSession } from '../helpers/getServerUserSession';

export async function handle(request: Request) {
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // Get authenticated user
    const { user } = await getServerUserSession(request);

    // Try to fetch existing settings for the authenticated user
    let userSettings = await db
      .selectFrom('userSettings')
      .selectAll()
      .where('userId', '=', user.id)
      .executeTakeFirst();

    // If no settings exist, create default settings
    if (!userSettings) {
        userSettings = await db
        .insertInto('userSettings')
        .values({
          userId: user.id,
          grade: null,
          classes: null,
          biggerText: false,
          hapticBuzz: false,
          kaibeatPlaylistUrl: null,
          notificationsEnabled: false,
          breakRemindersEnabled: false,
          breakReminderInterval: 30,
          celebrationNotificationsEnabled: false,
          dailyCheckinEnabled: false,
          updatedAt: new Date(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    }

    return new Response(superjson.stringify(userSettings satisfies OutputType));
  } catch (error) {
    console.error("Error fetching settings:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 500 });
  }
}