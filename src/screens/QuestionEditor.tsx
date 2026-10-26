import { useState } from 'react';
import { Icon, PrimaryButton, Sheet } from '../components/ui';
import { KIND_HINT, KIND_LABEL, PRESET_PHOTOS, TONES, blankOption, blankQuestion, optionBackground } from '../lib/content';
import type { Option, Question, QuestionKind } from '../lib/types';

const MAX_OPTIONS = 12;

/** Creates a question (pick a type first) or edits an existing one. */
export function QuestionEditor({
  initial,
  partner,
  onSave,
  onClose,
}: {
  initial: Question | null;
  partner: string;
  onSave: (question: Question) => void;
  onClose: () => void;
}) {
  const [question, setQuestion] = useState<Question | null>(initial);
  const [kind, setKind] = useState<QuestionKind>('swipe');
  const [error, setError] = useState('');

  if (!question) {
    return (
      <Sheet title="New question" onClose={onClose}>
        <h2 className="sheet-title">How should {partner} answer?</h2>
        {(['swipe', 'versus', 'open'] as QuestionKind[]).map((item) => (
          <button
            key={item}
            className={`type-option ${kind === item ? 'selected' : ''}`}
            aria-pressed={kind === item}
            onClick={() => setKind(item)}
          >
            <Icon name={item} />
            <span><b>{KIND_LABEL[item]}</b><small>{KIND_HINT[item]}</small></span>
            <strong><Icon name="check" /></strong>
          </button>
        ))}
        <PrimaryButton onClick={() => setQuestion(blankQuestion(kind))}>Continue</PrimaryButton>
      </Sheet>
    );
  }

  const updateOption = (id: string, change: Partial<Option>) =>
    setQuestion({ ...question, options: question.options.map((option) => (option.id === id ? { ...option, ...change } : option)) });

  const save = () => {
    const cleaned: Question = {
      ...question,
      prompt: question.prompt.trim(),
      options: question.options.map((option) => ({ ...option, title: option.title.trim(), blurb: option.blurb.trim() })),
    };
    if (!cleaned.prompt) return setError('Add the question you want to ask.');
    if (cleaned.kind !== 'open' && cleaned.options.some((option) => !option.title)) {
      return setError('Every possibility needs a name.');
    }
    onSave(cleaned);
  };

  const placeholder =
    question.kind === 'swipe' ? 'What sounds good for Friday?' : question.kind === 'versus' ? 'Which would tempt you more?' : 'What’s a perfect Sunday for you?';

  return (
    <Sheet
      title={initial ? 'Edit question' : KIND_LABEL[question.kind]}
      onClose={onClose}
      left={initial ? undefined : <button onClick={() => setQuestion(null)}>‹ Back</button>}
      right={<button className="strong" onClick={save}>Save</button>}
    >
      <label className="field">
        <span>QUESTION</span>
        <input
          value={question.prompt}
          maxLength={120}
          placeholder={placeholder}
          autoFocus={!initial}
          onChange={(event) => {
            setError('');
            setQuestion({ ...question, prompt: event.target.value });
          }}
        />
      </label>

      {question.kind !== 'open' && (
        <>
          <h3 className="section-title">{question.kind === 'versus' ? 'THE TWO CHOICES' : `POSSIBILITIES (${question.options.length})`}</h3>
          {question.options.map((option, index) => (
            <OptionEditor
              key={option.id}
              option={option}
              index={index}
              label={question.kind === 'versus' ? (index === 0 ? 'This' : 'That') : `Possibility ${index + 1}`}
              onChange={(change) => {
                setError('');
                updateOption(option.id, change);
              }}
              onRemove={
                question.kind === 'swipe' && question.options.length > 1
                  ? () => setQuestion({ ...question, options: question.options.filter((item) => item.id !== option.id) })
                  : undefined
              }
            />
          ))}
          {question.kind === 'swipe' && question.options.length < MAX_OPTIONS && (
            <button className="dashed-button" onClick={() => setQuestion({ ...question, options: [...question.options, blankOption()] })}>
              <Icon name="plus" /> Add a possibility
            </button>
          )}
        </>
      )}

      {error && <p className="form-error" role="alert">{error}</p>}
      <PrimaryButton onClick={save}>Save question</PrimaryButton>
    </Sheet>
  );
}

function OptionEditor({
  option,
  index,
  label,
  onChange,
  onRemove,
}: {
  option: Option;
  index: number;
  label: string;
  onChange: (change: Partial<Option>) => void;
  onRemove?: () => void;
}) {
  const custom = /^https:\/\//i.test(option.photo);
  const [showLink, setShowLink] = useState(custom);
  return (
    <fieldset className="option-editor">
      <legend>{label}</legend>
      <div className="option-preview" style={optionBackground(option, index)}>
        <span>{option.title || 'Name it below'}</span>
        {onRemove && <button className="icon-button light" aria-label={`Remove ${label}`} onClick={onRemove}><Icon name="trash" /></button>}
      </div>
      <div className="swatches" role="radiogroup" aria-label="Card background">
        {PRESET_PHOTOS.map((preset) => (
          <button
            key={preset.key}
            role="radio"
            aria-checked={option.photo === preset.key}
            aria-label={`${preset.label} photo`}
            className={option.photo === preset.key ? 'selected' : ''}
            style={{ backgroundImage: `url(${preset.url})` }}
            onClick={() => onChange({ photo: preset.key })}
          />
        ))}
        {TONES.map((tone, toneIndex) => (
          <button
            key={tone}
            role="radio"
            aria-checked={option.photo === `tone:${toneIndex}`}
            aria-label={`Color ${toneIndex + 1}`}
            className={option.photo === `tone:${toneIndex}` ? 'selected' : ''}
            style={{ backgroundImage: tone }}
            onClick={() => onChange({ photo: `tone:${toneIndex}` })}
          />
        ))}
        <button className={`link-swatch ${custom ? 'selected' : ''}`} aria-pressed={showLink} onClick={() => setShowLink(!showLink)}>
          URL
        </button>
      </div>
      {showLink && (
        <label className="field">
          <span>IMAGE LINK (HTTPS)</span>
          <input
            type="url"
            inputMode="url"
            placeholder="https://…"
            defaultValue={custom ? option.photo : ''}
            onChange={(event) => {
              const value = event.target.value.trim();
              if (/^https:\/\/\S+$/i.test(value)) onChange({ photo: value });
              else if (!value && custom) onChange({ photo: '' });
            }}
          />
        </label>
      )}
      <label className="field">
        <span>NAME</span>
        <input value={option.title} maxLength={40} placeholder="Long lunch energy" onChange={(event) => onChange({ title: event.target.value })} />
      </label>
      <label className="field">
        <span>ONE LINE <em>optional</em></span>
        <input value={option.blurb} maxLength={90} placeholder="Seasonal plates, nowhere to rush." onChange={(event) => onChange({ blurb: event.target.value })} />
      </label>
      <label className="field">
        <span>TAGS <em>optional, comma separated</em></span>
        <input
          defaultValue={option.tags.join(', ')}
          placeholder="Relaxed, Outdoors"
          onChange={(event) =>
            onChange({ tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 4) })
          }
        />
      </label>
    </fieldset>
  );
}
