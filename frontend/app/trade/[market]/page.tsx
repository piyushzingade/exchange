// "use client";

import { Depth } from "@/components/orderbook/Depth";
import { MarketBar } from "@/components/MarketBar";
import { SwapUI } from "@/components/SwapUI";
import {TradeView} from "@/components/TradeView";


export default async function Page({params} : { params : Promise<{market : string}>}) {
  // const { market } = useParams();
  const {market} = await params;
  return (
    <div className="flex flex-row flex-1">
      <div className="flex flex-col flex-1">
        <MarketBar market={market as string} />
        <div className="flex flex-row ">
          <div className="flex flex-col flex-1 w-full h-fit ml-3 bg-[#14151b] rounded-lg mt-2 ">
            <TradeView market={market as string} />
          </div>
          <div className="flex flex-col w-[250px] min-h-full overflow-hidden bg-[#14151b] rounded-lg p-3 mt-2 mx-2">
            <Depth market={market as string} />
          </div>
        </div>
      </div>
      {/* <div className="w-[332px] flex-col "></div> */}
      <div>
        <div className="flex flex-col w-[332px] bg-[#14151b] rounded-lg mr-3">
          <SwapUI  />
        </div>
      </div>
    </div>
  );
}
