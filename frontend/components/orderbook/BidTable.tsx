import { useRef, useState } from "react";

export const BidTable = ({ bids }: { bids: [string, string][] }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter out zero quantities and sort bids high to low
  const filteredBids = bids
    .filter(([_, quantity]) => Number(quantity) > 0)
    .sort(([a], [b]) => Number(b) - Number(a));

  // Keep top 15 highest bids
  const relevantBids = filteredBids.slice(0, 15);

  let currentTotal = 0;
  const bidsWithTotal: [string, string, number][] = relevantBids.map(
    ([price, quantity]) => [price, quantity, (currentTotal += Number(quantity))]
  );

  const maxTotal = relevantBids.reduce(
    (acc, [_, quantity]) => acc + Number(quantity),
    0
  );

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    setIsScrolled(scrollTop > 0);
  };

  // Show only first 9 items if not scrolled
  const displayBids = isScrolled ? bidsWithTotal : bidsWithTotal.slice(0, 9);

  return (
    <div
      ref={containerRef}
      className="max-h-[250px] overflow-y-auto scrollbar-hide"
      onScroll={handleScroll}
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {displayBids?.map(([price, quantity, total]) => (
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
  return (
    <div className="relative grid grid-cols-3 text-xs py-[2px] border-y-2 border-transparent">
      <div
        className="absolute right-0 top-0 bottom-0 bg-green-900/30"
        style={{
          width: `${(100 * total) / maxTotal}%`,
          transition: "width 0.3s ease-in-out",
        }}
      ></div>
      <div
        className="absolute right-0 top-0 bottom-0 bg-green-700/50"
        style={{
          width: `${(100 * parseInt(quantity)) / maxTotal}%`,
          transition: "width 0.3s ease-in-out",
        }}
      ></div>
      <div className="z-10 text-green-400">{price}</div>
      <div className="z-10 text-right">{quantity}</div>
      <div className="z-10 text-right">{total.toFixed(2)}</div>
    </div>
  );
}
