export const opportunityFactoryAbi = [
  {
    type: 'function',
    name: 'marketsLength',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'getMarket',
    stateMutability: 'view',
    inputs: [{ name: 'index', type: 'uint256' }],
    outputs: [
      {
        components: [
          { name: 'market', type: 'address' },
          { name: 'sponsor', type: 'address' },
          { name: 'collateralToken', type: 'address' },
          { name: 'penaltyBps', type: 'uint16' },
          { name: 'opportunityWindowEnd', type: 'uint256' },
          { name: 'questionHash', type: 'bytes32' },
          { name: 'optionCount', type: 'uint256' }
        ],
        name: '',
        type: 'tuple'
      }
    ]
  },
  {
    type: 'function',
    name: 'createMarket',
    stateMutability: 'nonpayable',
    inputs: [
      {
        components: [
          { name: 'sponsor', type: 'address' },
          { name: 'collateralToken', type: 'address' },
          { name: 'penaltyBps', type: 'uint16' },
          { name: 'opportunityWindowEnd', type: 'uint256' },
          { name: 'questionHash', type: 'bytes32' },
          {
            name: 'options',
            type: 'tuple[]',
            components: [
              { name: 'optionHash', type: 'bytes32' },
              { name: 'initialCollateral', type: 'uint256' },
              { name: 'initialVirtualYes', type: 'uint256' }
            ]
          }
        ],
        name: 'params',
        type: 'tuple'
      }
    ],
    outputs: [{ name: 'marketAddr', type: 'address' }]
  }
] as const;

export const opportunityMarketAbi = [
  {
    type: 'function',
    name: 'state',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }]
  },
  {
    type: 'function',
    name: 'opportunityWindowEnd',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'optionCount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'getOption',
    stateMutability: 'view',
    inputs: [{ name: 'optionId', type: 'uint256' }],
    outputs: [
      {
        components: [
          { name: 'optionHash', type: 'bytes32' },
          { name: 'collateralReserve', type: 'uint256' },
          { name: 'virtualYesReserve', type: 'uint256' },
          { name: 'totalYesShares', type: 'uint256' },
          { name: 'totalStake', type: 'uint256' }
        ],
        name: 'viewData',
        type: 'tuple'
      }
    ]
  },
  {
    type: 'function',
    name: 'buyYes',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'optionId', type: 'uint256' },
      { name: 'collateralIn', type: 'uint256' },
      { name: 'minYesOut', type: 'uint256' },
      { name: 'maxPrice', type: 'uint256' }
    ],
    outputs: [{ name: 'yesOut', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'lock',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: []
  },
  {
    type: 'function',
    name: 'resolveYes',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'optionId', type: 'uint256' }],
    outputs: []
  },
  {
    type: 'function',
    name: 'resolveNo',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: []
  },
  {
    type: 'function',
    name: 'claimYes',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'optionId', type: 'uint256' }],
    outputs: [{ name: 'collateralOut', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'claimNo',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [{ name: 'refundOut', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'claimSponsorPayout',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [{ name: 'amountOut', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'yesBalance',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'optionId', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'stakeAmount',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }, { name: 'optionId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'stakeAmount',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const;
