import { useEffect, useState, useRef } from "react";
import apiRequest from "../api/api.js";
import { calculateDistance, formatDistance } from "../utils/distanceCalculator.js";
import { loadGoogleMaps } from "../utils/googleMapsLoader.js";
import "./AllPropertiesMap.css";

function AllPropertiesMap() {
  const [userLocation, setUserLocation] = useState(null);
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [locationStatus, setLocationStatus] = useState("Detecting location...");
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  // Detect user location
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        setLocationStatus("Location detected ✓");
      },
      (err) => {
        console.error("Location error:", err);
        setError("Unable to detect your location. Please enable location access.");
        setLocationStatus("Location detection failed");
        setLoading(false);
      }
    );
  }, []);

  // Fetch all properties
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await apiRequest("/api/properties/all");
        const propsWithDistance = (data.properties || []).map((prop) => {
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            prop.latitude,
            prop.longitude
          );
          return {
            ...prop,
            distance,
            distanceKm: distance.kilometers,
          };
        });

        // Sort by distance
        propsWithDistance.sort((a, b) => parseFloat(a.distanceKm) - parseFloat(b.distanceKm));
        setProperties(propsWithDistance);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching properties:", err);
        setError("Failed to load properties");
        setLoading(false);
      }
    };

    if (userLocation) {
      fetchProperties();
    }
  }, [userLocation]);

  // Initialize map
  useEffect(() => {
    if (!userLocation || !mapRef.current || mapInstanceRef.current) return;

    const initMap = async () => {
      try {
        await new Promise((resolve, reject) => {
          loadGoogleMaps((error) => {
            if (error) reject(error);
            else resolve();
          });
        });
        
        const map = new window.google.maps.Map(mapRef.current, {
          zoom: 13,
          center: { lat: userLocation.latitude, lng: userLocation.longitude },
          mapTypeControl: true,
          fullscreenControl: true,
        });

        mapInstanceRef.current = map;

        // Add user location marker (red)
        const userMarker = new window.google.maps.Marker({
          position: { lat: userLocation.latitude, lng: userLocation.longitude },
          map,
          icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
          title: "Your Location",
          zIndex: 1000,
        });

        // Add property markers (blue)
        properties.forEach((prop) => {
          const marker = new window.google.maps.Marker({
            position: { lat: prop.latitude, lng: prop.longitude },
            map,
            icon: selectedProperty?._id === prop._id 
              ? "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
              : "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            title: prop.propertyName,
          });

          // Marker click handler
          marker.addListener("click", () => {
            setSelectedProperty(prop);
            // Update all markers
            updateMarkers(prop._id);
          });

          markersRef.current[prop._id] = marker;
        });
      } catch (err) {
        console.error("Map initialization error:", err);
        setError("Failed to load map. Please ensure Google Maps API key is configured.");
      }
    };

    initMap();
  }, [userLocation, properties]);

  // Update marker colors when selection changes
  const updateMarkers = (selectedId) => {
    Object.entries(markersRef.current).forEach(([propId, marker]) => {
      marker.setIcon(
        selectedId === propId
          ? "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
          : "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
      );
    });
  };

  // Handle property list click
  const handlePropertyClick = (property) => {
    setSelectedProperty(property);
    updateMarkers(property._id);

    // Center map on property
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({
        lat: property.latitude,
        lng: property.longitude,
      });
      mapInstanceRef.current.setZoom(15);
    }
  };

  // Refresh location
  const handleRefreshLocation = () => {
    setLoading(true);
    setLocationStatus("Detecting location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        setLocationStatus("Location updated ✓");
      },
      (err) => {
        console.error("Location error:", err);
        setError("Failed to refresh location");
        setLocationStatus("Location detection failed");
        setLoading(false);
      }
    );
  };

  if (loading) {
    return (
      <div className="all-properties-container">
        <div className="page-header">
          <h2>📍 All Properties Map</h2>
          <p>Browse all registered properties in the system</p>
        </div>
        <div className="loading-state">
          <p>Loading properties and map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="all-properties-container">
      {/* Page Header */}
      <div className="page-header">
        <h2>📍 All Properties Map</h2>
        <p>Browse all registered properties in the system</p>
      </div>

      {/* Location Status */}
      <div
        className={`location-status ${
          locationStatus.includes("✓") ? "success" : "warning"
        }`}
      >
        <span>{locationStatus}</span>
        <button className="btn-refresh-location" onClick={handleRefreshLocation}>
          🔄 Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert-error">
          <p>⚠️ {error}</p>
        </div>
      )}

      {/* Map Section */}
      <div className="map-section">
        <div className="map-header">
          <h3>Map View</h3>
          <div className="map-legend">
            <div className="legend-item">
              <span className="legend-dot user-dot"></span>
              <span>Your Location</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot property-dot"></span>
              <span>Property</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot selected-dot"></span>
              <span>Selected</span>
            </div>
          </div>
        </div>
        <div ref={mapRef} className="map-canvas"></div>
      </div>

      {/* Properties List */}
      <div className="properties-list-section">
        <div className="list-header">
          <h3>Properties ({properties.length})</h3>
          {selectedProperty && (
            <button
              className="btn-clear-selection"
              onClick={() => {
                setSelectedProperty(null);
                updateMarkers(null);
              }}
            >
              ✕ Clear Selection
            </button>
          )}
        </div>

        {properties.length === 0 ? (
          <div className="empty-state">
            <p>No properties found in the system</p>
          </div>
        ) : (
          <div className="properties-table-wrapper">
            <table className="properties-table">
              <thead>
                <tr>
                  <th>Property Name</th>
                  <th>Type</th>
                  <th>Address</th>
                  <th>Distance</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((prop, idx) => (
                  <tr
                    key={prop._id}
                    className={selectedProperty?._id === prop._id ? "selected-row" : ""}
                  >
                    <td className="prop-name">
                      {selectedProperty?._id === prop._id && "▸ "}
                      {prop.propertyName}
                    </td>
                    <td className="prop-type">{prop.propertyType}</td>
                    <td className="prop-address">{prop.address}</td>
                    <td className="prop-distance">
                      <strong>{formatDistance(prop.distanceKm)}</strong>
                    </td>
                    <td className="prop-action">
                      <button
                        className="btn-view"
                        onClick={() => handlePropertyClick(prop)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Selected Property Details */}
        {selectedProperty && (
          <div className="selected-property-card">
            <h4>{selectedProperty.propertyName}</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Type:</span>
                <span className="detail-value">{selectedProperty.propertyType}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Address:</span>
                <span className="detail-value">{selectedProperty.address}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Distance:</span>
                <span className="detail-value">
                  {formatDistance(selectedProperty.distanceKm)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Coordinates:</span>
                <span className="detail-value">
                  {selectedProperty.latitude.toFixed(6)}, {selectedProperty.longitude.toFixed(6)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AllPropertiesMap;
