"use client";
import { useRef, useState, useMemo, useEffect } from "react";

export const AskTable = ({ asks }: { asks: [string, string][] }) => {
  const [displayAsks, setDisplayAsks] = useState<[string, string][]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const latestAsksRef = useRef(asks);

  useEffect(() => {
    latestAsksRef.current = asks;

    if (frameRef.current) return;

    frameRef.current = requestAnimationFrame(() => {
      setDisplayAsks(latestAsksRef.current);
      frameRef.current = null;
    });
  }, [asks]);

  // Memoized computation
  const { asksWithTotal, maxTotal } = useMemo(() => {
    const filteredAsks = displayAsks.filter(
      ([_, quantity]) => Number(quantity) > 0
    );
    // Keep only top 15 asks (highest prices)
    const relevantAsks = filteredAsks.slice(0, 15);

    let currentTotal = 0;
    const asksWithTotal: [string, string, number][] = [];

    // Process asks from highest to lowest price
    for (const [price, quantity] of relevantAsks) {
      currentTotal += Number(quantity);
      asksWithTotal.push([price, quantity, currentTotal]);
    }

    const maxTotal = relevantAsks.reduce(
      (acc, [_, quantity]) => acc + Number(quantity),
      0
    );

    asksWithTotal.reverse();

    return { asksWithTotal, maxTotal };
  }, [displayAsks]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolled(e.currentTarget.scrollTop > 0);
  };

  const rowsToShow = isScrolled ? asksWithTotal : asksWithTotal.slice(0, 9);

  return (
    <div
      ref={containerRef}
      className="max-h-[200px] overflow-y-scroll hide-scrollbar"
      onScroll={handleScroll}
    >
      {rowsToShow.map(([price, quantity, total]) => (
        <Ask
          maxTotal={maxTotal}
          key={price}
          price={price}
          quantity={quantity}
          total={total}
        />
      ))}
    </div>
  );
};

function Ask({
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
      {/* Background bar for cumulative total */}
      <div
        className="absolute right-0 top-0 bottom-0 bg-red-900/30"
        style={{
          width: `${(100 * total) / maxTotal}%`,
          transition: "width 0.6s ease-out",
        }}
      />
      {/* Foreground bar for individual quantity */}
      <div
        className="absolute right-0 top-0 bottom-0 bg-red-900/50"
        style={{
          width: `${(100 * parseFloat(quantity)) / maxTotal}%`,
          transition: "width 0.6s ease-out",
        }}
      />
      <div className="z-10 text-red-400">{price}</div>
      <div className="z-10 text-right">{quantity}</div>
      <div className="z-10 text-right">{total.toFixed(2)}</div>
    </div>
  );
}
