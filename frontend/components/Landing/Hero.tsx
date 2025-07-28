import React from 'react'
import Slider from './Slider'
import MarketCards from '../MarketCards'
import AllMarketLists from './AllMarketLists'

export default function Hero() {
  return (
    <div className='max-w-6xl   mx-auto  space-y-4'>
       <Slider/>
       <MarketCards/>
       {/* <AllMarketLists/> */}
    </div>
  )
}
