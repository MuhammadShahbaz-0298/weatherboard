import WeatherIcon from './WeatherIcon';
import {
  formatMonthDay,
  formatTemperaturePair,
  formatWeekday
} from '../../utils/formatters';
import './ForecastDay.css';

export default function ForecastDay({ day, unit }) {
  return (
    <li className="forecast-day">
      <div className="forecast-day__date">
        <span className="forecast-day__weekday">{formatWeekday(day.date)}</span>
        <span className="forecast-day__month">{formatMonthDay(day.date)}</span>
      </div>
      <WeatherIcon code={day.conditionCode} size="small" />
      <div className="forecast-day__condition">
        <span>{day.condition}</span>
        <span className="forecast-day__temperatures">{formatTemperaturePair(day.min, day.max, unit)}</span>
      </div>
    </li>
  );
}
