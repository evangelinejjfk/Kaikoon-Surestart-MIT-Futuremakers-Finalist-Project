import { db } from "../helpers/db";
import { OutputType } from "./tasks_GET.schema";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Tasks, TaskSteps } from "../helpers/schema";
import { getServerUserSession } from "../helpers/getServerUserSession";

export async function handle(request: Request) {
  try {
    // Get authenticated user
    const { user } = await getServerUserSession(request);

    // Fetch all tasks and steps in two separate queries for efficiency
    const tasks = await db.selectFrom('tasks')
      .selectAll()
      .where('userId', '=', user.id)
      .orderBy('createdAt', 'desc')
      .execute();

    const steps = await db.selectFrom('taskSteps')
      .innerJoin('tasks', 'tasks.id', 'taskSteps.taskId')
      .selectAll('taskSteps')
      .where('tasks.userId', '=', user.id)
      .orderBy('orderIndex', 'asc')
      .execute();

    // Group steps by taskId for easy lookup
    const stepsByTaskId = new Map<number, Selectable<TaskSteps>[]>();
    for (const step of steps) {
      if (step.taskId) {
        if (!stepsByTaskId.has(step.taskId)) {
          stepsByTaskId.set(step.taskId, []);
        }
        stepsByTaskId.get(step.taskId)!.push(step);
      }
    }

    // Combine tasks with their respective steps
    const tasksWithSteps: OutputType = tasks.map(task => ({
      ...task,
      steps: stepsByTaskId.get(task.id) || [],
    }));

    return new Response(superjson.stringify(tasksWithSteps), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to fetch tasks: ${errorMessage}` }), { status: 500 });
  }
}