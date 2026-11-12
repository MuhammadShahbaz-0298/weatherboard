import './Spinner.css';

export default function Spinner({ size = 'medium', label = 'Loading' }) {
  return (
    <span className={`spinner spinner--${size}`} role="status">
      <span className="spinner__circle" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
