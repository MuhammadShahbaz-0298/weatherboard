import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../common/Button';
import Card from '../common/Card';
import Input from '../common/Input';
import SuggestionList from './SuggestionList';
import useDebounce from '../../hooks/useDebounce';
import {
  MAX_SEARCH_LENGTH,
  MIN_SEARCH_LENGTH,
  SEARCH_DEBOUNCE_MS
} from '../../utils/constants';
import { formatCityLabel } from '../../utils/formatters';
import {
  limitText,
  validateMaxLength,
  validateMinLength,
  validateRequired,
  validateCity
} from '../../utils/validators';
import './SearchBar.css';

export default function SearchBar({ online }) {
  const dispatch = useDispatch();
  const suggestions = useSelector((state) => state.city.suggestions);
  const selectedCity = useSelector((state) => state.city.selectedCity);
  const loading = useSelector((state) => state.city.loading);
  const noResults = useSelector((state) => state.city.noResults);
  const cityError = useSelector((state) => state.city.error);

  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debouncedQuery = useDebounce(query, SEARCH_DEBOUNCE_MS);
  const rootRef = useRef(null);
  const selectedLabel = selectedCity ? formatCityLabel(selectedCity) : '';

  useEffect(() => {
    if (!online) {
      return;
    }
    if (query !== debouncedQuery) {
      return;
    }
    if (query === selectedLabel) {
      return;
    }
    dispatch.city.searchCities(debouncedQuery);
  }, [debouncedQuery, query, selectedLabel, online, dispatch]);

  useEffect(() => {
    if (!online) {
      dispatch.city.clearSuggestions();
      setOpen(false);
      setActiveIndex(-1);
    }
  }, [online, dispatch]);

  useEffect(() => {
    if (!selectedCity) {
      return;
    }
    setQuery(selectedLabel);
    setError('');
  }, [selectedCity, selectedLabel]);

  useEffect(() => {
    function handleDocumentMouseDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleDocumentMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown);
    };
  }, []);

  function handleChange(event) {
    const nextQuery = limitText(event.target.value, MAX_SEARCH_LENGTH);
    setQuery(nextQuery);
    setError('');
    setOpen(true);
    setActiveIndex(-1);

    if (selectedCity && nextQuery !== selectedLabel) {
      dispatch.city.clearSelection();
    }
    dispatch.city.clearSuggestions();
  }

  function handleBlur() {
    if (!online) {
      return;
    }
    const validationError = validateCity(query, selectedCity ? formatCityLabel(selectedCity) : '', suggestions);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
  }

  function chooseCity(city) {
    setQuery(formatCityLabel(city));
    setOpen(false);
    setActiveIndex(-1);
    setError('');
    dispatch.city.selectCity(city);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!online) {
      return;
    }

    const validationError = validateCity(query, selectedCity ? formatCityLabel(selectedCity) : '', suggestions);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (activeIndex >= 0 && suggestions[activeIndex]) {
      chooseCity(suggestions[activeIndex]);
      return;
    }

    if (selectedCity && query === selectedLabel) {
      setOpen(false);
      dispatch.city.selectCity(selectedCity);
      return;
    }

    setError('Select a city from the suggestions.');
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown') {
      if (suggestions.length === 0) {
        return;
      }
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => {
        if (current >= suggestions.length - 1) {
          return 0;
        }
        return current + 1;
      });
      return;
    }

    if (event.key === 'ArrowUp') {
      if (suggestions.length === 0) {
        return;
      }
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => {
        if (current <= 0) {
          return suggestions.length - 1;
        }
        return current - 1;
      });
      return;
    }

    if (event.key === 'Enter' && open && activeIndex >= 0 && suggestions[activeIndex]) {
      event.preventDefault();
      chooseCity(suggestions[activeIndex]);
      return;
    }

    if (event.key === 'Escape') {
      if (open) {
        event.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
      }
    }
  }

  function handleRetry() {
    if (query.trim().length >= MIN_SEARCH_LENGTH) {
      setOpen(true);
      dispatch.city.searchCities(query);
    }
  }

  const listOpen = open && online && query.trim().length >= MIN_SEARCH_LENGTH;

  return (
    <Card
      title="Find a city"
      subtitle="Search by name, then choose the right match."
      className="search-bar-card"
    >
      <form className="search-bar" onSubmit={handleSubmit} ref={rootRef} noValidate>
        <div className="search-bar__field">
          <Input
            label="City"
            placeholder="Search for a city"
            value={query}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={() => {
              if (query.trim().length >= MIN_SEARCH_LENGTH) {
                setOpen(true);
              }
            }}
            onKeyDown={handleKeyDown}
            maxLength={MAX_SEARCH_LENGTH}
            autoComplete="off"
            spellCheck="false"
            disabled={!online}
            error={error}
            hint={online ? 'At least 2 characters.' : 'City search is paused while you are offline.'}
            role="combobox"
            aria-expanded={listOpen}
            aria-controls="city-suggestions"
            aria-autocomplete="list"
            aria-activedescendant={
              listOpen && activeIndex >= 0 ? `city-option-${activeIndex}` : undefined
            }
          />
          <SuggestionList
            id="city-suggestions"
            open={listOpen}
            loading={loading}
            error={cityError}
            noResults={noResults}
            query={query}
            suggestions={suggestions}
            activeIndex={activeIndex}
            onSelect={chooseCity}
            onRetry={handleRetry}
          />
        </div>
        <Button type="submit" disabled={!online} className="search-bar__submit">
          Search
        </Button>
      </form>
    </Card>
  );
}
