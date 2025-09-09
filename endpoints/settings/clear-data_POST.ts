import { db } from '../../helpers/db';
import { type OutputType } from "./clear-data_POST.schema";
import superjson from 'superjson';
import { Transaction } from 'kysely';
import { DB } from '../../helpers/schema';
import { getServerUserSession } from '../../helpers/getServerUserSession';

async function clearUserData(trx: Transaction<DB>, userId: number) {
  // Delete reflections for tasks owned by the user
  await trx
    .deleteFrom('reflections')
    .where('taskId', 'in', 
      trx.selectFrom('tasks')
         .select('id')
         .where('userId', '=', userId)
    )
    .execute();

  // Delete task steps for tasks owned by the user
  await trx
    .deleteFrom('taskSteps')
    .where('taskId', 'in',
      trx.selectFrom('tasks')
         .select('id')
         .where('userId', '=', userId)
    )
    .execute();

  // Delete tasks owned by the user
  await trx
    .deleteFrom('tasks')
    .where('userId', '=', userId)
    .execute();

  // Reset user progress for the authenticated user
  await trx
    .updateTable('userProgress')
    .set({ kaibloomsPoints: 0 })
    .where('userId', '=', userId)
    .execute();
}

export async function handle(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // Get authenticated user
    const { user } = await getServerUserSession(request);

    await db.transaction().execute(async (trx) => {
      await clearUserData(trx, user.id);
    });

    const response: OutputType = { success: true, message: "All user data has been cleared." };
    return new Response(superjson.stringify(response));

  } catch (error) {
    console.error("Error clearing user data:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during data clearing.";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 500 });
  }
}