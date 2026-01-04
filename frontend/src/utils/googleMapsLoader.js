// frontend/src/utils/googleMapsLoader.js
let isLoading = false;
let isLoaded = false;
const callbacks = [];

export const loadGoogleMaps = (callback) => {
  if (isLoaded) {
    callback();
    return;
  }

  callbacks.push(callback);

  if (isLoading) {
    return;
  }

  isLoading = true;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.error('Google Maps API key not found in environment variables');
    callbacks.forEach(cb => cb(new Error('API key missing')));
    callbacks.length = 0;
    return;
  }

  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
  script.async = true;
  script.defer = true;
  
  script.onload = () => {
    isLoaded = true;
    isLoading = false;
    callbacks.forEach(cb => cb());
    callbacks.length = 0;
  };

  script.onerror = () => {
    isLoading = false;
    const error = new Error('Failed to load Google Maps');
    callbacks.forEach(cb => cb(error));
    callbacks.length = 0;
  };

  document.head.appendChild(script);
};
