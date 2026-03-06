# NumPay Dapp

Progressive Web App (PWA) frontend for NumPay — send and receive USDC on Solana using just a phone number. No crypto knowledge required.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite + SWC |
| Styling | Tailwind CSS + shadcn/ui (Radix UI) |
| Auth | Privy (`@privy-io/react-auth`) — SMS OTP |
| Blockchain | Solana Mainnet via `@solana/web3.js` |
| Wallet adapter | `@solana/wallet-adapter-react` + Solana MWA |
| State | TanStack Query |
| Routing | React Router v6 |
| PWA | `vite-plugin-pwa` (installable, offline-ready) |

---

## Features

- **Phone-number payments** — send USDC to any phone number; recipient gets a wallet automatically
- **SMS login** — no passwords, no seed phrases; authenticate via Privy OTP
- **Add funds** — connect an external Solana wallet (Phantom, Solflare, or MWA on Android) and deposit USDC
- **QR code payments** — share a QR code to receive payments instantly
- **Payment requests** — request money from contacts with an optional message
- **Activity feed** — full transaction history with status tracking
- **PWA / installable** — works as a standalone app on Android and iOS
- **Solana dApp Store ready** — Solana Mobile Wallet Adapter (MWA) integration for TWA submission

---

## Getting Started

### Prerequisites

- Node.js 18+ or Bun 1.0+
- NumPay backend running (see [backend repo](https://github.com/numpayapp/Numpay/tree/backend))

### Installation

```bash
git clone https://github.com/numpayapp/Numpay.git -b frontend
cd frontend
npm install
# or
bun install
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Firebase (used for notifications / analytics)
VITE_APP_FIREBASE_API_KEY=your_firebase_api_key
VITE_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_APP_FIREBASE_PROJECT_ID=your_project_id
VITE_APP_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_APP_FIREBASE_APP_ID=your_app_id

# Privy
VITE_APP_PRIVY_APP_ID=your_privy_app_id
VITE_APP_PRIVY_CLIENT_ID=your_privy_client_id

# Backend API
VITE_BASE_URL=http://localhost:3001

# Solana RPC (Helius recommended)
VITE_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

### Run

```bash
# Development
npm run dev
# or
bun run dev
```

App runs at `http://localhost:5173`.

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

---

## Project Structure

```
src/
├── components/          # Shared UI components
│   ├── ui/              # shadcn/ui primitives (Button, Card, Dialog, etc.)
│   ├── Header.tsx
│   ├── AmountInput.tsx
│   └── Layout.tsx
├── context/
│   ├── AuthContext.tsx        # Privy auth state + user registration
│   ├── WalletContext.tsx      # App-level wallet state + sendMoney logic
│   └── SolanaWalletProvider.tsx  # Solana wallet adapter setup (MWA + extensions)
├── hooks/
│   └── use-balance.ts         # USDC balance polling hook
├── pages/
│   ├── Home.tsx               # Dashboard with balance + quick actions
│   ├── AddFunds.tsx           # Connect external wallet + USDC deposit
│   ├── SendMoney/Send.tsx     # Send USDC by phone number
│   ├── RequestMoney/          # Create and share payment requests
│   ├── Activity.tsx           # Transaction history
│   ├── QRCode.tsx             # QR code for receiving
│   ├── Login.tsx              # SMS OTP login
│   └── Settings/              # Account, security, and support settings
├── lib/
│   └── utils.ts               # cn(), showError(), showSuccess(), formatNumber()
└── App.tsx                    # Router + provider tree
```

---

## Key Pages

### Home
Displays the user's USDC balance (polled from backend), quick action buttons (Send, Request, Add Funds, QR), and recent transaction activity.

### Add Funds
Connects an external Solana wallet (Phantom, Solflare, or MWA on Android). Fetches the connected wallet's USDC balance and validates the entered amount before building and signing an SPL token transfer transaction directly in the user's wallet app.

### Send Money
Looks up a recipient by phone number and executes a server-side USDC transfer via `POST /api/transaction/execute-transfer`. No signing required from the sender's device.

### Payment Requests
Creates shareable payment request links. Supports global (anyone can pay) and direct (specific contact) request types.

---

## Wallet Adapter Setup

The app supports three wallet connection modes simultaneously:

| Adapter | Use case |
|---|---|
| `SolanaMobileWalletAdapter` | Android TWA / Solana dApp Store |
| `PhantomWalletAdapter` | Browser extension (desktop / iOS) |
| `SolflareWalletAdapter` | Browser extension (desktop / iOS) |

The `SolanaWalletProvider` wraps the entire app and exposes `useWallet` / `useConnection` hooks throughout.

---

## PWA Configuration

The app is configured as a full PWA via `vite-plugin-pwa`:

- **Install prompt** — users can install NumPay as a standalone app on Android and iOS
- **Auto-update** — service worker updates automatically on new deployments
- **Offline support** — core assets cached via Workbox
- **Icons** — full Android launcher icon set at `/public/AppImages/android/`

---

## Deployment

Build and serve as a static site:

```bash
npm run build
# Output: dist/
```

Deploy the `dist/` folder to any static host (Vercel, Netlify, Nginx, S3 + CloudFront).

**Nginx example** (`app.numpay.app`):

```nginx
server {
    listen 80;
    server_name app.numpay.app;
    root /var/www/numpay-dapp/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Environment Architecture

```
Browser / TWA
      │
      ├── Privy SDK ──── SMS OTP auth ──── Privy cloud
      │
      ├── Solana Wallet Adapter ──── External wallet (sign deposits only)
      │
      └── Axios ──── NumPay Backend API (api-solana.numpay.app)
                          │
                          └── Privy Server Wallets ──── Solana Mainnet
```

All money transfers (send/receive) go through the backend and are signed server-side. External wallet connections are only used for the **Add Funds** flow where users deposit from their own wallet.
