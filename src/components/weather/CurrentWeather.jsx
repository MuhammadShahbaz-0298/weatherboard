import Button from '../common/Button';
import Card from '../common/Card';
import WeatherIcon from './WeatherIcon';
import {
  convertTemperature,
  formatCitySecondary,
  formatHumidity,
  formatRelativeTime,
  formatWind,
  temperatureUnitLabel
} from '../../utils/formatters';
import './CurrentWeather.css';

export default function CurrentWeather({
  city,
  current,
  unit,
  loading,
  cached,
  updatedAt,
  onRefresh,
  favouriteAction
}) {
  if (!current) {
    if (!loading) {
      return null;
    }
    return (
      <Card className="current-weather current-weather--loading">
        <div className="current-weather__skeleton" role="status">
          <span className="sr-only">Loading current weather</span>
          <span className="skeleton current-weather__skeleton-title" />
          <span className="skeleton current-weather__skeleton-temperature" />
          <span className="skeleton current-weather__skeleton-line" />
          <span className="current-weather__skeleton-details">
            <span className="skeleton" />
            <span className="skeleton" />
          </span>
        </div>
      </Card>
    );
  }

  const temperature = Math.round(convertTemperature(current.temperature, unit));

  return (
    <Card
      title={city ? city.name : 'Current weather'}
      subtitle={city ? formatCitySecondary(city) : ''}
      className="current-weather"
      action={
        <div className="current-weather__actions">
          {favouriteAction}
          {onRefresh ? (
            <Button variant="ghost" size="small" onClick={onRefresh} disabled={loading}>
              {loading ? 'Updating...' : 'Refresh'}
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="current-weather__hero">
        <WeatherIcon code={current.conditionCode} size="large" />
        <div className="current-weather__reading">
          <p className="current-weather__temperature">
            {temperature}
            <span className="current-weather__unit">{temperatureUnitLabel(unit)}</span>
          </p>
          <p className="current-weather__condition">{current.condition}</p>
        </div>
      </div>

      <div className="current-weather__details">
        <div className="current-weather__detail">
          <span className="current-weather__detail-label">Humidity</span>
          <span className="current-weather__detail-value">{formatHumidity(current.humidity)}</span>
        </div>
        <div className="current-weather__detail">
          <span className="current-weather__detail-label">Wind</span>
          <span className="current-weather__detail-value">{formatWind(current.windSpeed)}</span>
        </div>
      </div>

      <p className="current-weather__updated">
        {cached ? 'Saved weather · ' : ''}
        {formatRelativeTime(updatedAt)}
      </p>
    </Card>
  );
}
