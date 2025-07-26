// export default function TickerComp({ market }: { market: string }) {
//   return (
//     <div className="flex h-[60px] shrink-0 space-x-4">
//       <div className="flex flex-row relative ml-2 -mr-4">
//         <img
//           alt="SOL Logo"
//           loading="lazy"
//           decoding="async"
//           data-nimg="1"
//           className="z-10 rounded-full h-6 w-6 mt-4 outline-baseBackgroundL1"
//           src="/sol.webp"
//         />
//         <img
//           alt="USDC Logo"
//           loading="lazy"
//           decoding="async"
//           data-nimg="1"
//           className="h-6 w-6 -ml-2 mt-4 rounded-full"
//           src="/usdc.webp"
//         />
//       </div>
//       <button type="button" className="react-aria-Button" data-rac="">
//         <div className="flex items-center justify-between flex-row cursor-pointer rounded-lg p-3 hover:opacity-80">
//           <div className="flex items-center flex-row gap-2 undefined">
//             <div className="flex flex-row relative">
//               <p className="font-medium text-sm undefined">
//                 {market.replace("_", " / ")}
//               </p>
//             </div>
//           </div>
//         </div>
//       </button>
//     </div>
//   );
// }
