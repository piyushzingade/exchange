
export function BookTableHeader() {
  return (
    <div className="flex justify-between text-xs mb-2">
      <div className="text-white">Price</div>
      <div className="text-slate-500">Size</div>
      <div className="text-slate-500">Total</div>
    </div>
  );
}


export function TradesTableHeader() {
  return (
    <div className="flex justify-between text-xs mb-2">
      <div className="text-white">Price (USD)</div>

      <div className="text-slate-500">Qty (SOL)</div>
      <div className="text-slate-500">TimeStamp </div>
    </div>
  );
}