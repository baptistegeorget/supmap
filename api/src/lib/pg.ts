import pg from "pg";

export const pool = new pg.Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT) : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

pg.types.setTypeParser(1082, val => new Date(val));
pg.types.setTypeParser(1114, val => new Date(val));
pg.types.setTypeParser(1184, val => new Date(val));