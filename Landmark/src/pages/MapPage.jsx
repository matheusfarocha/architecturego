import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Autocomplete,
  DirectionsRenderer,
  GoogleMap,
  Marker,
  useJsApiLoader,
} from '@react-google-maps/api';
import { FiCompass, FiInfo, FiMapPin, FiNavigation, FiRefreshCw, FiTarget } from 'react-icons/fi';
import './MapPage.css';

const libraries = ['places'];
const defaultCenter = { lat: 40.748514, lng: -73.985664 };

const mapOptions = {
  disableDefaultUI: false,
  fullscreenControl: false,
  streetViewControl: false,
  mapTypeControl: false,
  zoomControl: true,
  styles: [
    {
      elementType: 'geometry',
      stylers: [{ color: '#ebe3cd' }],
    },
    {
      elementType: 'labels.text.fill',
      stylers: [{ color: '#523735' }],
    },
    {
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#f5f1e6' }],
    },
    {
      featureType: 'administrative',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#c9b2a6' }],
    },
    {
      featureType: 'landscape.natural',
      elementType: 'geometry',
      stylers: [{ color: '#dfd2ae' }],
    },
    {
      featureType: 'poi',
      elementType: 'geometry',
      stylers: [{ color: '#dfd2ae' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry.fill',
      stylers: [{ color: '#c9e5bc' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#f5f1e6' }],
    },
    {
      featureType: 'road.arterial',
      elementType: 'geometry',
      stylers: [{ color: '#fdfcf8' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#f8c967' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#e9bc62' }],
    },
    {
      featureType: 'transit.line',
      elementType: 'geometry',
      stylers: [{ color: '#dfd2ae' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry.fill',
      stylers: [{ color: '#b9d3c2' }],
    },
  ],
};

const travelModes = ['WALKING', 'DRIVING', 'TRANSIT', 'BICYCLING'];

function MapPage() {
  const [map, setMap] = useState(null);
  const [directions, setDirections] = useState(null);
  const [status, setStatus] = useState('Search for a destination to plot your route.');
  const [isReady, setIsReady] = useState(false);
  const [userPosition, setUserPosition] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [travelMode, setTravelMode] = useState('WALKING');
  const [originValue, setOriginValue] = useState('');
  const [destinationValue, setDestinationValue] = useState('');

  const originAutocomplete = useRef(null);
  const destinationAutocomplete = useRef(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
    libraries,
  });

  const controlsReady = Boolean(apiKey) && isLoaded && !loadError;

  const handleMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
    setIsReady(true);
  }, []);

  const handleMapUnmount = useCallback(() => {
    setMap(null);
    setIsReady(false);
  }, []);

  const handleAutocompleteLoad = useCallback((ref, type) => {
    if (type === 'origin') {
      originAutocomplete.current = ref;
    } else {
      destinationAutocomplete.current = ref;
    }
  }, []);

  const handlePlaceChanged = useCallback(
    (type) => {
      if (!controlsReady) {
        return;
      }
      const autocomplete = type === 'origin' ? originAutocomplete.current : destinationAutocomplete.current;
      const place = autocomplete?.getPlace();
      if (!place) {
        return;
      }

      const value = place.formatted_address || place.name || '';
      if (type === 'origin') {
        setOriginValue(value);
      } else {
        setDestinationValue(value);
      }

      if (place.geometry?.location && map) {
        map.panTo({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
        map.setZoom(13);
      }
    },
    [controlsReady, map]
  );

  const buildWaypoint = useCallback((type) => {
    const autocomplete = type === 'origin' ? originAutocomplete.current : destinationAutocomplete.current;
    const place = autocomplete?.getPlace();
    if (place?.place_id) {
      return { placeId: place.place_id };
    }
    return type === 'origin' ? originValue : destinationValue;
  }, [destinationValue, originValue]);

  const handleRoute = useCallback(() => {
    if (!controlsReady || !window.google || !originValue || !destinationValue) {
      setStatus('Enter both origin and destination to calculate a route.');
      return;
    }

    setStatus('Calculating route…');
    const service = new window.google.maps.DirectionsService();

    service.route({
      origin: buildWaypoint('origin'),
      destination: buildWaypoint('destination'),
      travelMode: window.google.maps.TravelMode[travelMode],
      provideRouteAlternatives: true,
    })
      .then((result) => {
        setDirections(result);
        const leg = result.routes[0]?.legs[0];
        if (leg) {
          setRouteInfo({ distance: leg.distance.text, duration: leg.duration.text });
          setStatus(`Route ready · ${leg.distance.text} · ${leg.duration.text}`);
        } else {
          setRouteInfo(null);
          setStatus('Route ready');
        }
      })
      .catch((error) => {
        console.error('Directions request failed', error);
        setDirections(null);
        setRouteInfo(null);
        setStatus('Unable to find a route. Try refining your search.');
      });
  }, [buildWaypoint, controlsReady, destinationValue, originValue, travelMode]);

  const handleClear = useCallback(() => {
    setDirections(null);
    setRouteInfo(null);
    setStatus('Search for a destination to plot your route.');
  }, []);

  const handleLocate = useCallback(() => {
    if (!controlsReady) {
      setStatus('Map is still loading. Hold tight.');
      return;
    }
    if (!navigator.geolocation) {
      setStatus('Geolocation is not supported by your browser.');
      return;
    }

    setStatus('Locating you…');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserPosition(nextPosition);
        setStatus('You are here. Choose a destination to begin.');
        if (map) {
          map.panTo(nextPosition);
          map.setZoom(14);
        }
      },
      () => {
        setStatus('Unable to retrieve your location. Check permissions and try again.');
      }
    );
  }, [controlsReady, map]);

  const mapCenter = useMemo(() => userPosition || defaultCenter, [userPosition]);

  const renderSearchField = useCallback(
    (type, icon, placeholder, value, setValue) => {
      const inputField = (
        <div className={`search-field${controlsReady ? '' : ' is-disabled'}`}>
          {icon}
          <input
            type="text"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={placeholder}
            disabled={!controlsReady}
          />
        </div>
      );

      if (!controlsReady) {
        return inputField;
      }

      return (
        <Autocomplete
          key={type}
          onLoad={(ref) => handleAutocompleteLoad(ref, type)}
          onPlaceChanged={() => handlePlaceChanged(type)}
        >
          {inputField}
        </Autocomplete>
      );
    },
    [controlsReady, handleAutocompleteLoad, handlePlaceChanged]
  );

  return (
    <section className="map-page">
      <div className="map-header">
        <div className="map-title">
          <FiMapPin size={28} />
          <div>
            <h2>Explore Routes</h2>
            <p>{status}</p>
          </div>
        </div>
        <div className="map-meta">
          <span className={isReady && isLoaded ? 'indicator is-online' : 'indicator'} />
          {isReady && isLoaded ? 'Map live' : 'Waiting for map'}
        </div>
      </div>

      <div className="map-tools surface-card">
        <div className="search-fields">
          {renderSearchField('origin', <FiNavigation />, 'Starting point', originValue, setOriginValue)}
          {renderSearchField('destination', <FiTarget />, 'Destination', destinationValue, setDestinationValue)}
        </div>
        <div className="map-actions">
          <div className="mode-toggle">
            {travelModes.map((mode) => (
              <button
                key={mode}
                type="button"
                className={`ghost-btn pill ${travelMode === mode ? 'is-active' : ''}`}
                onClick={() => setTravelMode(mode)}
                disabled={!controlsReady}
              >
                {mode.charAt(0)}{mode.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <div className="action-buttons">
            <button
              type="button"
              className="ghost-btn compact"
              onClick={handleLocate}
              disabled={!controlsReady}
            >
              <FiCompass />
              Locate me
            </button>
            <button
              type="button"
              className="ghost-btn compact"
              onClick={handleClear}
              disabled={!controlsReady}
            >
              <FiRefreshCw />
              Clear
            </button>
            <button
              type="button"
              className="primary-btn compact"
              onClick={handleRoute}
              disabled={!controlsReady || !originValue || !destinationValue}
            >
              Plan route
            </button>
          </div>
        </div>
        {routeInfo && (
          <div className="route-info">
            <span>{routeInfo.distance}</span>
            <span>·</span>
            <span>{routeInfo.duration}</span>
            <span>·</span>
            <span>{travelMode.toLowerCase()}</span>
          </div>
        )}
      </div>

      <div className="map-container surface-card">
        {apiKey && !loadError && isLoaded && (
          <GoogleMap
            onLoad={handleMapLoad}
            onUnmount={handleMapUnmount}
            mapContainerClassName="google-map"
            options={mapOptions}
            center={mapCenter}
            zoom={12}
          >
            {userPosition && <Marker position={userPosition} />}
            {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: false }} />}
          </GoogleMap>
        )}

        {!apiKey && (
          <div className="map-overlay">
            <FiInfo size={24} />
            <p>
              Add <code>VITE_GOOGLE_MAPS_KEY</code> to your <code>.env</code> file and restart the dev server to
              enable the live map and routing search.
            </p>
          </div>
        )}

        {apiKey && loadError && (
          <div className="map-overlay">
            <FiInfo size={24} />
            <p>Google Maps failed to load. Check your API key permissions and billing status.</p>
          </div>
        )}

        {apiKey && !loadError && !isLoaded && (
          <div className="map-overlay">
            <FiInfo size={24} />
            <p>Loading Google Maps…</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default MapPage;
