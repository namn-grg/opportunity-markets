import { keccak256, stringToBytes } from 'viem';
import marketsData from '../data/markets.json';
import { DemoBid, DemoMarket, MarketCardData } from './types';

const STORAGE_KEY = 'opportunity-demo-state-v1';
const DEFAULT_SYMBOL = 'USDC';

export const demoModeEnabled = process.env.NEXT_PUBLIC_DEMO_MODE !== 'false';

type DemoState = {
  markets: DemoMarket[];
  nextId: number;
};

const seedMarkets = (): DemoMarket[] =>
  (marketsData as MarketCardData[]).map((market, idx) => ({
    ...market,
    id: market.id ?? idx,
    state: market.state ?? '0',
    bids: [],
    lockedAt: null,
    winningOptionId: null,
    sponsorPayout: null
  }));

const normalizeState = (state?: DemoState): DemoState => {
  const seeded = seedMarkets();
  if (!state || !Array.isArray(state.markets)) {
    return { markets: seeded, nextId: seeded.length };
  }
  const markets = state.markets.map((market, idx) => ({
    ...market,
    id: market.id ?? idx,
    state: market.state ?? '0',
    bids: market.bids ?? [],
    lockedAt: market.lockedAt ?? null,
    winningOptionId: market.winningOptionId ?? null,
    sponsorPayout: typeof market.sponsorPayout === 'number' ? market.sponsorPayout : null
  }));
  const maxId = markets.reduce((max, market) => Math.max(max, market.id ?? 0), 0);
  return { markets, nextId: Math.max(state.nextId ?? markets.length, maxId + 1) };
};

const loadState = (): DemoState => {
  if (typeof window === 'undefined') return normalizeState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = normalizeState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return normalizeState(JSON.parse(raw) as DemoState);
  } catch (error) {
    console.warn('Falling back to seeded demo state', error);
    const seeded = normalizeState();
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    }
    return seeded;
  }
};

const persistState = (state: DemoState) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeState(state)));
};

const randomHex = (length: number) => {
  const chars = 'abcdef0123456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return `0x${out}` as `0x${string}`;
};

export const listDemoMarkets = (): DemoMarket[] => loadState().markets;

export const getDemoMarket = (marketId: number): DemoMarket | null => {
  return loadState().markets.find((market) => market.id === marketId) ?? null;
};

export const createDemoMarket = ({
  question,
  penaltyBps,
  windowEnd,
  collateralToken,
  optionLabels,
  initialCollateral,
  sponsor,
  collateralSymbol
}: {
  question: string;
  penaltyBps: number;
  windowEnd?: string;
  collateralToken: string;
  optionLabels: string[];
  initialCollateral: string;
  sponsor?: `0x${string}` | null;
  collateralSymbol?: string;
}): DemoMarket => {
  const state = loadState();
  const now = Date.now();
  const resolvedWindowEnd = windowEnd ? new Date(windowEnd) : new Date(now + 14 * 24 * 60 * 60 * 1000);
  const options = optionLabels.map((label, idx) => ({
    label,
    optionHash: keccak256(stringToBytes(`${label}-${now}-${idx}`)) as `0x${string}`
  }));
  const market: DemoMarket = {
    id: state.nextId,
    state: '0',
    marketAddress: randomHex(40),
    questionHash: keccak256(stringToBytes(question || 'Demo question')) as `0x${string}`,
    title: question || 'Untitled opportunity window',
    description: `Sponsor window with ${initialCollateral || '0'} ${collateralSymbol || DEFAULT_SYMBOL} per option and hidden order flow.`,
    opportunityWindowEnd: resolvedWindowEnd.toISOString(),
    penaltyBps,
    sponsor: (sponsor ?? randomHex(40)) as `0x${string}`,
    collateralSymbol: collateralSymbol || DEFAULT_SYMBOL,
    collateralAddress: collateralToken
      ? (collateralToken as `0x${string}`)
      : ('0x0000000000000000000000000000000000000000' as `0x${string}`),
    options,
    bids: [],
    lockedAt: null,
    winningOptionId: null,
    sponsorPayout: null
  };

  const nextState: DemoState = {
    markets: [market, ...state.markets],
    nextId: state.nextId + 1
  };
  persistState(nextState);
  return market;
};

