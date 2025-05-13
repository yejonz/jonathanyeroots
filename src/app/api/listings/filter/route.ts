import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ListingDataProcessor } from '@/lib/cleanListings'

/**
 * This GET API route translates the query to fetch raw listings and photo data within both date and price ranges and uses the data processor class to process them into cleaned listings. The time for querying, fetching, and processing is displayed in the terminal.
 */
export async function GET(request: Request) {
  try {
    // Start timer for querying, fetching, and processing
    const startTime = performance.now();
    
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const minPriceStr = searchParams.get('minPrice');
    const maxPriceStr = searchParams.get('maxPrice');

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: 'Missing startDate or endDate query parameter' },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    const minPrice = minPriceStr ? parseFloat(minPriceStr) : undefined;
    const maxPrice = maxPriceStr ? parseFloat(maxPriceStr) : undefined;

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format for startDate or endDate' },
        { status: 400 }
      );
    }

    if ((minPriceStr && isNaN(minPrice!)) || (maxPriceStr && isNaN(maxPrice!))) {
      return NextResponse.json(
        { error: 'Invalid price format for minPrice or maxPrice' },
        { status: 400 }
      );
    }

    const rawListings = await prisma.rawListingData.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        rawData: {
          path: ['CurrentPrice'],
          not: { equals: null },
          ...(minPrice !== undefined && {
            gte: minPrice
          }),
          ...(maxPrice !== undefined && {
            lte: maxPrice
          })
        }
      },
    });

    // Get the IDs of the filtered listings
    const listingIds = rawListings.map(listing => listing.id);
    
    // Only fetch rawPhotos whose rawListingId is in listingsIds
    const rawPhotos = await prisma.rawPhotoData.findMany({
      where: {
        rawListingId: {
          in: listingIds
        }
      },
    });

    // Process the raw data using the ListingDataProcessor
    const processor = new ListingDataProcessor(rawListings, rawPhotos);
    const listings = processor.processAll();
    
    // Log timer info (should show in terminal)
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    console.log(`Processed ${rawListings.length} listings in ${totalTime.toFixed(2)}ms`);

    return NextResponse.json(listings);
  } catch (error) {
    console.error('Error fetching filtered listings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filtered listings' },
      { status: 500 }
    );
  }
}