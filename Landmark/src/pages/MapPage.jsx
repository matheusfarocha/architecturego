import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { useLocation } from "react-router-dom";
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
  styles: [
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#000000" }, { visibility: "on" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#000000" }] },
    { featureType: "road", elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
    { featureType: "transit.line", elementType: "geometry", stylers: [{ visibility: "off" }] },
    { featureType: "transit.station", elementType: "geometry", stylers: [{ visibility: "off" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
    { featureType: "all", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  ],
};

function MapPage() {
  const bicyclingLayerRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const [map, setMap] = useState(null);
  const [userPosition, setUserPosition] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [status, setStatus] = useState("Enter origin and destination to plan a route.");
  const [travelMode, setTravelMode] = useState("WALKING");
  const [originValue, setOriginValue] = useState("");
  const [destinationValue, setDestinationValue] = useState("");

  const location = useLocation(); // For query params
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: ["places"],
  });

  const handleMapLoad = useCallback((mapInstance) => setMap(mapInstance), []);
  const handleMapUnmount = useCallback(() => setMap(null), []);

  // Pan to coordinates from query params if available
  useEffect(() => {
    if (!map) return;
    const params = new URLSearchParams(location.search);
    const lat = parseFloat(params.get("lat"));
    const lng = parseFloat(params.get("lng"));
    if (!isNaN(lat) && !isNaN(lng)) {
      const position = { lat, lng };
      map.panTo(position);
      map.setZoom(16);
      setDestinationValue(`${lat},${lng}`);
      setStatus(`Focused on ${lat.toFixed(3)}, ${lng.toFixed(3)}`);
    }
  }, [location.search, map]);

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

        // Fill Starting Point input
        setOriginValue(`${nextPosition.lat},${nextPosition.lng}`);

        setStatus("You are here. Coordinates set as starting point.");
      },
      () => setStatus("Unable to retrieve location.")
    );
  }, [map]);

  const handleClear = useCallback(() => {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
    }
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
    if (!window.google?.maps || !map) {
      setStatus("Map not ready. Try again shortly.");
      return;
    }
    setStatus("Calculating route…");

    if (travelMode === "BICYCLING") {
      if (!bicyclingLayerRef.current && window.google.maps.BicyclingLayer) {
        bicyclingLayerRef.current = new window.google.maps.BicyclingLayer();
      }
      bicyclingLayerRef.current?.setMap(null);
    }

    const service = new window.google.maps.DirectionsService();
    service.route(
      {
        origin: originValue,
        destination: destinationValue,
        travelMode: window.google.maps.TravelMode[travelMode],
      },
      (result, status) => {
        if (status === "OK" && result) {
          if (!directionsRendererRef.current) {
            directionsRendererRef.current = new window.google.maps.DirectionsRenderer();
          }
          directionsRendererRef.current.setMap(map);
          directionsRendererRef.current.setDirections(result);
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
  }, [originValue, destinationValue, travelMode, map]);

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
