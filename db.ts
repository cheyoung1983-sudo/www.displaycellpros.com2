import { Signer } from "@aws-sdk/rds-signer";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";
import { attachDatabasePool } from "@vercel/functions";
import { Pool, Client } from "pg";

let pool: Pool | null = null;

/**
 * Normalizes host path for Unix Domain Sockets vs TCP hostnames.
 */
function normalizeHost(rawHost: string): { host: string; isUnixSocket: boolean } {
  if (rawHost.startsWith("/")) {
    // If host is a socket path like /app/cloudsql/project:region:instance/.s.PGSQL.5432
    // Strip trailing /.s.PGSQL.5432 or /s.PGSQL.5432 so pg gets the socket directory
    const cleanedHost = rawHost.replace(/\/\.?s\.PGSQL\.\d+$/, "");
    return { host: cleanedHost, isUnixSocket: true };
  }
  return { host: rawHost, isUnixSocket: false };
}

/**
 * Safe helper to check if database configuration is complete.
 */
export function isDbConfigured(): boolean {
  return !!(
    (process.env.SQL_HOST && process.env.SQL_USER) ||
    (process.env.PGHOST && process.env.PGUSER)
  );
}

/**
 * Returns the initialized PostgreSQL connection pool.
 * Implements lazy loading and defensive checks to prevent crashing if environment variables are not yet populated.
 */
export function getDbPool(): Pool {
  if (pool) return pool;

  // Support both Cloud SQL variables (SQL_HOST, SQL_USER) and AWS RDS/custom PG variables
  const rawHost = process.env.SQL_HOST || process.env.PGHOST;
  const user = process.env.SQL_USER || process.env.PGUSER;
  const password = process.env.SQL_PASSWORD || process.env.PGPASSWORD || "";
  const database = process.env.SQL_DB_NAME || process.env.PGDATABASE || "postgres";
  const port = Number(process.env.PGPORT) || 5432;
  const roleArn = process.env.AWS_ROLE_ARN;
  const region = process.env.AWS_REGION || "us-east-1";

  if (!rawHost || !user) {
    throw new Error(
      "PostgreSQL configuration variables (SQL_HOST/SQL_USER or PGHOST/PGUSER) are missing. " +
      "Please configure your environment variables in AI Studio, Vercel, or your local .env file."
    );
  }

  const { host, isUnixSocket } = normalizeHost(rawHost);

  console.log(`[Database] Initializing connection pool to ${isUnixSocket ? 'Unix Socket ' + host : host + ':' + port}/${database} as user ${user}`);

  let passwordOption: any = password;

  if (roleArn && !isUnixSocket) {
    console.log(`[Database] Configuring AWS IAM OIDC Authentication using role: ${roleArn}`);
    try {
      const signer = new Signer({
        hostname: host,
        port: port,
        username: user,
        region: region,
        credentials: awsCredentialsProvider({
          roleArn: roleArn,
          clientConfig: { region: region },
        }),
      });
      passwordOption = () => signer.getAuthToken();
    } catch (err: any) {
      console.warn("[Database] AWS RDS Signer error, falling back to static password:", err.message);
    }
  }

  const poolConfig: any = {
    host,
    user,
    database,
    password: passwordOption,
    port,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };

  if (isUnixSocket) {
    // Unix domain sockets do NOT use SSL in pg
    poolConfig.ssl = false;
  } else {
    // TCP sockets use SSL
    poolConfig.ssl = { rejectUnauthorized: false };
  }

  pool = new Pool(poolConfig);

  // Catch unexpected errors on idle pool clients so they do not crash Node
  pool.on("error", (err) => {
    console.error("[Database Pool Error]: Unexpected error on idle client:", err);
  });

  try {
    attachDatabasePool(pool);
    console.log("[Database] Attached connection pool to @vercel/functions handler.");
  } catch (err: any) {
    console.log(`[Database] Note: attachDatabasePool is not applicable in this context: ${err.message}`);
  }

  return pool;
}

/**
 * Executes a PostgreSQL query.
 * If an explicit database authentication token (such as a 15-minute temporary AWS IAM sign-in token)
 * is passed, it connects via an isolated single-client instance to avoid polluting or leaking the main Pool.
 */
export async function queryWithToken(sql: string, params: any[] = [], token?: string): Promise<any> {
  const rawHost = process.env.SQL_HOST || process.env.PGHOST;
  const user = process.env.SQL_USER || process.env.PGUSER;
  const database = process.env.SQL_DB_NAME || process.env.PGDATABASE || "postgres";
  const port = Number(process.env.PGPORT) || 5432;

  if (token && rawHost && user) {
    const { host, isUnixSocket } = normalizeHost(rawHost);
    console.log(`[Database] Query executing via explicit token connection to ${host}:${port}/${database} as user ${user}`);
    const client = new Client({
      host,
      user,
      database,
      password: token,
      port,
      ssl: isUnixSocket ? false : { rejectUnauthorized: false },
    });
    await client.connect();
    try {
      const result = await client.query(sql, params);
      return result;
    } finally {
      await client.end().catch((err) => console.warn("[Database] Error closing explicit connection:", err));
    }
  }

  // Fallback to global pool
  const standardPool = getDbPool();
  return await standardPool.query(sql, params);
}

