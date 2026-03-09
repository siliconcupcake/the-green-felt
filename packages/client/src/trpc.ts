/**
 * tRPC vanilla client setup.
 * - HTTP (httpBatchLink) for queries and mutations
 * - HTTP SSE (httpSubscriptionLink) for subscriptions (real-time lobby/game updates)
 */
import { createTRPCClient, httpBatchLink, splitLink, httpSubscriptionLink } from '@trpc/client';
import type { AppRouter } from '@the-green-felt/server/router/index.js';

export const trpc = createTRPCClient<AppRouter>({
  links: [
    splitLink({
      condition: (op) => op.type === 'subscription',
      true: httpSubscriptionLink({
        url: '/trpc',
      }),
      false: httpBatchLink({
        url: '/trpc',
      }),
    }),
  ],
});
