import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { AppHeader, Icon, OptionCard, PrimaryButton, toast } from '../components/ui';
import { isAnswered, optionBackground } from '../lib/content';
import { answersLink, shareLink, copyText } from '../lib/share';
import { progressStore, sentStore } from '../lib/storage';
import type { Answer, DeckResponse, Question, SharedDeck, SwipeChoice, VersusChoice } from '../lib/types';

/**
 * The partner's side of a deck.
 * - link: opened from an invite link on their own phone; answers go back as a link.
 * - here: answered on the planner's phone; answers save straight into the deck.
 * - preview: the planner trying their own deck; nothing is saved.
 */
type Mode = 'link' | 'here' | 'preview';

const INVITE = -2;
const INTRO = -1;

export function Picker({
  deck,
  from,
  to,
  mode,
  onSubmit,
  onExit,
}: {
  deck: SharedDeck;
  from: string;
  to: string;
  mode: Mode;
  onSubmit?: (response: DeckResponse) => void;
  onExit?: () => void;
}) {
  const total = deck.questions.length;
  const NOTE = total;
  const DONE = total + 1;

  const [state, setState] = useState(() => {
    const saved = mode === 'link' ? progressStore.get(deck.id) : null;
    const sent = mode === 'link' ? sentStore.get(deck.id) : null;
    if (saved && saved.step >= INTRO && saved.step <= NOTE) return { ...saved, sentLink: null as string | null };
    if (sent) return { step: DONE, answers: {}, note: '', sentLink: sent.link as string | null };
    return { step: mode === 'preview' ? INTRO : INVITE, answers: {} as Record<string, Answer>, note: '', sentLink: null as string | null };
  });
  const { step, answers, note, sentLink } = state;
  const setStep = (next: number) => setState((current) => ({ ...current, step: next }));
  const setAnswer = (questionId: string, answer: Answer) =>
    setState((current) => ({ ...current, answers: { ...current.answers, [questionId]: answer } }));

  // Keep in-progress answers so closing the tab doesn't lose them.
  useEffect(() => {
    if (mode === 'link' && step >= INTRO && step <= NOTE) progressStore.set(deck.id, { step, answers, note });
  }, [mode, deck.id, step, answers, note, NOTE]);

  const scroller = useRef<HTMLElement>(null);
  useEffect(() => {
    scroller.current?.scrollTo(0, 0);
  }, [step]);

  const finish = async () => {
    const response: DeckResponse = { from: to, respondedAt: Date.now(), answers, note: note.trim() };
    if (mode === 'here') onSubmit?.(response);
    if (mode === 'link') {
      const link = await answersLink(deck, from, response);
      sentStore.set(deck.id, link);
      progressStore.set(deck.id, null);
      setState((current) => ({ ...current, step: DONE, sentLink: link }));
      return;
    }
    setStep(DONE);
  };

  const confirmExit = () => {
    if (mode === 'here' && step < DONE && Object.keys(answers).length > 0) {
      if (!window.confirm(`Leave now? ${to}’s answers so far won’t be saved.`)) return;
    }
    onExit?.();
  };

  const exitButton = onExit && step !== DONE && (
    <button className="text-link" onClick={confirmExit}>{mode === 'preview' ? 'Exit preview' : 'Exit'}</button>
  );
  const previewBadge = mode === 'preview' && <div className="preview-badge">PREVIEW · ANSWERS AREN’T SAVED</div>;

  if (step === INVITE) {
    return (
      <section className="full-screen invite-screen">
        {onExit && <button className="exit-button" onClick={confirmExit} aria-label="Close"><Icon name="close" /></button>}
        <div className="invite-art" aria-hidden="true">
          <div className="invitation">
            <span>FOR {to.toUpperCase()}</span>
            <div className="wax-seal">{from.charAt(0).toUpperCase() || 'D'}</div>
            <small>A PRIVATE INVITATION</small>
          </div>
          <i /><i />
        </div>
        <div className="bottom-copy">
          <p className="eyebrow">FROM {from.toUpperCase()}, FOR YOU</p>
          <h2 className="display">A little mystery awaits.</h2>
          <p>{from} put together a few questions for you. Answer with your gut — {from} will keep the rest a surprise.</p>
          <PrimaryButton onClick={() => setStep(INTRO)}>Open your invitation</PrimaryButton>
        </div>
      </section>
    );
  }

  if (step === INTRO) {
    return (
      <section className="screen">
        {previewBadge}
        <AppHeader title="Date Deck" back={mode === 'preview' ? undefined : () => setStep(INVITE)} action={exitButton} />
        <main className="scroll intro-scroll" ref={scroller}>
          <div className="count-art" aria-hidden="true">
            <div className="mini-deck"><i /><i /><b>{total}</b></div>
            <span>{total === 1 ? 'ONE QUESTION' : `${total} QUESTIONS`}</span>
          </div>
          <div className="question-intro">
            <p className="eyebrow">A NOTE FROM {from.toUpperCase()}</p>
            <h2 className="display">{deck.title}</h2>
            {deck.message && <blockquote>“{deck.message}”</blockquote>}
            <PrimaryButton onClick={() => setStep(0)}>Begin</PrimaryButton>
            <p className="reassurance">Take your time. There are no wrong answers.</p>
          </div>
        </main>
      </section>
    );
  }

  if (step >= 0 && step < total) {
    const question = deck.questions[step];
    const answer = answers[question.id];
    const next = () => setStep(step + 1);
    const back = () => setStep(step - 1 < 0 ? INTRO : step - 1);
    const header = (
      <>
        {previewBadge}
        <AppHeader title={deck.title} back={back} action={exitButton} />
        <div className="progress-label">
          <span>QUESTION {step + 1} OF {total}</span>
          <i><b style={{ width: `${((step + 1) / (total + 1)) * 100}%` }} /></i>
        </div>
      </>
    );
    if (question.kind === 'swipe') {
      return (
        <section className="screen deck-screen">
          {header}
          <SwipeQuestion
            key={question.id}
            question={question}
            picks={answer?.kind === 'swipe' ? answer.picks : {}}
            onChange={(picks) => setAnswer(question.id, { kind: 'swipe', picks })}
            onDone={next}
            partnerPrivacy={mode === 'link' ? `Your answers are only shared when you send them to ${from}.` : undefined}
          />
        </section>
      );
    }
    if (question.kind === 'versus') {
      const choice = answer?.kind === 'versus' ? answer.choice : null;
      const choose = (value: VersusChoice) => setAnswer(question.id, { kind: 'versus', choice: value });
      return (
        <section className="screen versus-screen">
          {header}
          <main className="scroll" ref={scroller}>
            <div className="versus-intro"><p className="eyebrow">THIS OR THAT</p><h2>{question.prompt || 'Which would you pick?'}</h2></div>
            <div className={`versus-card ${choice ?? ''}`}>
              {question.options.slice(0, 2).map((option, index) => {
                const value: VersusChoice = index === 0 ? 'a' : 'b';
                return (
                  <button
                    key={option.id}
                    className={`versus-side ${value}`}
                    onClick={() => choose(value)}
                    aria-pressed={choice === value}
                    style={optionBackground(option, index)}
                  >
                    <span><b>{option.title || (index === 0 ? 'This' : 'That')}</b>{option.blurb && <small>{option.blurb}</small>}</span>
                  </button>
                );
              })}
              <i aria-hidden="true">{choice === 'either' ? 'EITHER' : choice === 'neither' ? 'NEITHER' : 'OR'}</i>
            </div>
            <div className="choice-row" role="group" aria-label="Other answers">
              <button className={choice === 'either' ? 'active' : ''} aria-pressed={choice === 'either'} onClick={() => choose('either')}>Either works</button>
              <button className={choice === 'neither' ? 'active' : ''} aria-pressed={choice === 'neither'} onClick={() => choose('neither')}>Neither</button>
            </div>
          </main>
          <footer className="screen-footer">
            <PrimaryButton disabled={!choice} onClick={next}>{choice ? 'Continue' : 'Tap a side to choose'}</PrimaryButton>
          </footer>
        </section>
      );
    }
    const text = answer?.kind === 'open' ? answer.text : '';
    return (
      <section className="screen">
        {header}
        <main className="scroll note-content" ref={scroller}>
          <p className="eyebrow">IN YOUR WORDS</p>
          <h2 className="display">{question.prompt || 'Tell me anything'}</h2>
          <label className="sr-only" htmlFor={`answer-${question.id}`}>Your answer</label>
          <textarea
            id={`answer-${question.id}`}
            maxLength={600}
            value={text}
            onChange={(event) => setAnswer(question.id, { kind: 'open', text: event.target.value })}
            placeholder="Type your answer…"
          />
          <small>{text.length} / 600</small>
        </main>
        <footer className="screen-footer">
          <PrimaryButton disabled={!text.trim()} onClick={next}>Continue</PrimaryButton>
          <button className="text-button" onClick={next}>Skip this one</button>
        </footer>
      </section>
    );
  }

  if (step === NOTE) {
    const unanswered = deck.questions.filter((question) => !isAnswered(question, answers[question.id])).length;
    return (
      <section className="screen">
        {previewBadge}
        <AppHeader title="One last thing" back={() => setStep(total - 1)} action={exitButton} />
        <main className="scroll note-content" ref={scroller}>
          <p className="eyebrow">OPTIONAL</p>
          <h2 className="display">Anything {from} should know?</h2>
          <p>Dietary needs, timing, a place you’ve been craving — anything goes.</p>
          <label className="sr-only" htmlFor="partner-note">Note for {from}</label>
          <textarea
            id="partner-note"
            maxLength={280}
            value={note}
            onChange={(event) => setState((current) => ({ ...current, note: event.target.value }))}
            placeholder="I’d love somewhere we can actually hear each other…"
          />
          <small>{note.length} / 280</small>
          {unanswered > 0 && <p className="soft-warning">{unanswered === 1 ? 'One question was' : `${unanswered} questions were`} skipped — that’s okay.</p>}
        </main>
        <footer className="screen-footer">
          <PrimaryButton onClick={finish}>{mode === 'preview' ? 'Finish preview' : mode === 'here' ? 'Save my answers' : 'Finish'}</PrimaryButton>
        </footer>
      </section>
    );
  }

  // DONE
  if (mode === 'link') return <SendAnswers from={from} deckTitle={deck.title} link={sentLink} onEdit={() => setStep(INTRO)} />;
  return (
    <section className="full-screen done-screen">
      <div className="done-mark"><Icon name="check" /></div>
      <p className="eyebrow">{mode === 'preview' ? 'PREVIEW COMPLETE' : 'SAVED'}</p>
      <h2 className="display">{mode === 'preview' ? 'That’s the whole deck.' : 'Your picks are in.'}</h2>
      <p>{mode === 'preview' ? `This is exactly what ${to} will see.` : `Hand the phone back to ${from}.`}</p>
      <PrimaryButton onClick={onExit}>{mode === 'preview' ? 'Exit preview' : `Back to ${from}’s deck`}</PrimaryButton>
    </section>
  );
}

