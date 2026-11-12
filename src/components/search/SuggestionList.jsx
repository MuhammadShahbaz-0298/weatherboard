import { useEffect } from 'react';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import { formatCitySecondary } from '../../utils/formatters';
import './SuggestionList.css';

export default function SuggestionList({
  id,
  open,
  loading,
  error,
  noResults,
  query,
  suggestions,
  activeIndex,
  onSelect,
  onRetry
}) {
  useEffect(() => {
    if (activeIndex < 0) {
      return;
    }
    const option = document.getElementById(`city-option-${activeIndex}`);
    if (option) {
      option.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const hasContent = loading || Boolean(error) || noResults || suggestions.length > 0;

  if (!open || query.trim().length < 2 || !hasContent) {
    return null;
  }

  return (
    <div className="suggestion-list" id={id} role="listbox" aria-label="City suggestions">
      {loading ? (
        <div className="suggestion-list__status" role="status">
          <Spinner size="small" label="Searching cities" />
          <span>Finding matching cities...</span>
        </div>
      ) : null}

      {!loading && error ? (
        <div className="suggestion-list__status suggestion-list__status--error" role="alert">
          <span>{error}</span>
          <Button
            size="small"
            variant="secondary"
            onMouseDown={(event) => event.preventDefault()}
            onClick={onRetry}
          >
            Retry
          </Button>
        </div>
      ) : null}

      {!loading && !error && noResults ? (
        <div className="suggestion-list__status" role="status">
          <span>
            No city found for “{query}”. Check the spelling or try a nearby larger city.
          </span>
        </div>
      ) : null}

      {!loading && !error && suggestions.length > 0 ? (
        <ul className="suggestion-list__items">
          {suggestions.map((city, index) => (
            <li key={city.id} role="presentation">
              <button
                type="button"
                role="option"
                id={`city-option-${index}`}
                tabIndex={-1}
                aria-selected={index === activeIndex}
                className={
                  index === activeIndex
                    ? 'suggestion-list__button suggestion-list__button--active'
                    : 'suggestion-list__button'
                }
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onSelect(city)}
              >
                <span className="suggestion-list__name">{city.name}</span>
                <span className="suggestion-list__meta">{formatCitySecondary(city)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
