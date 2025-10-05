import { useCallback, useMemo, useState } from "react";
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader } from "@react-google-maps/api";
import {
  FiCompass,
  FiInfo,
  FiMapPin,
  FiNavigation,
  FiRefreshCw,
  FiTarget,
} from "react-icons/fi";
import "./MapPage.css";

const defaultCenter = { lat: 40.748514, lng: -73.985664 };
const travelModes = ["WALKING", "DRIVING", "TRANSIT", "BICYCLING"];

const mapOptions = {
  disableDefaultUI: false,
  fullscreenControl: false,
  streetViewControl: false,
  mapTypeControl: false,
  zoomControl: true,
};

function MapPage() {
  const [map, setMap] = useState(null);
  const [userPosition, setUserPosition] = useState(null);
  const [directions, setDirections] = useState(null);
  const [directionsKey, setDirectionsKey] = useState(0);
  const [routeInfo, setRouteInfo] = useState(null);
  const [status, setStatus] = useState("Enter origin and destination to plan a route.");
  const [travelMode, setTravelMode] = useState("WALKING");
  const [originValue, setOriginValue] = useState("");
  const [destinationValue, setDestinationValue] = useState("");

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

  // ✅ Use official loader to avoid duplicate scripts
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: ["places"],
  });

  const handleMapLoad = useCallback((mapInstance) => setMap(mapInstance), []);
  const handleMapUnmount = useCallback(() => setMap(null), []);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("Geolocation not supported.");
      return;
    }

    setStatus("Locating you…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPosition(nextPosition);
        map?.panTo(nextPosition);
        map?.setZoom(14);
        setStatus("You are here. Enter a destination.");
      },
      () => setStatus("Unable to retrieve location.")
    );
  }, [map]);

  const handleClear = useCallback(() => {
    setDirections(null);
    setDirectionsKey((k) => k + 1);
    setRouteInfo(null);
    setOriginValue("");
    setDestinationValue("");
    setStatus("Enter origin and destination to plan a route.");
  }, []);

  const handleRoute = useCallback(() => {
    if (!originValue || !destinationValue) {
      setStatus("Enter both origin and destination.");
      return;
    }

    if (!window.google?.maps) {
      setStatus("Map still loading. Try again shortly.");
      return;
    }

    setStatus("Calculating route…");

    const service = new window.google.maps.DirectionsService();
    service.route(
      {
        origin: originValue,
        destination: destinationValue,
        travelMode: window.google.maps.TravelMode[travelMode],
      },
      (result, status) => {
        if (status === "OK" && result) {
          setDirections(result);
          setDirectionsKey((k) => k + 1);
          const leg = result.routes[0]?.legs[0];
          if (leg) {
            setRouteInfo({
              distance: leg.distance.text,
              duration: leg.duration.text,
            });
            setStatus(`Route ready · ${leg.distance.text} · ${leg.duration.text}`);
          }
        } else {
          console.error("Route error:", status);
          setStatus("Unable to find a route.");
        }
      }
    );
  }, [originValue, destinationValue, travelMode]);

  const mapCenter = useMemo(() => userPosition || defaultCenter, [userPosition]);

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
          <span className={isLoaded ? "indicator is-online" : "indicator"} />
          {isLoaded ? "Map live" : "Loading map…"}
        </div>
      </div>

      <div className="map-tools surface-card">
        <div className="search-fields">
          <div className="search-field">
            <FiNavigation />
            <input
              type="text"
              placeholder="Starting point"
              value={originValue}
              onChange={(e) => setOriginValue(e.target.value)}
            />
          </div>
          <div className="search-field">
            <FiTarget />
            <input
              type="text"
              placeholder="Destination"
              value={destinationValue}
              onChange={(e) => setDestinationValue(e.target.value)}
            />
          </div>
        </div>

        <div className="map-actions">
          <div className="mode-toggle">
            {travelModes.map((mode) => (
              <button
                key={mode}
                type="button"
                className={`ghost-btn pill ${travelMode === mode ? "is-active" : ""}`}
                onClick={() => setTravelMode(mode)}
              >
                {mode.charAt(0)}
                {mode.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="action-buttons">
            <button type="button" className="ghost-btn compact" onClick={handleLocate}>
              <FiCompass />
              Locate me
            </button>
            <button type="button" className="ghost-btn compact" onClick={handleClear}>
              <FiRefreshCw />
              Clear
            </button>
            <button
              type="button"
              className="primary-btn compact"
              onClick={handleRoute}
              disabled={!originValue || !destinationValue}
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
        {isLoaded && !loadError ? (
          <GoogleMap
            onLoad={handleMapLoad}
            onUnmount={handleMapUnmount}
            mapContainerClassName="google-map"
            options={mapOptions}
            center={mapCenter}
            zoom={12}
          >
            {userPosition && <Marker position={userPosition} />}
            {directions && <DirectionsRenderer directions={directions} />}
          </GoogleMap>
        ) : (
          <div className="map-overlay">
            <FiInfo size={24} />
            <p>
              {loadError
                ? "Google Maps failed to load. Check API key and billing status."
                : "Loading map…"}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default MapPage;
