import { useEffect, useRef, useState } from 'react';
import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { AppHeader, EmptyState, Icon, PrimaryButton, Sheet, toast } from '../components/ui';
import { KIND_LABEL, TEMPLATES, duplicateDeck, formatDate, isAnswered, newDeck } from '../lib/content';
import { go } from '../lib/router';
import { copyText, inviteLink, payloadFromPaste, readAnswers, shareLink } from '../lib/share';
import { parseBackup } from '../lib/storage';
import type { AnswerPayload, AppData, Deck, Profile, Question } from '../lib/types';
import { AnswersView } from './AnswersView';
import { QuestionEditor } from './QuestionEditor';

type SetData = Dispatch<SetStateAction<AppData>>;

export function Onboarding({ onDone }: { onDone: (profile: Profile) => void }) {
  const [me, setMe] = useState('');
  const [partner, setPartner] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (me.trim() && partner.trim()) onDone({ me: me.trim(), partner: partner.trim() });
  };
  return (
    <form className="screen role-entry" onSubmit={submit}>
      <div className="scroll">
        <div className="brand-mark" aria-hidden="true">D</div>
        <p className="eyebrow">DATE DECK</p>
        <h1 className="display">A better way to plan a date.</h1>
        <p className="lede">Ask the questions, collect the answers, keep the destination a surprise.</p>
        <label className="field">
          <span>YOUR FIRST NAME</span>
          <input value={me} onChange={(event) => setMe(event.target.value)} autoComplete="given-name" maxLength={24} placeholder="Alex" />
        </label>
        <label className="field">
          <span>WHO YOU’RE PLANNING FOR</span>
          <input value={partner} onChange={(event) => setPartner(event.target.value)} maxLength={24} placeholder="Jamie" />
        </label>
        <p className="fine-print">Everything is saved on this device. Nothing is shared until you send a link.</p>
      </div>
      <footer className="screen-footer">
        <PrimaryButton type="submit" disabled={!me.trim() || !partner.trim()}>Get started</PrimaryButton>
      </footer>
    </form>
  );
}

function deckStatus(deck: Deck) {
  if (deck.response) return { label: 'Answered', tone: 'answered' };
  if (deck.sentAt && deck.updatedAt > deck.sentAt) return { label: 'Changed since sent', tone: 'changed' };
  if (deck.sentAt) return { label: 'Sent · waiting', tone: 'sent' };
  return { label: deck.questions.length ? 'Draft' : 'Empty draft', tone: 'draft' };
}

