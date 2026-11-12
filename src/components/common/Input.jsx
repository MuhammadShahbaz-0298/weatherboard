import { useId } from 'react';
import './Input.css';

export default function Input({
  id,
  label,
  error = '',
  hint = '',
  className = '',
  ...rest
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const hintId = hint ? `${inputId}-hint` : '';
  const errorId = error ? `${inputId}-error` : '';
  const describedBy = [hintId, errorId].filter(Boolean).join(' ');
  const classes = ['input'];

  if (error) {
    classes.push('input--error');
  }
  if (className) {
    classes.push(className);
  }

  return (
    <div className={classes.join(' ')}>
      <label className="input__label" htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        className="input__control"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy || undefined}
        {...rest}
      />
      {hint ? (
        <p className="input__hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="input__error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
