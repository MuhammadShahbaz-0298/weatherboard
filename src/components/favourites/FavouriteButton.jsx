import { useDispatch, useSelector } from 'react-redux';
import Button from '../common/Button';

export default function FavouriteButton({ city }) {
  const dispatch = useDispatch();
  const list = useSelector((state) => state.favourites.list);
  const loading = useSelector((state) => state.favourites.loading);

  if (!city) {
    return null;
  }

  const id = city.id || `${city.lat.toFixed(4)}:${city.lon.toFixed(4)}`;
  const isSaved = list.some((item) => item.id === id);

  if (isSaved) {
    return (
      <Button variant="secondary" size="small" disabled>
        Saved
      </Button>
    );
  }

  return (
    <Button
      variant="secondary"
      size="small"
      loading={loading}
      onClick={() => dispatch.favourites.addFavourite(city)}
    >
      Save city
    </Button>
  );
}
