import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Carpark, VehicleType, UserCoordinates } from '../types/carpark';
import { getAvailabilityLevel } from '../services/carparkService';
import { Layers, Crosshair, Navigation } from 'lucide-react';

interface CarparkMapProps {
  carparks: Carpark[];
  selectedCarpark: Carpark | null;
  onSelectCarpark: (carpark: Carpark) => void;
  selectedVehicleType: VehicleType;
  userLocation: UserCoordinates;
  onLocateUser: () => void;
  isDarkMode: boolean;
}

export const CarparkMap: React.FC<CarparkMapProps> = ({
  carparks,
  selectedCarpark,
  onSelectCarpark,
  selectedVehicleType,
  userLocation,
  onLocateUser,
  isDarkMode,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [1.3521, 103.8198], // Singapore center
      zoom: 12,
      minZoom: 10,
      maxZoom: 18,
      zoomControl: false,
    });

    // Clean tile layer
    const tileUrl = isDarkMode
      ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers when carparks, vehicle type, or selection change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    carparks.forEach((cp) => {
      const lotInfo = cp.lots[selectedVehicleType] || cp.lots.C;
      const level = getAvailabilityLevel(lotInfo.lotsAvailable, lotInfo.totalLots);
      const isSelected = selectedCarpark?.id === cp.id;

      let bgColor = '#10b981'; // emerald
      let borderColor = '#059669';
      if (level === 'medium') {
        bgColor = '#f59e0b'; // amber
        borderColor = '#d97706';
      } else if (level === 'low') {
        bgColor = '#f43f5e'; // rose
        borderColor = '#e11d48';
      } else if (level === 'full') {
        bgColor = '#64748b'; // slate
        borderColor = '#475569';
      }

      const iconHtml = `
        <div class="custom-carpark-pin ${isSelected ? 'ring-4 ring-emerald-400 ring-offset-2' : ''}" style="
          background-color: ${bgColor};
          border: 2px solid ${isSelected ? '#000000' : borderColor};
          color: white;
          border-radius: 9999px;
          padding: 3px 8px;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          font-size: 11px;
          line-height: 1.2;
          display: flex;
          align-items: center;
          gap: 4px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.22);
          cursor: pointer;
          white-space: nowrap;
        ">
          <span style="font-size: 9px; opacity: 0.9;">${cp.agency}</span>
          <span>${lotInfo.lotsAvailable}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: iconHtml,
        iconSize: [60, 24],
        iconAnchor: [30, 12],
      });

      const marker = L.marker([cp.latitude, cp.longitude], { icon: customIcon });

      const popupContent = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 12px; width: 230px;">
          <div style="font-size: 11px; color: #64748b; font-weight: 600; margin-bottom: 2px;">
            ${cp.carparkNumber} · ${cp.agency} · ${cp.planningArea}
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 6px; line-height: 1.3;">
            ${cp.name}
          </div>
          <div style="display: flex; align-items: baseline; gap: 6px; margin-bottom: 8px;">
            <span style="font-size: 20px; font-weight: 800; font-family: 'JetBrains Mono', monospace; color: ${bgColor};">
              ${lotInfo.lotsAvailable}
            </span>
            <span style="font-size: 12px; color: #64748b; font-family: 'JetBrains Mono', monospace;">
              / ${lotInfo.totalLots} lots free
            </span>
          </div>
          <div style="font-size: 11px; color: #475569; background: #f8fafc; padding: 6px 8px; border-radius: 6px; margin-bottom: 8px;">
            <strong>Rate:</strong> ${cp.rates.weekdayRateDay}
          </div>
          <button id="view-details-btn-${cp.id}" style="
            width: 100%;
            background: #059669;
            color: white;
            font-size: 12px;
            font-weight: 600;
            padding: 6px 10px;
            border-radius: 6px;
            border: none;
            cursor: pointer;
          ">
            View Lot Breakdown & Rates
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-details-btn-${cp.id}`);
        if (btn) {
          btn.onclick = () => onSelectCarpark(cp);
        }
      });

      marker.on('click', () => {
        onSelectCarpark(cp);
      });

      marker.addTo(markersGroup);
    });
  }, [carparks, selectedVehicleType, selectedCarpark]);

  // Update User Location Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-location-pin',
        html: `
          <div style="
            width: 16px; 
            height: 16px; 
            background-color: #2563eb; 
            border: 3px solid white; 
            border-radius: 50%; 
            box-shadow: 0 0 0 4px rgba(37,99,235,0.3), 0 2px 6px rgba(0,0,0,0.3);
          "></div>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const marker = L.marker([userLocation.latitude, userLocation.longitude], {
        icon: userIcon,
        zIndexOffset: 1000,
      }).addTo(map);

      marker.bindTooltip(`📍 ${userLocation.name}`, { permanent: false, direction: 'top' });
      userMarkerRef.current = marker;
    }
  }, [userLocation]);

  // Focus map when selectedCarpark changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedCarpark) return;

    map.flyTo([selectedCarpark.latitude, selectedCarpark.longitude], 15, {
      duration: 0.8,
    });
  }, [selectedCarpark]);

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([1.3521, 103.8198], 12);
    }
  };

  const handleCenterUser = () => {
    if (mapInstanceRef.current && userLocation) {
      mapInstanceRef.current.flyTo([userLocation.latitude, userLocation.longitude], 14, {
        duration: 0.7,
      });
    } else {
      onLocateUser();
    }
  };

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-900">
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[420px] z-10" />

      {/* Floating Map Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button
          onClick={handleCenterUser}
          title="Center on my location"
          className="p-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-emerald-600 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 transition-colors"
        >
          <Crosshair className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetView}
          title="Reset to all Singapore"
          className="p-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-emerald-600 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 transition-colors"
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-md text-xs space-y-1.5 hidden sm:block">
        <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
          <Navigation className="w-3.5 h-3.5 text-emerald-600" />
          <span>Lot Availability</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
          <span className="text-slate-600 dark:text-slate-300">Plenty of Lots (&gt;25% / &gt;50 lots)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
          <span className="text-slate-600 dark:text-slate-300">Filling Fast (10-49 lots)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
          <span className="text-slate-600 dark:text-slate-300">Limited Lots (1-9 lots)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0"></span>
          <span className="text-slate-600 dark:text-slate-300">Carpark Full (0 lots)</span>
        </div>
      </div>
    </div>
  );
};
