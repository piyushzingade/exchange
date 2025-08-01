// import { ChartManager } from "@/utils/ChartManager";
// import { getKlines } from "@/utils/httpClient";
// import { KLine } from "@/utils/types";
// import { useEffect, useRef } from "react";


// export default function TradeView({market}  :{market : string}){
//     const chartRef = useRef<HTMLDivElement>(null)
//     const chartManagerRef = useRef<ChartManager>(null)

//     useEffect(()=> {
//         ( async () =>{
//             let kLineData: KLine[] = [] ;
//             try {
//                 kLineData = await getKlines(
//                 market,
//                 "1h",
//                 Math.floor(
//                     (new Date().getTime() - 1000 * 60 * 60 * 24 * 7) /
//                     1000
//                 ),
//                 Math.floor(new Date().getTime() / 1000)
//                 ); 

//             } catch (error) {
//                 console.log("Error in getKlines " , error)
//             }

//             if(chartRef){
//                 if(chartManagerRef.current){
//                     chartManagerRef.current.destroy();
//                 }

//                 const charManager = new ChartManager(
//                     chartRef.current,
//                     [
//                         ...kLineData?.map((x)=>({
//                             close : parseFloat(x.close),
//                             high: parseFloat(x.high),
//                             open: parseFloat(x.open),
//                             low : parseFloat(x.low),
//                             time : new Date(x.end)
//                         }))
//                     ],
//                     {
//                         background:"#0e0f14",
//                         color:"white"
//                     }
//                 )
//                 chartManagerRef.current = charManager
//             }
//         })();
//     }, [market , chartRef])

//     return <div ref={chartRef} className="mt-4 h-[520px] w-full"></div>;
// }

