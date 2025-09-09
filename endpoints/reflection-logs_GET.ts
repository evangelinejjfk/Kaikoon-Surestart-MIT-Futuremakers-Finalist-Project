import { db } from "../helpers/db";
import { OutputType } from "./reflection-logs_GET.schema";
import superjson from 'superjson';
import { getServerUserSession } from "../helpers/getServerUserSession";

export async function handle(request: Request) {
  try {
    // Get authenticated user
    const { user } = await getServerUserSession(request);

    const reflectionLogs = await db
      .selectFrom('reflections')
      .innerJoin('tasks', 'tasks.id', 'reflections.taskId')
      .select([
        'reflections.id',
        'reflections.createdAt',
        'reflections.taskId',
        'reflections.emojiRating',
        'reflections.reflectionText',
        'reflections.sentiment',
        'tasks.title as taskTitle',
      ])
      .where('tasks.userId', '=', user.id)
      .orderBy('reflections.createdAt', 'desc')
      .execute();

    return new Response(superjson.stringify(reflectionLogs satisfies OutputType), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching reflection logs:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to fetch reflection logs: ${errorMessage}` }), { status: 500 });
  }
}