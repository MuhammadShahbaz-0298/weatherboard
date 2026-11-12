import Spinner from './Spinner';
import './Button.css';

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  ...rest
}) {
  const classes = ['button', `button--${variant}`, `button--${size}`];
  if (fullWidth) {
    classes.push('button--full');
  }
  if (className) {
    classes.push(className);
  }

  return (
    <button
      type={type}
      className={classes.join(' ')}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner size="small" label="Working" /> : null}
      <span>{children}</span>
    </button>
  );
}
