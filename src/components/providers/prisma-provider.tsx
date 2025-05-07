'use client'

import { createContext, useContext } from 'react'
import { prisma } from '@/lib/prisma'

const PrismaContext = createContext(prisma)

export function PrismaProvider({ children }: { children: React.ReactNode }) {
  return (
    <PrismaContext.Provider value={prisma}>
      {children}
    </PrismaContext.Provider>
  )
}

export const usePrisma = () => {
  const context = useContext(PrismaContext)
  if (context === undefined) {
    throw new Error('usePrisma must be used within a PrismaProvider')
  }
  return context
} 