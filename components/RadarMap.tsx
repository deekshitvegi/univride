
import React, { useEffect, useRef, useState } from 'react';
import { Ride, RideType, Location } from '../types';

// Declare Leaflet global
declare const L: any;

interface RadarMapProps {
  rides: Ride[];
  userLocation: Location;
  onRideClick: (ride: Ride) => void;
  selectedRideId?: string | null;
  className?: string; 
}

export const RadarMap: React.FC<RadarMapProps> = ({ rides, userLocation, onRideClick, selectedRideId, className }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Safety check: Ensure Leaflet is loaded
    if (typeof L === 'undefined') {
        console.error("Leaflet (L) is not defined. Map cannot render.");
        setError("Map visualization unavailable (Library not loaded).");
        return;
    }

    if (!mapContainerRef.current) return;

    try {
        // Initialize Map
        if (!mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false 
        }).setView([userLocation.lat, userLocation.lng], 11);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(mapInstanceRef.current);
        
        // Current User "You are here" Marker
        const userIcon = L.divIcon({
            className: 'custom-user-icon',
            html: `<div class="relative cursor-pointer">
                    <div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg relative z-10"></div>
                    <div class="absolute -top-3 -left-3 w-10 h-10 bg-blue-500/20 rounded-full animate-pulse"></div>
                </div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });

        L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(mapInstanceRef.current);
        }

        // Clear old layers
        layersRef.current.forEach(l => l.remove());
        layersRef.current = [];

        // Helper to generate Bezier Curve points
        const getBezierPoints = (from: Location, to: Location) => {
            const lat1 = from.lat; const lng1 = from.lng;
            const lat2 = to.lat; const lng2 = to.lng;
            const midLat = (lat1 + lat2) / 2;
            const midLng = (lng1 + lng2) / 2;
            const curveStrength = 0.15; 
            const ctrlLat = midLat + (lng2 - lng1) * curveStrength;
            const ctrlLng = midLng - (lat2 - lat1) * curveStrength;

            const points = [];
            for (let t = 0; t <= 1; t += 0.05) {
                const l1lat = lat1 + (ctrlLat - lat1) * t;
                const l1lng = lng1 + (ctrlLng - lng1) * t;
                const l2lat = ctrlLat + (lat2 - ctrlLat) * t;
                const l2lng = ctrlLng + (lng2 - ctrlLng) * t;
                const lat = l1lat + (l2lat - l1lat) * t;
                const lng = l1lng + (l2lng - l1lng) * t;
                points.push([lat, lng]);
            }
            return points;
        };

        // Render Rides
        rides.forEach(ride => {
            const isSelected = ride.id === selectedRideId;
            const isOffer = ride.type === RideType.OFFER; // Driver
            
            // Visual Styling
            const baseColor = isOffer ? '#10b981' : '#8b5cf6'; // Green vs Purple
            const color = isSelected ? '#ef4444' : baseColor; 
            const zIndex = isSelected ? 1000 : 10;
            const opacity = isSelected ? 1 : (selectedRideId ? 0.1 : 0.8); 
            const weight = isSelected ? 5 : 4;
            
            // Dashed lines for Requests (Need a ride), Solid for Offers (Have a car)
            const dashArray = isOffer ? undefined : '10, 10'; 

            // Icons
            // Driver = Car SVG. Rider = Person SVG.
            const iconSvg = isOffer 
                ? `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>` // Nav Arrow/Car
                : `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>`; // Person

            const startMarkerHtml = `
                <div class="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-md transition-transform hover:scale-110 cursor-pointer" style="background-color: ${color}; transform: scale(${isSelected ? 1.2 : 1})">
                    ${iconSvg}
                </div>
            `;

            const startIcon = L.divIcon({
                html: startMarkerHtml,
                iconSize: [32, 32],
                iconAnchor: [16, 16],
                className: 'custom-marker'
            });

            const startMarker = L.marker([ride.from.lat, ride.from.lng], { icon: startIcon, zIndexOffset: zIndex }).addTo(mapInstanceRef.current);
            
            // Small dot for destination
            const endIcon = L.divIcon({
                html: `<div class="w-3 h-3 border-2 rounded-full shadow-sm cursor-pointer" style="background-color: ${color}; border-color: white;"></div>`,
                iconSize: [12, 12],
                iconAnchor: [6, 6]
            });
            
            const endMarker = L.marker([ride.to.lat, ride.to.lng], { icon: endIcon, zIndexOffset: zIndex }).addTo(mapInstanceRef.current);
            
            layersRef.current.push(startMarker, endMarker);

            const clickHandler = () => {
                onRideClick(ride);
                // Fly to Bounds
                const bounds = L.latLngBounds([ride.from.lat, ride.from.lng], [ride.to.lat, ride.to.lng]);
                mapInstanceRef.current.flyToBounds(bounds, { paddingBottomRight: [0, 300], paddingTopLeft: [0, 50] });
            };

            startMarker.on('click', clickHandler);
            endMarker.on('click', clickHandler);

            // Draw Route
            let routeLine;
            const routeOptions = {
                color: color,
                weight: weight,
                opacity: opacity,
                lineJoin: 'round',
                dashArray: dashArray, // Solid for Driver, Dashed for Rider
                className: 'cursor-pointer' // Add pointer cursor to line
            };

            if (ride.routeGeometry) {
                routeLine = L.polyline(ride.routeGeometry, routeOptions).addTo(mapInstanceRef.current);
            } else {
                const curvePoints = getBezierPoints(ride.from, ride.to);
                routeLine = L.polyline(curvePoints, routeOptions).addTo(mapInstanceRef.current);
            }

            if (isSelected) {
                routeLine.bindTooltip(isOffer ? `Driver to ${ride.to.name}` : `Needs ride to ${ride.to.name}`, { 
                    permanent: true, 
                    direction: 'center', 
                    className: 'font-bold text-xs text-slate-700 bg-white border border-slate-200 rounded px-2 py-1 shadow-md' 
                }).openTooltip();
            }

            routeLine.on('click', clickHandler);
            // Hover effect
            routeLine.on('mouseover', function(e: any) {
                e.target.setStyle({ weight: weight + 2 });
            });
            routeLine.on('mouseout', function(e: any) {
                e.target.setStyle({ weight: weight });
            });

            layersRef.current.push(routeLine);
        });
    } catch (e) {
        console.error("Map rendering error:", e);
        setError("Error rendering map elements.");
    }

  }, [rides, userLocation, onRideClick, selectedRideId]);

  if (error) {
      return (
        <div className={`relative bg-slate-100 flex items-center justify-center text-slate-400 ${className}`}>
             <div className="text-center p-4">
                 <p className="text-xl mb-2">🗺️</p>
                 <p className="text-sm font-medium">{error}</p>
                 <p className="text-xs mt-1">Please check your internet connection and refresh.</p>
             </div>
        </div>
      );
  }

  return (
    <div className={`relative bg-slate-200 z-0 transition-all ${className}`}>
       <div ref={mapContainerRef} className="w-full h-full z-0" />
       
       {/* Improved Legend */}
       <div className="absolute top-24 right-4 z-[400] bg-white/90 backdrop-blur p-3 rounded-2xl border border-slate-100 shadow-lg pointer-events-none flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-6 h-6 bg-emerald-500 rounded-full text-white shadow-sm">
                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-700 uppercase">Driver (Offer)</p>
                <p className="text-[10px] text-slate-400 leading-none">Solid Line</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-6 h-6 bg-violet-500 rounded-full text-white shadow-sm">
                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
             <div>
                <p className="text-[10px] font-bold text-slate-700 uppercase">Rider (Request)</p>
                <p className="text-[10px] text-slate-400 leading-none">Dashed Line</p>
            </div>
          </div>
      </div>
    </div>
  );
};
