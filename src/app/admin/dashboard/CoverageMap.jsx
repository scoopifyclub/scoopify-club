import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Circle, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { toast } from 'sonner';

const mapContainerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '0.5rem',
  overflow: 'hidden',
};

export default function CoverageMap() {
  const [areas, setAreas] = useState([]);
  const [priorityZips, setPriorityZips] = useState([]);
  const [customerZips, setCustomerZips] = useState([]); // zips with active customers
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchZip, setSearchZip] = useState('');
  const [highlighted, setHighlighted] = useState(null);
  const mapRef = useRef();

  // Google Maps API loader
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  });

  useEffect(() => {
    fetchCoverage();
    fetchPriorityZips();
    fetchCustomerZips();
  }, []);

  const fetchCoverage = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/coverage-area');
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch coverage areas');
      }
      const data = await response.json();
      setAreas(data);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const fetchPriorityZips = async () => {
    try {
      const res = await fetch('/api/admin/coverage-priority');
      if (!res.ok) throw new Error('Failed to fetch priority zips');
      const data = await res.json();
      setPriorityZips(data.map(z => z.zipCode));
    } catch (e) {
      toast.error('Could not load priority zips');
    }
  };

  const fetchCustomerZips = async () => {
    try {
      const res = await fetch('/api/admin/active-customer-zips');
      if (!res.ok) throw new Error('Failed to fetch customer zips');
      const data = await res.json();
      setCustomerZips(data);
    } catch (e) {
      toast.error('Could not load customer zips');
    }
  };

  // Group by zip code, count scoopers, and geocode zip centers
  const [zipData, setZipData] = useState([]);

  useEffect(() => {
    if (!areas.length) return;
    // Group areas by zip
    const zipMap = {};
    for (const area of areas) {
      if (!zipMap[area.zipCode]) zipMap[area.zipCode] = [];
      zipMap[area.zipCode].push(area.employeeId);
    }
    // Geocode zip codes to lat/lng using Google API
    const fetchZipCenters = async () => {
      const promises = Object.keys(zipMap).map(async (zip) => {
        const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${zip}&components=country:US&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`);
        const geo = await res.json();
        const loc = geo.results[0]?.geometry?.location;
        return {
          zipCode: zip,
          scooperCount: zipMap[zip].length,
          employeeIds: zipMap[zip],
          lat: loc?.lat,
          lng: loc?.lng,
        };
      });
      const results = await Promise.all(promises);
      setZipData(results.filter(z => z.lat && z.lng));
    };
    fetchZipCenters();
  }, [areas]);

  // Find highlighted zip
  const highlight = zipData.find(z => z.zipCode === searchZip) || highlighted;

  // Map center
  const defaultCenter = zipData.length
    ? { lat: zipData[0].lat, lng: zipData[0].lng }
    : { lat: 39.8283, lng: -98.5795 }; // US center

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Service Area Coverage Map</CardTitle>
          <Button asChild size="sm" variant="outline" title="Export priority zips">
            <a href="/api/admin/coverage-priority-export" download>
              Export Priority Zips
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-2 items-center">
          <Input
            placeholder="Search zip code..."
            value={searchZip}
            onChange={e => setSearchZip(e.target.value)}
            className="w-40"
            maxLength={5}
          />
          <Button
            onClick={() => setHighlighted(zipData.find(z => z.zipCode === searchZip) || null)}
            disabled={!searchZip}
            size="sm"
          >
            Search
          </Button>
        </div>
        {(!isLoaded || loading) ? (
          <div className="flex items-center justify-center h-[400px]">
            <Loader className="animate-spin h-8 w-8 text-gray-400" />
          </div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={highlight ? { lat: highlight.lat, lng: highlight.lng } : defaultCenter}
            zoom={highlight ? 12 : 6}
            onLoad={map => (mapRef.current = map)}
          >
            {zipData.map((z, idx) => {
              // Priority zip highlight logic
              const isPriority = priorityZips.includes(z.zipCode);
              const hasCustomers = customerZips.includes(z.zipCode);
              const isCovered = z.scooperCount > 0;
              // Red: has customers, no scoopers
              // Orange: priority zip
              // Green: normal coverage
              // Orange border: covered + priority
              let fillColor = '#22c55e';
              let strokeColor = '#16a34a';
              let zIndex = 1;
              if (hasCustomers && !isCovered) {
                fillColor = '#ef4444';
                strokeColor = '#b91c1c';
                zIndex = 4;
              } else if (isPriority && !isCovered) {
                fillColor = '#f59e42';
                strokeColor = '#d97706';
                zIndex = 3;
              } else if (isPriority && isCovered) {
                fillColor = '#22c55e';
                strokeColor = '#f59e42';
                zIndex = 2;
              }
              return (
                <Circle
                  key={z.zipCode}
                  center={{ lat: z.lat, lng: z.lng }}
                  radius={Math.max(800 + z.scooperCount * 400, 1200)}
                  options={{
                    fillColor,
                    fillOpacity: 0.35,
                    strokeColor,
                    strokeWeight: 2,
                    zIndex,
                  }}
                  onClick={() => setHighlighted(z)}
                />
              );
            })}
            {zipData.map((z, idx) => (
              <MarkerF
                key={z.zipCode}
                position={{ lat: z.lat, lng: z.lng }}
                label={{
                  text: String(z.scooperCount),
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  className: 'bg-green-600 rounded-full px-2 py-1',
                }}
                onClick={() => setHighlighted(z)}
              >
                {highlight && highlight.zipCode === z.zipCode && (
                  <InfoWindowF onCloseClick={() => setHighlighted(null)}>
                    <div className="font-semibold">
                      Zip: {z.zipCode}<br />
                      {z.scooperCount} scooper{z.scooperCount > 1 ? 's' : ''} covering
                      {priorityZips.includes(z.zipCode) && <div className="text-orange-500 font-semibold">PRIORITY</div>}
                      {customerZips.includes(z.zipCode) && z.scooperCount === 0 && <div className="text-red-600 font-semibold">CUSTOMERS AT RISK</div>}
                    </div>
                  </InfoWindowF>
                )}
              </MarkerF>
            ))}
          </GoogleMap>
        )}
      </CardContent>
    </Card>
  );
}
