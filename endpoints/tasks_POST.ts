import { db } from "../helpers/db";
import { schema, OutputType } from "./tasks_POST.schema";
import superjson from 'superjson';
import { type Transaction } from "kysely";
import { type DB } from "../helpers/schema";
import { getServerUserSession } from "../helpers/getServerUserSession";

export async function handle(request: Request) {
  try {
    // Get authenticated user
    const { user } = await getServerUserSession(request);

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const newTaskWithSteps = await db.transaction().execute(async (trx: Transaction<DB>) => {
      // 1. Insert the main task
      const [newTask] = await trx
        .insertInto('tasks')
        .values({
          title: input.title,
          estimatedMinutes: input.estimatedMinutes,
          completed: false,
          userId: user.id,
        })
        .returningAll()
        .execute();

      if (!newTask) {
        throw new Error("Task creation failed.");
      }

      // 2. Insert the associated steps
      if (input.steps && input.steps.length > 0) {
        const stepsToInsert = input.steps.map((step, index) => ({
          taskId: newTask.id,
          description: step.description,
          materials: step.materials,
          orderIndex: index,
          completed: false,
        }));

        const newSteps = await trx
          .insertInto('taskSteps')
          .values(stepsToInsert)
          .returningAll()
          .execute();
        
        return { ...newTask, steps: newSteps };
      }

      return { ...newTask, steps: [] };
    });

    return new Response(superjson.stringify(newTaskWithSteps satisfies OutputType), {
      status: 201, // Created
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error creating task:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to create task: ${errorMessage}` }), { status: 400 });
  }
}