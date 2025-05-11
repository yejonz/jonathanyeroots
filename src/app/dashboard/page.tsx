"use client"

import { useState, useEffect, ChangeEvent } from 'react';
import { DateRange } from 'react-day-picker';
import { parse, isValid, isAfter, isBefore, format } from 'date-fns';

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

    useEffect(() => {
        const fetchListingsCount = async () => {
            setLoading(true)
            setError(null)
            try {
                if (!dateRange || !dateRange.from || !dateRange.to) {
                    return;
                }

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
    }, [dateRange])
  
    return (
        <div>
            <div className="relative">
                <p>
                    Enter Date Range:
                </p>
                <input
                    type="text"
                    placeholder="MM-DD-YYYY:MM-DD-YYYY"
                    value={dateRangeText}
                    onChange={handleDateChange}
                    className="px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    style={{ width: '24ch' }} // Width based on character count
                    maxLength={21} // Restrict to exactly MM-DD-YYYY format length
                />
                <p>
                    {subtext}
                </p>

            </div>
        </div>
    )
}