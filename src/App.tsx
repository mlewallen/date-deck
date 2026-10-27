import { useEffect, useState } from 'react';
import { PrimaryButton, Toaster, toast } from './components/ui';
import { go, useRoute } from './lib/router';
import { readInvite, resolveShortLink, sharedDeck } from './lib/share';
import { useAppData } from './lib/storage';
import type { InvitePayload } from './lib/types';
import { Picker } from './screens/Picker';
import { DeckScreen, Home, ImportAnswers, Onboarding, Settings } from './screens/Planner';

function PlayFromLink({ payload }: { payload: string }) {
  const [invite, setInvite] = useState<InvitePayload | null | 'loading'>('loading');
  useEffect(() => {
    readInvite(payload).then(setInvite);
  }, [payload]);

  if (invite === 'loading') return <section className="full-screen done-screen"><p className="eyebrow">OPENING YOUR INVITATION…</p></section>;
  if (!invite) {
    return (
      <section className="full-screen done-screen">
        <p className="eyebrow">HMM</p>
        <h2 className="display">That invitation didn’t open.</h2>
        <p>The link may have been cut off when it was copied. Ask for it to be sent again.</p>
        <PrimaryButton onClick={() => go('/', { replace: true })}>Go to Date Deck</PrimaryButton>
      </section>
    );
  }
  return <Picker key={payload} deck={invite.deck} from={invite.from} to={invite.to} mode="link" />;
}

/** #/s/<id>: fetch the stored invite, then continue as a normal #/play/ link. */
function OpenShortLink({ id }: { id: string }) {
  const [error, setError] = useState<'not-found' | 'offline' | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    setError(null);
    resolveShortLink(id).then((result) => {
      if (!live) return;
      if ('payload' in result) go(`/play/${result.payload}`, { replace: true });
      else setError(result.error);
    });
    return () => {
      live = false;
    };
  }, [id, attempt]);

  if (!error) return <section className="full-screen done-screen"><p className="eyebrow">OPENING YOUR INVITATION…</p></section>;
  return (
    <section className="full-screen done-screen">
      <p className="eyebrow">HMM</p>
      <h2 className="display">{error === 'offline' ? 'Couldn’t reach Date Deck.' : 'That invitation didn’t open.'}</h2>
      <p>
        {error === 'offline'
          ? 'Check your connection and try again.'
          : 'The link may be mistyped or cut off. Ask for it to be sent again.'}
      </p>
      {error === 'offline' && <PrimaryButton onClick={() => setAttempt((count) => count + 1)}>Try again</PrimaryButton>}
      <button className="text-button" onClick={() => go('/', { replace: true })}>Go to Date Deck</button>
    </section>
  );
}

function Screens() {
  const route = useRoute();
  const { data, setData, updateDeck, saveFailed } = useAppData();

  useEffect(() => {
    if (saveFailed) toast('Couldn’t save — this browser’s storage is full. Remove some uploaded photos or old decks.');
  }, [saveFailed]);

  // Links from a partner work without any setup on this device.
  if (route.name === 'short') return <OpenShortLink id={route.id} />;
  if (route.name === 'play') return <PlayFromLink payload={route.payload} />;
  if (route.name === 'answers') return <ImportAnswers payload={route.payload} data={data} setData={setData} />;

  const profile = data.profile;
  if (!profile?.me || !profile.partner) {
    if (data.profile) return <Settings data={data} setData={setData} />;
    return <Onboarding onDone={(next) => setData((current) => ({ ...current, profile: next }))} />;
  }
  if (route.name === 'settings') return <Settings data={data} setData={setData} />;

  if (route.name === 'deck' || route.name === 'here' || route.name === 'preview') {
    const deck = data.decks.find((item) => item.id === route.id);
    if (!deck) {
      return (
        <section className="full-screen done-screen">
          <p className="eyebrow">NOT FOUND</p>
          <h2 className="display">That deck isn’t on this device.</h2>
          <PrimaryButton onClick={() => go('/', { replace: true })}>Go to my decks</PrimaryButton>
        </section>
      );
    }
    if (route.name === 'deck') return <DeckScreen deck={deck} profile={profile} tab={route.tab} setData={setData} />;
    return (
      <Picker
        key={`${route.name}-${deck.id}`}
        deck={sharedDeck(deck)}
        from={profile.me}
        to={profile.partner}
        mode={route.name}
        onSubmit={(response) => updateDeck(deck.id, (current) => ({ ...current, response }))}
        onExit={() => go(`/deck/${deck.id}${route.name === 'here' ? '/answers' : ''}`, { replace: true })}
      />
    );
  }

  return <Home data={data} setData={setData} />;
}

export default function App() {
  return (
    <div className="app">
      <Screens />
      <Toaster />
    </div>
  );
}
