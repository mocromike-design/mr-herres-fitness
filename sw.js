// Mr. Herres Trainingsapp - Service Worker voor Offline Gym Gebruik
const CACHE_NAME = 'mr-herres-v13';
const ASSETS_TO_CACHE = [
  './',
  './92adeac7-32d0-4dcc-9b34-d052fc222f8e-resized-380x512.jpg',
  './Ab Wheel Rollouts.jpg',
  './app.js',
  './Arnold Press (Dumbbells).jpg',
  './Barbell Bench Press.jpg',
  './Barbell Bicep Curls.jpg',
  './Barbell Squat.jpg',
  './bench-press.jpg',
  './Bent-over Barbell Row.jpg',
  './Bulgarian Split Squats.jpg',
  './Cable Crunches.jpg',
  './Cable Lateral Raises.jpg',
  './Calf Press op Leg Press Machine.jpg',
  './Close-Grip Pulldown (V-Bar).jpg',
  './Conventional Deadlift.jpg',
  './data.js',
  './Dead Hangs (Aan stang hangen).jpg',
  './Decline Bench Crunches.jpg',
  './Dips (Lichaamsgewicht of extra).jpg',
  './Dumbbell Hammer Curls.jpg',
  './Dumbbell Lateral Raises.jpg',
  './Dumbbell Romanian Deadlift.jpg',
  './Dumbbell Wrist Curls (Polsen).jpg',
  './Face Pulls.jpg',
  './Farmer Walks.jpg',
  './Flat Dumbbell Press.jpg',
  './Goblet Squats (Kettlebell).jpg',
  './Hack Squat (of Front Squat).jpg',
  './Hanging Leg Raises.jpg',
  './Hip Thrusts (Machine of Barbell).jpg',
  './icon.png',
  './icon.svg',
  './Incline Barbell Press.jpg',
  './Incline Dumbbell Press.jpg',
  './index.html',
  './Lat Pulldown.jpg',
  './Leg Extensions.jpg',
  './Leg Press.jpg',
  './logo.jpg',
  './Lying Leg Curls.jpg',
  './Machine Flyes (Pec Deck).jpg',
  './Machine Shoulder Press.jpg',
  './manifest.json',
  './Pull-ups.jpg',
  './Reverse Barbell Curls.jpg',
  './Reverse Pec Deck (Machine).jpg',
  './Romanian Deadlift (RDL).jpg',
  './Russian Twists (met gewicht).jpg',
  './Seated Cable Row.jpg',
  './Seated Calf Raises.jpg',
  './Seated Dumbbell Press.jpg',
  './Seated Leg Curls.jpg',
  './Single Arm Dumbbell Row.jpg',
  './Single Leg Calf Raises (Bodyweight).jpg',
  './Skullcrushers (EZ-Bar).jpg',
  './Standing Calf Raises.jpg',
  './Straight Arm Pulldowns.jpg',
  './style.css',
  './sw.js',
  './T-Bar Row (of Machine Row).jpg',
  './Tricep Rope Pushdowns.jpg',
  './Walking Lunges (met Dumbbells).jpg',
  './Weighted Plank (Schijf op rug).jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of ASSETS_TO_CACHE) {
        try {
          await cache.add(asset);
        } catch (e) {
          console.warn('Caching overgeslagen voor:', asset);
        }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return networkResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html', { ignoreSearch: true });
        }
      });
    })
  );
});
