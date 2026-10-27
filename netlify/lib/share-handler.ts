/*
 * Short links for invites: the app POSTs the encoded deck (the same payload a
 * long #/play/… link carries) and gets back a 12-character id; the partner's
 * app GETs it back by id. Shared by the Netlify Function (backed by Netlify
 * Blobs) and the Vite dev server (backed by memory), so both behave the same.
 */

export type ShareStore = {
  get(id: string): Promise<string | null>;
  /** Stores a new entry; resolves false if the id is already taken. */
  create(id: string, payload: string): Promise<boolean>;
};

const MAX_PAYLOAD = 1_500_000;
const ID_LENGTH = 12;
const ID_PATTERN = /^[A-Za-z0-9]{12}$/;
const PAYLOAD_PATTERN = /^[zj][A-Za-z0-9_-]+$/;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function json(status: number, body: unknown, cache = 'no-store') {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': cache, 'X-Robots-Tag': 'noindex' },
  });
}

/** ~71 bits of randomness, unbiased (bytes >= 248 are re-drawn). */
function newId() {
  let id = '';
  while (id.length < ID_LENGTH) {
    for (const byte of crypto.getRandomValues(new Uint8Array(16))) {
      if (byte < 248 && id.length < ID_LENGTH) id += ALPHABET[byte % 62];
    }
  }
  return id;
}

/** Only accept payloads that really are Date Deck invites. */
async function isInvitePayload(payload: string) {
  try {
    const binary = atob(payload.slice(1).replace(/-/g, '+').replace(/_/g, '/'));
    let bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    if (payload[0] === 'z') {
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    }
    const invite = JSON.parse(new TextDecoder().decode(bytes));
    return invite?.t === 'invite' && typeof invite.deck?.id === 'string' && Array.isArray(invite.deck?.questions);
  } catch {
    return false;
  }
}

export async function handleShare(request: Request, store: ShareStore): Promise<Response> {
  const path = new URL(request.url).pathname.replace(/\/+$/, '');

  if (path === '/api/share') {
    if (request.method !== 'POST') return json(405, { error: 'method-not-allowed' });
    if (Number(request.headers.get('content-length') ?? 0) > MAX_PAYLOAD + 100) return json(413, { error: 'too-large' });
    let payload: unknown;
    try {
      payload = ((await request.json()) as { payload?: unknown }).payload;
    } catch {
      return json(400, { error: 'bad-json' });
    }
    if (typeof payload !== 'string' || payload.length > MAX_PAYLOAD) return json(413, { error: 'too-large' });
    if (!PAYLOAD_PATTERN.test(payload) || !(await isInvitePayload(payload))) return json(400, { error: 'not-an-invite' });
    for (let attempt = 0; attempt < 3; attempt++) {
      const id = newId();
      if (await store.create(id, payload)) return json(201, { id });
    }
    return json(500, { error: 'id-collision' });
  }

  const match = path.match(/^\/api\/share\/([^/]+)$/);
  if (match) {
    if (request.method !== 'GET') return json(405, { error: 'method-not-allowed' });
    if (!ID_PATTERN.test(match[1])) return json(404, { error: 'not-found' });
    const payload = await store.get(match[1]);
    // Entries never change, so a day of private caching is safe.
    return payload ? json(200, { payload }, 'private, max-age=86400') : json(404, { error: 'not-found' });
  }

  return json(404, { error: 'not-found' });
}
