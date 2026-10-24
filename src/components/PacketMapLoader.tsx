"use client";

import { Component, type ReactNode } from "react";
import dynamic from "next/dynamic";

const PacketMap = dynamic(() => import("./PacketMap"), {
  ssr: false,
  loading: () => <div className="h-[220px] w-full animate-pulse bg-surface-2" />,
});

class MapBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) return <p className="p-4 text-xs text-muted">Map unavailable.</p>;
    return this.props.children;
  }
}

export function PacketMapLoader({ lat, lon, label }: { lat: number; lon: number; label: string }) {
  return (
    <figure className="overflow-hidden rounded-lg border border-line" aria-label={label}>
      <MapBoundary>
        <PacketMap lat={lat} lon={lon} />
      </MapBoundary>
    </figure>
  );
}
