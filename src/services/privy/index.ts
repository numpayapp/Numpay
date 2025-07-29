import {PrivyClient} from '@privy-io/server-auth';
require('dotenv').config();

// Validate environment variables
const PRIVY_APP_ID = process.env.PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;

if (!PRIVY_APP_ID || !PRIVY_APP_SECRET) {
    process.exit(1);
}

const privy = new PrivyClient(PRIVY_APP_ID, PRIVY_APP_SECRET);

export { privy };