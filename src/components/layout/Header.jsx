import { useDispatch, useSelector } from 'react-redux';
import './Header.css';

function isDarkTheme(theme) {
  if (theme === 'dark') {
    return true;
  }
  if (theme === 'light') {
    return false;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function ThemeIcon({ dark }) {
  if (dark) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 15.2A8.5 8.5 0 0 1 8.8 4a8.5 8.5 0 1 0 11.2 11.2z" />
    </svg>
  );
}

export default function Header() {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.settings.theme);
  const unit = useSelector((state) => state.settings.unit);
  const dark = isDarkTheme(theme);

  function toggleTheme() {
    dispatch.settings.updateSettings({
      theme: dark ? 'light' : 'dark',
      unit
    });
  }

  function changeUnit(nextUnit) {
    if (nextUnit === unit) {
      return;
    }
    dispatch.settings.updateSettings({
      theme,
      unit: nextUnit
    });
  }

  return (
    <header className="header">
      <div className="header__inner">
        <div className="header__brand">
          <span className="header__mark" aria-hidden="true" />
          <h1 className="header__title">WeatherBoard</h1>
        </div>

        <div className="header__controls">
          <button
            type="button"
            className="header__theme"
            onClick={toggleTheme}
            aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            <ThemeIcon dark={dark} />
          </button>

          <div className="header__units" role="group" aria-label="Temperature unit">
            <button
              type="button"
              className="header__unit"
              aria-pressed={unit === 'celsius'}
              onClick={() => changeUnit('celsius')}
            >
              °C
            </button>
            <button
              type="button"
              className="header__unit"
              aria-pressed={unit === 'fahrenheit'}
              onClick={() => changeUnit('fahrenheit')}
            >
              °F
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
