// frontend/src/components/PropertyMapSelector.jsx
import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../utils/googleMapsLoader';
import './PropertyMapSelector.css';

function PropertyMapSelector({ latitude, longitude, properties, onPropertySelect, selectedPropertyId }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (latitude && longitude) {
      loadGoogleMaps((error) => {
        if (error) {
          console.error('Google Maps loading error:', error);
          return;
        }
        initializeMap();
      });
    }
  }, [latitude, longitude, properties]);

  const initializeMap = () => {
    if (!window.google || !mapRef.current) return;

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Create map
    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: { lat, lng },
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
    });

    // Add user location marker (red)
    const userMarker = new window.google.maps.Marker({
      position: { lat, lng },
      map: mapInstanceRef.current,
      icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
      title: 'Your Location',
    });
    markersRef.current.push(userMarker);

    // Add property markers (blue)
    if (properties && properties.length > 0) {
      properties.forEach((property) => {
        const propLat = parseFloat(property.latitude);
        const propLng = parseFloat(property.longitude);

        if (!isNaN(propLat) && !isNaN(propLng)) {
          const isSelected = selectedPropertyId === property._id;
          
          const marker = new window.google.maps.Marker({
            position: { lat: propLat, lng: propLng },
            map: mapInstanceRef.current,
            icon: isSelected 
              ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
              : 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            title: property.propertyName,
          });

          marker.addListener('click', () => {
            onPropertySelect(property);
            // Update marker colors
            initializeMap();
          });

          markersRef.current.push(marker);
        }
      });
    }
  };

  if (!latitude || !longitude) {
    return (
      <div className="property-map-placeholder">
        <p>📍 Detecting location to show nearby properties...</p>
      </div>
    );
  }

  return (
    <div className="property-map-selector">
      <div ref={mapRef} className="property-map-canvas"></div>
      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#EA4335' }}></span>
          <span>Your Location</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#4285F4' }}></span>
          <span>Nearby Properties</span>
        </div>
        {selectedPropertyId && (
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#34A853' }}></span>
            <span>Selected Property</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default PropertyMapSelector;
