import { Rng } from "./rng";

export interface Asset {
  symbol: string;
  name: string;
  price: number;
  /** Per-tick volatility. */
  vol: number;
  /** Per-tick drift. */
  drift: number;
  history: number[];
}

export const HISTORY_LENGTH = 240;

// Synthetic tokenized-stock and ETH markets. Prices are generated, not quoted.
const SPECS: Omit<Asset, "history">[] = [
  { symbol: "ETH", name: "Ether", price: 2400, vol: 0.012, drift: 0.0001 },
  { symbol: "AAPL", name: "Apple (tokenized)", price: 228, vol: 0.007, drift: 0.00008 },
  { symbol: "NVDA", name: "NVIDIA (tokenized)", price: 132, vol: 0.016, drift: 0.00015 },
  { symbol: "TSLA", name: "Tesla (tokenized)", price: 251, vol: 0.02, drift: 0 },
  { symbol: "AMZN", name: "Amazon (tokenized)", price: 186, vol: 0.009, drift: 0.00005 },
];

export const SYMBOLS = SPECS.map((s) => s.symbol);
export const STOCK_SYMBOLS = SYMBOLS.filter((s) => s !== "ETH");

function move(asset: Asset, rng: Rng, shock = 0) {
  const z = rng.normal();
  asset.price *= Math.exp(asset.drift - (asset.vol * asset.vol) / 2 + asset.vol * z + shock);
  asset.history.push(asset.price);
  if (asset.history.length > HISTORY_LENGTH) asset.history.shift();
}

export function createMarket(rng: Rng): Map<string, Asset> {
  const market = new Map<string, Asset>();
  for (const spec of SPECS) {
    const asset: Asset = { ...spec, history: [] };
    // Warm up so strategies with a lookback have data from tick one.
    for (let i = 0; i < 120; i++) move(asset, rng);
    market.set(asset.symbol, asset);
  }
  return market;
}

export function stepMarket(market: Map<string, Asset>, rng: Rng) {
  // A rare market-wide shock keeps guardrails like the drawdown kill switch honest.
  const shock = rng.next() < 0.006 ? (rng.next() < 0.5 ? -1 : 1) * (0.02 + rng.next() * 0.05) : 0;
  for (const asset of market.values()) move(asset, rng, shock);
}
