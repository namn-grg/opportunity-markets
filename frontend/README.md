# Opportunity Markets Frontend

A single-page Next.js workspace that mirrors the opportunity-markets article: calm, data-first surfaces for sponsors and scouts to explore markets, trade YES with slippage bounds, and launch new opportunity windows.

## Features
- Wallet connect with wagmi injected connector
- Market directory backed by static metadata (replace with on-chain reads when ready)
- Trading workspace with privacy reminders and slippage controls for `buyYes`
- Sponsor creation wizard that hashes questions and options client-side before calling the factory
- Policy drawer summarizing the privacy/penalty story from the article

## Getting started
1. Install dependencies: `npm install`
2. Copy environment variables:
   - `NEXT_PUBLIC_SAPPHIRE_RPC` (defaults to Sapphire testnet)
   - `NEXT_PUBLIC_FACTORY_ADDRESS`
3. Run the dev server: `npm run dev`

> Note: If the environment blocks npm registry access, set an available proxy or vendor dependencies before running the app.
