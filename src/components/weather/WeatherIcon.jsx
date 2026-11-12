import './WeatherIcon.css';

function Sun() {
  return (
    <g>
      <g className="weather-icon__rays">
        <line x1="32" y1="6" x2="32" y2="13" />
        <line x1="32" y1="51" x2="32" y2="58" />
        <line x1="6" y1="32" x2="13" y2="32" />
        <line x1="51" y1="32" x2="58" y2="32" />
        <line x1="13.6" y1="13.6" x2="18.6" y2="18.6" />
        <line x1="45.4" y1="45.4" x2="50.4" y2="50.4" />
        <line x1="13.6" y1="50.4" x2="18.6" y2="45.4" />
        <line x1="45.4" y1="18.6" x2="50.4" y2="13.6" />
      </g>
      <circle className="weather-icon__sun-body" cx="32" cy="32" r="13" />
    </g>
  );
}

function Cloud({ offset = 0 }) {
  return (
    <g className="weather-icon__cloud" transform={`translate(0 ${offset})`}>
      <circle cx="23" cy="38" r="9" />
      <circle cx="34" cy="31" r="12" />
      <circle cx="46" cy="38" r="8" />
      <rect x="21" y="37" width="27" height="10" rx="5" />
    </g>
  );
}

export default function WeatherIcon({ code = 'clouds', size = 'medium' }) {
  return (
    <span className={`weather-icon weather-icon--${code} weather-icon--${size}`} aria-hidden="true">
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {code === 'clear' ? <Sun /> : null}

        {code === 'clouds' ? (
          <>
            <g className="weather-icon__sun-small">
              <circle cx="43" cy="21" r="9" />
            </g>
            <Cloud offset={2} />
          </>
        ) : null}

        {code === 'rain' || code === 'drizzle' ? (
          <>
            <Cloud offset={-2} />
            <g className="weather-icon__rain">
              <line x1="25" y1="49" x2="22" y2="57" />
              <line x1="34" y1="49" x2="31" y2="57" />
              <line x1="43" y1="49" x2="40" y2="57" />
            </g>
          </>
        ) : null}

        {code === 'snow' ? (
          <>
            <Cloud offset={-2} />
            <g className="weather-icon__snow">
              <circle cx="25" cy="53" r="2" />
              <circle cx="34" cy="57" r="2" />
              <circle cx="43" cy="52" r="2" />
            </g>
          </>
        ) : null}

        {code === 'thunder' ? (
          <>
            <Cloud offset={-2} />
            <path className="weather-icon__bolt" d="M35 44h8l-6 9h5l-11 13 3-10h-6z" />
          </>
        ) : null}

        {code === 'mist' ? (
          <>
            <Cloud offset={-3} />
            <g className="weather-icon__mist">
              <line x1="20" y1="52" x2="44" y2="52" />
              <line x1="25" y1="58" x2="49" y2="58" />
            </g>
          </>
        ) : null}
      </svg>
    </span>
  );
}
