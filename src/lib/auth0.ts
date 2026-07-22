import { Auth0Client } from '@auth0/nextjs-auth0/server';

// Defensive check to prevent build-time warnings/errors when environment variables are missing
const isConfigured = !!(
  process.env.AUTH0_SECRET &&
  (process.env.AUTH0_ISSUER_BASE_URL || process.env.AUTH0_DOMAIN) &&
  (process.env.AUTH0_BASE_URL || process.env.APP_URL) &&
  process.env.AUTH0_CLIENT_ID &&
  process.env.AUTH0_CLIENT_SECRET
);

export const auth0 = isConfigured
  ? new Auth0Client()
  : new Auth0Client({
      secret: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      domain: 'dummy.auth0.com',
      clientId: 'dummy',
      clientSecret: 'dummy'
    });
