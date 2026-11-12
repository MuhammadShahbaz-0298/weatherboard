import Card from '../common/Card';
import ForecastDay from './ForecastDay';
import './ForecastList.css';

export default function ForecastList({ days, unit, loading }) {
  if (loading && days.length === 0) {
    return (
      <Card title="5-day forecast" className="forecast-list-card">
        <div className="forecast-list forecast-list--loading" role="status" aria-busy="true">
          <span className="sr-only">Loading forecast</span>
          {[0, 1, 2, 3, 4].map((item) => (
            <span className="skeleton forecast-list__skeleton" key={item} />
          ))}
        </div>
      </Card>
    );
  }

  if (days.length === 0) {
    return null;
  }

  return (
    <Card
      title="5-day forecast"
      subtitle="Daily high and low temperatures"
      className="forecast-list-card"
    >
      <ul className="forecast-list" aria-busy={loading || undefined}>
        {days.map((day) => (
          <ForecastDay day={day} unit={unit} key={day.date} />
        ))}
      </ul>
    </Card>
  );
}
