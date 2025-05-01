import {PrivyClient} from '@privy-io/server-auth';
require('dotenv').config();

const privy = new PrivyClient(process.env.PRIVY_APP_ID || "", process.env.PRIVY_APP_SECRET || "");

export { privy };