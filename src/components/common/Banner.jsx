import './Banner.css';

export default function Banner({
  variant = 'info',
  title = '',
  children,
  action = null,
  className = ''
}) {
  const classes = ['banner', `banner--${variant}`];
  if (className) {
    classes.push(className);
  }

  return (
    <div className={classes.join(' ')} role={variant === 'error' ? 'alert' : 'status'}>
      <span className="banner__marker" aria-hidden="true" />
      <div className="banner__content">
        {title ? <strong className="banner__title">{title}</strong> : null}
        {children ? <div className="banner__text">{children}</div> : null}
      </div>
      {action ? <div className="banner__action">{action}</div> : null}
    </div>
  );
}
