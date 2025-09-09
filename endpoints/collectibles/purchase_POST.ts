import { db } from "../../helpers/db";
import { schema, OutputType } from "./purchase_POST.schema";
import superjson from 'superjson';
import { getServerUserSession } from "../../helpers/getServerUserSession";

export async function handle(request: Request) {
  try {
    // Get authenticated user
    const { user } = await getServerUserSession(request);

    const json = superjson.parse(await request.text());
    const { collectibleTypeId } = schema.parse(json);

    const result = await db.transaction().execute(async (trx) => {
      // 1. Get collectible cost and user points
      const collectible = await trx
        .selectFrom('collectibleTypes')
        .select(['cost'])
        .where('id', '=', collectibleTypeId)
        .executeTakeFirst();

      if (!collectible) {
        throw new Error("Collectible not found.");
      }

      const userProgress = await trx
        .selectFrom('userProgress')
        .select(['kaibloomsPoints'])
        .where('userId', '=', user.id)
        .executeTakeFirst();

      if (!userProgress) {
        throw new Error("User progress not found.");
      }

      const userPoints = userProgress.kaibloomsPoints ?? 0;
      const collectibleCost = collectible.cost;

      // 2. Check if user has enough points
      if (userPoints < collectibleCost) {
        throw new Error("Insufficient Kaiblooms points.");
      }

      // 3. Deduct points
      const newPoints = userPoints - collectibleCost;
      await trx
        .updateTable('userProgress')
        .set({ kaibloomsPoints: newPoints, updatedAt: new Date() })
        .where('userId', '=', user.id)
        .execute();

      // 4. Add collectible to user's collection (upsert logic)
      const existingUserCollectible = await trx
        .selectFrom('userCollectibles')
        .selectAll()
        .where('collectibleTypeId', '=', collectibleTypeId)
        .where('userId', '=', user.id)
        .executeTakeFirst();

      if (existingUserCollectible) {
        // User already has this collectible, increment quantity
        await trx
          .updateTable('userCollectibles')
          .set({ 
            quantity: (existingUserCollectible.quantity ?? 0) + 1,
            purchasedAt: new Date()
          })
          .where('id', '=', existingUserCollectible.id)
          .execute();
      } else {
        // First time user is buying this collectible
        await trx
          .insertInto('userCollectibles')
          .values({
            userId: user.id,
            collectibleTypeId: collectibleTypeId,
            quantity: 1,
            purchasedAt: new Date()
          })
          .execute();
      }

            return { success: true as const, newPoints };
    });

    return new Response(superjson.stringify(result satisfies OutputType), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error purchasing collectible:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}