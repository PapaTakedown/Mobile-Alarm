const CACHE_NAME = 'alarm-clock-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json',
  '/components/Clock.tsx',
  '/components/AlarmList.tsx',
  '/components/SetAlarmForm.tsx',
  '/components/AlarmModal.tsx',
  '/components/AlarmItem.tsx',
  '/hooks/useCurrentTime.ts',
  '/types.ts',
  '/constants.ts',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;700&display=swap',
  'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg'
];

self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event: any) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
