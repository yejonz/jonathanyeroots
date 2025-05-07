'use client'

import { useState } from 'react'
import { Button, Heading, VStack, Text, Image, Box, SimpleGrid } from "@chakra-ui/react"

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

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRecentListings = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/listings/recent')
      if (!response.ok) {
        throw new Error('Failed to fetch listings')
      }
      const data = await response.json()
      setListings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center w-full max-w-6xl">
        <Heading>Recent Listings</Heading>
        
        <Button
          colorScheme="blue"
          onClick={fetchRecentListings}
          loading={loading}
        >
          {loading ? 'Fetching...' : 'Fetch Recent Listings'}
        </Button>

        {error && (
          <Text color="red.500">Error: {error}</Text>
        )}

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6} width="100%">
          {listings.map((listing) => (
            <Box
              key={listing.id}
              borderWidth="1px"
              borderRadius="lg"
              overflow="hidden"
              p={4}
            >
              {listing.photoUrls[0] && (
                <Image
                  src={listing.photoUrls[0]}
                  alt={listing.address}
                  height="200px"
                  width="100%"
                  objectFit="cover"
                  borderRadius="md"
                />
              )}
              <VStack align="start" mt={4} gap={2}>
                <Text fontWeight="bold" fontSize="xl">
                  ${listing.price.toLocaleString()}
                </Text>
                <Text>{listing.address}</Text>
                {listing.city && listing.state && (
                  <Text>{`${listing.city}, ${listing.state}`}</Text>
                )}
                <Text>
                  {listing.bedrooms && `${listing.bedrooms} beds`}
                  {listing.bathrooms && ` • ${listing.bathrooms} baths`}
                  {listing.squareFeet && ` • ${listing.squareFeet} sqft`}
                </Text>
                <Text color="gray.500" fontSize="sm">
                  {listing.propertyType}
                </Text>
                <Text color="blue.500" fontSize="sm">
                  {listing.status}
                </Text>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      </main>
    </div>
  )
}
