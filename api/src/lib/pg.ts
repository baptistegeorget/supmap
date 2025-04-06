import pg from "pg";

if (!process.env.POSTGRES_HOST) throw new Error("Missing environment variable: POSTGRES_HOST");
if (!process.env.POSTGRES_PORT) throw new Error("Missing environment variable: POSTGRES_PORT");
if (!process.env.POSTGRES_DB) throw new Error("Missing environment variable: POSTGRES_DB");
if (!process.env.POSTGRES_USER) throw new Error("Missing environment variable: POSTGRES_USER");
if (!process.env.POSTGRES_PASSWORD) throw new Error("Missing environment variable: POSTGRES_PASSWORD");

const poolConfig: pg.PoolConfig = {
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
};

export const pool = new pg.Pool(poolConfig);