"use client"

import { MarketBar } from '@/components/MarketBar'
import { useParams } from 'next/navigation'
import React from 'react'

export default function Page() {
    const { market } = useParams()
  return (
    <div><MarketBar market={market as string}/></div>
  )
}
