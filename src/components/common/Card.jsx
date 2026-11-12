import { useId } from 'react';
import './Card.css';

export default function Card({
  title = '',
  subtitle = '',
  action = null,
  children,
  className = ''
}) {
  const titleId = useId();
  const classes = ['card'];
  if (className) {
    classes.push(className);
  }

  return (
    <section className={classes.join(' ')} aria-labelledby={title ? titleId : undefined}>
      {title ? (
        <header className="card__header">
          <div>
            <h2 className="card__title" id={titleId}>
              {title}
            </h2>
            {subtitle ? <p className="card__subtitle">{subtitle}</p> : null}
          </div>
          {action ? <div className="card__action">{action}</div> : null}
        </header>
      ) : null}
      <div className="card__body">{children}</div>
    </section>
  );
}
