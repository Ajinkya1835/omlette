// frontend/src/components/MapSearchPanel.jsx
import { useState, useEffect, useRef } from 'react';
import { loadGoogleMaps } from '../utils/googleMapsLoader';
import apiRequest from '../api/api';
import './MapSearchPanel.css';

function MapSearchPanel({ userRole }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  const [center, setCenter] = useState({ lat: 19.0760, lng: 72.8777 }); // Mumbai
  const [radius, setRadius] = useState(5000); // 5km default
  const [status, setStatus] = useState('');
  const [violationType, setViolationType] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchType, setSearchType] = useState('violations'); // 'violations' or 'properties'

  useEffect(() => {
    loadGoogleMaps((error) => {
      if (error) {
        console.error('Google Maps loading error:', error);
        return;
      }
      initializeMap();
    });
  }, []);

  const initializeMap = () => {
    if (!window.google || !mapRef.current) return;

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: center,
      zoom: 12,
      mapTypeControl: true,
      streetViewControl: false,
    });

    // Add click listener to update search center
    mapInstanceRef.current.addListener('click', (event) => {
      const newLat = event.latLng.lat();
      const newLng = event.latLng.lng();
      setCenter({ lat: newLat, lng: newLng });
    });
  };

  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
  };

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    clearMarkers();

    try {
      const params = new URLSearchParams({
        lat: center.lat.toString(),
        lng: center.lng.toString(),
        radius: radius.toString(),
      });

      if (status) params.append('status', status);
      if (violationType) params.append('violationType', violationType);

      const endpoint = searchType === 'violations' 
        ? `/api/map/violations/search?${params}`
        : `/api/map/properties/search?${params}`;

      const data = await apiRequest(endpoint);

      const items = searchType === 'violations' ? data.violations : data.properties;
      setResults(items);

      // Add markers to map
      if (mapInstanceRef.current) {
        items.forEach((item) => {
          const position = searchType === 'violations'
            ? { lat: item.location?.latitude, lng: item.location?.longitude }
            : { lat: item.latitude, lng: item.longitude };

          if (position.lat && position.lng) {
            const marker = new window.google.maps.Marker({
              position,
              map: mapInstanceRef.current,
              title: searchType === 'violations' 
                ? `Violation ${item._id.slice(-6)}`
                : item.propertyName,
              icon: searchType === 'violations'
                ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                : 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            });

            marker.addListener('click', () => {
              setSelectedItem(item);
            });

            markersRef.current.push(marker);
          }
        });

        // Center search marker
        const centerMarker = new window.google.maps.Marker({
          position: center,
          map: mapInstanceRef.current,
          icon: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
          title: 'Search Center',
        });
        markersRef.current.push(centerMarker);

        // Draw radius circle
        const circle = new window.google.maps.Circle({
          strokeColor: '#0056b3',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#0056b3',
          fillOpacity: 0.15,
          map: mapInstanceRef.current,
          center: center,
          radius: radius,
        });
        markersRef.current.push(circle);
      }
    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCenter = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCenter(newCenter);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(newCenter);
        }
      },
      () => alert('Unable to detect location')
    );
  };

  return (
    <div className="map-search-container">
      <div className="map-search-sidebar">
        <h2>🗺️ Map Search</h2>

        {/* Search Type Toggle */}
        {userRole === 'OFFICER' && (
          <div className="form-group">
            <label>Search For:</label>
            <div className="toggle-buttons">
              <button
                className={searchType === 'violations' ? 'active' : ''}
                onClick={() => setSearchType('violations')}
              >
                Violations
              </button>
              <button
                className={searchType === 'properties' ? 'active' : ''}
                onClick={() => setSearchType('properties')}
              >
                Properties
              </button>
            </div>
          </div>
        )}

        {/* Location */}
        <div className="form-group">
          <label>Search Center:</label>
          <div className="coords-display">
            📍 {center.lat.toFixed(6)}, {center.lng.toFixed(6)}
          </div>
          <button className="btn-detect" onClick={handleDetectLocation}>
            Detect My Location
          </button>
          <small>Click map to change center</small>
        </div>

        {/* Radius */}
        <div className="form-group">
          <label>Search Radius:</label>
          <select value={radius} onChange={(e) => setRadius(parseInt(e.target.value))}>
            <option value="1000">1 km</option>
            <option value="2000">2 km</option>
            <option value="5000">5 km</option>
            <option value="10000">10 km</option>
            <option value="20000">20 km</option>
          </select>
        </div>

        {/* Filters for Violations */}
        {searchType === 'violations' && (
          <>
            <div className="form-group">
              <label>Status Filter:</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="REPORTED">Reported</option>
                <option value="AUTO_DECIDED">Auto Decided</option>
                <option value="AWAITING_OWNER">Awaiting Owner</option>
                <option value="OBJECTED">Objected</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="PAID">Paid</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <div className="form-group">
              <label>Violation Type:</label>
              <input
                type="text"
                placeholder="e.g., PL-001"
                value={violationType}
                onChange={(e) => setViolationType(e.target.value)}
              />
            </div>
          </>
        )}

        {/* Search Button */}
        <button className="btn-search" onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : '🔍 Search'}
        </button>

        {/* Error */}
        {error && <div className="alert-error">{error}</div>}

        {/* Results Summary */}
        <div className="results-summary">
          <strong>Results:</strong> {results.length} found
        </div>

        {/* Results List */}
        <div className="results-list">
          {results.map((item) => (
            <div
              key={item._id}
              className="result-item"
              onClick={() => setSelectedItem(item)}
            >
              {searchType === 'violations' ? (
                <>
                  <div className="result-title">Violation #{item._id.slice(-6)}</div>
                  <div className="result-meta">{item.violationType}</div>
                  <div className="result-status">{item.status}</div>
                </>
              ) : (
                <>
                  <div className="result-title">{item.propertyName}</div>
                  <div className="result-meta">{item.propertyType}</div>
                  <div className="result-status">{item.status}</div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Map Canvas */}
      <div className="map-search-canvas">
        <div ref={mapRef} className="map-canvas"></div>
      </div>

      {/* Details Modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedItem(null)}>
              ✕
            </button>
            <h3>{searchType === 'violations' ? 'Violation Details' : 'Property Details'}</h3>
            {searchType === 'violations' ? (
              <div className="modal-body">
                <p><strong>ID:</strong> {selectedItem._id}</p>
                <p><strong>Type:</strong> {selectedItem.violationType}</p>
                <p><strong>Status:</strong> {selectedItem.status}</p>
                <p><strong>Reported By:</strong> {selectedItem.reportedBy?.name}</p>
                <p><strong>Description:</strong> {selectedItem.description || 'N/A'}</p>
                <p><strong>Location:</strong> {selectedItem.location?.latitude}, {selectedItem.location?.longitude}</p>
              </div>
            ) : (
              <div className="modal-body">
                <p><strong>Property:</strong> {selectedItem.propertyName}</p>
                <p><strong>Type:</strong> {selectedItem.propertyType}</p>
                <p><strong>Address:</strong> {selectedItem.address}</p>
                <p><strong>Ward:</strong> {selectedItem.wardNumber}</p>
                <p><strong>Zone:</strong> {selectedItem.zone}</p>
                <p><strong>Permit:</strong> {selectedItem.permitNumber}</p>
                <p><strong>Status:</strong> {selectedItem.status}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MapSearchPanel;
