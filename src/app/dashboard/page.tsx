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
    latitude: number
    longitude: number
}

export default function Page() {
    const [dateRangeText, setDateRangeText] = useState<string>('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [subtext, setSubtext] = useState<string | null>(null);
    const [priceRangeText, setPriceRangeText] = useState<string>('');
    const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>({});
    const [isDateRangeValid, setIsDateRangeValid] = useState(false);
    const [isPriceRangeValid, setIsPriceRangeValid] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null)
    const [listings, setListings] = useState<Listing[]>([])

    const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
        setDateRangeText(e.target.value);
    };

    const handlePriceChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPriceRangeText(e.target.value);
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
                    setIsDateRangeValid(false);
                    return;
                }
                
                if (!isValid(endDate)) {
                    setSubtext('Invalid end date');
                    setIsDateRangeValid(false);
                    return;
                }
                
                // Validate date range (end date must be after start date)
                if (isBefore(endDate, startDate)) {
                    setSubtext('End date must be after start date');
                    setIsDateRangeValid(false);
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
                setIsDateRangeValid(true);
                
            } catch (error) {
                setSubtext('Error parsing date range');
                setIsDateRangeValid(false);
                console.error('Error parsing date range:', error);
            }
        } else {
            setIsDateRangeValid(false);
        }
    }, [dateRangeText]);

    // Parse price range text
    useEffect(() => {
        if (priceRangeText) {
            try {
                const [minStr, maxStr] = priceRangeText.split(':');
                const min = minStr ? parseFloat(minStr) : undefined;
                const max = maxStr ? parseFloat(maxStr) : undefined;

                if ((minStr && isNaN(min!)) || (maxStr && isNaN(max!))) {
                    setSubtext('Invalid price format');
                    setIsPriceRangeValid(false);
                    return;
                }

                if (min !== undefined && max !== undefined && min > max) {
                    setSubtext('Minimum price must be less than maximum price');
                    setIsPriceRangeValid(false);
                    return;
                }

                setPriceRange({ min, max });
                setIsPriceRangeValid(true);
            } catch (error) {
                setSubtext('Error parsing price range');
                setIsPriceRangeValid(false);
                console.error('Error parsing price range:', error);
            }
        } else {
            setIsPriceRangeValid(false);
        }
    }, [priceRangeText]);

    // This useEffect fetches the count when both dateRange and priceRange are valid
    useEffect(() => {
        const fetchListingsCount = async () => {
            if (!isDateRangeValid || !isPriceRangeValid || !dateRange || !dateRange.from || !dateRange.to) {
                return;
            }
            
            setLoading(true);
            setError(null);
            
            try {
                // Format dates for API request
                const startDate = dateRange.from.toISOString();
                const endDate = dateRange.to.toISOString();
                
                // Build query parameters
                const params = new URLSearchParams({
                    startDate,
                    endDate
                });

                if (priceRange.min !== undefined) {
                    params.append('minPrice', priceRange.min.toString());
                }
                if (priceRange.max !== undefined) {
                    params.append('maxPrice', priceRange.max.toString());
                }
                
                // Make the API request with query parameters
                const response = await fetch(
                    `/api/listings/filter/count?${params.toString()}`
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
    }, [dateRange, priceRange, isDateRangeValid, isPriceRangeValid]);
    
    // Handle Enter key press to submit - only when not loading and both fields are valid
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !loading && isDateRangeValid && isPriceRangeValid) {
            e.preventDefault();
            handleSubmit();
        }
    };
    
    // Submit function that clears the input and fetches map data
    const handleSubmit = async () => {
        if (loading || !isDateRangeValid || !isPriceRangeValid || !dateRange || !dateRange.from || !dateRange.to) return;
        
        try {
            setLoading(true);
            setError(null);
            
            // Format dates for API request
            const startDate = dateRange.from.toISOString();
            const endDate = dateRange.to.toISOString();
            
            // Build query parameters
            const params = new URLSearchParams({
                startDate,
                endDate
            });

            if (priceRange.min !== undefined) {
                params.append('minPrice', priceRange.min.toString());
            }
            if (priceRange.max !== undefined) {
                params.append('maxPrice', priceRange.max.toString());
            }
            
            const response = await fetch(
                `/api/listings/filter?${params.toString()}`
            );
            
            if (!response.ok) {
                throw new Error('Failed to fetch map data');
            }
            
            const cleanedListings = await response.json();
            setListings(cleanedListings);
            console.log(cleanedListings)
            
            // Reset the input fields only after successful submission
            setDateRangeText('');
            setPriceRangeText('');
            
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred fetching map data');
        } finally {
            setLoading(false);
        }
    };
  
    return (
        <div>
            <div>
                <ListingMap listings={listings} />
            </div>
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
                <p className="mt-4">
                    Enter Price Range:
                </p>
                <input
                    type="text"
                    placeholder="min:max"
                    value={priceRangeText}
                    onChange={handlePriceChange}
                    onKeyDown={handleKeyDown}
                    className="px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    style={{ width: '16ch' }}
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