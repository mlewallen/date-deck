import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent, ReactNode } from 'react';
import { optionBackground } from '../lib/content';
import type { Option, SwipeChoice } from '../lib/types';

const ICONS: Record<string, ReactNode> = {
  spark: <><path d="M12 2.8c.5 5.3 2 6.8 7.2 7.2-5.2.5-6.7 2-7.2 7.2-.5-5.2-2-6.7-7.2-7.2 5.2-.4 6.7-1.9 7.2-7.2Z" /><path d="M19 16.5c.2 2 .8 2.6 2.8 2.8-2 .2-2.6.8-2.8 2.7-.2-1.9-.8-2.5-2.8-2.7 2-.2 2.6-.8 2.8-2.8Z" /></>,
  arrow: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
  close: <><path d="m7 7 10 10" /><path d="M17 7 7 17" /></>,
  undo: <><path d="M9 7H5v-4" /><path d="M5.5 7.5a8 8 0 1 1-1 7.5" /></>,
  up: <><path d="M12 19V5" /><path d="m7 10 5-5 5 5" /></>,
  down: <><path d="M12 5v14" /><path d="m7 14 5 5 5-5" /></>,
  swipe: <><path d="M4 8h16" /><path d="m7 5-3 3 3 3" /><path d="M20 16H4" /><path d="m17 13 3 3-3 3" /></>,
  versus: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M12 4v16" /></>,
  open: <><path d="M5 5h14v10H9l-4 4V5Z" /><path d="M9 9h6M9 12h4" /></>,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  back: <path d="m15 5-7 7 7 7" />,
  chevron: <path d="m9 5 7 7-7 7" />,
  more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></>,
  trash: <><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M6 7l1 13h10l1-13" /></>,
  share: <><path d="M12 3v12" /><path d="m7 8 5-5 5 5" /><path d="M5 13v7h14v-7" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V4H4v12h4" /></>,
  phone: <><rect x="7" y="3" width="10" height="18" rx="2" /><path d="M11 18h2" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.8" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" /></>,
  heart: <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" />,
  inbox: <><path d="M4 13h4l1.5 3h5L16 13h4" /><path d="M5.5 5h13L20 13v6H4v-6l1.5-8Z" /></>,
  download: <><path d="M12 4v11" /><path d="m7 10 5 5 5-5" /><path d="M5 20h14" /></>,
  camera: <><path d="M4 8h3l2-3h6l2 3h3v11H4V8Z" /><circle cx="12" cy="13" r="3.5" /></>,
};

export type IconName = keyof typeof ICONS;

export function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  return (
    <span className={`icon ${className}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {ICONS[name]}
      </svg>
    </span>
  );
}

export function PrimaryButton({
  children,
  onClick,
  secondary = false,
  disabled = false,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  secondary?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button type={type} className={`primary-button ${secondary ? 'secondary' : ''}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function AppHeader({
  title,
  back,
  backLabel = 'Back',
  action,
}: {
  title: string;
  back?: () => void;
  backLabel?: string;
  action?: ReactNode;
}) {
  return (
    <header className="app-header">
      <div>{back && <button className="icon-button" aria-label={backLabel} onClick={back}><Icon name="back" /></button>}</div>
      <h1>{title}</h1>
      <div>{action}</div>
    </header>
  );
}

/** Bottom sheet with a backdrop; Escape and the backdrop both close it. */
export function Sheet({
  title,
  onClose,
  left,
  right,
  children,
}: {
  title: string;
  onClose: () => void;
  left?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    panel.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} ref={panel} tabIndex={-1}>
        <div className="grabber" />
        <div className="sheet-head">
          <div>{left ?? <button onClick={onClose}>Cancel</button>}</div>
          <b>{title}</b>
          <div>{right}</div>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </>
  );
}

/* Toasts: call toast('Copied') from anywhere; <Toaster /> renders them. */

export function toast(message: string) {
  window.dispatchEvent(new CustomEvent('date-deck:toast', { detail: message }));
}

export function Toaster() {
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    let timer = 0;
    const onToast = (event: Event) => {
      setMessage((event as CustomEvent<string>).detail);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setMessage(null), 2600);
    };
    window.addEventListener('date-deck:toast', onToast);
    return () => {
      window.removeEventListener('date-deck:toast', onToast);
      window.clearTimeout(timer);
    };
  }, []);
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {message && <div className="toast">{message}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon: IconName; title: string; children?: ReactNode }) {
  return (
    <div className="empty-state">
      <Icon name={icon} />
      <h2>{title}</h2>
      {children}
    </div>
  );
}

export const INTENT: Record<SwipeChoice, { label: string; icon: IconName }> = {
  pass: { label: 'Pass', icon: 'close' },
  into: { label: 'Into it', icon: 'arrow' },
  love: { label: 'Love it', icon: 'heart' },
};

const RING = 2 * Math.PI * 44;

/** Grows in as the card is dragged; the ring fills until the choice locks in. */
function IntentBadge({ intent, intensity, armed }: { intent: SwipeChoice; intensity: number; armed: boolean }) {
  return (
    <div
      className={`intent-badge ${intent} ${armed ? 'armed' : ''}`}
      style={{ opacity: Math.min(1, intensity * 1.6), transform: `translate(-50%, -50%) scale(${0.55 + 0.45 * intensity})` }}
      aria-hidden="true"
    >
      <span className="intent-ring">
        <svg viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="44" className="track" />
          <circle cx="48" cy="48" r="44" className="fill" strokeDasharray={RING} strokeDashoffset={RING * (1 - intensity)} />
        </svg>
        <Icon name={INTENT[intent].icon} />
      </span>
      <b>{INTENT[intent].label}</b>
    </div>
  );
}

export function OptionCard({
  option,
  index,
  total,
  className = '',
  style,
  intent,
  intensity = 0,
  armed = false,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  option: Option;
  index: number;
  total: number;
  className?: string;
  style?: CSSProperties;
  intent?: SwipeChoice;
  intensity?: number;
  armed?: boolean;
  onPointerDown?: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove?: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp?: (event: PointerEvent<HTMLElement>) => void;
}) {
  return (
    <article
      className={`vibe-card ${className} ${intent ? `selecting ${intent}` : ''}`}
      style={{ ...optionBackground(option, index), '--selection-strength': intensity, ...style } as CSSProperties}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      aria-label={`${option.title}. ${option.blurb}`}
    >
      <div className="shade" />
      <div className="selection-glow" />
      {intent && <IntentBadge intent={intent} intensity={intensity} armed={armed} />}
      <div className="vibe-copy">
        <div className="card-kicker"><small>POSSIBILITY</small><span>{index + 1} of {total}</span></div>
        <h2>{option.title || 'Untitled'}</h2>
        {option.blurb && <p>{option.blurb}</p>}
        {option.tags.length > 0 && <div className="chips">{option.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
      </div>
    </article>
  );
}