function SendAnswers({ from, deckTitle, link, onEdit }: { from: string; deckTitle: string; link: string | null; onEdit: () => void }) {
  const [sent, setSent] = useState(false);
  const send = async () => {
    if (!link) return;
    const result = await shareLink(link, `${deckTitle} — my answers`, `Here are my answers for “${deckTitle}”:`);
    if (result === 'shared') setSent(true);
    if (result === 'copied') {
      setSent(true);
      toast(`Link copied — paste it in a message to ${from}`);
    }
    if (result === 'failed') toast('Couldn’t copy. Press and hold the link below to copy it.');
  };
  const copy = async () => {
    if (link && (await copyText(link))) toast('Link copied');
  };
  return (
    <section className="full-screen done-screen">
      <div className="done-mark"><Icon name={sent ? 'check' : 'heart'} /></div>
      <p className="eyebrow">{sent ? 'SENT' : 'ONE LAST STEP'}</p>
      <h2 className="display">{sent ? 'Your picks are in.' : `Send your answers to ${from}.`}</h2>
      <p>
        {sent
          ? `Now you get to enjoy not knowing. If ${from} didn’t get it, you can send it again.`
          : `Your answers are saved on this phone only. Send ${from} the link — it opens straight into their deck.`}
      </p>
      <PrimaryButton onClick={send} disabled={!link}>{sent ? 'Send again' : `Send to ${from}`}</PrimaryButton>
      <div className="link-actions">
        <button className="text-button" onClick={copy} disabled={!link}>Copy link</button>
        <button className="text-button" onClick={onEdit}>Change my answers</button>
      </div>
      {link && <input className="link-field" readOnly value={link} aria-label="Answer link" onFocus={(event) => event.currentTarget.select()} />}
    </section>
  );
}

