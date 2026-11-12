import Banner from '../common/Banner';
import './OfflineBanner.css';

export default function OfflineBanner({ online }) {
  if (online) {
    return null;
  }

  return (
    <div className="offline-banner">
      <Banner variant="warning" title="Offline mode">
        Search is paused while you are offline. Saved weather stays available, and fresh weather
        returns when you reconnect.
      </Banner>
    </div>
  );
}
