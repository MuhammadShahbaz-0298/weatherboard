import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './Toast.css';

export default function Toast() {
  const dispatch = useDispatch();
  const message = useSelector((state) => state.alert.message);
  const type = useSelector((state) => state.alert.type);
  const id = useSelector((state) => state.alert.id);

  useEffect(() => {
    if (!id) {
      return undefined;
    }
    const timer = setTimeout(() => {
      dispatch.alert.clear();
    }, 5000);
    return () => {
      clearTimeout(timer);
    };
  }, [id, dispatch]);

  if (!message) {
    return null;
  }

  return (
    <div
      className={`toast toast--${type}`}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <span className="toast__message">{message}</span>
      <button
        type="button"
        className="toast__close"
        onClick={() => dispatch.alert.clear()}
        aria-label="Dismiss message"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}
