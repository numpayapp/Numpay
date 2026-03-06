# NumPay Backend

REST API server for NumPay — a phone-number-based USDC payment platform on Solana. The backend manages user accounts with Privy server wallets and executes all on-chain transfers server-side, so users never need to manage private keys.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express 5 |
| Database | PostgreSQL (Neon) via Prisma ORM |
| Blockchain | Solana Mainnet |
| Token | USDC (`EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`) |
| Wallet custody | Privy Server Wallets (`@privy-io/node`) |
| Auth | Privy JWT verification |
| SMS OTP | Twilio Verify |
| Security | Helmet, CORS allowlist, express-rate-limit |

---

## Architecture Overview

```
Client (Privy JWT)
        │
        ▼
  Auth Middleware  ──── Privy verifyAccessToken
        │
        ▼
   API Routes
   ├── /api/user        User registration, lookup, balance
   ├── /api/transaction Transfer execution, history, stats
   └── /api/request     Payment requests
        │
        ▼
  Privy Wallet API  ──── signAndSendTransaction (server-side)
        │
        ▼
   Solana Mainnet   ──── Helius RPC
        │
        ▼
  PostgreSQL (Neon) ──── Transaction records
```

Every USDC transfer is signed server-side using Privy's wallet API. Users authenticate with their phone number only and never interact with a private key.

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended)
- Privy account with server wallets enabled
- Twilio account for SMS OTP
- Helius RPC URL (Solana mainnet)

### Installation

```bash
git clone https://github.com/numpayapp/Numpay.git -b backend
cd backend
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Environment
NODE_ENV=development
BASE_URL=https://your-frontend-url.com

# Privy
PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret

# Solana
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY

# Treasury wallet — seeds new user wallets with SOL for rent exemption
RELAYER_PRIVATE_KEY=base58_encoded_private_key

# Twilio
TWILIO_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

# WhatsApp (optional)
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
```

### Database Setup

```bash
# Generate Prisma client and run migrations
npx prisma migrate dev

# Production
npx prisma migrate deploy
```

### Run

```bash
# Development
npm run dev

# Production
npm run build
node build/server.js
```

Server starts on port `3001` by default (override with `PORT` env var).

---

## API Reference

All routes are prefixed with `/api`. Protected routes require:
```
Authorization: Bearer <privy_jwt>
```

### User — `/api/user`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | No | Register user; creates Privy server wallet |
| `POST` | `/pregenerate` | No | Pre-create wallet for unregistered phone |
| `PUT` | `/update/:id` | Yes | Update user profile |
| `GET` | `/get/:id` | Yes | Get user by ID |
| `GET` | `/phone/:phoneNumber` | Yes | Get user by phone number |
| `GET` | `/wallet/:id` | Yes | Get user by wallet address |
| `GET` | `/balance/:privyDID` | Yes | Get USDC balance |
| `GET` | `/:userId/summary` | Yes | Get transaction summary |

**Register request body:**
```json
{
  "privyDID": "did:privy:xxx",
  "phoneNumber": "+1234567890",
  "countryCode": "+1",
  "name": "John Doe"
}
```

### Transactions — `/api/transaction`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/execute-transfer` | Yes | Execute Solana USDC transfer |
| `POST` | `/` | Yes | Manually record a transaction |
| `GET` | `/:id` | Yes | Get transaction by ID |
| `GET` | `/tx/:txhash` | Yes | Get transaction by Solana tx hash |
| `GET` | `/user/:userId` | Yes | Get user transaction history |
| `GET` | `/stats/:userId` | Yes | Get transaction statistics |

**Execute transfer request body:**
```json
{
  "recipientPhone": "+1234567890",
  "amount": 10.00
}
```
**Response:**
```json
{
  "success": true,
  "txhash": "solana_transaction_signature"
}
```

### Requests — `/api/request`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/create` | Yes | Create a payment request |
| `GET` | `/:id` | Yes | Get request by ID |
| `PUT` | `/update/:id` | Yes | Update request status |

---

## Database Schema

```
User
├── id              UUID (primary key)
├── privyDID        Unique — Privy user identifier
├── phoneNumber     Unique
├── solanaAddress   Unique — Privy server wallet public key
├── privyWalletId   Unique — used for server-side signing
├── name, email, countryCode
└── status          ACTIVE | INACTIVE | SUSPENDED

Transaction
├── id              UUID
├── txhash          Solana transaction signature (unique)
├── senderId        → User
├── receiverId      → User
├── amount          USDC (float)
├── transactionType SEND | RECEIVE | DEPOSIT | REQUEST
└── status          PENDING | COMPLETED | FAILED

Request
├── id              UUID
├── requesterId     → User
├── payerId         → User (optional)
├── amountRequested Float
├── requestType     GLOBAL | DIRECT | OTHER
└── requestStatus   PENDING | APPROVED | REJECTED | CANCELED
```

---

## Deployment (AWS EC2 + PM2 + Nginx)

```bash
# Clone and build
git clone https://github.com/numpayapp/Numpay.git -b backend numpay-backend
cd numpay-backend
npm install && npm run build

# Start with PM2
pm2 start build/server.js --name numpay-backend
pm2 save
pm2 startup
```

**Nginx config** (`/etc/nginx/sites-available/api-solana.numpay.app`):

```nginx
server {
    listen 80;
    server_name api-solana.numpay.app;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and reload:
```bash
sudo ln -s /etc/nginx/sites-available/api-solana.numpay.app /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d api-solana.numpay.app
```

---

## Key Design Decisions

**Server-side custody** — Privy server wallets are created per user at registration. The backend signs and broadcasts all transactions. Users never handle private keys.

**ATA auto-creation** — When sending USDC to a new recipient, the service automatically prepends an Associated Token Account creation instruction so recipients can receive tokens with no setup.

**Finalized blockhash** — Transactions use `'finalized'` commitment when fetching blockhashes to ensure all RPC nodes (including Privy's internal simulation nodes) recognize the blockhash, preventing "Blockhash not found" errors.

**Wallet pre-generation** — Sending to an unregistered phone number automatically creates a Privy wallet for that number. When they register, their wallet and any received funds are ready.
