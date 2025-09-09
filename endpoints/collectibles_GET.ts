import { db } from "../helpers/db";
import { OutputType } from "./collectibles_GET.schema";
import superjson from 'superjson';
import { Transaction } from "kysely";
import { DB } from "../helpers/schema";

const SEED_COLLECTIBLES = [
  { name: 'Sprout', emoji: '🌱', cost: 50, description: 'A tiny green sprout.' },
  { name: 'Sunflower', emoji: '🌻', cost: 100, description: 'A bright, happy sunflower.' },
  { name: 'Rose Bush', emoji: '🌹', cost: 150, description: 'A beautiful bush of red roses.' },
  { name: 'Bonsai Tree', emoji: '🌳', cost: 200, description: 'A meticulously cared-for bonsai.' },
  { name: 'Cherry Blossom', emoji: '🌸', cost: 250, description: 'A delicate cherry blossom branch.' },
];

async function seedCollectibles(trx: Transaction<DB>) {
  console.log("Seeding collectible types...");
  await trx.insertInto('collectibleTypes').values(SEED_COLLECTIBLES).execute();
  console.log("Collectible types seeded successfully.");
}

export async function handle(request: Request) {
  try {
    const collectibles = await db.transaction().execute(async (trx) => {
      const countResult = await trx.selectFrom('collectibleTypes').select(db.fn.count('id').as('count')).executeTakeFirst();
      const count = Number(countResult?.count ?? 0);

      if (count === 0) {
        await seedCollectibles(trx);
      }

      return await trx.selectFrom('collectibleTypes').selectAll().orderBy('cost', 'asc').execute();
    });

    return new Response(superjson.stringify(collectibles satisfies OutputType), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error fetching collectible types:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to fetch collectibles: ${errorMessage}` }), { status: 500 });
  }
}