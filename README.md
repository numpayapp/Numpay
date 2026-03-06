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

## Architecture

```mermaid
graph TD
    Client["Client App\n(React PWA / Mobile)"]
    Auth["Auth Middleware\nPrivy verifyAccessToken"]
    Routes["API Routes\n/user · /transaction · /request"]
    UserCtrl["User Controller\nRegister · Lookup · Balance"]
    TxCtrl["Transaction Controller\nExecute Transfer · History"]
    ReqCtrl["Request Controller\nCreate · Update"]
    Privy["Privy Wallet API\nsignAndSendTransaction"]
    Solana["Solana Mainnet\nHelius RPC"]
    DB["PostgreSQL\nNeon · Prisma ORM"]

    Client -->|"Bearer JWT"| Auth
    Auth --> Routes
    Routes --> UserCtrl
    Routes --> TxCtrl
    Routes --> ReqCtrl
    UserCtrl --> DB
    UserCtrl -->|"getTokenAccountBalance"| Solana
    TxCtrl --> Privy
    TxCtrl --> DB
    ReqCtrl --> DB
    Privy -->|"Signed USDC tx"| Solana
```

---

## Backend Flow

### User Registration Flow

```mermaid
sequenceDiagram
    participant App as Client App
    participant API as NumPay API
    participant Privy as Privy Wallet API
    participant Treasury as Treasury Wallet
    participant DB as PostgreSQL

    App->>API: POST /api/user/register\n{ privyDID, phoneNumber }
    API->>DB: Check if user exists by privyDID
    alt User exists
        DB-->>API: Return existing user
        API-->>App: 200 OK (existing user)
    else Phone has pregenerated wallet
        DB-->>API: Pregenerated record found
        API->>DB: Update privyDID on existing record
        API-->>App: 200 OK (merged user)
    else New user
        API->>Privy: walletApi.create({ chainType: 'solana' })
        Privy-->>API: { wallet.id, wallet.address }
        API->>DB: Create user with solanaAddress + privyWalletId
        API--)Treasury: Fund wallet with 0.01 SOL (fire & forget)
        API-->>App: 201 Created
    end
```

### USDC Transfer Flow

```mermaid
sequenceDiagram
    participant App as Client App
    participant API as NumPay API
    participant DB as PostgreSQL
    participant Solana as Solana RPC (Helius)
    participant Privy as Privy Wallet API

    App->>API: POST /api/transaction/execute-transfer\n{ recipientPhone, amount }
    API->>DB: Lookup sender by privyDID
    API->>DB: Lookup recipient by phone
    alt Recipient not registered
        API->>Privy: Pre-generate wallet for phone
        API->>DB: Store pregenerated record
    end
    API->>Solana: getLatestBlockhash('finalized')
    API->>Solana: Check recipient ATA exists
    alt ATA missing
        Note over API: Prepend createAssociatedTokenAccount ix
    end
    API->>API: Build USDC SPL transfer transaction
    API->>Privy: walletApi.solana.signAndSendTransaction\n{ walletId, transaction }
    Privy->>Solana: Broadcast signed transaction
    Solana-->>Privy: Transaction signature
    Privy-->>API: txhash
    API->>DB: Record transaction (COMPLETED)
    API-->>App: { success: true, txhash }
```

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

## Key Design Decisions

**Server-side custody** — Privy server wallets are created per user at registration. The backend signs and broadcasts all transactions. Users never handle private keys.

**ATA auto-creation** — When sending USDC to a new recipient, the service automatically prepends an Associated Token Account creation instruction so recipients can receive tokens with no setup.

**Finalized blockhash** — Transactions use `'finalized'` commitment when fetching blockhashes to ensure all RPC nodes (including Privy's internal simulation nodes) recognize the blockhash, preventing "Blockhash not found" errors.

**Wallet pre-generation** — Sending to an unregistered phone number automatically creates a Privy wallet for that number. When they register, their wallet and any received funds are ready.
