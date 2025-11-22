# ROFL Integration Guide

This repository now ships with the files necessary to package the Opportunity Markets frontend as a ROFL application. Follow the steps below to go from source to a deployed ROFL machine. Reference the Oasis documentation for any additional background or troubleshooting: [Runtime Off-Chain Logic overview](https://docs.oasis.io/build/rofl/) and the [Quickstart](https://docs.oasis.io/build/rofl/quickstart).

## 1. Prerequisites

1. **Container-ready app** – the `frontend` workspace builds into a production-ready Next.js server using the provided `frontend/Dockerfile`.
2. **Oasis CLI** – download and install the latest release.
3. **Funded wallet** – create or import an account with ~150 testnet tokens:

   ```bash
   oasis wallet create opportunity_markets --file.algorithm secp256k1-bip44
   oasis faucet # visit the faucet in a browser to fund the account
   ```

## 2. Configure environment variables

Populate the values required by the app by copying `env.sample` to `.env` in the repository root:

```bash
cp env.sample .env
```

Update the two variables with your preferred Sapphire RPC endpoint and the deployed factory address. These variables are injected during the Docker build and at runtime so they will also need to be provided as ROFL secrets (see step 4).

## 3. Build the ROFL bundle

From the repository root:

```bash
oasis rofl init                 # already reflected in rofl.yaml but safe to rerun
oasis rofl create --network testnet
oasis rofl build
```

The build step creates a `.orc` bundle using the Docker image defined in `compose.yaml`.

## 4. Encrypt and upload secrets

Store your public runtime values inside the ROFL KMS so they stay private on-chain:

```bash
echo -n "https://testnet.sapphire.oasis.dev" | oasis rofl secret set NEXT_PUBLIC_SAPPHIRE_RPC -
echo -n "0xYourFactoryAddress" | oasis rofl secret set NEXT_PUBLIC_FACTORY_ADDRESS -
```

Apply the bundle metadata and secrets on-chain:

```bash
oasis rofl update
```

## 5. Deploy

Start a ROFL machine that runs the bundled container, then monitor it:

```bash
oasis rofl deploy
oasis rofl machine show
oasis rofl machine logs
```

When the machine is healthy, the Next.js server will be reachable on the exposed port (proxying handled by the ROFL provider).

## File reference

- `frontend/Dockerfile` – multi-stage build that compiles and runs the Next.js app with the required build args for ROFL secrets.
- `frontend/.dockerignore` – keeps build context small.
- `compose.yaml` – single-service definition consumed by `oasis rofl build`.
- `rofl.yaml` – manifest describing TEE resources and artifacts for Sapphire deployments.

Adapt CPU, memory, storage, and artifact versions as your workload evolves.

