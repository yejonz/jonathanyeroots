import { NextResponse } from 'next/server'
import { ListingService } from '@/services/listing.service'

const listingService = new ListingService()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  const id = searchParams.get('id')

  try {
    if (id) {
      const listing = await listingService.findById(id)
      return NextResponse.json(listing)
    }

    if (query) {
      const listings = await listingService.search(query)
      return NextResponse.json(listings)
    }

    const listings = await listingService.findAll()
    return NextResponse.json(listings)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const listing = await listingService.create(data)
    return NextResponse.json(listing, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    const listing = await listingService.update(data)
    return NextResponse.json(listing)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await listingService.delete(id)
    return NextResponse.json({ message: 'Listing deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 })
  }
} 