export function Home({ data, setData }: { data: AppData; setData: SetData }) {
  const [creating, setCreating] = useState(false);
  const partner = data.profile?.partner ?? 'them';
  const decks = [...data.decks].sort((a, b) => (b.response?.respondedAt ?? b.updatedAt) - (a.response?.respondedAt ?? a.updatedAt));
  const answered = decks.filter((deck) => deck.response);

  const create = (deck: Deck) => {
    setData((current) => ({ ...current, decks: [deck, ...current.decks] }));
    setCreating(false);
    go(`/deck/${deck.id}`);
  };

  return (
    <section className="screen planner-screen">
      <AppHeader
        title="Date Deck"
        action={<button className="icon-button" aria-label="Settings" onClick={() => go('/settings')}><Icon name="settings" /></button>}
      />
      <main className="scroll planner-content">
        <div className="title-row">
          <div><p className="eyebrow">FOR {partner.toUpperCase()}</p><h2 className="display">Your decks</h2></div>
          {decks.length > 0 && <button className="add-button" onClick={() => setCreating(true)} aria-label="New deck"><Icon name="plus" /></button>}
        </div>

        {decks.length === 0 ? (
          <>
            <EmptyState icon="spark" title="No decks yet">
              <p>A deck is a set of questions for {partner}. You’ll see every answer here, tied to the deck you asked it in.</p>
              <PrimaryButton onClick={() => setCreating(true)}>Create your first deck</PrimaryButton>
            </EmptyState>
            <ol className="how-it-works">
              <li><b>Build a deck.</b> Add swipe cards, This-or-That choices, or open questions.</li>
              <li><b>Send it to {partner}.</b> They answer on their own phone — or on yours.</li>
              <li><b>See their answers.</b> They send a link back, and the answers land in the deck.</li>
            </ol>
          </>
        ) : (
          <>
            {answered.length > 0 && (
              <button className="answer-banner" onClick={() => go(`/deck/${answered[0].id}/answers`)}>
                <div className="avatar" aria-hidden="true">{partner.charAt(0).toUpperCase()}</div>
                <span><b>{partner} answered “{answered[0].title}”</b><small>{formatDate(answered[0].response!.respondedAt)}</small></span>
                <Icon name="chevron" />
              </button>
            )}
            <ul className="deck-list">
              {decks.map((deck) => {
                const status = deckStatus(deck);
                const count = deck.questions.length;
                return (
                  <li key={deck.id}>
                    <button className="question-row" onClick={() => go(`/deck/${deck.id}${deck.response ? '/answers' : ''}`)}>
                      <div>
                        <b>{deck.title}</b>
                        <span>{count} {count === 1 ? 'question' : 'questions'} · Updated {formatDate(deck.updatedAt)}</span>
                      </div>
                      <em className={`status ${status.tone}`}>{status.label}</em>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </main>
      {creating && <DeckDetailsSheet partner={partner} onClose={() => setCreating(false)} onCreate={create} />}
    </section>
  );
}

function DeckDetailsSheet({
  deck,
  partner,
  onClose,
  onCreate,
  onSave,
}: {
  deck?: Deck;
  partner: string;
  onClose: () => void;
  onCreate?: (deck: Deck) => void;
  onSave?: (title: string, message: string) => void;
}) {
  const [title, setTitle] = useState(deck?.title ?? '');
  const [message, setMessage] = useState(deck?.message ?? '');
  const submit = () => {
    if (!title.trim()) return;
    if (deck) onSave?.(title.trim(), message.trim());
    else onCreate?.(newDeck(title.trim(), message.trim()));
  };
  return (
    <Sheet
      title={deck ? 'Deck details' : 'New deck'}
      onClose={onClose}
      right={<button className="strong" disabled={!title.trim()} onClick={submit}>{deck ? 'Save' : 'Create'}</button>}
    >
      <label className="field">
        <span>DECK NAME</span>
        <input value={title} maxLength={40} autoFocus placeholder="Friday night" onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label className="field">
        <span>A NOTE TO {partner.toUpperCase()} <em>optional</em></span>
        <textarea value={message} maxLength={160} placeholder="Pick with your gut. I’ll handle the rest." onChange={(event) => setMessage(event.target.value)} />
      </label>
      <PrimaryButton disabled={!title.trim()} onClick={submit}>{deck ? 'Save' : 'Create deck'}</PrimaryButton>
      {!deck && (
        <>
          <h3 className="section-title">OR START FROM A TEMPLATE</h3>
          {TEMPLATES.map((template) => (
            <button key={template.name} className="type-option" onClick={() => onCreate?.(template.build())}>
              <Icon name="spark" />
              <span><b>{template.name}</b><small>{template.description}</small></span>
              <Icon name="chevron" className="plain" />
            </button>
          ))}
        </>
      )}
    </Sheet>
  );
}

export function DeckScreen({
  deck,
  profile,
  tab,
  setData,
}: {
  deck: Deck;
  profile: Profile;
  tab: 'questions' | 'answers';
  setData: SetData;
}) {
  const [editing, setEditing] = useState<Question | 'new' | null>(null);
  const [sheet, setSheet] = useState<'send' | 'menu' | 'details' | null>(null);
  const { partner } = profile;

  const update = (change: (deck: Deck) => Deck, touch = true) =>
    setData((current) => ({
      ...current,
      decks: current.decks.map((item) => (item.id === deck.id ? { ...change(item), ...(touch ? { updatedAt: Date.now() } : {}) } : item)),
    }));

  const saveQuestion = (question: Question) => {
    update((current) => ({
      ...current,
      questions: current.questions.some((item) => item.id === question.id)
        ? current.questions.map((item) => (item.id === question.id ? question : item))
        : [...current.questions, question],
    }));
    setEditing(null);
  };

  const move = (index: number, by: number) =>
    update((current) => {
      const questions = [...current.questions];
      const [item] = questions.splice(index, 1);
      questions.splice(index + by, 0, item);
      return { ...current, questions };
    });

  const remove = (question: Question) => {
    if (!window.confirm(`Delete “${question.prompt}”?`)) return;
    update((current) => ({ ...current, questions: current.questions.filter((item) => item.id !== question.id) }));
  };

  const status = deckStatus(deck);
  const hasQuestions = deck.questions.length > 0;

  return (
    <section className="screen planner-screen">
      <AppHeader
        title={deck.title}
        back={() => go('/')}
        backLabel="All decks"
        action={<button className="icon-button" aria-label="Deck options" onClick={() => setSheet('menu')}><Icon name="more" /></button>}
      />
      <div className="segmented" role="tablist" aria-label="Deck sections">
        <button role="tab" aria-selected={tab === 'questions'} onClick={() => go(`/deck/${deck.id}`, { replace: true })}>
          Questions <small>{deck.questions.length}</small>
        </button>
        <button role="tab" aria-selected={tab === 'answers'} onClick={() => go(`/deck/${deck.id}/answers`, { replace: true })}>
          Answers {deck.response && <i className="dot" aria-label="has answers" />}
        </button>
      </div>

      <main className="scroll planner-content">
        <div className="deck-intro">
          <em className={`status ${status.tone}`}>{status.label}</em>
          {deck.message ? <blockquote>“{deck.message}”</blockquote> : (
            <button className="text-link" onClick={() => setSheet('details')}>+ Add a note to {partner}</button>
          )}
        </div>

        {tab === 'questions' && (
          <>
            {!hasQuestions ? (
              <EmptyState icon="open" title="No questions yet">
                <p>Add what you want to ask {partner}. Mix swipe cards, This-or-That, and open questions.</p>
                <PrimaryButton onClick={() => setEditing('new')}>Add the first question</PrimaryButton>
              </EmptyState>
            ) : (
              <>
                <ol className="question-list">
                  {deck.questions.map((question, index) => {
                    const answered = deck.response && isAnswered(question, deck.response.answers[question.id]);
                    return (
                      <li key={question.id} className="question-item">
                        <button className="question-main" onClick={() => setEditing(question)}>
                          <Icon name={question.kind} />
                          <span>
                            <b>{question.prompt}</b>
                            <small>
                              {KIND_LABEL[question.kind]}
                              {question.kind === 'swipe' && ` · ${question.options.length} ${question.options.length === 1 ? 'card' : 'cards'}`}
                              {deck.response && (answered ? ' · Answered' : ' · Not answered')}
                            </small>
                          </span>
                        </button>
                        <div className="question-tools">
                          <button onClick={() => setEditing(question)} aria-label={`Edit question ${index + 1}`}><Icon name="edit" /></button>
                          <button onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move question ${index + 1} up`}><Icon name="up" /></button>
                          <button onClick={() => move(index, 1)} disabled={index === deck.questions.length - 1} aria-label={`Move question ${index + 1} down`}><Icon name="down" /></button>
                          <button onClick={() => remove(question)} aria-label={`Delete question ${index + 1}`}><Icon name="trash" /></button>
                        </div>
                      </li>
                    );
                  })}
                </ol>
                <button className="dashed-button" onClick={() => setEditing('new')}><Icon name="plus" /> Add a question</button>
              </>
            )}
          </>
        )}

        {tab === 'answers' && (
          deck.response ? (
            <>
              <AnswersView deck={deck} partner={partner} />
              <button className="text-button" onClick={() => go(`/deck/${deck.id}/here`)}>Have {partner} answer again on this phone</button>
            </>
          ) : (
            <>
              <EmptyState icon="inbox" title={deck.sentAt ? `Waiting for ${partner}` : 'No answers yet'}>
                <p>
                  {deck.sentAt
                    ? `You sent this ${formatDate(deck.sentAt)}. When ${partner} finishes, they’ll send you a link — open it and the answers land here.`
                    : hasQuestions
                      ? `Send this deck to ${partner}, or hand them your phone. Their answers will show up here.`
                      : `Add a few questions first, then send the deck to ${partner}.`}
                </p>
              </EmptyState>
              {deck.sentAt && <PasteAnswers />}
            </>
          )
        )}
      </main>

      {hasQuestions && !(tab === 'answers' && deck.response) && (
        <footer className="screen-footer with-tools">
          <PrimaryButton onClick={() => setSheet('send')}>{deck.sentAt ? `Send to ${partner} again` : `Send to ${partner}`}</PrimaryButton>
          <div className="footer-tools">
            <button onClick={() => go(`/deck/${deck.id}/here`)}><Icon name="phone" /> Answer here</button>
            <button onClick={() => go(`/deck/${deck.id}/preview`)}><Icon name="eye" /> Preview</button>
          </div>
        </footer>
      )}

      {editing && (
        <QuestionEditor
          initial={editing === 'new' ? null : editing}
          partner={partner}
          onSave={saveQuestion}
          onClose={() => setEditing(null)}
        />
      )}
      {sheet === 'send' && <SendSheet deck={deck} profile={profile} onSent={() => update((current) => ({ ...current, sentAt: Date.now() }), false)} onClose={() => setSheet(null)} />}
      {sheet === 'details' && (
        <DeckDetailsSheet
          deck={deck}
          partner={partner}
          onClose={() => setSheet(null)}
          onSave={(title, message) => {
            update((current) => ({ ...current, title, message }));
            setSheet(null);
          }}
        />
      )}
      {sheet === 'menu' && (
        <Sheet title="Deck options" onClose={() => setSheet(null)} left={<span />} right={<button onClick={() => setSheet(null)}>Done</button>}>
          <div className="menu-list">
            <button onClick={() => setSheet('details')}><Icon name="edit" /> Rename or edit note</button>
            <button
              onClick={() => {
                const copy = duplicateDeck(deck);
                setData((current) => ({ ...current, decks: [copy, ...current.decks] }));
                setSheet(null);
                go(`/deck/${copy.id}`);
                toast('Deck duplicated');
              }}
            >
              <Icon name="copy" /> Duplicate deck
            </button>
            {deck.response && (
              <button
                onClick={() => {
                  if (!window.confirm(`Clear ${partner}’s answers for this deck?`)) return;
                  update((current) => ({ ...current, response: undefined }), false);
                  setSheet(null);
                }}
              >
                <Icon name="undo" /> Clear answers
              </button>
            )}
            <button
              className="danger"
              onClick={() => {
                if (!window.confirm(`Delete “${deck.title}” and its answers? This can’t be undone.`)) return;
                setData((current) => ({ ...current, decks: current.decks.filter((item) => item.id !== deck.id) }));
                go('/', { replace: true });
              }}
            >
              <Icon name="trash" /> Delete deck
            </button>
          </div>
        </Sheet>
      )}
    </section>
  );
}

function SendSheet({ deck, profile, onSent, onClose }: { deck: Deck; profile: Profile; onSent: () => void; onClose: () => void }) {
  const [link, setLink] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    inviteLink(deck, profile.me, profile.partner).then((url) => live && setLink(url));
    return () => {
      live = false;
    };
  }, [deck, profile]);

  const send = async () => {
    if (!link) return;
    const result = await shareLink(link, deck.title, `${profile.me} made you a Date Deck: “${deck.title}”`);
    if (result === 'shared' || result === 'copied') onSent();
    if (result === 'copied') toast(`Link copied — paste it in a message to ${profile.partner}`);
    if (result === 'failed') toast('Couldn’t copy automatically. Copy the link below.');
    if (result !== 'cancelled' && result !== 'failed') onClose();
  };
  const copy = async () => {
    if (link && (await copyText(link))) {
      onSent();
      toast('Link copied');
    }
  };

  return (
    <Sheet title={`Send to ${profile.partner}`} onClose={onClose} left={<span />} right={<button onClick={onClose}>Done</button>}>
      <p className="sheet-copy">
        {profile.partner} opens the link on their phone, answers, then sends a link back to you. The deck lives inside the link itself — it never goes to a server.
      </p>
      <PrimaryButton onClick={send} disabled={!link}><span className="button-row"><Icon name="share" /> Share link</span></PrimaryButton>
      <button className="text-button" onClick={copy} disabled={!link}>Copy link</button>
      {link && <input className="link-field" readOnly value={link} aria-label="Invite link" onFocus={(event) => event.currentTarget.select()} />}
      <p className="fine-print">Edit the deck after sending? Send it again so {profile.partner} gets the latest version.</p>
    </Sheet>
  );
}

function PasteAnswers() {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const payload = payloadFromPaste(text, 'answers');
    if (!payload) return setError('That doesn’t look like an answer link.');
    go(`/answers/${payload}`);
  };
  return (
    <form className="paste-answers" onSubmit={submit}>
      <label className="field">
        <span>GOT AN ANSWER LINK ON ANOTHER DEVICE? PASTE IT HERE</span>
        <input value={text} onChange={(event) => { setText(event.target.value); setError(''); }} placeholder="https://…/#/answers/…" />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <PrimaryButton secondary type="submit" disabled={!text.trim()}>Add answers</PrimaryButton>
    </form>
  );
}

export function ImportAnswers({ payload, data, setData }: { payload: string; data: AppData; setData: SetData }) {
  const [state, setState] = useState<{ status: 'loading' | 'invalid' } | { status: 'ready'; answers: AnswerPayload }>({ status: 'loading' });
  const handled = useRef(false);

  useEffect(() => {
    readAnswers(payload).then((answers) => setState(answers ? { status: 'ready', answers } : { status: 'invalid' }));
  }, [payload]);

  const save = (answers: AnswerPayload) => {
    const { deck: shared, response } = answers;
    setData((current) => {
      const exists = current.decks.some((deck) => deck.id === shared.id);
      const decks = exists
        ? current.decks.map((deck) => (deck.id === shared.id ? { ...deck, response } : deck))
        : [{ ...newDeck(shared.title, shared.message, shared.questions), id: shared.id, sentAt: response.respondedAt, response }, ...current.decks];
      return { ...current, profile: current.profile ?? { me: answers.to, partner: response.from }, decks };
    });
    toast(`Saved ${response.from}’s answers`);
    go(`/deck/${shared.id}/answers`, { replace: true });
  };

  const existing = state.status === 'ready' ? data.decks.find((deck) => deck.id === state.answers.deck.id) : undefined;
  const conflict =
    state.status === 'ready' && existing?.response && existing.response.respondedAt !== state.answers.response.respondedAt;

  useEffect(() => {
    if (state.status !== 'ready' || handled.current || conflict) return;
    handled.current = true;
    if (existing?.response?.respondedAt === state.answers.response.respondedAt) go(`/deck/${existing.id}/answers`, { replace: true });
    else save(state.answers);
  });

  if (state.status === 'invalid') {
    return (
      <section className="full-screen done-screen">
        <p className="eyebrow">HMM</p>
        <h2 className="display">That link didn’t open.</h2>
        <p>It may have been cut off when it was copied. Ask for it again, or paste the full link from your messages.</p>
        <PrimaryButton onClick={() => go('/', { replace: true })}>Go to my decks</PrimaryButton>
      </section>
    );
  }
  if (state.status === 'ready' && conflict && existing?.response) {
    const { answers } = state;
    const newer = answers.response.respondedAt > existing.response.respondedAt;
    return (
      <section className="full-screen done-screen">
        <p className="eyebrow">NEW ANSWERS</p>
        <h2 className="display">Replace the answers for “{existing.title}”?</h2>
        <p>
          You have answers from {formatDate(existing.response.respondedAt)}. This link has {newer ? 'newer' : 'older'} answers from {formatDate(answers.response.respondedAt)}.
        </p>
        <PrimaryButton onClick={() => save(answers)}>Use these answers</PrimaryButton>
        <button className="text-button" onClick={() => go(`/deck/${existing.id}/answers`, { replace: true })}>Keep what I have</button>
      </section>
    );
  }
  return <section className="full-screen done-screen"><p className="eyebrow">OPENING ANSWERS…</p></section>;
}

export function Settings({ data, setData }: { data: AppData; setData: SetData }) {
  const profile = data.profile ?? { me: '', partner: '' };
  const fileInput = useRef<HTMLInputElement>(null);

  const setName = (key: keyof Profile, value: string) => setData((current) => ({ ...current, profile: { ...profile, ...current.profile, [key]: value } }));

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `date-deck-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = async (file: File | undefined) => {
    if (!file) return;
    const backup = parseBackup(await file.text());
    if (!backup) return toast('That file isn’t a Date Deck backup.');
    if (!window.confirm(`Replace everything on this device with the backup (${backup.decks.length} decks)?`)) return;
    setData(backup);
    toast('Backup restored');
  };

  return (
    <section className="screen planner-screen">
      <AppHeader title="Settings" back={() => go('/')} />
      <main className="scroll planner-content settings">
        <h3 className="section-title">NAMES</h3>
        <label className="field">
          <span>YOUR NAME</span>
          <input value={profile.me} maxLength={24} onChange={(event) => setName('me', event.target.value)} />
        </label>
        <label className="field">
          <span>YOUR PARTNER’S NAME</span>
          <input value={profile.partner} maxLength={24} onChange={(event) => setName('partner', event.target.value)} />
        </label>

        <h3 className="section-title">ANSWERS FROM ANOTHER DEVICE</h3>
        <PasteAnswers />

        <h3 className="section-title">BACKUP</h3>
        <p className="sheet-copy">
          Your decks and answers live only in this browser. Save a backup now and then — and on iPhone, use Share → Add to Home Screen so Safari keeps your data.
        </p>
        <div className="button-pair">
          <PrimaryButton secondary onClick={exportBackup}>Save backup</PrimaryButton>
          <PrimaryButton secondary onClick={() => fileInput.current?.click()}>Restore</PrimaryButton>
        </div>
        <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={(event) => { importBackup(event.target.files?.[0]); event.target.value = ''; }} />

        <h3 className="section-title">START OVER</h3>
        <button
          className="danger-button"
          onClick={() => {
            if (!window.confirm('Erase all decks, answers, and names from this device? This can’t be undone.')) return;
            setData({ version: 1, profile: null, decks: [] });
            go('/', { replace: true });
          }}
        >
          Erase everything on this device
        </button>
      </main>
    </section>
  );
}
