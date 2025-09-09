import { db } from "../helpers/db";
import { OutputType } from "./user-progress_GET.schema";
import superjson from 'superjson';
import { getServerUserSession } from "../helpers/getServerUserSession";

export async function handle(request: Request) {
  try {
    // Get authenticated user
    const { user } = await getServerUserSession(request);

    // Get or create user progress for the authenticated user
    const userProgress = await db.transaction().execute(async (trx) => {
      let progress = await trx
        .selectFrom('userProgress')
        .selectAll()
        .where('userId', '=', user.id)
        .executeTakeFirst();

      if (!progress) {
        console.log("No user progress found, creating initial record.");
        [progress] = await trx
          .insertInto('userProgress')
          .values({ userId: user.id, kaibloomsPoints: 0 })
          .returningAll()
          .execute();
      }
      return progress;
    });

    if (!userProgress) {
        throw new Error("Failed to find or create user progress record.");
    }

    return new Response(superjson.stringify(userProgress satisfies OutputType), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error fetching user progress:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to fetch user progress: ${errorMessage}` }), { status: 500 });
  }
}