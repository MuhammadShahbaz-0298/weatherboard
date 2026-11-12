import Button from '../common/Button';
import Input from '../common/Input';
import './PermissionExplainer.css';

export default function PermissionExplainer({
  time,
  timeError,
  onTimeChange,
  onTimeBlur,
  onEnable,
  loading
}) {
  function handleSubmit(event) {
    event.preventDefault();
    onEnable();
  }

  return (
    <div className="permission-explainer">
      <h3 className="permission-explainer__title">A quiet morning forecast</h3>
      <p className="permission-explainer__text">
        We ask for notification permission so WeatherBoard can remind you of the day's weather
        at your chosen time. On installed Chrome/Edge PWAs, a reminder is delivered in the
        background by Periodic Background Sync (the time shown is approximate). When the app
        is open, the foreground timer delivers the notification at the exact chosen time.
      </p>
      <ul className="permission-explainer__list">
        <li>Permission is requested only when you choose.</li>
        <li>You can send a test notification to confirm it works.</li>
        <li>No marketing, no account, no tracking.</li>
        <li>You can turn it off whenever you want.</li>
      </ul>

      <form className="permission-explainer__form" onSubmit={handleSubmit} noValidate>
        <Input
          label="Reminder time"
          type="time"
          value={time}
          onChange={(event) => onTimeChange(event.target.value)}
          onBlur={onTimeBlur}
          error={timeError}
          hint="Validated when you leave the field or save."
        />
        <Button type="submit" loading={loading}>
          Enable notifications
        </Button>
      </form>
    </div>
  );
}
