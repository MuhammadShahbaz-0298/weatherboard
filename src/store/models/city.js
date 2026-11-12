import { MAX_SEARCH_LENGTH, MIN_SEARCH_LENGTH } from '../../utils/constants';
import { limitText, validateSelectedCity } from '../../utils/validators';
import { searchCities as searchCitiesRequest } from '../../services/geoService';

let latestSearchId = 0;

const city = {
  state: {
    suggestions: [],
    selectedCity: null,
    noResults: false,
    success: '',
    error: '',
    loading: false
  },
  reducers: {
    setSuggestions(state, payload) {
      return { ...state, suggestions: payload };
    },
    setSelectedCity(state, payload) {
      return { ...state, selectedCity: payload };
    },
    setNoResults(state, payload) {
      return { ...state, noResults: payload };
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
      async searchCities(query) {
        const trimmedQuery = limitText(query, MAX_SEARCH_LENGTH).trim();
        const requestId = latestSearchId + 1;
        latestSearchId = requestId;

        this.resetMessages();

        if (trimmedQuery.length < MIN_SEARCH_LENGTH) {
          this.setSuggestions([]);
          this.setNoResults(false);
          this.setLoading(false);
          return;
        }

        this.setLoading(true);
        try {
          const results = await searchCitiesRequest(trimmedQuery);
          if (requestId !== latestSearchId) {
            return;
          }
          this.setSuggestions(results);
          this.setNoResults(results.length === 0);
        } catch (err) {
          if (requestId !== latestSearchId) {
            return;
          }
          this.setSuggestions([]);
          this.setNoResults(false);
          this.setError(err.message || 'City search failed. Check your connection and try again.');
        } finally {
          if (requestId === latestSearchId) {
            this.setLoading(false);
          }
        }
      },
      async selectCity(selectedCity) {
        this.resetMessages();
        try {
          const cityError = validateSelectedCity(selectedCity);
          if (cityError) {
            this.setError(cityError);
            dispatch.alert.error({ msg: cityError });
            return;
          }

          latestSearchId += 1;
          this.setSelectedCity(selectedCity);
          this.setSuggestions([]);
          this.setNoResults(false);
          this.setLoading(false);
          this.setSuccess(`Loading weather for ${selectedCity.name}.`);
          await dispatch.weather.loadWeather(selectedCity);
        } catch (err) {
          this.setError(err.message || 'Could not load weather for that city.');
          dispatch.alert.error({ msg: err.message || 'Could not load weather for that city.' });
        }
      },
      clearSelection() {
        this.setSelectedCity(null);
        this.resetMessages();
      },
      clearSuggestions() {
        latestSearchId += 1;
        this.setSuggestions([]);
        this.setNoResults(false);
        this.setError('');
        this.setLoading(false);
      },
      resetMessages() {
        this.setSuccess('');
        this.setError('');
      }
    };
  }
};

export default city;
