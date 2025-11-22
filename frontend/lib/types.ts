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
  options: OptionMetadata[];
};

export type MarketCardData = MarketMetadata & {
  state?: string;
  totalOptions?: number;
};
