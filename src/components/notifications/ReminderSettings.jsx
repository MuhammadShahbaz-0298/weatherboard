import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Banner from '../common/Banner';
import Button from '../common/Button';
import Card from '../common/Card';
import Input from '../common/Input';
import Toggle from '../common/Toggle';
import PermissionExplainer from './PermissionExplainer';
import { validateTime } from '../../utils/validators';
import './ReminderSettings.css';

function deliveryLabel(mode) {
  if (mode === 'periodic') {
    return 'Background sync';
  }
  if (mode === 'foreground') {
    return 'Foreground timer';
  }
  if (mode === 'idle') {
    return 'Checking';
  }
  return 'Off';
}

export default function ReminderSettings() {
  const dispatch = useDispatch();
  const time = useSelector((state) => state.reminder.time);
  const enabled = useSelector((state) => state.reminder.enabled);
  const permission = useSelector((state) => state.reminder.permission);
  const supported = useSelector((state) => state.reminder.supported);
  const mode = useSelector((state) => state.reminder.mode);
  const modeDetail = useSelector((state) => state.reminder.modeDetail);
  const loading = useSelector((state) => state.reminder.loading);
  const error = useSelector((state) => state.reminder.error);
  const [draftTime, setDraftTime] = useState(time);
  const [timeError, setTimeError] = useState('');

  useEffect(() => {
    setDraftTime(time);
  }, [time]);

  useEffect(() => {
    function refresh() {
      dispatch.reminder.refreshPermission();
    }
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
    };
  }, [dispatch]);

  function checkTime() {
    const message = validateTime(draftTime);
    setTimeError(message);
    return message === '';
  }

  function handleTimeChange(value) {
    setDraftTime(value);
    setTimeError('');
  }

  function handleEnable() {
    if (!checkTime()) {
      return;
    }
    dispatch.reminder.enableReminder({ time: draftTime });
  }

  function handleTimeSubmit(event) {
    event.preventDefault();
    if (!checkTime()) {
      return;
    }
    dispatch.reminder.changeTime(draftTime);
  }

  function handleToggle(nextValue) {
    if (nextValue) {
      if (!checkTime()) {
        return;
      }
      dispatch.reminder.enableReminder({ time: draftTime });
      return;
    }
    dispatch.reminder.disableReminder();
  }

  const unsupported = !supported || permission === 'unsupported';

  return (
    <Card
      title="Daily reminder"
      subtitle="Optional notification preference"
      className="reminder-settings"
    >
      <div className="reminder-settings__content">
        {error && !unsupported && permission !== 'denied' ? (
          <Banner variant="error">{error}</Banner>
        ) : null}

        {unsupported ? (
          <Banner variant="warning" title="Notifications unavailable">
            This browser does not support notifications with a service worker. The rest of
            WeatherBoard keeps working normally.
          </Banner>
        ) : null}

        {!unsupported && permission === 'denied' ? (
          <Banner variant="warning" title="Notifications are blocked">
            Re-enable notifications for this site in your browser settings, then return to this tab.
            The rest of WeatherBoard keeps working.
          </Banner>
        ) : null}

        {!unsupported && permission === 'default' ? (
          <PermissionExplainer
            time={draftTime}
            timeError={timeError}
            onTimeChange={handleTimeChange}
            onTimeBlur={checkTime}
            onEnable={handleEnable}
            loading={loading}
          />
        ) : null}

        {!unsupported && permission === 'granted' ? (
          <div className="reminder-settings__granted">
            <form className="reminder-settings__form" onSubmit={handleTimeSubmit} noValidate>
              <Input
                label="Reminder time"
                type="time"
                value={draftTime}
                onChange={(event) => handleTimeChange(event.target.value)}
                onBlur={checkTime}
                error={timeError}
                hint="Validated when you leave the field or save."
              />
              <Button type="submit" variant="secondary" loading={loading}>
                Save time
              </Button>
            </form>

            <Toggle
              checked={enabled}
              onChange={handleToggle}
              label="Daily reminder"
              description={`Preferred reminder time: ${time}.`}
              disabled={loading}
            />

            <p className="reminder-settings__mode">
              Delivery mode: <strong>{deliveryLabel(mode)}</strong>
            </p>

            {enabled && mode === 'periodic' ? (
              <Banner variant="info" title="Background sync active">
                Your browser can deliver reminders when WeatherBoard is closed. It chooses the
                exact wake time, so delivery may be earlier or later than {time}.
              </Banner>
            ) : null}

            {enabled && mode === 'foreground' ? (
              <Banner variant="warning" title="Foreground timer active">
                {modeDetail ? `${modeDetail} ` : ''}
                Reminders are delivered while WeatherBoard is open. Closed-app delivery needs an
                installed Chromium PWA with background sync available.
              </Banner>
            ) : null}

            {enabled && mode === 'idle' ? (
              <Banner variant="info" title="Checking delivery mode">
                WeatherBoard is checking whether background sync is available.
              </Banner>
            ) : null}

            <Button
              variant="ghost"
              size="small"
              onClick={() => dispatch.reminder.sendTest()}
              disabled={loading}
            >
              Send test notification
            </Button>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
