import { Signer } from "@aws-sdk/rds-signer";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";
import { attachDatabasePool } from "@vercel/functions";
import { Pool, Client } from "pg";

let pool: Pool | null = null;

/**
 * Returns the initialized PostgreSQL connection pool.
 * Implements lazy loading and defensive checks to prevent crashing if environment variables are not yet populated.
 */
export function getDbPool(): Pool {
  if (pool) return pool;

  const host = process.env.PGHOST;
  const user = process.env.PGUSER;
  const roleArn = process.env.AWS_ROLE_ARN;
  const region = process.env.AWS_REGION || "us-east-1";
  const port = Number(process.env.PGPORT) || 5432;
  const database = process.env.PGDATABASE || "postgres";

  if (!host || !user) {
    throw new Error(
      "PostgreSQL configuration variables (PGHOST, PGUSER) are missing. " +
      "Please configure your environment variables in Vercel or your local .env file."
    );
  }

  console.log(`[Database] Initializing connection pool to ${host}:${port}/${database} as user ${user}`);

  let passwordOption: any;

  if (roleArn) {
    console.log(`[Database] Configuring AWS IAM OIDC Authentication using role: ${roleArn}`);
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
  } else {
    console.log("[Database] No AWS_ROLE_ARN detected. Defaulting to standard password authentication.");
    passwordOption = process.env.PGPASSWORD || "";
  }

  pool = new Pool({
    host,
    user,
    database,
    password: passwordOption,
    port,
    ssl: { rejectUnauthorized: false },
  });

  try {
    attachDatabasePool(pool);
    console.log("[Database] Attached connection pool to @vercel/functions handler.");
  } catch (err: any) {
    console.log(`[Database] Note: attachDatabasePool is not applicable in this runtime context: ${err.message}`);
  }

  return pool;
}

/**
 * Executes a PostgreSQL query.
 * If an explicit database authentication token (such as a 15-minute temporary AWS IAM sign-in token)
 * is passed, it connects via an isolated single-client instance to avoid polluting or leaking the main Pool.
 */
export async function queryWithToken(sql: string, params: any[] = [], token?: string): Promise<any> {
  const host = process.env.PGHOST;
  const user = process.env.PGUSER;
  const port = Number(process.env.PGPORT) || 5432;
  const database = process.env.PGDATABASE || "postgres";

  if (token) {
    console.log(`[Database] Query executing via explicit token connection to ${host}:${port}/${database} as user ${user}`);
    const client = new Client({
      host,
      user,
      database,
      password: token,
      port,
      ssl: { rejectUnauthorized: false },
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

/**
 * Safe helper to check if database configuration is complete.
 */
export function isDbConfigured(): boolean {
  return !!(process.env.PGHOST && process.env.PGUSER);
}
