import { optionBackground, SWIPE_LABEL, formatDate, versusLabel } from '../lib/content';
import type { Deck, Option, SwipeChoice } from '../lib/types';
import { Icon } from '../components/ui';

const RANK: Record<SwipeChoice, number> = { love: 0, into: 1, pass: 2 };

/** Everything the partner answered for one deck, question by question. */
export function AnswersView({ deck, partner }: { deck: Deck; partner: string }) {
  const response = deck.response;
  if (!response) return null;

  const loved: Option[] = [];
  for (const question of deck.questions) {
    const answer = response.answers[question.id];
    if (question.kind === 'swipe' && answer?.kind === 'swipe') {
      loved.push(...question.options.filter((option) => answer.picks[option.id] === 'love'));
    }
  }
  const editedAfter = deck.updatedAt > response.respondedAt;

  return (
    <div className="answers">
      <p className="answered-at">
        <Icon name="check" /> {response.from || partner} answered {formatDate(response.respondedAt)}
      </p>
      {editedAfter && (
        <p className="soft-warning">You changed this deck after these answers came in. New or edited questions show as unanswered until you send it again.</p>
      )}

      {loved.length > 0 && (
        <div className="insight-hero">
          <span><Icon name="heart" /></span>
          <div>
            <small>{(response.from || partner).toUpperCase()} LOVED</small>
            <h3>{loved.map((option) => option.title).join(', ')}</h3>
          </div>
        </div>
      )}

      {deck.questions.map((question, number) => {
        const answer = response.answers[question.id];
        return (
          <section className="answer-block" key={question.id}>
            <p className="eyebrow">QUESTION {number + 1}</p>
            <h3>{question.prompt}</h3>

            {question.kind === 'swipe' && (
              answer?.kind === 'swipe' ? (
                <>
                  <div className="result-summary">
                    {(['love', 'into', 'pass'] as SwipeChoice[]).map((choice) => (
                      <div key={choice} className={choice}>
                        <span>{SWIPE_LABEL[choice].toUpperCase()}</span>
                        <b>{question.options.filter((option) => answer.picks[option.id] === choice).length}</b>
                      </div>
                    ))}
                  </div>
                  {[...question.options]
                    .map((option, index) => ({ option, index, pick: answer.picks[option.id] }))
                    .sort((a, b) => (a.pick ? RANK[a.pick] : 3) - (b.pick ? RANK[b.pick] : 3))
                    .map(({ option, index, pick }) => (
                      <div className="result-row" key={option.id}>
                        <i className="thumb" style={optionBackground(option, index)} />
                        <span><strong>{option.title}</strong>{option.blurb && <small>{option.blurb}</small>}</span>
                        <em className={`pick ${pick ?? 'none'}`}>{pick ? SWIPE_LABEL[pick] : 'Not answered'}</em>
                      </div>
                    ))}
                </>
              ) : <p className="unanswered">Not answered</p>
            )}

            {question.kind === 'versus' && (
              answer?.kind === 'versus' ? (
                <>
                  <div className="versus-result">
                    {question.options.slice(0, 2).map((option, index) => {
                      const chosen = answer.choice === (index === 0 ? 'a' : 'b') || answer.choice === 'either';
                      return (
                        <div key={option.id} className={chosen ? 'chosen' : 'faded'} style={optionBackground(option, index)}>
                          <span>{option.title}</span>
                          {chosen && <Icon name="check" />}
                        </div>
                      );
                    })}
                  </div>
                  <p className="verdict">{versusLabel(question, answer.choice)}</p>
                </>
              ) : <p className="unanswered">Not answered</p>
            )}

            {question.kind === 'open' && (
              answer?.kind === 'open' && answer.text.trim() ? <blockquote className="open-answer">“{answer.text}”</blockquote> : <p className="unanswered">Skipped</p>
            )}
          </section>
        );
      })}

      {response.note && (
        <div className="note-card"><span>{(response.from || partner).toUpperCase()}’S NOTE</span><p>“{response.note}”</p></div>
      )}
    </div>
  );
}