function SwipeQuestion({
  question,
  picks,
  onChange,
  onDone,
  partnerPrivacy,
}: {
  question: Question;
  picks: Record<string, SwipeChoice>;
  onChange: (picks: Record<string, SwipeChoice>) => void;
  onDone: () => void;
  partnerPrivacy?: string;
}) {
  const options = question.options;
  const firstOpen = options.findIndex((option) => !picks[option.id]);
  const index = firstOpen === -1 ? options.length : firstOpen;
  const [stamp, setStamp] = useState<string>();
  const [drag, setDrag] = useState({ x: 0, y: 0, startX: 0, startY: 0, active: false });
  const busy = useRef(false);

  const answer = useCallback(
    (choice: SwipeChoice) => {
      const option = options[index];
      if (!option || busy.current) return;
      busy.current = true;
      setStamp(choice === 'love' ? 'Love it' : choice === 'into' ? 'Into it' : 'Pass');
      navigator.vibrate?.(12);
      window.setTimeout(() => {
        busy.current = false;
        setStamp(undefined);
        setDrag({ x: 0, y: 0, startX: 0, startY: 0, active: false });
        onChange({ ...picks, [option.id]: choice });
        if (index === options.length - 1) onDone();
      }, 220);
    },
    [index, options, picks, onChange, onDone],
  );

  const undo = useCallback(() => {
    const previous = options[index - 1];
    if (!previous || busy.current) return;
    const rest = { ...picks };
    delete rest[previous.id];
    navigator.vibrate?.(25);
    onChange(rest);
  }, [index, options, picks, onChange]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest('input, textarea, button')) return;
      if (event.key === 'ArrowLeft') answer('pass');
      else if (event.key === 'ArrowRight') answer('into');
      else if (event.key === 'ArrowUp') answer('love');
      else if (event.key === 'Backspace') undo();
      else return;
      event.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answer, undo]);

  if (index >= options.length) {
    return (
      <main className="scroll swipe-complete">
        <h2 className="display">{question.prompt || 'All rated'}</h2>
        <p>You rated all {options.length}. Keep going, or start this one over.</p>
        <PrimaryButton onClick={onDone}>Continue</PrimaryButton>
        <button className="text-button" onClick={() => onChange({})}>Start this one over</button>
      </main>
    );
  }

  const dragStamp =
    drag.y < -55 && Math.abs(drag.y) > Math.abs(drag.x) ? 'Love it' : drag.x > 55 ? 'Into it' : drag.x < -55 ? 'Pass' : undefined;
  const dragSelection =
    drag.y < 0 && Math.abs(drag.y) > Math.abs(drag.x) ? 'love' : drag.x > 0 ? 'into' : drag.x < 0 ? 'pass' : undefined;
  const dragIntensity = Math.min(1, Math.max(Math.abs(drag.x), Math.abs(drag.y)) / 110);

  const beginDrag = (event: PointerEvent<HTMLElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ x: 0, y: 0, startX: event.clientX, startY: event.clientY, active: true });
  };
  const moveDrag = (event: PointerEvent<HTMLElement>) => {
    if (!drag.active) return;
    setDrag((current) => ({ ...current, x: event.clientX - current.startX, y: Math.min(0, event.clientY - current.startY) }));
  };
  const endDrag = () => {
    if (!drag.active) return;
    if (drag.y < -110 && Math.abs(drag.y) > Math.abs(drag.x)) answer('love');
    else if (drag.x > 110) answer('into');
    else if (drag.x < -110) answer('pass');
    else setDrag({ x: 0, y: 0, startX: 0, startY: 0, active: false });
  };

  return (
    <>
      {question.prompt && <p className="swipe-prompt">{question.prompt}</p>}
      <div className="gesture-coach" aria-hidden="true"><span>← Pass</span><b>↑ Love</b><span>Into it →</span></div>
      <div className="card-stack">
        <i /><i />
        <OptionCard
          key={options[index].id}
          option={options[index]}
          index={index}
          total={options.length}
          stamp={stamp ?? dragStamp}
          dragging={drag.active}
          selection={drag.active ? dragSelection : undefined}
          intensity={dragIntensity}
          onPointerDown={beginDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          style={{ transform: `translate3d(${drag.x}px, ${drag.y}px, 0) rotate(${drag.x / 24}deg)` }}
        />
      </div>
      <div className="deck-actions">
        <button onClick={() => answer('pass')}><Icon name="close" /><span>Pass</span></button>
        <button onClick={undo} disabled={index === 0}><Icon name="undo" /><span>Undo</span></button>
        <button className="love" onClick={() => answer('love')}><Icon name="up" /><span>Love it</span></button>
        <button className="into" onClick={() => answer('into')}><Icon name="arrow" /><span>Into it</span></button>
      </div>
      {partnerPrivacy && <p className="private-caption">{partnerPrivacy}</p>}
    </>
  );
}
