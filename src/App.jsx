import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Banner from './components/common/Banner';
import Button from './components/common/Button';
import Card from './components/common/Card';
import EmptyState from './components/common/EmptyState';
import Toast from './components/common/Toast';
import FavouritesPanel from './components/favourites/FavouritesPanel';
import FavouriteButton from './components/favourites/FavouriteButton';
import Footer from './components/layout/Footer';
import Header from './components/layout/Header';
import OfflineBanner from './components/layout/OfflineBanner';
import ReminderSettings from './components/notifications/ReminderSettings';
import SearchBar from './components/search/SearchBar';
import CurrentWeather from './components/weather/CurrentWeather';
import ForecastList from './components/weather/ForecastList';
import useOnlineStatus from './hooks/useOnlineStatus';

export default function App() {
  const dispatch = useDispatch();
  const online = useOnlineStatus();
  const theme = useSelector((state) => state.settings.theme);
  const unit = useSelector((state) => state.settings.unit);
  const weather = useSelector((state) => state.weather);
  const selectedCity = useSelector((state) => state.city.selectedCity);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    dispatch.settings.loadSettings();
    dispatch.favourites.loadFavourites();
    dispatch.reminder.loadReminder();
    dispatch.weather.restoreLastWeather();
  }, [dispatch]);

  useEffect(() => {
    if (!online) {
      wasOfflineRef.current = true;
      return;
    }
    if (!wasOfflineRef.current || weather.loading) {
      return;
    }
    wasOfflineRef.current = false;
    if (weather.city) {
      dispatch.weather.retryWeather();
    }
  }, [online, weather.city, weather.loading, dispatch]);

  useEffect(() => {
    if (!weather.city || !weather.current) {
      return;
    }
    dispatch.reminder.syncWeatherSnapshot({
      city: weather.city,
      current: weather.current,
      unit,
      updatedAt: weather.updatedAt
    });
  }, [weather.city, weather.current, weather.updatedAt, unit, dispatch]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    function applyTheme() {
      const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
      document.documentElement.setAttribute('data-theme', resolved);
    }

    applyTheme();

    if (theme === 'system') {
      media.addEventListener('change', applyTheme);
      return () => {
        media.removeEventListener('change', applyTheme);
      };
    }

    return undefined;
  }, [theme]);

  const currentCity = selectedCity || weather.city;
  const showWelcome = !weather.current && !weather.loading && !weather.error;
  const showFallback = weather.source === 'open-meteo' && weather.current;

  return (
    <div className="app">
      <Header />
      <OfflineBanner online={online} />

      <main className="app__main">
        <SearchBar online={online} />

        {showFallback ? (
          <Banner variant="info" className="app__notice">
            OpenWeatherMap is unavailable, so this view uses Open-Meteo.
          </Banner>
        ) : null}

        {weather.error ? (
          <Banner
            variant="error"
            title="Weather could not load"
            className="app__notice"
            action={
              <Button variant="secondary" size="small" onClick={() => dispatch.weather.retryWeather()}>
                Retry
              </Button>
            }
          >
            {weather.error}
          </Banner>
        ) : null}

        <div className="dashboard">
          <div className="dashboard__primary">
            {showWelcome ? (
              <Card className="welcome-card">
                <EmptyState
                  title="Start with a city"
                  message="Search for a city above to see current conditions and a five-day forecast. Your last city will be waiting here next time."
                />
              </Card>
            ) : null}

            <CurrentWeather
              city={currentCity}
              current={weather.current}
              unit={unit}
              loading={weather.loading}
              cached={weather.cached}
              updatedAt={weather.updatedAt}
              onRefresh={() => dispatch.weather.retryWeather()}
              favouriteAction={<FavouriteButton city={currentCity} />}
            />

            {weather.current ? (
              <ForecastList days={weather.forecast} unit={unit} loading={weather.loading} />
            ) : null}
          </div>

          <aside className="dashboard__side">
            <FavouritesPanel />
            <ReminderSettings />
          </aside>
        </div>
      </main>

      <Footer />
      <Toast />
    </div>
  );
}
