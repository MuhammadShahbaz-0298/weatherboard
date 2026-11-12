import { useId } from 'react';
import './Toggle.css';

export default function Toggle({
  checked,
  onChange,
  label,
  description = '',
  disabled = false
}) {
  const labelId = useId();
  const descriptionId = useId();

  return (
    <div className="toggle">
      <div className="toggle__text">
        <span className="toggle__label" id={labelId}>
          {label}
        </span>
        {description ? (
          <span className="toggle__description" id={descriptionId}>
            {description}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
        className="toggle__button"
        onClick={() => onChange(!checked)}
        disabled={disabled}
      >
        <span className="toggle__thumb" aria-hidden="true" />
      </button>
    </div>
  );
}
