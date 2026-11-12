import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Banner from '../common/Banner';
import Button from '../common/Button';
import Card from '../common/Card';
import EmptyState from '../common/EmptyState';
import Modal from '../common/Modal';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import useStorage from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../utils/constants';
import { formatCitySecondary } from '../../utils/formatters';
import './FavouritesPanel.css';

export default function FavouritesPanel() {
  const dispatch = useDispatch();
  const online = useOnlineStatus();
  const list = useSelector((state) => state.favourites.list);
  const loading = useSelector((state) => state.favourites.loading);
  const storageAvailable = useSelector((state) => state.favourites.storageAvailable);
  const selectedCity = useSelector((state) => state.city.selectedCity);
  const weatherCity = useSelector((state) => state.weather.city);
  const currentCity = selectedCity || weatherCity;
  const [openPanel, setOpenPanel] = useStorage(STORAGE_KEYS.favouritesPanelOpen, true);
  const [pendingRemove, setPendingRemove] = useState(null);

  function confirmRemove() {
    if (pendingRemove) {
      dispatch.favourites.removeFavourite(pendingRemove.id);
    }
    setPendingRemove(null);
  }

  return (
    <>
      <Card
        title="Saved cities"
        subtitle="Up to 5 cities for quick access."
        className="favourites-panel"
        action={
          <Button
            variant="ghost"
            size="small"
            onClick={() => setOpenPanel(!openPanel)}
            aria-expanded={openPanel}
          >
            {openPanel ? 'Hide' : 'Show'}
          </Button>
        }
      >
        {openPanel ? (
          <div className="favourites-panel__content">
            {!storageAvailable ? (
              <Banner variant="warning">
                Local storage is unavailable. Favourites work for this session but will not be saved
                after you close the tab.
              </Banner>
            ) : null}

            {loading && list.length === 0 ? (
              <div className="favourites-panel__skeleton" role="status">
                <span className="sr-only">Loading saved cities</span>
                <span className="skeleton" />
                <span className="skeleton" />
              </div>
            ) : null}

            {!loading && list.length === 0 ? (
              <EmptyState
                title="No saved cities yet"
                message="Search for a city, select it, then save it here for quick access."
              />
            ) : null}

            {!online && list.length > 0 ? (
              <p className="favourites-panel__hint">
                Reconnect to switch saved cities. The current saved weather stays visible.
              </p>
            ) : null}

            {list.length > 0 ? (
              <ul className="favourites-panel__list">
                {list.map((favourite) => {
                  const isCurrent = currentCity && currentCity.id === favourite.id;
                  return (
                    <li className="favourites-panel__item" key={favourite.id}>
                      <button
                        type="button"
                        className={
                          isCurrent
                            ? 'favourites-panel__open favourites-panel__open--current'
                            : 'favourites-panel__open'
                        }
                        aria-current={isCurrent ? 'true' : undefined}
                        disabled={!online}
                        title={online ? undefined : 'Reconnect to switch saved cities.'}
                        onClick={() => dispatch.city.selectCity(favourite)}
                      >
                        <span className="favourites-panel__name">{favourite.name}</span>
                        <span className="favourites-panel__meta">
                          {formatCitySecondary(favourite)}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="favourites-panel__remove"
                        onClick={() => setPendingRemove(favourite)}
                        aria-label={`Remove ${favourite.name} from favourites`}
                      >
                        <span aria-hidden="true">×</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        ) : null}
      </Card>

      <Modal
        open={pendingRemove !== null}
        title="Remove saved city?"
        onClose={() => setPendingRemove(null)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setPendingRemove(null)}>
              Keep city
            </Button>
            <Button variant="danger" onClick={confirmRemove}>
              Remove city
            </Button>
          </>
        }
      >
        {pendingRemove ? (
          <p>
            Remove {pendingRemove.name} from your favourites? You can search for it again later.
          </p>
        ) : null}
      </Modal>
    </>
  );
}
