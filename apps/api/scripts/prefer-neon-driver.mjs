/**
 * Drizzle Kit auto-detects PostgreSQL drivers and prefers `pg` when it is
 * present as Drizzle ORM's optional peer dependency. This project must use
 * Neon's WebSocket driver because raw PostgreSQL TCP is not reachable on the
 * development network. Hiding only `pg` from Drizzle Kit lets its normal
 * driver detection select `@neondatabase/serverless`.
 */
export async function resolve(specifier, context, nextResolve) {
  if (
    specifier === 'pg' &&
    context.parentURL?.endsWith('/drizzle-kit/bin.cjs')
  ) {
    throw new Error('Use @neondatabase/serverless for Drizzle Kit');
  }

  return nextResolve(specifier, context);
}
