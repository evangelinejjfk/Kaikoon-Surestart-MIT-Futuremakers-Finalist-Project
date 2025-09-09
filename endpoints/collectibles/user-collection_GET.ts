import { db } from "../../helpers/db";
import { OutputType } from "./user-collection_GET.schema";
import superjson from 'superjson';
import { getServerUserSession } from "../../helpers/getServerUserSession";

export async function handle(request: Request) {
  try {
    // Get authenticated user
    const { user } = await getServerUserSession(request);

    const userCollection = await db
      .selectFrom('userCollectibles')
      .innerJoin('collectibleTypes', 'collectibleTypes.id', 'userCollectibles.collectibleTypeId')
      .select([
        'userCollectibles.id as userCollectibleId',
        'userCollectibles.quantity',
        'userCollectibles.purchasedAt',
        'collectibleTypes.id as collectibleTypeId',
        'collectibleTypes.name',
        'collectibleTypes.description',
        'collectibleTypes.emoji',
        'collectibleTypes.cost'
      ])
      .where('userCollectibles.userId', '=', user.id)
      .orderBy('userCollectibles.purchasedAt', 'desc')
      .execute();

    return new Response(superjson.stringify(userCollection satisfies OutputType), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error fetching user collection:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to fetch user collection: ${errorMessage}` }), { status: 500 });
  }
}