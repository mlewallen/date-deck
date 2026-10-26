import type { CSSProperties } from 'react';
import { newId } from './storage';
import type { Answer, Deck, Option, Question, QuestionKind, SwipeChoice, VersusChoice } from './types';

export const PRESET_PHOTOS: { key: string; label: string; url: string }[] = [
  {
    key: 'p:bistro',
    label: 'Bistro',
    url: 'https://images.unsplash.com/photo-1668957067240-9483f721d207?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=900',
  },
  {
    key: 'p:wine',
    label: 'Wine bar',
    url: 'https://images.unsplash.com/photo-1606659894125-40824878b6ce?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=900',
  },
  {
    key: 'p:lounge',
    label: 'Lounge',
    url: 'https://images.unsplash.com/photo-1698614082118-8e6eaecb08ef?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=900',
  },
];

export const TONES = [
  'linear-gradient(150deg, #3e6d5c, #1c2a25)',
  'linear-gradient(150deg, #c77b5c, #7f362b)',
  'linear-gradient(150deg, #d8b44a, #8a6a1f)',
  'linear-gradient(150deg, #6b7fa6, #2c3550)',
  'linear-gradient(150deg, #9a6aa0, #452a4d)',
  'linear-gradient(150deg, #7aa58c, #2f5444)',
];

export function photoUrl(photo: string) {
  if (photo.startsWith('p:')) return PRESET_PHOTOS.find((preset) => preset.key === photo)?.url ?? null;
  if (/^https:\/\//i.test(photo)) return photo;
  return null;
}

/** CSS background for an option: its photo, or a tone picked from its position. */
export function optionBackground(option: Option, index: number): CSSProperties {
  const url = photoUrl(option.photo);
  if (url) return { backgroundImage: `url("${url.replace(/"/g, '%22')}")` };
  const tone = option.photo.startsWith('tone:') ? Number(option.photo.slice(5)) : index;
  return { backgroundImage: TONES[Math.abs(tone) % TONES.length] };
}

export const KIND_LABEL: Record<QuestionKind, string> = {
  swipe: 'Swipe deck',
  versus: 'This or That',
  open: 'Open question',
};

export const KIND_HINT: Record<QuestionKind, string> = {
  swipe: 'Rate each possibility: pass, into it, or love it',
  versus: 'Choose between two options',
  open: 'Ask anything and get a written answer',
};

export const SWIPE_LABEL: Record<SwipeChoice, string> = { love: 'Love it', into: 'Into it', pass: 'Pass' };

export function versusLabel(question: Question, choice: VersusChoice) {
  if (choice === 'either') return 'Either works';
  if (choice === 'neither') return 'Neither';
  return question.options[choice === 'a' ? 0 : 1]?.title || (choice === 'a' ? 'Option A' : 'Option B');
}

export function blankOption(): Option {
  return { id: newId(), title: '', blurb: '', tags: [], photo: '' };
}

export function blankQuestion(kind: QuestionKind): Question {
  return {
    id: newId(),
    kind,
    prompt: '',
    options: kind === 'open' ? [] : kind === 'versus' ? [blankOption(), blankOption()] : [blankOption()],
  };
}

export function isAnswered(question: Question, answer: Answer | undefined) {
  if (!answer || answer.kind !== question.kind) return false;
  if (answer.kind === 'swipe') return question.options.every((option) => answer.picks[option.id]);
  if (answer.kind === 'open') return answer.text.trim().length > 0;
  return true;
}

export function newDeck(title: string, message: string, questions: Question[] = []): Deck {
  const now = Date.now();
  return { id: newId(), title, message, questions, createdAt: now, updatedAt: now };
}

export function duplicateDeck(deck: Deck): Deck {
  return newDeck(
    `${deck.title} (copy)`,
    deck.message,
    deck.questions.map((question) => ({
      ...question,
      id: newId(),
      options: question.options.map((option) => ({ ...option, id: newId() })),
    })),
  );
}

const option = (title: string, blurb: string, tags: string[], photo: string): Option => ({
  id: newId(),
  title,
  blurb,
  tags,
  photo,
});

export const TEMPLATES: { name: string; description: string; build: () => Deck }[] = [
  {
    name: 'Friday night out',
    description: '3 vibes to swipe, a This or That, and an open question',
    build: () =>
      newDeck('Friday night', 'Pick with your gut. I’ll handle the rest.', [
        {
          id: newId(),
          kind: 'swipe',
          prompt: 'What sounds good for Friday?',
          options: [
            option('Long lunch energy', 'Seasonal plates, sun on the table, nowhere to rush.', ['Bistro', 'Relaxed', 'Seasonal'], 'p:bistro'),
            option('Low-lit & lingering', 'A tucked-away table, a very good bottle, nowhere else to be.', ['Intimate', 'Wine bar', 'Dressy'], 'p:wine'),
            option('Hidden downstairs', 'Dark corners, vinyl spinning, one excellent nightcap.', ['Cocktails', 'Late', 'Moody'], 'p:lounge'),
          ],
        },
        {
          id: newId(),
          kind: 'versus',
          prompt: 'Which would tempt you more?',
          options: [
            option('Wine bar', 'Quiet, low-lit, lingering', [], 'p:wine'),
            option('Night market', 'Electric, casual, shareable', [], 'tone:1'),
          ],
        },
        { id: newId(), kind: 'open', prompt: 'Anything you’ve been craving lately?', options: [] },
      ]),
  },
  {
    name: 'Getting to know you',
    description: 'Three open questions to start a good conversation',
    build: () =>
      newDeck('Getting to know you', 'No wrong answers — I just want to hear yours.', [
        { id: newId(), kind: 'open', prompt: 'What’s a perfect, lazy Sunday for you?', options: [] },
        { id: newId(), kind: 'open', prompt: 'Somewhere you’ve always wanted us to go?', options: [] },
        { id: newId(), kind: 'open', prompt: 'What made you smile this week?', options: [] },
      ]),
  },
];

export function formatDate(time: number) {
  return new Date(time).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
