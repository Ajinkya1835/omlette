// frontend/src/components/MapPicker.jsx
import { useEffect, useRef } from 'react';
import { loadGoogleMaps } from '../utils/googleMapsLoader';
import './MapPicker.css';

function MapPicker({ latitude, longitude, onLocationChange, properties = [] }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const propertyMarkersRef = useRef([]);

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
      propertyMarkersRef.current.forEach(marker => {
        marker.setMap(null);
      });
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

  // Display property markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear old markers
    propertyMarkersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    propertyMarkersRef.current = [];

    // Add new markers for each property
    if (Array.isArray(properties) && properties.length > 0) {
      properties.forEach((prop) => {
        if (prop.latitude && prop.longitude) {
          const marker = new window.google.maps.Marker({
            position: { 
              lat: parseFloat(prop.latitude), 
              lng: parseFloat(prop.longitude) 
            },
            map: mapInstanceRef.current,
            title: prop.propertyName || 'Property',
            icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          });

          // Add info window on marker click
          const infoWindow = new window.google.maps.InfoWindow({
            content: `<div style="padding: 8px; font-size: 13px;"><strong>${prop.propertyName || 'Property'}</strong><br/>${prop.propertyType || ''}</div>`,
          });

          marker.addListener('click', () => {
            infoWindow.open(mapInstanceRef.current, marker);
          });

          propertyMarkersRef.current.push(marker);
        }
      });
    }
  }, [properties]);

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

  return (
    <div className="map-picker-container">
      <div className="map-picker-header">
        <span className="map-picker-hint">Click map or drag marker to set location. Blue markers show registered properties.</span>
      </div>
      <div ref={mapRef} className="map-picker-canvas"></div>
    </div>
  );
}

export default MapPicker;
