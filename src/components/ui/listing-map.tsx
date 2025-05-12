"use client"

import { useState, useEffect, useRef } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

// Define your Listing type based on your data structure
interface Listing {
  id: string
  address: string
  city: string | null
  state: string | null
  price: number
  bedrooms: number | null
  bathrooms: number | null
  squareFeet: number | null
  propertyType: string
  photoUrls: string[]
  status: string
  createdAt: string
  latitude: number
  longitude: number
}

interface ListingMapProps {
  listings: Listing[];
  height?: string;
  width?: string;
}

export default function ListingMap({ listings, height = '600px', width = '100%' }: ListingMapProps) {
  // You'll need to add your Mapbox access token to your environment variables
  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_API_SECRET_KEY;
  
  const [viewState, setViewState] = useState({
    latitude: 37.7749, // Default coordinates (San Francisco)
    longitude: -122.4194,
    zoom: 10
  });
  
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  // Position the map based on listings
  useEffect(() => {
    if (listings && listings.length > 0) {
      // Calculate the center of all listings
      const sumLat = listings.reduce((sum, listing) => sum + listing.latitude, 0);
      const sumLng = listings.reduce((sum, listing) => sum + listing.longitude, 0);
      
      setViewState({
        latitude: sumLat / listings.length,
        longitude: sumLng / listings.length,
        zoom: 10
      });
    }
  }, [listings]);

  return (
    <div style={{ height, width }}>
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <NavigationControl position="top-right" />
        
        {/* Render a marker for each listing */}
        {listings.map(listing => (
          <Marker
            key={listing.id}
            latitude={listing.latitude}
            longitude={listing.longitude}
            onClick={e => {
              // Prevent click from propagating to the map
              e.originalEvent.stopPropagation();
              setSelectedListing(listing);
            }}
          >
            <div className="cursor-pointer">
              <div className="bg-blue-500 text-white rounded-full px-2 py-1 text-xs font-bold">
                ${listing.price}
              </div>
            </div>
          </Marker>
        ))}
        
        {/* Popup for the selected listing */}
        {selectedListing && (
          <Popup
            latitude={selectedListing.latitude}
            longitude={selectedListing.longitude}
            closeOnClick={false}
            onClose={() => setSelectedListing(null)}
            anchor="bottom"
          >
            <div className="p-2 max-w-xs">
              <h3 className="font-bold">{selectedListing.address}</h3>
              <p className="text-sm">${selectedListing.price}</p>
              {/* Add more listing details here */}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}