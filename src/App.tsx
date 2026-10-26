import { useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';

type Role = 'picker' | 'planner' | null;
type PickerScreen = 'invite' | 'intro' | 'swipe' | 'versus' | 'note' | 'done';
type PlannerTab = 'questions' | 'results' | 'discover' | 'pairing';

const cards = [
  {
    title: 'Long lunch energy',
    blurb: 'Seasonal plates, sun on the table, nowhere to rush.',
    tags: ['BISTRO', 'RELAXED', 'SEASONAL'],
    photo:
      'https://images.unsplash.com/photo-1668957067240-9483f721d207?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=88&w=1000',
  },
  {
    title: 'Low-lit & lingering',
    blurb: 'A tucked-away table, a very good bottle, nowhere else to be.',
    tags: ['INTIMATE', 'WINE BAR', 'DRESSY'],
    photo:
      'https://images.unsplash.com/photo-1606659894125-40824878b6ce?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=88&w=1000',
  },
  {
    title: 'Hidden downstairs',
    blurb: 'Dark corners, vinyl spinning, one excellent nightcap.',
    tags: ['COCKTAILS', 'LATE', 'MOODY'],
    photo:
      'https://images.unsplash.com/photo-1698614082118-8e6eaecb08ef?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=88&w=1000',
  },
];

const recommendations = [
  {
    name: 'The Garden Room',
    kind: 'Seasonal bistro',
    fit: 96,
    distance: '0.8 mi',
    price: '$$$',
    reason: 'Quiet tables · Seasonal menu · Warm daylight',
    integration: 'Reserve',
    photo:
      'https://images.unsplash.com/photo-1668957067240-9483f721d207?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=88&w=1000',
  },
  {
    name: 'Juniper Wine Bar',
    kind: 'Wine bar',
    fit: 92,
    distance: '1.2 mi',
    price: '$$',
    reason: 'Intimate · Conversation-friendly · Natural wine',
    integration: 'Walk-in',
    photo:
      'https://images.unsplash.com/photo-1606659894125-40824878b6ce?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=88&w=1000',
  },
  {
    name: 'Clay & Cabernet',
    kind: 'Pottery workshop',
    fit: 88,
    distance: '2.1 mi',
    price: '$$',
    reason: 'Hands-on · Relaxed · 90 minutes',
    integration: 'Tickets',
    photo:
      'https://images.unsplash.com/photo-1698614082118-8e6eaecb08ef?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=88&w=1000',
  },
];

function Icon({ children }: { children: React.ReactNode }) {
  const name = String(children);
  const paths: Record<string, React.ReactNode> = {
    '✦': <><path d="M12 2.8c.5 5.3 2 6.8 7.2 7.2-5.2.5-6.7 2-7.2 7.2-.5-5.2-2-6.7-7.2-7.2 5.2-.4 6.7-1.9 7.2-7.2Z" /><path d="M19 16.5c.2 2 .8 2.6 2.8 2.8-2 .2-2.6.8-2.8 2.7-.2-1.9-.8-2.5-2.8-2.7 2-.2 2.6-.8 2.8-2.8Z" /></>,
    '→': <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
    '×': <><path d="m7 7 10 10" /><path d="M17 7 7 17" /></>,
    '↶': <><path d="M9 7H5v-4" /><path d="M5.5 7.5a8 8 0 1 1-1 7.5" /></>,
    '↑': <><path d="M12 19V5" /><path d="m7 10 5-5 5 5" /></>,
    '↔': <><path d="M4 8h16" /><path d="m7 5-3 3 3 3" /><path d="M20 16H4" /><path d="m17 13 3 3-3 3" /></>,
    '▥': <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M12 4v16" /></>,
    '⌖': <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    '□': <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></>,
    '○': <path d="M7 4h10v17l-5-3-5 3V4Z" />,
    '●': <path d="M7 4h10v17l-5-3-5 3V4Z" fill="currentColor" />,
    '＋': <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    '▤': <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    '↗': <><path d="M5 18 10 13l3 3 6-8" /><path d="M14 8h5v5" /></>,
    '⌁': <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3.5 20c.4-4 2.3-6 5.5-6s5.1 2 5.5 6M14 15c3.6-.7 5.7 1 6.5 4" /></>,
    '‹': <path d="m15 5-7 7 7 7" />,
    '›': <path d="m9 5 7 7-7 7" />,
    '•••': <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
    '✓': <path d="m5 12 4 4L19 6" />,
  };
  return (
    <span className="icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {paths[name] ?? paths['✦']}
      </svg>
    </span>
  );
}

function PrimaryButton({
  children,
  onClick,
  secondary = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  secondary?: boolean;
}) {
  return (
    <button className={`primary-button ${secondary ? 'secondary' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}

function AppHeader({
  title,
  back,
  action,
}: {
  title: string;
  back?: () => void;
  action?: React.ReactNode;
}) {
  return (
    <header className="app-header">
      <div>{back && <button aria-label="Back" onClick={back}><Icon>‹</Icon></button>}</div>
      <b>{title}</b>
      <div>{action}</div>
    </header>
  );
}

function VibeCard({
  index,
  stamp,
  style,
  dragging,
  selection,
  intensity = 0,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  index: number;
  stamp?: string;
  style?: CSSProperties;
  dragging?: boolean;
  selection?: 'pass' | 'into' | 'love';
  intensity?: number;
  onPointerDown?: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove?: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp?: (event: PointerEvent<HTMLElement>) => void;
}) {
  const card = cards[index % cards.length];
  return (
    <article
      className={`vibe-card ${dragging ? 'dragging' : ''} ${selection ? `selecting ${selection}` : ''}`}
      style={{ backgroundImage: `url(${card.photo})`, '--selection-strength': intensity, ...style } as CSSProperties}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="shade" />
      <div className="selection-glow" />
      {stamp && <div className={`stamp ${stamp.toLowerCase().replace(' ', '-')}`}>{stamp}</div>}
      <div className="vibe-copy">
        <div className="card-kicker"><small>CHOSEN FOR YOU</small><span>0{index + 1}</span></div>
        <h2>{card.title}</h2>
        <p>{card.blurb}</p>
        <div className="chips">{card.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      </div>
    </article>
  );
}

function RoleEntry({ setRole }: { setRole: (role: Role) => void }) {
  return (
    <div className="role-entry">
      <div className="brand-mark">D</div>
      <p className="eyebrow">DATE DECK</p>
      <h1>A better way to plan a date.</h1>
      <p>Share the possibilities, keep the destination a surprise.</p>
      <div className="role-cards">
        <button onClick={() => setRole('planner')}>
          <span className="icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3c.6 6 2.4 7.8 8.4 8.4-6 .6-7.8 2.4-8.4 8.4-.6-6-2.4-7.8-8.4-8.4C9.6 10.8 11.4 9 12 3Z" />
            </svg>
          </span><span><b>I’m planning</b><small>Create a deck and see their picks</small></span><strong>›</strong>
        </button>
        <button onClick={() => setRole('picker')}>
          <Icon>→</Icon><span><b>I have an invite</b><small>Open a deck from your person</small></span><strong>›</strong>
        </button>
      </div>
      <small className="demo-note">Choose a role to explore the working prototype.</small>
    </div>
  );
}

function VersusCard({ choice, setChoice }: { choice: string | null; setChoice: (choice: string) => void }) {
  return (
    <div className={`versus-card ${choice ?? ''}`}>
      <button
        className="versus-side left"
        onClick={() => setChoice('left')}
        style={{ backgroundImage: `url(${cards[1].photo})` }}
      >
        <span><b>Wine bar</b><small>Quiet, low-lit, lingering</small></span>
      </button>
      <button
        className="versus-side right"
        onClick={() => setChoice('right')}
        style={{ backgroundImage: `url(${cards[2].photo})` }}
      >
        <span><b>Night market</b><small>Electric, casual, shareable</small></span>
      </button>
      <i>{choice === 'either' ? 'EITHER' : 'OR'}</i>
    </div>
  );
}

function PickerApp({ exit }: { exit: () => void }) {
  const [screen, setScreen] = useState<PickerScreen>('invite');
  const [cardIndex, setCardIndex] = useState(0);
  const [stamp, setStamp] = useState<string>();
  const [choice, setChoice] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [drag, setDrag] = useState({ x: 0, y: 0, startX: 0, startY: 0, active: false });

  const answer = (value: string) => {
    setStamp(value);
    navigator.vibrate?.(value === 'Undo' ? 25 : 12);
    window.setTimeout(() => {
      setStamp(undefined);
      setDrag({ x: 0, y: 0, startX: 0, startY: 0, active: false });
      if (cardIndex < cards.length - 1) setCardIndex((current) => current + 1);
      else setScreen('versus');
    }, 220);
  };

  const dragStamp =
    drag.y < -55 && Math.abs(drag.y) > Math.abs(drag.x)
      ? 'Love it'
      : drag.x > 55
        ? 'Into it'
        : drag.x < -55
          ? 'Pass'
          : undefined;
  const dragSelection =
    drag.y < 0 && Math.abs(drag.y) > Math.abs(drag.x)
      ? 'love'
      : drag.x > 0
        ? 'into'
        : drag.x < 0
          ? 'pass'
          : undefined;
  const dragIntensity = Math.min(1, Math.max(Math.abs(drag.x), Math.abs(drag.y)) / 110);

  const beginDrag = (event: PointerEvent<HTMLElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ x: 0, y: 0, startX: event.clientX, startY: event.clientY, active: true });
  };

  const moveDrag = (event: PointerEvent<HTMLElement>) => {
    if (!drag.active) return;
    setDrag((current) => ({
      ...current,
      x: event.clientX - current.startX,
      y: Math.min(0, event.clientY - current.startY),
    }));
  };

  const endDrag = () => {
    if (!drag.active) return;
    if (drag.y < -110 && Math.abs(drag.y) > Math.abs(drag.x)) answer('Love it');
    else if (drag.x > 110) answer('Into it');
    else if (drag.x < -110) answer('Pass');
    else setDrag({ x: 0, y: 0, startX: 0, startY: 0, active: false });
  };

  if (screen === 'invite') {
    return (
      <section className="full-screen invite-screen">
        <button className="exit-button" onClick={exit} aria-label="Close"><Icon>×</Icon></button>
        <div className="invite-art">
          <div className="invitation">
            <span>FOR JAMIE</span>
            <div className="wax-seal">D</div>
            <small>A PRIVATE INVITATION</small>
          </div>
          <i /><i /><i />
        </div>
        <div className="bottom-copy">
          <p className="eyebrow">FROM ALEX, FOR YOU</p>
          <h1>A little mystery awaits.</h1>
          <p>Alex chose a few possibilities for your next date. Share what draws you in—he’ll keep the rest a surprise.</p>
          <PrimaryButton onClick={() => setScreen('intro')}>Open your invitation</PrimaryButton>
          <button className="text-button">Enter a code instead</button>
        </div>
      </section>
    );
  }

  if (screen === 'intro') {
    return (
      <section className="screen">
        <AppHeader title="Date Deck" back={() => setScreen('invite')} />
        <div className="count-art">
          <div className="mini-deck"><i /><i /><b>5</b></div>
          <span>A PRIVATE DECK</span>
        </div>
        <div className="question-intro">
          <p className="eyebrow">A NOTE FROM ALEX</p>
          <h1>What sounds good for Friday?</h1>
          <blockquote>“Pick with your gut. I’ll handle the rest.”</blockquote>
          <PrimaryButton onClick={() => setScreen('swipe')}>Begin choosing</PrimaryButton>
          <p className="reassurance">Take your time. There are no wrong answers.</p>
        </div>
      </section>
    );
  }

  if (screen === 'swipe') {
    return (
      <section className="screen deck-screen">
        <AppHeader
          title="Friday night"
          back={() => setScreen('intro')}
        action={<button aria-label="More"><Icon>•••</Icon></button>}
        />
        <div className="progress-label"><span>POSSIBILITY {cardIndex + 1} OF {cards.length}</span><i><b style={{ width: `${((cardIndex + 1) / cards.length) * 100}%` }} /></i></div>
        <div className="gesture-coach"><span>← Pass</span><b>↑ Love</b><span>Into →</span></div>
        <div className="card-stack">
          <i /><i />
          <VibeCard
            index={cardIndex}
            stamp={stamp ?? dragStamp}
            dragging={drag.active}
            selection={drag.active ? dragSelection : undefined}
            intensity={dragIntensity}
            onPointerDown={beginDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            style={{
              transform: `translate3d(${drag.x}px, ${drag.y}px, 0) rotate(${drag.x / 24}deg)`,
            }}
          />
        </div>
        <div className="deck-actions">
          <button onClick={() => answer('Pass')} aria-label="Pass"><Icon>×</Icon><span>Pass</span></button>
          <button onClick={() => { navigator.vibrate?.(25); setCardIndex(Math.max(0, cardIndex - 1)); }} aria-label="Undo"><Icon>↶</Icon><span>Undo</span></button>
          <button onClick={() => answer('Love it')} aria-label="Love it"><Icon>↑</Icon><span>Love</span></button>
          <button className="into" onClick={() => answer('Into it')} aria-label="Into it"><Icon>→</Icon><span>Into it</span></button>
        </div>
        <p className="private-caption">Your choices are shared only with Alex.</p>
      </section>
    );
  }

  if (screen === 'versus') {
    return (
      <section className="screen versus-screen">
        <AppHeader title="One more choice" back={() => setScreen('swipe')} action={<span>1 of 1</span>} />
        <div className="versus-intro"><p className="eyebrow">WHICH WOULD TEMPT YOU?</p><h2>Choose the feeling.</h2></div>
        <VersusCard choice={choice} setChoice={setChoice} />
        <p className="drag-hint">Tap a side to choose</p>
        <div className="versus-buttons">
          <PrimaryButton secondary onClick={() => setChoice('either')}>Either works</PrimaryButton>
          <button className="text-button" onClick={() => setChoice('neither')}>Neither</button>
          {choice && <PrimaryButton onClick={() => setScreen('note')}>Continue</PrimaryButton>}
        </div>
      </section>
    );
  }

  if (screen === 'note') {
    return (
      <section className="screen">
        <AppHeader title="One last thing" back={() => setScreen('versus')} />
        <div className="note-content">
          <p className="eyebrow">OPTIONAL</p>
          <h1>Anything he should know?</h1>
          <p>Dietary needs, timing, a place you’ve been craving—anything goes.</p>
          <textarea
            autoFocus
            maxLength={280}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="I’d love somewhere we can actually hear each other…"
          />
          <small>{note.length} / 280</small>
          <PrimaryButton onClick={() => setScreen('done')}>Send my picks</PrimaryButton>
          <button className="text-button" onClick={() => setScreen('done')}>Skip</button>
        </div>
      </section>
    );
  }

  return (
    <section className="full-screen done-screen">
      <div className="done-mark">✓</div>
      <p className="eyebrow">DELIVERED QUIETLY</p>
      <h1>Your picks are in.</h1>
      <p>Alex has everything he needs. Now you get to enjoy not knowing.</p>
      <PrimaryButton onClick={exit}>Done</PrimaryButton>
    </section>
  );
}

function QuestionRow({
  title,
  type,
  progress,
  onClick,
}: {
  title: string;
  type: string;
  progress: number;
  onClick: () => void;
}) {
  return (
    <button className="question-row" onClick={onClick}>
      <div><b>{title}</b><span>{type} · {progress ? `${progress}% answered` : 'Waiting for Jamie'}</span></div>
      <strong>{progress || '—'}</strong>
      <i><span style={{ width: `${progress}%` }} /></i>
      <em>›</em>
    </button>
  );
}

function NewQuestionSheet({ close }: { close: () => void }) {
  const [step, setStep] = useState<'type' | 'details' | 'cards'>('type');
  const [type, setType] = useState<'Swipe deck' | 'This or That'>('Swipe deck');
  if (step === 'type') return (
    <div className="sheet">
      <div className="grabber" /><div className="sheet-head"><button onClick={close}>Cancel</button><b>New question</b><span /></div>
      <h2>How should they choose?</h2>
      {['Swipe deck', 'This or That'].map((item) => <button className={`type-option ${type === item ? 'selected' : ''}`} onClick={() => setType(item as typeof type)} key={item}><Icon>{item === 'Swipe deck' ? '↔' : '▥'}</Icon><span><b>{item}</b><small>{item === 'Swipe deck' ? 'Rate every possibility' : 'Choose between two vibes'}</small></span><strong>✓</strong></button>)}
      <PrimaryButton onClick={() => setStep('details')}>Continue</PrimaryButton>
    </div>
  );
  if (step === 'details') return (
    <div className="sheet">
      <div className="grabber" /><div className="sheet-head"><button onClick={() => setStep('type')}>‹ Back</button><b>Question details</b><span /></div>
      <label>QUESTION TITLE<input defaultValue="What sounds good for Friday?" /></label>
      <label>MESSAGE TO JAMIE<textarea defaultValue="Pick with your gut. I’ll handle the rest." /></label>
      <div className="toggle-row"><span><b>Show to Jamie</b><small>You can hide this question anytime.</small></span><input type="checkbox" defaultChecked /></div>
      <PrimaryButton onClick={() => setStep('cards')}>Add possibilities</PrimaryButton>
    </div>
  );
  return (
    <div className="sheet">
      <div className="grabber" /><div className="sheet-head"><button onClick={() => setStep('details')}>‹ Back</button><b>Add a card</b><button onClick={close}>Done</button></div>
      <button className="photo-picker" style={{ backgroundImage: `url(${cards[0].photo})` }}><span>Change photo</span></button>
      <label>VIBE NAME<input defaultValue="Long lunch energy" /></label>
      <label>ONE LINE<input defaultValue="Seasonal plates, sun on the table, nowhere to rush." /></label>
      <label>TAGS<input defaultValue="Bistro, Relaxed, Seasonal" /></label>
      <PrimaryButton onClick={close}>Save card</PrimaryButton>
    </div>
  );
}

function MatchCard({
  item,
  saved,
  onSave,
  onOpen,
}: {
  item: (typeof recommendations)[number];
  saved: boolean;
  onSave: () => void;
  onOpen: () => void;
}) {
  return (
    <article className="match-card">
      <button className="match-photo" onClick={onOpen} style={{ backgroundImage: `url(${item.photo})` }}>
        <span>{item.fit}% MATCH</span>
      </button>
      <div className="match-copy">
        <div><small>{item.kind.toUpperCase()}</small><h3>{item.name}</h3></div>
        <button className={saved ? 'saved' : ''} onClick={onSave} aria-label={saved ? 'Remove saved match' : 'Save match'}>{saved ? '●' : '○'}</button>
        <p>{item.reason}</p>
        <span>{item.distance} · {item.price} · {item.integration}</span>
      </div>
    </article>
  );
}

function MatchDetail({
  item,
  close,
  saved,
  onSave,
}: {
  item: (typeof recommendations)[number];
  close: () => void;
  saved: boolean;
  onSave: () => void;
}) {
  const [planned, setPlanned] = useState(false);
  return (
    <div className="match-detail">
      <div className="match-hero" style={{ backgroundImage: `url(${item.photo})` }}>
        <button onClick={close} aria-label="Close"><Icon>×</Icon></button>
        <span>{item.fit}% MATCH</span>
      </div>
      <div className="match-detail-copy">
        <p className="eyebrow">{item.kind} · {item.distance}</p>
        <h2>{item.name}</h2>
        <p className="why-match">Jamie loved relaxed, seasonal places and passed on anything loud. This is one of your strongest matches.</p>
        <div className="fit-reasons"><span>Quiet enough to talk</span><span>Seasonal menu</span><span>{item.price}</span></div>
        <div className="integration-row">
          <button><Icon>⌖</Icon><b>Directions</b><small>Apple Maps</small></button>
          <button><Icon>□</Icon><b>{item.integration}</b><small>Partner link</small></button>
          <button onClick={onSave}><Icon>{saved ? '●' : '○'}</Icon><b>{saved ? 'Saved' : 'Save'}</b><small>Shortlist</small></button>
        </div>
        <PrimaryButton onClick={() => setPlanned(true)}>{planned ? 'Added to Friday night ✓' : 'Add to date plan'}</PrimaryButton>
        <p className="integration-note">Availability and booking can connect through restaurant, ticketing, and maps partners.</p>
      </div>
    </div>
  );
}

function PlannerApp({ exit }: { exit: () => void }) {
  const [tab, setTab] = useState<PlannerTab>('questions');
  const [sheet, setSheet] = useState(false);
  const [preview, setPreview] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<(typeof recommendations)[number] | null>(null);
  const [saved, setSaved] = useState<string[]>([recommendations[0].name]);
  const [copied, setCopied] = useState(false);

  const toggleSaved = (name: string) => {
    setSaved((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
  };

  if (preview) return (
    <section className="screen preview-screen">
      <div className="preview-badge">PREVIEW · PICKS AREN’T SAVED</div>
      <AppHeader title="Friday night" back={() => setPreview(false)} />
      <div className="progress-label"><span>1 of 3</span><i><b style={{ width: '33%' }} /></i></div>
      <div className="card-stack"><i /><i /><VibeCard index={0} /></div>
      <div className="deck-actions">
        <button><Icon>×</Icon><span>Pass</span></button><button><Icon>↶</Icon><span>Undo</span></button>
        <button><Icon>↑</Icon><span>Love</span></button><button className="into"><Icon>→</Icon><span>Into it</span></button>
      </div>
    </section>
  );

  return (
    <section className="screen planner-screen">
      <AppHeader
        title={tab === 'questions' ? 'Date Deck' : tab === 'results' ? 'Insights' : tab === 'discover' ? 'Matches' : 'Pairing'}
        action={<button onClick={exit} aria-label="More"><Icon>•••</Icon></button>}
      />
      <div className="planner-content">
        {tab === 'questions' && <>
          <div className="title-row"><div><p className="eyebrow">PLANNER</p><h1>Your questions</h1></div><button className="add-button" onClick={() => setSheet(true)} aria-label="New question"><Icon>＋</Icon></button></div>
          <button className="answer-banner" onClick={() => setTab('results')}><div className="avatar">J</div><span><b>Jamie answered</b><small>Friday night is ready to view.</small></span><strong>›</strong></button>
          <div className="home-insight">
            <span className="spark">✦</span>
            <div><small>NEW INSIGHT</small><b>She’s favoring quiet, unhurried places.</b><button onClick={() => setTab('discover')}>See 3 local matches →</button></div>
          </div>
          <QuestionRow title="Friday night" type="Swipe deck" progress={67} onClick={() => setTab('results')} />
          <QuestionRow title="Pick an anniversary mood" type="This or That" progress={0} onClick={() => setPreview(true)} />
          <h3 className="section-title">DRAFTS</h3>
          <QuestionRow title="A slow Sunday" type="Swipe deck" progress={0} onClick={() => setPreview(true)} />
          <button className="preview-link" onClick={() => setPreview(true)}>Preview Picker experience</button>
        </>}
        {tab === 'results' && <>
          <p className="eyebrow">FRIDAY NIGHT · COMPLETE</p><h1>She’s leaning in.</h1><p className="subcopy">A clear preference for relaxed places where you can stay awhile.</p>
          <div className="insight-hero">
            <span>✦</span>
            <div><small>DATE DECK INSIGHT</small><h3>Keep it intimate, but not formal.</h3><p>Jamie loved seasonal food and conversation-friendly rooms. She passed on tasting menus and high-energy spots.</p></div>
          </div>
          <div className="preference-bars">
            {[['Quiet & intimate', 92], ['Relaxed pace', 84], ['Seasonal food', 78], ['Dressy', 35]].map(([label, value]) => <div key={label}><span><b>{label}</b><small>{value}%</small></span><i><em style={{ width: `${value}%` }} /></i></div>)}
          </div>
          <div className="result-summary"><div><span>LOVE</span><b>1</b></div><div><span>INTO</span><b>2</b></div><div><span>PASS</span><b>1</b></div></div>
          <h3 className="section-title">RANKED PICKS</h3>
          {cards.map((card, index) => <div className="result-row" key={card.title}><b>{index + 1}</b><img src={card.photo} alt="" /><span><strong>{card.title}</strong><small>{index === 0 ? 'Love' : index === 1 ? 'Into it' : 'Not yet'}</small></span><em>{index === 0 ? '↑' : '→'}</em></div>)}
          <div className="note-card"><span>JAMIE’S NOTE</span><p>“Somewhere quiet would be perfect. I want to actually hear you.”</p></div>
          <PrimaryButton onClick={() => setTab('discover')}>Find matching places</PrimaryButton>
        </>}
        {tab === 'discover' && <>
          <p className="eyebrow">BASED ON FRIDAY NIGHT</p><h1>Made for this date.</h1><p className="subcopy">Local places and activities ranked against Jamie’s picks—not generic popularity.</p>
          <div className="filter-row"><button className="active">Best match</button><button>Food</button><button>Activities</button><button>Open Friday</button></div>
          <div className="recommendation-summary"><span>✦</span><p><b>3 strong matches nearby</b><small>Prioritizing quiet, relaxed, and seasonal.</small></p><button onClick={() => setTab('results')}>Tune</button></div>
          {recommendations.map((item) => <MatchCard key={item.name} item={item} saved={saved.includes(item.name)} onSave={() => toggleSaved(item.name)} onOpen={() => setSelectedMatch(item)} />)}
          <div className="integration-card"><Icon>＋</Icon><div><b>More local options, automatically</b><p>Connect restaurant reservations, activity tickets, maps, ride share, and calendar partners without revealing the plan to Jamie.</p></div></div>
        </>}
        {tab === 'pairing' && <>
          <div className="pair-art"><div className="avatar big">J</div><div className="avatar big planner">A</div></div>
          <p className="eyebrow centered">YOUR PERSON</p><h1 className="centered">Paired with Jamie</h1><p className="subcopy centered">Connected three months ago.</p>
          <div className="invite-code"><span>INVITE CODE</span><b>482 719</b><small>Valid for 24 hours</small></div>
          <PrimaryButton>Share invite link</PrimaryButton><button className="text-button" onClick={() => { navigator.clipboard?.writeText('482719'); setCopied(true); }}>{copied ? 'Code copied ✓' : 'Copy code'}</button>
        </>}
      </div>
      <nav className="tab-bar">
        <button className={tab === 'questions' ? 'active' : ''} onClick={() => setTab('questions')}><Icon>▤</Icon><span>Questions</span></button>
        <button className={tab === 'results' ? 'active' : ''} onClick={() => setTab('results')}><Icon>↗</Icon><span>Results</span></button>
        <button className={tab === 'discover' ? 'active' : ''} onClick={() => setTab('discover')}><Icon>✦</Icon><span>Matches</span></button>
        <button className={tab === 'pairing' ? 'active' : ''} onClick={() => setTab('pairing')}><Icon>⌁</Icon><span>Pairing</span></button>
      </nav>
      {sheet && <><button className="sheet-backdrop" onClick={() => setSheet(false)} aria-label="Close sheet" /><NewQuestionSheet close={() => setSheet(false)} /></>}
      {selectedMatch && <><button className="sheet-backdrop" onClick={() => setSelectedMatch(null)} aria-label="Close match" /><MatchDetail item={selectedMatch} close={() => setSelectedMatch(null)} saved={saved.includes(selectedMatch.name)} onSave={() => toggleSaved(selectedMatch.name)} /></>}
    </section>
  );
}

export default function App() {
  const [role, setRole] = useState<Role>(null);
  return (
    <main>
      <div className="device">
        <div className="status-bar"><b>9:41</b><i /><span>● ◒</span></div>
        <div className="app">
          {!role && <RoleEntry setRole={setRole} />}
          {role === 'picker' && <PickerApp exit={() => setRole(null)} />}
          {role === 'planner' && <PlannerApp exit={() => setRole(null)} />}
        </div>
        <div className="home-indicator" />
      </div>
    </main>
  );
}
