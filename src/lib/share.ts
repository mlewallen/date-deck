import { isPhotoData } from './photos';
import type { AnswerPayload, Deck, DeckResponse, InvitePayload, SharedDeck } from './types';

/*
 * Decks and answers travel inside the URL hash (#/play/… and #/answers/…).
 * The hash is never sent to the server, so nothing about a deck leaves the
 * two phones — and it works on any static host, including Netlify.
 */

function toBase64Url(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string) {
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function pipe(bytes: Uint8Array, transform: CompressionStream | DecompressionStream) {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(transform);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function encodePayload(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  if (typeof CompressionStream !== 'undefined') {
    try {
      return 'z' + toBase64Url(await pipe(bytes, new CompressionStream('deflate-raw')));
    } catch {
      // Fall through to the uncompressed form.
    }
  }
  return 'j' + toBase64Url(bytes);
}

export async function decodePayload(text: string): Promise<unknown> {
  const body = fromBase64Url(text.slice(1));
  const raw = text[0] === 'z' ? await pipe(body, new DecompressionStream('deflate-raw')) : body;
  return JSON.parse(new TextDecoder().decode(raw));
}

function isSharedDeck(deck: SharedDeck | undefined): deck is SharedDeck {
  return !!deck && typeof deck.id === 'string' && typeof deck.title === 'string' && Array.isArray(deck.questions);
}

const SAFE_PHOTO = /^(|p:[a-z]+|tone:\d+|https:\/\/[^\s"'()\\]+)$/i;

/** Drops any photo value a link shouldn't carry, so cards fall back to a color. */
function cleanDeck(deck: SharedDeck, keepUploads = true): SharedDeck {
  return {
    ...deck,
    questions: deck.questions.map((question) => ({
      ...question,
      options: (question.options ?? []).map((option) => ({
        ...option,
        photo:
          typeof option.photo === 'string' && (SAFE_PHOTO.test(option.photo) || (keepUploads && isPhotoData(option.photo)))
            ? option.photo
            : '',
      })),
    })),
  };
}

export async function readInvite(text: string): Promise<InvitePayload | null> {
  try {
    const payload = (await decodePayload(text)) as InvitePayload;
    return payload?.t === 'invite' && isSharedDeck(payload.deck) ? { ...payload, deck: cleanDeck(payload.deck) } : null;
  } catch {
    return null;
  }
}

export async function readAnswers(text: string): Promise<AnswerPayload | null> {
  try {
    const payload = (await decodePayload(text)) as AnswerPayload;
    return payload?.t === 'answers' && isSharedDeck(payload.deck) && !!payload.response?.answers
      ? { ...payload, deck: cleanDeck(payload.deck) }
      : null;
  } catch {
    return null;
  }
}

export function sharedDeck(deck: Deck): SharedDeck {
  return { id: deck.id, title: deck.title, message: deck.message, questions: deck.questions };
}

function appUrl(route: string) {
  return `${window.location.origin}${window.location.pathname}#${route}`;
}

export type InviteLink = { url: string; short: boolean };

/**
 * Stores the invite with the app's share API and returns a short #/s/<id>
 * link. If the API can't be reached, falls back to the self-contained
 * #/play/<payload> link, which works anywhere but can be very long.
 */
export async function inviteLink(deck: Deck, from: string, to: string): Promise<InviteLink> {
  const invite: InvitePayload = { t: 'invite', v: 1, from, to, deck: sharedDeck(deck) };
  const payload = await encodePayload(invite);
  try {
    const response = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload }),
    });
    const { id } = (await response.json()) as { id?: string };
    if (response.ok && id && /^[A-Za-z0-9]{12}$/.test(id)) return { url: appUrl(`/s/${id}`), short: true };
  } catch {
    // Offline, or a static host without the function.
  }
  return { url: appUrl(`/play/${payload}`), short: false };
}

export type ShortLinkResult = { payload: string } | { error: 'not-found' | 'offline' };

export async function resolveShortLink(id: string): Promise<ShortLinkResult> {
  try {
    const response = await fetch(`/api/share/${encodeURIComponent(id)}`);
    if (response.status === 404) return { error: 'not-found' };
    const { payload } = (await response.json()) as { payload?: string };
    return response.ok && typeof payload === 'string' ? { payload } : { error: 'offline' };
  } catch {
    return { error: 'offline' };
  }
}

export async function answersLink(deck: SharedDeck, to: string, response: DeckResponse) {
  // The planner already has the photos; leaving uploads out keeps the reply link short.
  const payload: AnswerPayload = { t: 'answers', v: 1, to, deck: cleanDeck(deck, false), response };
  return appUrl(`/answers/${await encodePayload(payload)}`);
}

/** Pulls the payload out of a pasted link (or a bare payload) for a given route. */
export function payloadFromPaste(text: string, route: 'play' | 'answers') {
  const match = text.trim().match(new RegExp(`#/${route}/([A-Za-z0-9_-]+)`));
  if (match) return match[1];
  const bare = text.trim();
  return /^[zj][A-Za-z0-9_-]+$/.test(bare) ? bare : null;
}

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed';

/** Uses the native share sheet when there is one, otherwise copies the link. */
export async function shareLink(url: string, title: string, text: string): Promise<ShareResult> {
  if (navigator.share && matchMedia('(pointer: coarse)').matches) {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch (error) {
      if ((error as DOMException)?.name === 'AbortError') return 'cancelled';
    }
  }
  return (await copyText(url)) ? 'copied' : 'failed';
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
