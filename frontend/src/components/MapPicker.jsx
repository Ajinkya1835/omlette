// frontend/src/components/MapPicker.jsx
import { useEffect, useRef } from 'react';
import { loadGoogleMaps } from '../utils/googleMapsLoader';
import './MapPicker.css';

function MapPicker({ latitude, longitude, onLocationChange }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    loadGoogleMaps((error) => {
      if (error) {
        console.error('Google Maps loading error:', error);
        return;
      }
      initializeMap();
    });

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        const newPosition = { lat, lng };
        mapInstanceRef.current.setCenter(newPosition);
        
        if (markerRef.current) {
          markerRef.current.setPosition(newPosition);
        }
      }
    }
  }, [latitude, longitude]);

  const initializeMap = () => {
    if (!window.google || !mapRef.current) return;

    const lat = parseFloat(latitude) || 19.0760; // Mumbai default
    const lng = parseFloat(longitude) || 72.8777;

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: { lat, lng },
      zoom: 14,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    markerRef.current = new window.google.maps.Marker({
      position: { lat, lng },
      map: mapInstanceRef.current,
      draggable: true,
      title: 'Location',
    });

    // Update on marker drag
    markerRef.current.addListener('dragend', (event) => {
      const newLat = event.latLng.lat();
      const newLng = event.latLng.lng();
      onLocationChange(newLat.toFixed(6), newLng.toFixed(6));
    });

    // Update on map click
    mapInstanceRef.current.addListener('click', (event) => {
      const newLat = event.latLng.lat();
      const newLng = event.latLng.lng();
      markerRef.current.setPosition({ lat: newLat, lng: newLng });
      onLocationChange(newLat.toFixed(6), newLng.toFixed(6));
    });
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        onLocationChange(lat, lng);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to detect location. Please enable location permissions.');
      }
    );
  };

  return (
    <div className="map-picker-container">
      <div className="map-picker-header">
        <button 
          type="button" 
          className="detect-location-btn" 
          onClick={handleDetectLocation}
        >
          📍 Detect My Location
        </button>
        <span className="map-picker-hint">Click map or drag marker to set location</span>
      </div>
      <div ref={mapRef} className="map-picker-canvas"></div>
    </div>
  );
}

export default MapPicker;
