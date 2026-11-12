import { STORAGE_KEYS } from '../../utils/constants';
import { isWeatherData } from '../../utils/weatherMapper';
import { readStorage, writeStorage } from '../../utils/storage';
import { fetchWeather } from '../../services/weatherService';

const TEN_MINUTES = 10 * 60 * 1000;

let latestWeatherRequestId = 0;

function sameCity(first, second) {
  if (!first || !second) {
    return false;
  }
  return Math.abs(first.lat - second.lat) < 0.01 && Math.abs(first.lon - second.lon) < 0.01;
}

const weather = {
  state: {
    city: null,
    current: null,
    forecast: [],
    source: '',
    updatedAt: 0,
    cached: false,
    success: '',
    error: '',
    loading: false
  },
  reducers: {
    setCity(state, payload) {
      return { ...state, city: payload };
    },
    setCurrent(state, payload) {
      return { ...state, current: payload };
    },
    setForecast(state, payload) {
      return { ...state, forecast: payload };
    },
    setSource(state, payload) {
      return { ...state, source: payload };
    },
    setUpdatedAt(state, payload) {
      return { ...state, updatedAt: payload };
    },
    setCached(state, payload) {
      return { ...state, cached: payload };
    },
    setSuccess(state, payload) {
      return { ...state, success: payload };
    },
    setError(state, payload) {
      return { ...state, error: payload };
    },
    setLoading(state, payload) {
      return { ...state, loading: payload };
    }
  },
  effects: (dispatch) => {
    return {
      applyWeather(data) {
        this.setCity(data.city);
        this.setCurrent(data.current);
        this.setForecast(data.forecast);
        this.setSource(data.source);
        this.setUpdatedAt(data.updatedAt);
      },
      async loadWeather(city, rootState) {
        const requestId = latestWeatherRequestId + 1;
        latestWeatherRequestId = requestId;
        const previousCity = rootState.weather.city;
        const same = sameCity(previousCity, city);

        if (!same) {
          this.setCurrent(null);
          this.setForecast([]);
          this.setSource('');
          this.setUpdatedAt(0);
          this.setCached(false);
        }

        this.setCity(city);
        this.setLoading(true);
        this.resetMessages();

        try {
          const data = await fetchWeather(city);
          if (requestId !== latestWeatherRequestId) {
            return;
          }
          this.applyWeather(data);
          this.setCached(false);
          this.setSuccess('Weather updated.');

          const saved = writeStorage(STORAGE_KEYS.lastWeather, data);
          if (!saved) {
            dispatch.alert.info({
              msg: 'Weather loaded, but offline saving is unavailable in this browser.'
            });
          }
        } catch (err) {
          if (requestId !== latestWeatherRequestId) {
            return;
          }
          const cached = readStorage(STORAGE_KEYS.lastWeather, null);
          const canUseCache =
            (err.type === 'offline' || err.type === 'network') &&
            isWeatherData(cached) &&
            sameCity(cached.city, city);

          if (canUseCache) {
            this.applyWeather(cached);
            this.setCached(true);
            this.setSuccess('Showing saved weather because fresh data is unavailable.');
            dispatch.alert.info({ msg: 'Showing saved weather. It will refresh when you reconnect.' });
            return;
          }

          this.setError(err.message || 'Could not load weather for this city. Try again.');
          dispatch.alert.error({ msg: err.message || 'Could not load weather for this city.' });
        } finally {
          if (requestId === latestWeatherRequestId) {
            this.setLoading(false);
          }
        }
      },
      async restoreLastWeather() {
        this.resetMessages();
        try {
          const stored = readStorage(STORAGE_KEYS.lastWeather, null);
          if (!isWeatherData(stored)) {
            return;
          }

          this.applyWeather(stored);
          this.setCached(true);
          dispatch.city.setSelectedCity(stored.city);
          this.setSuccess('Showing your last saved city.');

          const age = Date.now() - stored.updatedAt;
          if (navigator.onLine && age > TEN_MINUTES) {
            await dispatch.weather.loadWeather(stored.city);
          }
        } catch (err) {
          this.setError(err.message || 'Could not load your last saved weather.');
          dispatch.alert.error({ msg: err.message || 'Could not load your last saved weather.' });
        }
      },
      async retryWeather(payload, rootState) {
        this.resetMessages();
        const city = rootState.city.selectedCity || rootState.weather.city;
        if (!city) {
          const message = 'Choose a city before retrying the weather.';
          this.setError(message);
          dispatch.alert.error({ msg: message });
          return;
        }
        await dispatch.weather.loadWeather(city);
      },
      resetMessages() {
        this.setSuccess('');
        this.setError('');
      }
    };
  }
};

export default weather;
