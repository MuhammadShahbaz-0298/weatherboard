import { MAX_FAVOURITES, STORAGE_KEYS } from '../../utils/constants';
import { isCityShape, isFavouriteShape } from '../../utils/validators';
import { isStorageAvailable, readStorage, writeStorage } from '../../utils/storage';

function buildFavourite(city) {
  return {
    id: city.id || `${city.lat.toFixed(4)}:${city.lon.toFixed(4)}`,
    name: city.name,
    state: city.state || '',
    country: city.country,
    lat: city.lat,
    lon: city.lon
  };
}

const favourites = {
  state: {
    list: [],
    storageAvailable: true,
    success: '',
    error: '',
    loading: false
  },
  reducers: {
    setList(state, payload) {
      return { ...state, list: payload };
    },
    setStorageAvailable(state, payload) {
      return { ...state, storageAvailable: payload };
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
      async loadFavourites() {
        this.setLoading(true);
        this.resetMessages();
        try {
          const stored = readStorage(STORAGE_KEYS.favourites, []);
          const list = [];
          const seen = new Set();
          if (Array.isArray(stored)) {
            for (const item of stored) {
              if (
                isFavouriteShape(item) &&
                !seen.has(item.id) &&
                list.length < MAX_FAVOURITES
              ) {
                seen.add(item.id);
                list.push(item);
              }
            }
          }
          this.setList(list);
          const available = isStorageAvailable();
          this.setStorageAvailable(available);
          if (!available) {
            this.setError('Favourites will not be saved after you close this tab.');
          }
        } catch (err) {
          this.setError(err.message || 'Could not load your saved cities.');
          dispatch.alert.error({ msg: err.message || 'Could not load your saved cities.' });
        } finally {
          this.setLoading(false);
        }
      },
      async addFavourite(city, rootState) {
        this.setLoading(true);
        this.resetMessages();
        try {
          if (!isCityShape(city)) {
            const message = 'Choose a city before saving it to favourites.';
            this.setError(message);
            dispatch.alert.error({ msg: message });
            return;
          }

          const favourite = buildFavourite(city);
          const currentList = rootState.favourites.list;
          const duplicate = currentList.find((item) => item.id === favourite.id);
          if (duplicate) {
            const message = 'This city is already in your favourites.';
            this.setError(message);
            dispatch.alert.error({ msg: message });
            return;
          }
          if (currentList.length >= MAX_FAVOURITES) {
            const message = 'You can save up to 5 cities. Remove one to add another.';
            this.setError(message);
            dispatch.alert.error({ msg: message });
            return;
          }

          const nextList = currentList.concat([favourite]);
          this.setList(nextList);

          const saved = writeStorage(STORAGE_KEYS.favourites, nextList);
          if (!saved) {
            this.setStorageAvailable(false);
            const message = 'City saved for this session only. Favourites will not survive a reload.';
            this.setError(message);
            dispatch.alert.error({ msg: message });
            return;
          }

          this.setStorageAvailable(true);
          this.setSuccess(`${favourite.name} saved to favourites.`);
          dispatch.alert.success({ msg: `${favourite.name} saved to favourites.` });
        } catch (err) {
          this.setError(err.message || 'Could not save this city.');
          dispatch.alert.error({ msg: err.message || 'Could not save this city.' });
        } finally {
          this.setLoading(false);
        }
      },
      async removeFavourite(id, rootState) {
        this.setLoading(true);
        this.resetMessages();
        try {
          const currentList = rootState.favourites.list;
          const favourite = currentList.find((item) => item.id === id);
          if (!favourite) {
            const message = 'That city is no longer in your favourites.';
            this.setError(message);
            dispatch.alert.error({ msg: message });
            return;
          }

          const nextList = currentList.filter((item) => item.id !== id);
          this.setList(nextList);

          const saved = writeStorage(STORAGE_KEYS.favourites, nextList);
          if (!saved) {
            this.setStorageAvailable(false);
            const message = 'City removed for this session only. Favourites will not survive a reload.';
            this.setError(message);
            dispatch.alert.error({ msg: message });
            return;
          }

          this.setStorageAvailable(true);
          this.setSuccess(`${favourite.name} removed from favourites.`);
          dispatch.alert.success({ msg: `${favourite.name} removed from favourites.` });
        } catch (err) {
          this.setError(err.message || 'Could not remove this city.');
          dispatch.alert.error({ msg: err.message || 'Could not remove this city.' });
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

export default favourites;
