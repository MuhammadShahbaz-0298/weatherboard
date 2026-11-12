import { STORAGE_KEYS, THEMES, UNITS } from '../../utils/constants';
import { readStorage, writeStorage } from '../../utils/storage';

const settings = {
  state: {
    theme: 'system',
    unit: 'celsius',
    success: '',
    error: '',
    loading: false
  },
  reducers: {
    setTheme(state, payload) {
      return { ...state, theme: payload };
    },
    setUnit(state, payload) {
      return { ...state, unit: payload };
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
      async loadSettings() {
        this.setLoading(true);
        this.resetMessages();
        try {
          const stored = readStorage(STORAGE_KEYS.settings, null);
          if (stored && typeof stored === 'object') {
            if (THEMES.includes(stored.theme)) {
              this.setTheme(stored.theme);
            }
            if (UNITS.includes(stored.unit)) {
              this.setUnit(stored.unit);
            }
          }
        } catch (err) {
          this.setError(err.message || 'Could not load your preferences.');
          dispatch.alert.error({ msg: err.message || 'Could not load your preferences.' });
        } finally {
          this.setLoading(false);
        }
      },
      async updateSettings(payload, rootState) {
        this.setLoading(true);
        this.resetMessages();
        try {
          const nextTheme = payload && THEMES.includes(payload.theme)
            ? payload.theme
            : rootState.settings.theme;
          const nextUnit = payload && UNITS.includes(payload.unit)
            ? payload.unit
            : rootState.settings.unit;

          this.setTheme(nextTheme);
          this.setUnit(nextUnit);

          const saved = writeStorage(STORAGE_KEYS.settings, {
            theme: nextTheme,
            unit: nextUnit
          });

          if (!saved) {
            const message = 'Your preferences will not be saved after you close this tab.';
            this.setError(message);
            dispatch.alert.error({ msg: message });
          }
        } catch (err) {
          this.setError(err.message || 'Could not save your preferences.');
          dispatch.alert.error({ msg: err.message || 'Could not save your preferences.' });
        } finally {
          this.setLoading(false);
        }
      },
      resetMessages() {
        this.setSuccess('');
        this.setError('');
      }
    };
  }
};

export default settings;
