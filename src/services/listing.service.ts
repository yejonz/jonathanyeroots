import { prisma } from '@/lib/prisma'

export interface CreateListingInput {
  title: string
  description: string
  price: number
  location: string
  // Add other fields as needed
}

export interface UpdateListingInput extends Partial<CreateListingInput> {
  id: string
}

export class ListingService {
  async create(data: CreateListingInput) {
    return prisma.listing.create({
      data
    })
  }

  async findAll() {
    return prisma.listing.findMany()
  }

  async findById(id: string) {
    return prisma.listing.findUnique({
      where: { id }
    })
  }

  async update({ id, ...data }: UpdateListingInput) {
    return prisma.listing.update({
      where: { id },
      data
    })
  }

  async delete(id: string) {
    return prisma.listing.delete({
      where: { id }
    })
  }

  async search(query: string) {
    return prisma.listing.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } }
        ]
      }
    })
  }
} 