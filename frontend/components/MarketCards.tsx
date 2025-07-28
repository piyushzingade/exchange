interface newMarketProps {
  image: string;
  market: string;
  price: string;
  percent: string;
}

const newMarket: newMarketProps[] = [
  { image: "🟢", market: "ES", price: "$0.24081", percent: "+2.14%" },
  { image: "🌊", market: "WCT", price: "$0.375", percent: "+7.14%" },
  { image: "🟢", market: "PUMP", price: "$0.002821", percent: "0.00%" },
  { image: "⚡", market: "FRAG", price: "$0.05961", percent: "+6.14%" },
  { image: "🟣", market: "NS", price: "$0.15009", percent: "-1.61%" },
];

const topGainers: newMarketProps[] = [
  { image: "🌙", market: "SEND", price: "$0.6526", percent: "+21.98%" },
  { image: "⚪", market: "ENA", price: "$0.6735", percent: "+10.46%" },
  { image: "🔵", market: "RAY", price: "$3.39", percent: "+9.55%" },
  { image: "🟣", market: "HNT", price: "$3.64", percent: "+8.33%" },
  { image: "🌊", market: "WCT", price: "$0.375", percent: "+7.14%" },
];

const popular: newMarketProps[] = [
  { image: "🔵", market: "SOL", price: "$192.47", percent: "+2.88%" },
  { image: "🔵", market: "ETH", price: "$3,884.27", percent: "+2.44%" },
  { image: "🟠", market: "BTC", price: "$118,801.00", percent: "+0.50%" },
  { image: "🟢", market: "USDT", price: "$1.00", percent: "-0.01%" },
  { image: "🔵", market: "SUI", price: "$4.21", percent: "+0.23%" },
];

function MarketCard({
  title,
  data,
}: {
  title: string;
  data: newMarketProps[];
}) {
  return (
    <div className="bg-[#14151b] rounded-lg p-4">
      <h3 className="text-white text-md font-medium mb-4">{title}</h3>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-sm">
                {item.image}
              </div>
              <span className="text-white font-medium">{item.market}</span>
            </div>
            <div className="text-white font-medium text-right min-w-[100px]">
              {item.price}
            </div>
            <div
              className={`text-sm font-medium text-right min-w-[80px] ${
                item.percent.startsWith("+")
                  ? "text-green-400"
                  : item.percent.startsWith("-")
                  ? "text-red-400"
                  : "text-gray-400"
              }`}
            >
              {item.percent}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MarketCards() {
  return (
    <div className="grid w-full items-center gap-4 sm:grid-cols-2 md:grid-cols-3">
      {/* New */}
      <MarketCard title="New" data={newMarket} />

      {/* Top Gainers */}
      <MarketCard title="Top Gainers" data={topGainers} />

      {/* Popular */}
      <MarketCard title="Popular" data={popular} />
    </div>
  );
}
