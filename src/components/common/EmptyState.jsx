import './EmptyState.css';

export default function EmptyState({ title, message, action = null, className = '' }) {
  const classes = ['empty-state'];
  if (className) {
    classes.push(className);
  }

  return (
    <div className={classes.join(' ')}>
      <span className="empty-state__mark" aria-hidden="true" />
      <h3 className="empty-state__title">{title}</h3>
      {message ? <p className="empty-state__message">{message}</p> : null}
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  );
}
