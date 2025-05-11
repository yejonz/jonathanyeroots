"use client"

import { useState, useEffect, ChangeEvent, KeyboardEvent } from 'react';
import { DateRange } from 'react-day-picker';
import { parse, isValid, isAfter, isBefore, format } from 'date-fns';
import ListingMap from '@/components/ui/listing-map';

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
}

export default function Page() {
    const [dateRangeText, setDateRangeText] = useState<string>('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [subtext, setSubtext] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null)
    const [listings, setListings] = useState<Listing[]>([])

    const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
        setDateRangeText(e.target.value);
    };

    // This useEffect parses text into DateRange but doesn't trigger API calls
    useEffect(() =>  {
        if (dateRangeText.length === 21) {
        try {
          // Split the text into two date strings
          const [startDateStr, endDateStr] = dateRangeText.split(':');
          
          // Parse the dates using date-fns
          const startDate = parse(startDateStr, 'MM-dd-yyyy', new Date());
          const endDate = parse(endDateStr, 'MM-dd-yyyy', new Date());
          
          // Validate the parsed dates
          if (!isValid(startDate)) {
            setSubtext('Invalid start date');
            return;
          }
          
          if (!isValid(endDate)) {
            setSubtext('Invalid end date');
            return;
          }
          
          // Validate date range (end date must be after start date)
          if (isBefore(endDate, startDate)) {
            setSubtext('End date must be after start date');
            return;
          }
          
          // Create the DateRange object
          const newDateRange: DateRange = {
            from: startDate,
            to: endDate
          };
          
          console.log('Valid DateRange created:', newDateRange);
          
          // Update the state with the new DateRange
          setDateRange(newDateRange);
          
        } catch (error) {
          setSubtext('Error parsing date range');
          console.error('Error parsing date range:', error);
        }
    }}, [dateRangeText]);

    // This useEffect fetches the count when dateRange changes
    useEffect(() => {
        const fetchListingsCount = async () => {
            if (!dateRange || !dateRange.from || !dateRange.to) {
                return;
            }
            
            setLoading(true);
            setError(null);
            
            try {
                // Format dates for API request
                const startDate = dateRange.from.toISOString();
                const endDate = dateRange.to.toISOString();
                
                // Make the API request with query parameters
                const response = await fetch(
                    `/api/listings/filter/count?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
                );
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch listings: ${response.statusText}`);
                }
                
                const listingsCount = await response.json();
                setSubtext(listingsCount.count + ' listings found.')
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred')
            } finally {
                setLoading(false)
            }
        }

        fetchListingsCount();
    }, [dateRange]);
    
    // Handle Enter key press to submit - only when not loading
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        // Only process Enter key if not loading and input is properly formatted
        if (e.key === 'Enter' && !loading && dateRangeText.length === 21) {
            e.preventDefault();
            handleSubmit();
        }
    };
    
    // Submit function that clears the input and fetches map data
    const handleSubmit = async () => {
        if (loading || !dateRange || !dateRange.from || !dateRange.to) return;
        
        try {
            setLoading(true);
            setError(null);
            
            // Format dates for API request
            const startDate = dateRange.from.toISOString();
            const endDate = dateRange.to.toISOString();
            
            // Add your API call here to fetch the listings for the map
            // Example implementation:
            const response = await fetch(
                `/api/listings/filter?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
            );
            
            if (!response.ok) {
                throw new Error('Failed to fetch map data');
            }
            
            const mapData = await response.json();
            setListings(mapData);
            
            // Reset the input field only after successful submission
            setDateRangeText('');
            
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred fetching map data');
        } finally {
            setLoading(false);
        }
    };
  
    return (
        <div>
            {/* <div>
                {listings.length > 0 && <ListingMap listings={listings} />}
            </div> */}
            <div className="relative">
                <p>
                    Enter Date Range:
                </p>
                <input
                    type="text"
                    placeholder="MM-DD-YYYY:MM-DD-YYYY"
                    value={dateRangeText}
                    onChange={handleDateChange}
                    onKeyDown={handleKeyDown}
                    className="px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    style={{ width: '24ch' }} // Width based on character count
                    maxLength={21} // Restrict to exactly MM-DD-YYYY format length
                />
                <p className="mt-2 text-sm">
                    {subtext}
                </p>
                {error && (
                    <p className="mt-2 text-sm text-red-600">
                        {error}
                    </p>
                )}
                {loading && (
                    <p className="mt-2 text-sm text-blue-600">
                        Loading data...
                    </p>
                )}
            </div>
        </div>
    )
}