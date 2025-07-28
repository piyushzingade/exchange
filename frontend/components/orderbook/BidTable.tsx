export const BidTable = ({ bids }: { bids: [string, string][] }) => {
  let currentTotal = 0;
  const relevantBids = bids.slice(0, 15);
  const bidsWithTotal: [string, string, number][] = relevantBids.map(
    ([price, quantity]) => [price, quantity, (currentTotal += Number(quantity))]
  );
  const maxTotal = relevantBids.reduce(
    (acc, [_, quantity]) => acc + Number(quantity),
    0
  );

  return (
    <div>
      {bidsWithTotal?.map(([price, quantity, total]) => (
        <Bid
          maxTotal={maxTotal}
          total={total}
          key={price}
          price={price}
          quantity={quantity}
        />
      ))}
    </div>
  );
};

function Bid({
  price,
  quantity,
  total,
  maxTotal,
}: {
  price: string;
  quantity: string;
  total: number;
  maxTotal: number;
}) {
  const widthPercentage = (100 * total) / maxTotal;

  return (
    <div className="flex relative w-full bg-transparent overflow-hidden">
      <div
        className="absolute top-0 left-0 h-full bg-green-500/30 transition-all duration-300 ease-in-out"
        style={{ width: `${widthPercentage}%` }}
      ></div>
      <div className="flex justify-between text-xs w-full relative z-10 p-1">
        <div className="text-white">{price}</div>
        <div className="text-white">{quantity}</div>
        <div className="text-white">{total.toFixed(2)}</div>
      </div>
    </div>
  );
}
