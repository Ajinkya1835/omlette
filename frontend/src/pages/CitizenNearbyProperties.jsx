// frontend/src/pages/CitizenNearbyProperties.jsx
import { useEffect, useState, useRef } from "react";
import apiRequest from "../api/api.js";
import { loadGoogleMaps } from "../utils/googleMapsLoader";
import { calculateDistance, formatDistance } from "../utils/distanceCalculator.js";
import "./CitizenNearbyProperties.css";

function CitizenNearbyProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    detectLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchAllProperties();
    }
  }, [userLocation]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (err) => {
        console.error("Location error:", err);
        setError("Unable to detect your location. Please enable location access.");
        setLoading(false);
      }
    );
  };

  const fetchAllProperties = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/api/properties/all");
      
      // Calculate distance for each property
      const propertiesWithDistance = (data.properties || []).map((prop) => {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          prop.latitude,
          prop.longitude
        );
        return {
          ...prop,
          distance: distance.meters,
          distanceKm: distance.kilometers,
        };
      });

      // Sort by distance (nearest first)
      propertiesWithDistance.sort((a, b) => a.distance - b.distance);
      
      setProperties(propertiesWithDistance);
      initializeMap(propertiesWithDistance);
    } catch (err) {
      setError(err.message || "Failed to fetch properties");
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = (propsToShow) => {
    loadGoogleMaps((error) => {
      if (error) {
        console.error("Google Maps loading error:", error);
        return;
      }
      renderMap(propsToShow);
    });
  };

  const renderMap = (propsToShow) => {
    if (!window.google || !mapRef.current || !userLocation) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Create map
    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: userLocation,
      zoom: 14,
      mapTypeControl: true,
      streetViewControl: false,
    });

    // User location marker (red)
    const userMarker = new window.google.maps.Marker({
      position: userLocation,
      map: mapInstanceRef.current,
      icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
      title: 'Your Location',
    });
    markersRef.current.push(userMarker);

    // Property markers (blue/green)
    propsToShow.forEach((property) => {
      const propLat = parseFloat(property.latitude);
      const propLng = parseFloat(property.longitude);

      if (!isNaN(propLat) && !isNaN(propLng)) {
        const isSelected = selectedProperty?._id === property._id;

        const marker = new window.google.maps.Marker({
          position: { lat: propLat, lng: propLng },
          map: mapInstanceRef.current,
          icon: isSelected
            ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
            : 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          title: property.propertyName,
        });

        marker.addListener('click', () => {
          handlePropertySelect(property);
        });

        markersRef.current.push(marker);
      }
    });
  };

  const handlePropertySelect = (property) => {
    setSelectedProperty(property);
    
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({
        lat: parseFloat(property.latitude),
        lng: parseFloat(property.longitude),
      });
      mapInstanceRef.current.setZoom(16);
    }

    // Re-render markers to update colors
    renderMap(properties);
  };

  return (
    <div className="nearby-properties-container">
      <div className="page-header-nearby">
        <h2>🏢 All Properties</h2>
        <p>View all registered properties with distance from your location</p>
      </div>

      {/* Controls */}
      <div className="controls-bar">
        <button className="btn-refresh" onClick={detectLocation}>
          🔄 Refresh Location
        </button>
      </div>

      {error && (
        <div className="alert-error-nearby">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="loading-state-nearby">Loading properties...</div>
      ) : (
        <>
          {/* Map */}
          <div className="map-section-nearby">
            <div ref={mapRef} className="map-canvas-nearby"></div>
            <div className="map-info">
              <strong>Found {properties.length} active properties</strong>
            </div>
          </div>

          {/* Properties List */}
          <div className="properties-list-nearby">
            <h3>Properties List ({properties.length})</h3>

            {properties.length === 0 ? (
              <div className="no-properties">
                <p>No active properties found in the system.</p>
              </div>
            ) : (
              <div className="properties-table-wrapper">
                <table className="properties-table">
                  <thead>
                    <tr>
                      <th>Property Name</th>
                      <th>Type</th>
                      <th>Address</th>
                      <th>Ward</th>
                      <th>Zone</th>
                      <th>Distance</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((property) => (
                      <tr
                        key={property._id}
                        className={selectedProperty?._id === property._id ? 'selected-row' : ''}
                      >
                        <td><strong>{property.propertyName}</strong></td>
                        <td>{property.propertyType}</td>
                        <td>{property.address}</td>
                        <td>{property.wardNumber}</td>
                        <td>{property.zone}</td>
                        <td>{property.distanceKm} km</td>
                        <td>
                          <button
                            className="btn-view-map"
                            onClick={() => handlePropertySelect(property)}
                          >
                            📍 View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Selected Property Details */}
          {selectedProperty && (
            <div className="selected-property-details">
              <div className="details-header">
                <h4>📋 Property Details</h4>
                <button className="btn-close-details" onClick={() => setSelectedProperty(null)}>
                  ✕
                </button>
              </div>
              <div className="details-content">
                <div className="detail-row">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">{selectedProperty.propertyName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Type:</span>
                  <span className="detail-value">{selectedProperty.propertyType}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value">{selectedProperty.address}</span>
                </div>
                {selectedProperty.wardNumber && (
                  <div className="detail-row">
                    <span className="detail-label">Ward:</span>
                    <span className="detail-value">{selectedProperty.wardNumber}</span>
                  </div>
                )}
                {selectedProperty.zone && (
                  <div className="detail-row">
                    <span className="detail-label">Zone:</span>
                    <span className="detail-value">{selectedProperty.zone}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-label">Distance:</span>
                  <span className="detail-value">{selectedProperty.distanceKm} km</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default CitizenNearbyProperties;
