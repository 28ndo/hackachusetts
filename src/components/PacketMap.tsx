"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Circle } from "react-leaflet";

export default function PacketMap({ lat, lon }: { lat: number; lon: number }) {
  return (
    <MapContainer center={[lat, lon]} zoom={17} scrollWheelZoom={false} style={{ height: 220, width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" />
      <Circle center={[lat, lon]} radius={25} pathOptions={{ color: "#1f5fbf", weight: 1, fillOpacity: 0.08 }} />
      <CircleMarker center={[lat, lon]} radius={8} pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#b3261e", fillOpacity: 1 }} />
    </MapContainer>
  );
}
