import { db } from "../../helpers/db";
import { schema, OutputType } from "./update_POST.schema";
import superjson from 'superjson';
import { type Transaction } from "kysely";
import { type DB } from "../../helpers/schema";
import { getServerUserSession } from "../../helpers/getServerUserSession";

export async function handle(request: Request) {
  try {
    // Get authenticated user
    const { user } = await getServerUserSession(request);

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const updatedTask = await db.transaction().execute(async (trx: Transaction<DB>) => {
      // 1. Update task completion status if provided
      if (typeof input.completed === 'boolean') {
        await trx
          .updateTable('tasks')
          .set({ completed: input.completed })
          .where('id', '=', input.taskId)
          .where('userId', '=', user.id)
          .execute();

        // Award points if task is marked as complete
        if (input.completed) {
          await trx
            .updateTable('userProgress')
            .set((eb) => ({
              kaibloomsPoints: eb('kaibloomsPoints', '+', 15)
            }))
            .where('userId', '=', user.id)
            .execute();
        }
      }

      // 2. Update individual steps if provided
      if (input.steps && input.steps.length > 0) {
        for (const step of input.steps) {
          await trx
            .updateTable('taskSteps')
            .set({ completed: step.completed })
            .where('id', '=', step.id)
            .where('taskId', '=', input.taskId)
            .execute();
        }
      }

      // 3. Fetch and return the updated task with its steps
      const task = await trx
        .selectFrom('tasks')
        .selectAll()
        .where('id', '=', input.taskId)
        .where('userId', '=', user.id)
        .executeTakeFirstOrThrow();

      const steps = await trx
        .selectFrom('taskSteps')
        .selectAll()
        .where('taskId', '=', input.taskId)
        .orderBy('orderIndex', 'asc')
        .execute();

      return { ...task, steps };
    });

    return new Response(superjson.stringify(updatedTask satisfies OutputType), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error updating task:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to update task: ${errorMessage}` }), { status: 400 });
  }
}