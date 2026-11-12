import { DEFAULT_REMINDER_TIME, STORAGE_KEYS } from '../../utils/constants';
import { validateTime } from '../../utils/validators';
import { readStorage, writeStorage } from '../../utils/storage';
import {
  getNotificationPermission,
  isNotificationSupported,
  isServiceWorkerSupported,
  requestNotificationPermission,
  showTestNotification
} from '../../services/notificationService';
import {
  configureReminderSync,
  isAtOrAfterReminderTime,
  updateReminderWeather
} from '../../services/reminderSyncService';

const reminder = {
  state: {
    time: DEFAULT_REMINDER_TIME,
    enabled: false,
    permission: 'default',
    supported: true,
    mode: 'idle',
    modeDetail: '',
    success: '',
    error: '',
    loading: false
  },
  reducers: {
    setTime(state, payload) {
      return { ...state, time: payload };
    },
    setEnabled(state, payload) {
      return { ...state, enabled: payload };
    },
    setPermission(state, payload) {
      return { ...state, permission: payload };
    },
    setSupported(state, payload) {
      return { ...state, supported: payload };
    },
    setDelivery(state, payload) {
      return { ...state, mode: payload.mode, modeDetail: payload.detail || '' };
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
      async loadReminder() {
        this.setLoading(true);
        this.resetMessages();
        try {
          const permission = getNotificationPermission();
          const supported = permission !== 'unsupported' && isServiceWorkerSupported();
          this.setPermission(permission);
          this.setSupported(supported);

          let time = DEFAULT_REMINDER_TIME;
          let enabled = false;
          const stored = readStorage(STORAGE_KEYS.reminder, null);
          if (stored && typeof stored === 'object') {
            if (typeof stored.time === 'string' && !validateTime(stored.time)) {
              time = stored.time;
            }
            if (typeof stored.enabled === 'boolean') {
              enabled = stored.enabled && permission === 'granted';
            }
          }

          if (permission !== 'granted') {
            enabled = false;
          }

          this.setTime(time);
          this.setEnabled(enabled);

          if (!supported) {
            await configureReminderSync({ enabled: false, time });
            this.setDelivery({ mode: 'unsupported', detail: '' });
            return;
          }

          const delivery = await configureReminderSync({
            enabled,
            time,
            suppressToday: false
          });
          this.setDelivery(delivery);
        } catch (err) {
          this.setDelivery({ mode: 'off', detail: '' });
          this.setError(err.message || 'Could not load your reminder settings.');
          dispatch.alert.error({ msg: err.message || 'Could not load your reminder settings.' });
        } finally {
          this.setLoading(false);
        }
      },
      async changeTime(time, rootState) {
        this.setLoading(true);
        this.resetMessages();
        try {
          const timeError = validateTime(time);
          if (timeError) {
            this.setError(timeError);
            dispatch.alert.error({ msg: timeError });
            return;
          }

          this.setTime(time);
          const enabled = rootState.reminder.enabled;
          const saved = writeStorage(STORAGE_KEYS.reminder, { time, enabled });

          const delivery = await configureReminderSync({
            enabled,
            time,
            suppressToday: enabled && isAtOrAfterReminderTime(time)
          });
          this.setDelivery(delivery);

          if (!saved) {
            const message = 'Reminder time changed for this session only. It will not survive a reload.';
            this.setError(message);
            dispatch.alert.error({ msg: message });
            return;
          }

          this.setSuccess(`Reminder time saved for ${time}.`);
          dispatch.alert.success({ msg: `Reminder time saved for ${time}.` });
        } catch (err) {
          this.setError(err.message || 'Could not save the reminder time.');
          dispatch.alert.error({ msg: err.message || 'Could not save the reminder time.' });
        } finally {
          this.setLoading(false);
        }
      },
      async enableReminder(payload, rootState) {
        this.setLoading(true);
        this.resetMessages();
        try {
          if (!isNotificationSupported() || !isServiceWorkerSupported()) {
            this.setSupported(false);
            this.setDelivery({ mode: 'unsupported', detail: '' });
            const message = 'This browser does not support notifications from a service worker.';
            this.setError(message);
            dispatch.alert.error({ msg: message });
            return;
          }

          const time = payload && payload.time ? payload.time : rootState.reminder.time;
          const timeError = validateTime(time);
          if (timeError) {
            this.setError(timeError);
            dispatch.alert.error({ msg: timeError });
            return;
          }

          const permission = await requestNotificationPermission();
          this.setPermission(permission);

          if (permission !== 'granted') {
            this.setEnabled(false);
            this.setDelivery({ mode: 'off', detail: '' });
            await configureReminderSync({ enabled: false, time });
            const message = permission === 'denied'
              ? 'Notifications are blocked. Re-enable them for this site in your browser settings, then try again.'
              : 'Notification permission was not granted. Try again when you are ready.';
            this.setError(message);
            dispatch.alert.error({ msg: message });
            return;
          }

          this.setTime(time);
          this.setEnabled(true);
          const saved = writeStorage(STORAGE_KEYS.reminder, { time, enabled: true });
          const delivery = await configureReminderSync({
            enabled: true,
            time,
            suppressToday: isAtOrAfterReminderTime(time)
          });
          this.setDelivery(delivery);

          if (!saved) {
            const message = 'Notifications are allowed, but the preferred time could not be saved and will reset on reload.';
            this.setError(message);
            dispatch.alert.error({ msg: message });
            return;
          }

          const modeMessage = delivery.mode === 'periodic'
            ? 'Background sync is active.'
            : 'The foreground timer is active while WeatherBoard is open.';
          this.setSuccess(`Notifications enabled. ${modeMessage}`);
          dispatch.alert.success({ msg: `Notifications enabled. ${modeMessage}` });
        } catch (err) {
          this.setEnabled(false);
          this.setDelivery({ mode: 'off', detail: '' });
          this.setError(err.message || 'Could not enable notifications.');
          dispatch.alert.error({ msg: err.message || 'Could not enable notifications.' });
        } finally {
          this.setLoading(false);
        }
      },
      async disableReminder(payload, rootState) {
        this.setLoading(true);
        this.resetMessages();
        try {
          this.setEnabled(false);
          const saved = writeStorage(STORAGE_KEYS.reminder, {
            time: rootState.reminder.time,
            enabled: false
          });
          const delivery = await configureReminderSync({
            enabled: false,
            time: rootState.reminder.time
          });
          this.setDelivery(delivery);

          if (!saved) {
            const message = 'The reminder preference is off, but the change will not survive a reload.';
            this.setError(message);
            dispatch.alert.error({ msg: message });
            return;
          }

          this.setSuccess('Reminder preference turned off.');
          dispatch.alert.success({ msg: 'Reminder preference turned off.' });
        } catch (err) {
          this.setError(err.message || 'Could not turn off the reminder preference.');
          dispatch.alert.error({ msg: err.message || 'Could not turn off the reminder preference.' });
        } finally {
          this.setLoading(false);
        }
      },
      async sendTest() {
        this.setLoading(true);
        this.resetMessages();
        try {
          await showTestNotification();
          this.setSuccess('Test notification sent.');
          dispatch.alert.success({ msg: 'Test notification sent.' });
        } catch (err) {
          this.setError(err.message || 'Could not send a test notification.');
          dispatch.alert.error({ msg: err.message || 'Could not send a test notification.' });
        } finally {
          this.setLoading(false);
        }
      },
      async refreshPermission(payload, rootState) {
        const permission = getNotificationPermission();
        const supported = permission !== 'unsupported' && isServiceWorkerSupported();
        this.setPermission(permission);
        this.setSupported(supported);

        if (!supported) {
          this.setEnabled(false);
          this.setDelivery({ mode: 'unsupported', detail: '' });
          return;
        }

        if (permission !== 'granted') {
          this.setEnabled(false);
          this.setDelivery({ mode: 'off', detail: '' });
          await configureReminderSync({ enabled: false, time: rootState.reminder.time });
          return;
        }

        if (!rootState.reminder.enabled) {
          this.setDelivery({ mode: 'off', detail: '' });
          return;
        }

        const delivery = await configureReminderSync({
          enabled: true,
          time: rootState.reminder.time,
          suppressToday: false
        });
        this.setDelivery(delivery);
      },
      async syncWeatherSnapshot(payload) {
        try {
          await updateReminderWeather(payload);
        } catch (err) {
          return;
        }
      },
      resetMessages() {
        this.setSuccess('');
        this.setError('');
      }
    };
  }
};

export default reminder;
