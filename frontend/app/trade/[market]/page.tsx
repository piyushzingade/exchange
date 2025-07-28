"use client";

import { Depth } from "@/components/orderbook/Depth";
import { MarketBar } from "@/components/MarketBar";
import { SwapUI } from "@/components/SwapUI";
import { TradeView } from "@/components/TradingViewWidget";
// import TradeView from "@/components/TradeView";
import { useParams } from "next/navigation";

export default function Page() {
  const { market } = useParams();
  return (
    <div className="flex flex-row flex-1">
      <div className="flex flex-col flex-1">
        <MarketBar market={market as string} />
        <div className="flex flex-row ">
          <div className="flex flex-col flex-1 w-full ml-3 bg-[#14151b] p-3 rounded-lg mt-2 ">
            <TradeView market={market as string} />
          </div>
          <div className="flex flex-col w-[250px] overflow-hidden bg-[#14151b] rounded-lg p-3 m-3 mt-2 ">
            <Depth market={market as string} />
          </div>
        </div>
      </div>
      {/* <div className="w-[332px] flex-col "></div> */}
      <div>
        <div className="flex flex-col w-[332px] bg-[#14151b] rounded-lg mr-3">
          <SwapUI market={market as string} />
        </div>
      </div>
    </div>
  );
}
