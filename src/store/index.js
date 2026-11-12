import { init } from '@rematch/core';
import alert from './models/alert';
import city from './models/city';
import favourites from './models/favourites';
import reminder from './models/reminder';
import settings from './models/settings';
import weather from './models/weather';

const store = init({
  models: {
    alert,
    city,
    favourites,
    reminder,
    settings,
    weather
  }
});

export default store;
