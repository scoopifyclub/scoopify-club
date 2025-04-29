'use client';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

/**
 * @typedef {[number, number]} LatLngExpression - Latitude and longitude coordinates
 */

/**
 * @typedef {Object} Marker
 * @property {LatLngExpression} position - The position of the marker
 * @property {string} title - The title of the marker
 * @property {string} [description] - Optional description for the marker
 */

/**
 * @typedef {Object} MapProps
 * @property {LatLngExpression} center - The center coordinates of the map
 * @property {number} [zoom=13] - The zoom level of the map
 * @property {Marker[]} [markers=[]] - Array of markers to display on the map
 */

/**
 * MapContent component for handling map view updates
 * @param {MapProps} props - Component props
 * @returns {null} This component doesn't render anything
 */
function MapContent({ center, markers }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center);
    }, [center, map]);
    return null;
}

/**
 * Map component for displaying an interactive map with markers
 * @param {MapProps} props - Component props
 * @returns {JSX.Element} The rendered component
 */
export default function Map({ center, zoom = 13, markers = [] }) {
    return (<div className="h-[400px] w-full">
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
        <MapContent center={center} markers={markers}/>
        {markers.map((marker, index) => (<Marker key={index} position={marker.position}>
            <Popup>
              <div>
                <h3 className="font-semibold">{marker.title}</h3>
                {marker.description && (<p className="text-sm text-gray-600">{marker.description}</p>)}
              </div>
            </Popup>
          </Marker>))}
      </MapContainer>
    </div>);
}