export const recordDemoBid = ({
  marketId,
  trader,
  optionId,
  collateralIn,
  maxPrice
}: {
  marketId: number;
  trader?: string | null;
  optionId: number;
  collateralIn: number;
  maxPrice?: number;
}): DemoMarket | null => {
  const state = loadState();
  const idx = state.markets.findIndex((m) => m.id === marketId);
  if (idx === -1) return null;
  if (!Number.isFinite(collateralIn) || collateralIn <= 0) return state.markets[idx];
  const market = state.markets[idx];
  const option = market.options[optionId];
  const price = Math.max(maxPrice ?? 0.6, 0.01);
  const sanitizedCollateral = Number(collateralIn.toFixed(2));
  const yesOut = Math.max(1, Number((sanitizedCollateral / price).toFixed(2)));
  const bid: DemoBid = {
    id: `bid-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    trader: trader || randomHex(40),
    optionId,
    optionLabel: option?.label ?? `Option ${optionId + 1}`,
    collateralIn: sanitizedCollateral,
    yesOut,
    timestamp: Date.now(),
    status: 'open'
  };
  const updatedMarket: DemoMarket = {
    ...market,
    state: market.state ?? '0',
    bids: [bid, ...market.bids]
  };
  state.markets[idx] = updatedMarket;
  persistState(state);
  return updatedMarket;
};

export const lockDemoMarket = (marketId: number): DemoMarket | null => {
  const state = loadState();
  const idx = state.markets.findIndex((m) => m.id === marketId);
  if (idx === -1) return null;
  const updatedMarket: DemoMarket = { ...state.markets[idx], state: '1', lockedAt: Date.now() };
  state.markets[idx] = updatedMarket;
  persistState(state);
  return updatedMarket;
};

export const resolveDemoMarket = (marketId: number, winningOptionId: number): DemoMarket | null => {
  const state = loadState();
  const idx = state.markets.findIndex((m) => m.id === marketId);
  if (idx === -1) return null;
  const market = state.markets[idx];
  const penaltyFraction = (market.penaltyBps ?? 0) / 10000;
  let sponsorPayout = 0;
  const bids = market.bids.map((bid) => {
    if (bid.optionId === winningOptionId) return { ...bid, status: 'won' as const };
    sponsorPayout += bid.collateralIn * penaltyFraction;
    return { ...bid, status: 'lost' as const };
  });
  const updatedMarket: DemoMarket = {
    ...market,
    state: '2',
    bids,
    winningOptionId,
    sponsorPayout: Number(sponsorPayout.toFixed(2))
  };
  state.markets[idx] = updatedMarket;
  persistState(state);
  return updatedMarket;
};

export const claimDemoYes = (marketId: number): { market: DemoMarket | null; amount: number } => {
  const state = loadState();
  const idx = state.markets.findIndex((m) => m.id === marketId);
  if (idx === -1) return { market: null, amount: 0 };
  const market = state.markets[idx];
  let amount = 0;
  const bids = market.bids.map((bid) => {
    if (bid.status === 'won') {
      amount += bid.yesOut;
      return { ...bid, status: 'claimed' as const };
    }
    return bid;
  });
  const updatedMarket: DemoMarket = { ...market, bids };
  state.markets[idx] = updatedMarket;
  persistState(state);
  return { market: updatedMarket, amount: Number(amount.toFixed(2)) };
};

export const claimSponsorPayout = (marketId: number): { market: DemoMarket | null; amount: number } => {
  const state = loadState();
  const idx = state.markets.findIndex((m) => m.id === marketId);
  if (idx === -1) return { market: null, amount: 0 };
  const market = state.markets[idx];
  const amount = market.sponsorPayout ?? 0;
  const updatedMarket: DemoMarket = { ...market, sponsorPayout: 0 };
  state.markets[idx] = updatedMarket;
  persistState(state);
  return { market: updatedMarket, amount: Number(amount.toFixed(2)) };
};

export const resetDemoState = () => {
  const seeded = normalizeState();
  persistState(seeded);
  return seeded;
};
