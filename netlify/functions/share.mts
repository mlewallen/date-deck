import { getStore } from '@netlify/blobs';
import type { Config } from '@netlify/functions';
import { handleShare } from '../lib/share-handler.ts';

// Strong consistency so a link works the moment it's created, from any region.
const shares = () => getStore({ name: 'shared-decks', consistency: 'strong' });

export default async (request: Request) => {
  try {
    return await handleShare(request, {
      get: (id) => shares().get(id, { type: 'text' }),
      create: async (id, payload) => (await shares().set(id, payload, { onlyIfNew: true })).modified,
    });
  } catch (error) {
    // The app treats any failure as "use a long link instead", so fail cleanly.
    console.error('share function failed', error);
    return Response.json({ error: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
};

export const config: Config = {
  path: ['/api/share', '/api/share/:id'],
};
