// frontend/src/components/MapView.jsx
import { useEffect, useRef } from 'react';
import { loadGoogleMaps } from '../utils/googleMapsLoader';
import './MapView.css';

function MapView({ latitude, longitude, title = 'Location' }) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!latitude || !longitude) return;

    loadGoogleMaps((error) => {
      if (error) {
        console.error('Google Maps loading error:', error);
        return;
      }
      initializeMap();
    });
  }, [latitude, longitude]);

  const initializeMap = () => {
    if (!window.google || !mapRef.current) return;

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      console.error('Invalid coordinates');
      return;
    }

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat, lng },
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      draggable: false,
      scrollwheel: false,
      disableDoubleClickZoom: true,
    });

    new window.google.maps.Marker({
      position: { lat, lng },
      map: map,
      title: title,
    });
  };

  if (!latitude || !longitude) {
    return <div className="map-view-error">Location not available</div>;
  }

  return (
    <div className="map-view-container">
      <div ref={mapRef} className="map-view-canvas"></div>
      <div className="map-view-coords">
        📍 {parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}
      </div>
    </div>
  );
}

export default MapView;
