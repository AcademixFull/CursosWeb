import Map, { Marker } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { env } from "../../config/env";

export default function ContactMap() {
  return (
    <div className="h-full min-h-72" role="region" aria-label="Mapa de ubicación de Academix en Apizaco">
      <Map
        mapboxAccessToken={env.mapboxToken}
        initialViewState={{ longitude: -98.1333, latitude: 19.4167, zoom: 13 }}
        style={{ width: "100%", height: "100%", minHeight: "288px" }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        cooperativeGestures
        reuseMaps
      >
        <Marker longitude={-98.1333} latitude={19.4167} color="#7c3aed" />
      </Map>
    </div>
  );
}
