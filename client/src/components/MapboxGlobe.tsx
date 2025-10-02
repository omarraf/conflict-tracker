import { useRef, useEffect, useState } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Conflict } from '../types/conflict';
import { getSeverityColor } from '../lib/coordinates';

interface MapboxGlobeProps {
  conflicts: Conflict[];
  selectedConflict: Conflict | null;
  onSelectConflict: (conflict: Conflict | null) => void;
  isMobile?: boolean;
}

export function MapboxGlobe({ 
  conflicts, 
  selectedConflict, 
  onSelectConflict,
  isMobile = false 
}: MapboxGlobeProps) {
  const mapRef = useRef<MapRef>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');

  useEffect(() => {
    fetch('/api/mapbox-token')
      .then(res => res.json())
      .then(data => setMapboxToken(data.token))
      .catch(err => console.error('Failed to fetch Mapbox token:', err));
  }, []);

  // Center on selected conflict
  useEffect(() => {
    if (selectedConflict && mapRef.current) {
      mapRef.current.flyTo({
        center: [selectedConflict.longitude, selectedConflict.latitude],
        zoom: 6,
        duration: 1500,
        essential: true
      });
    }
  }, [selectedConflict]);

  // Auto-adjust view to show all conflicts when list changes
  useEffect(() => {
    if (conflicts.length > 0 && mapRef.current && !selectedConflict) {
      const bounds = conflicts.reduce(
        (acc, conflict) => {
          return acc.extend([conflict.longitude, conflict.latitude]);
        },
        new mapboxgl.LngLatBounds(
          [conflicts[0].longitude, conflicts[0].latitude],
          [conflicts[0].longitude, conflicts[0].latitude]
        )
      );

      mapRef.current.fitBounds(bounds, {
        padding: isMobile ? 50 : 100,
        maxZoom: 5,
        duration: 1000
      });
    }
  }, [conflicts, selectedConflict, isMobile]);

  if (!mapboxToken) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-950">
        <div className="text-white text-center">
          <div className="animate-pulse mb-2">Loading map...</div>
        </div>
      </div>
    );
  }

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={mapboxToken}
      initialViewState={{
        longitude: 0,
        latitude: 20,
        zoom: 2
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
      projection={{ name: 'globe' }}
      fog={{
        color: 'rgb(186, 210, 235)',
        'high-color': 'rgb(36, 92, 223)',
        'horizon-blend': 0.02,
        'space-color': 'rgb(11, 11, 25)',
        'star-intensity': 0.6
      }}
      renderWorldCopies={false}
      dragRotate={true}
      touchZoomRotate={true}
      touchPitch={!isMobile}
    >
      {/* Render conflict markers */}
      {conflicts.map((conflict) => (
        <Marker
          key={conflict.id}
          longitude={conflict.longitude}
          latitude={conflict.latitude}
          anchor="bottom"
          onClick={(e: any) => {
            e.originalEvent.stopPropagation();
            onSelectConflict(conflict);
          }}
          style={{ cursor: 'pointer' }}
        >
          <div
            className="relative group"
            style={{
              transform: selectedConflict?.id === conflict.id ? 'scale(1.3)' : 'scale(1)',
              transition: 'transform 0.3s ease'
            }}
          >
            {/* Pin marker */}
            <div
              className="w-8 h-8 rounded-full border-2 border-white shadow-lg transition-all group-hover:scale-110"
              style={{
                backgroundColor: getSeverityColor(conflict.severity),
                boxShadow: `0 0 20px ${getSeverityColor(conflict.severity)}80`
              }}
            />
            {/* Pin stem */}
            <div
              className="absolute left-1/2 top-full w-0.5 h-3 -translate-x-1/2"
              style={{
                backgroundColor: getSeverityColor(conflict.severity)
              }}
            />
          </div>
        </Marker>
      ))}

      {/* Selected conflict popup */}
      {selectedConflict && (
        <Popup
          longitude={selectedConflict.longitude}
          latitude={selectedConflict.latitude}
          anchor="top"
          onClose={() => onSelectConflict(null)}
          closeButton={false}
          className="mapbox-popup"
        >
          <div className="bg-gray-900/95 backdrop-blur-lg rounded-lg p-3 border border-white/10">
            <h3 className="font-semibold text-white text-sm">{selectedConflict.name}</h3>
            <p className="text-xs text-gray-300 mt-1">{selectedConflict.region}</p>
          </div>
        </Popup>
      )}
    </Map>
  );
}
