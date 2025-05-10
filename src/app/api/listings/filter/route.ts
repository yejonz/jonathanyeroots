import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ListingDataProcessor } from '@/lib/cleanListings'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: 'Missing startDate or endDate query parameter' },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format for startDate or endDate' },
        { status: 400 }
      );
    }

    const raw_listings = await prisma.rawListingData.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    })
    
    const raw_photos = await prisma.rawPhotoData.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      // orderBy: {
      //   createdAt: 'desc'
      // },
    })
    
    const raw_loans = await prisma.rawLoanData.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    // Process the raw data using the ListingDataProcessor
    const processor = new ListingDataProcessor(raw_listings, raw_photos, raw_loans);
    const listings = processor.processAll();

    return NextResponse.json(listings)
  } catch (error) {
    console.error('Error fetching filtered listings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch filtered listings' },
      { status: 500 }
    )
  }
}