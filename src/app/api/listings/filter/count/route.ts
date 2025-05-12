import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
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

    // Count the listings in the specified date range and price range
    const listingsCount = await prisma.rawListingData.count({
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

    return NextResponse.json({
      count: listingsCount,
    });
  } catch (error) {
    console.error('Error counting listings:', error);
    return NextResponse.json(
      { error: 'Failed to count listings' },
      { status: 500 }
    );
  }
}