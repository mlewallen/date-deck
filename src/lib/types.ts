export type SwipeChoice = 'pass' | 'into' | 'love';
export type VersusChoice = 'a' | 'b' | 'either' | 'neither';
export type QuestionKind = 'swipe' | 'versus' | 'open';

/** One possibility on a swipe card, or one side of a This-or-That. */
export type Option = {
  id: string;
  title: string;
  blurb: string;
  tags: string[];
  /** '' (automatic), 'p:<preset>', 'tone:<n>', or an https:// image URL. */
  photo: string;
};

/** Swipe uses any number of options, versus uses exactly two, open uses none. */
export type Question = {
  id: string;
  kind: QuestionKind;
  prompt: string;
  options: Option[];
};

export type Answer =
  | { kind: 'swipe'; picks: Record<string, SwipeChoice> }
  | { kind: 'versus'; choice: VersusChoice }
  | { kind: 'open'; text: string };

export type DeckResponse = {
  from: string;
  respondedAt: number;
  answers: Record<string, Answer>;
  note: string;
};

export type Deck = {
  id: string;
  title: string;
  message: string;
  questions: Question[];
  createdAt: number;
  updatedAt: number;
  sentAt?: number;
  /** Short invite link, reused until the deck or names change (see `version`). */
  shareLink?: { url: string; version: string };
  response?: DeckResponse;
};

export type Profile = { me: string; partner: string };

export type AppData = { version: 1; profile: Profile | null; decks: Deck[] };

/** The part of a deck that travels inside a share link. */
export type SharedDeck = Pick<Deck, 'id' | 'title' | 'message' | 'questions'>;

export type InvitePayload = { t: 'invite'; v: 1; from: string; to: string; deck: SharedDeck };
export type AnswerPayload = { t: 'answers'; v: 1; to: string; deck: SharedDeck; response: DeckResponse };
