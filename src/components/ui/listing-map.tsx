"use client"

import { useState, useEffect } from "react"
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox"
import "mapbox-gl/dist/mapbox-gl.css"

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
  listings: Listing[]
  height?: string
  width?: string
}

export default function ListingMap({ listings, height = "1000px", width = "80%" }: ListingMapProps) {
  // You'll need to add your Mapbox access token to your environment variables
  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_API_SECRET_KEY

  // Add this after the MAPBOX_TOKEN constant
  if (!MAPBOX_TOKEN) {
    console.error(
      "Mapbox token is missing. Please add NEXT_PUBLIC_MAPBOX_API_SECRET_KEY to your environment variables.",
    )
  }

  const [viewState, setViewState] = useState({
    latitude: 37.7749, // Default coordinates (San Francisco)
    longitude: -122.4194,
    zoom: 10,
  })

  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  // Position the map based on listings
  useEffect(() => {
    if (listings && listings.length > 0) {
      // Calculate the center of all listings
      const sumLat = listings.reduce((sum, listing) => sum + listing.latitude, 0)
      const sumLng = listings.reduce((sum, listing) => sum + listing.longitude, 0)

      setViewState({
        latitude: sumLat / listings.length,
        longitude: sumLng / listings.length,
        zoom: 10,
      })
    }
  }, [listings])

  // Reset current photo index when changing selected listing
  useEffect(() => {
    setCurrentPhotoIndex(0)
  }, [selectedListing])

  // Photo gallery navigation functions
  const nextPhoto = () => {
    if (selectedListing?.photoUrls && selectedListing.photoUrls.length > 1) {
      setCurrentPhotoIndex((prev) => (prev + 1) % selectedListing.photoUrls.length)
    }
  }

  const prevPhoto = () => {
    if (selectedListing?.photoUrls && selectedListing.photoUrls.length > 1) {
      setCurrentPhotoIndex((prev) => (prev === 0 ? selectedListing.photoUrls.length - 1 : prev - 1))
    }
  }

  // Add this at the beginning of the return statement
  if (!MAPBOX_TOKEN) {
    return (
      <div
        style={{
          height,
          width,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5fff0",
          border: "1px solid #d1edc4",
          borderRadius: "8px",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <div>
          <h3 style={{ color: "#222222", marginBottom: "10px" }}>Map cannot be displayed</h3>
          <p style={{ color: "#666666" }}>Mapbox API key is missing. Please check your environment variables.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height, width }}>
      <style jsx global>{`
        .marker-container {
          transform: translate(-50%, -100%);
        }
        
        .map-pin {
          background-color: #98E934;
          color: #222222;
          border-radius: 100px;
          padding: 8px 12px;
          font-weight: 700;
          font-size: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          position: relative;
          
          transition: all 0.2s ease;
        }
        
        .map-pin:hover {
          background-color: #86CF2D;
          z-index: 2;
          transform: scale(1.05);
        }
        
        .pin-stem {
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          width: 12px;
          height: 12px;
          background-color: #98E934;
          z-index: 0;
        }
        
        .map-pin:hover .pin-stem {
          background-color: #86CF2D;
        }
        
        .mapboxgl-popup {
          animation: fadeIn 0.2s ease-out;
          z-index: 3;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .mapboxgl-popup-content {
          padding: 0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          width: 440px !important;
          border: 1px solid rgba(0,0,0,0.05);
        }
        
        /* Adjust popup tip position */
        .mapboxgl-popup-anchor-bottom .mapboxgl-popup-tip {
          border-top-color: white;
        }
        
        .mapboxgl-popup-close-button {
          font-size: 18px;
          color: #fff;
          background-color: rgba(0,0,0,0.4);
          border-radius: 50%;
          width: 28px;
          height: 28px;
          line-height: 26px;
          text-align: center;
          top: 8px;
          right: 8px;
          padding: 0;
          z-index: 4;
        }
        
        .mapboxgl-popup-close-button:hover {
          background-color: rgba(0,0,0,0.6);
        }
        
        .photo-nav-button {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background-color: rgba(0,0,0,0.4);
          color: white;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.2s;
          z-index: 3;
        }
        
        .photo-nav-button:hover {
          background-color: rgba(0,0,0,0.6);
        }
        
        .photo-nav-button.prev {
          left: 10px;
        }
        
        .photo-nav-button.next {
          right: 10px;
        }
        
        .photo-indicator {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background-color: rgba(0,0,0,0.6);
          color: white;
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: bold;
          z-index: 3;
        }
      `}</style>

      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/streets-v12" // Using a more colorful but clean map style
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <NavigationControl position="top-right" />

        {/* Render a marker for each listing */}
        {listings.map((listing) => (
          <Marker
            key={listing.id}
            latitude={listing.latitude}
            longitude={listing.longitude}
            onClick={(e) => {
              // Prevent click from propagating to the map
              e.originalEvent.stopPropagation()
              setSelectedListing(listing)
            }}
          >
            <div className="cursor-pointer marker-container">
              <div className="map-pin">
                <div className="pin-price">${listing.price.toLocaleString()}</div>
                <div className="pin-stem"></div>
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
            offset={25}
          >
            <div
              style={{
                width: "440px",
                maxHeight: "520px",
                overflow: "hidden",
                borderRadius: "12px",
                backgroundColor: "white",
              }}
            >
              {/* Image Container */}
              {selectedListing.photoUrls && selectedListing.photoUrls.length > 0 ? (
                <div
                  style={{
                    width: "100%",
                    height: "240px",
                    position: "relative",
                    overflow: "hidden",
                    backgroundColor: "#f5fff0",
                  }}
                >
                  <img
                    src={selectedListing.photoUrls[currentPhotoIndex] || "/placeholder.svg"}
                    alt={`${selectedListing.address} - Photo ${currentPhotoIndex + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />

                  {/* Photo Navigation */}
                  {selectedListing.photoUrls.length > 1 && (
                    <>
                      <button className="photo-nav-button prev" onClick={prevPhoto} aria-label="Previous photo">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M10 12L6 8L10 4"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>

                      <button className="photo-nav-button next" onClick={nextPhoto} aria-label="Next photo">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M6 4L10 8L6 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>

                      <div className="photo-indicator">
                        {currentPhotoIndex + 1} / {selectedListing.photoUrls.length}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "160px",
                    backgroundColor: "#f5fff0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      color: "#86CF2D",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                  >
                    No Images Available
                  </div>
                </div>
              )}

              {/* Info Container */}
              <div style={{ padding: "20px" }}>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    marginBottom: "8px",
                    lineHeight: 1.3,
                    color: "#222222",
                  }}
                >
                  {selectedListing.address}
                </div>

                <div
                  style={{
                    fontSize: "14px",
                    color: "#666666",
                    marginBottom: "10px",
                  }}
                >
                  {selectedListing.city ?? ""}
                  {selectedListing.city && selectedListing.state ? ", " : ""}
                  {selectedListing.state ?? ""}
                </div>

                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: "bold",
                    color: "#222222",
                    marginBottom: "16px",
                  }}
                >
                  ${selectedListing.price.toLocaleString()}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: "16px",
                    color: "#444444",
                    marginBottom: "14px",
                  }}
                >
                  {/* Bedrooms - null check */}
                  {selectedListing.bedrooms != null && (
                    <div style={{ marginRight: "20px", display: "flex", alignItems: "center" }}>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ marginRight: "6px" }}
                      >
                        <path
                          d="M3 21V7C3 5.89543 3.89543 5 5 5H19C20.1046 5 21 5.89543 21 7V21"
                          stroke="#444444"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M3 11H21"
                          stroke="#444444"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M3 16H21"
                          stroke="#444444"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M8 21V16"
                          stroke="#444444"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M16 21V16"
                          stroke="#444444"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span style={{ fontWeight: "bold" }}>{selectedListing.bedrooms}</span> beds
                    </div>
                  )}

                  {/* Bathrooms - null check */}
                  {selectedListing.bathrooms != null && (
                    <div style={{ marginRight: "20px", display: "flex", alignItems: "center" }}>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ marginRight: "6px" }}
                      >
                        <path
                          d="M4 12H20"
                          stroke="#444444"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M4 12V19C4 19.5523 4.44772 20 5 20H19C19.5523 20 20 19.5523 20 19V12"
                          stroke="#444444"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M8 12V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V12"
                          stroke="#444444"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span style={{ fontWeight: "bold" }}>{selectedListing.bathrooms}</span> baths
                    </div>
                  )}

                  {/* Square Feet - null check */}
                  {selectedListing.squareFeet != null && (
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ marginRight: "6px" }}
                      >
                        <path
                          d="M4 4H20V20H4V4Z"
                          stroke="#444444"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M4 4L15 15"
                          stroke="#444444"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span style={{ fontWeight: "bold" }}>{selectedListing.squareFeet.toLocaleString()}</span> sq ft
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginTop: "8px",
                    fontSize: "14px",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "#f5fff0",
                      padding: "6px 10px",
                      borderRadius: "100px",
                      marginRight: "10px",
                      color: "#222222",
                      fontWeight: "bold",
                    }}
                  >
                    {selectedListing.propertyType}
                  </div>
                  <div
                    style={{
                      backgroundColor: "#98E934",
                      padding: "6px 10px",
                      borderRadius: "100px",
                      color: "#222222",
                      fontWeight: "bold",
                    }}
                  >
                    {selectedListing.status}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "12px",
                    fontSize: "14px",
                    color: "#666666",
                  }}
                >
                  Listed on {new Date(selectedListing.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  )
}
