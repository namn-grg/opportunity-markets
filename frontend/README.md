# Opportunity Markets Frontend

A multi-surface Next.js workspace inspired by Paradigm Research’s [Opportunity Markets](https://www.paradigm.xyz/2025/08/opportunity-markets): calm, data-first surfaces for sponsors and scouts to explore markets, trade YES with slippage bounds, and launch new opportunity windows.

## Features
- Landing page that funnels visitors into the app with clear Paradigm credits
- Wallet connect with wagmi injected connector
- Market directory backed by static metadata (replace with on-chain reads when ready)
- Trading workspace with privacy reminders and slippage controls for `buyYes`
- Sponsor creation wizard (now on `/sponsor`) that hashes questions and options client-side before calling the factory
- Policy drawer summarizing the privacy/penalty story from the article

## Getting started
1. Install dependencies: `npm install`
2. Copy environment variables:
   - `NEXT_PUBLIC_SAPPHIRE_RPC` (defaults to Sapphire testnet)
   - `NEXT_PUBLIC_FACTORY_ADDRESS`
3. Run the dev server: `npm run dev`

> Note: If the environment blocks npm registry access, set an available proxy or vendor dependencies before running the app.
