import { useEffect, useState } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'settings' }
  | { name: 'deck'; id: string; tab: 'questions' | 'answers' }
  | { name: 'here'; id: string }
  | { name: 'preview'; id: string }
  | { name: 'play'; payload: string }
  | { name: 'answers'; payload: string };

export function parseRoute(hash: string): Route {
  const [, first, second, third] = hash.replace(/^#/, '').split('/');
  if (first === 'settings') return { name: 'settings' };
  if (first === 'deck' && second) {
    if (third === 'here') return { name: 'here', id: second };
    if (third === 'preview') return { name: 'preview', id: second };
    return { name: 'deck', id: second, tab: third === 'answers' ? 'answers' : 'questions' };
  }
  if (first === 'play' && second) return { name: 'play', payload: second };
  if (first === 'answers' && second) return { name: 'answers', payload: second };
  return { name: 'home' };
}

export function useRoute() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return parseRoute(hash);
}

/** Navigates with a history entry, so the phone's back gesture works. */
export function go(path: string, { replace = false } = {}) {
  if (replace) {
    window.history.replaceState(null, '', `#${path}`);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = path;
  }
}
