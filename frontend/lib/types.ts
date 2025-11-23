export type OptionMetadata = {
  label: string;
  optionHash: `0x${string}`;
};

export type MarketMetadata = {
  id: number;
  marketAddress: `0x${string}`;
  questionHash: `0x${string}`;
  title: string;
  description: string;
  opportunityWindowEnd: string;
  penaltyBps: number;
  sponsor: `0x${string}`;
  collateralSymbol: string;
  collateralAddress: `0x${string}`;
  options: OptionMetadata[];
};

export type MarketCardData = MarketMetadata & {
  state?: string;
  totalOptions?: number;
};

export type DemoBid = {
  id: string;
  trader: string;
  optionId: number;
  optionLabel: string;
  collateralIn: number;
  yesOut: number;
  timestamp: number;
  status: 'open' | 'won' | 'lost' | 'claimed';
};

export type DemoMarket = MarketCardData & {
  bids: DemoBid[];
  lockedAt: number | null;
  winningOptionId: number | null;
  sponsorPayout: number | null;
};
