import { pool } from "../lib/pg.js";

export namespace Account {
  export interface IAccount {
    id: string;
    user_id: number;
    provider: string;
    provider_account_id: string;
    access_token: string;
    refresh_token: string;
    expires_at: Date;
    scope: string;
  }

  export async function create(userId: string, provider: string, providerAccountId: string, accessToken: string, refreshToken: string, expiresAt: Date, scope: string) {
    try {
      const query = `INSERT INTO "account" ("user_id", "provider", "provider_account_id", "access_token", "refresh_token", "expires_at", "scope") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
      const values = [userId, provider, providerAccountId, accessToken, refreshToken, expiresAt, scope];

      const client = await pool.connect();
      const result = await client.query<IAccount>(query, values);
      client.release();

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  export async function update(id: string, userId: string, provider: string, providerAccountId: string, accessToken: string, refreshToken: string, expiresAt: Date, scope: string) {
    try {
      const query = `UPDATE "account" SET "user_id" = $2, "provider" = $3, "provider_account_id" = $4, "access_token" = $5, "refresh_token" = $6, "expires_at" = $7, "scope" = $8 WHERE "id" = $1 RETURNING *`;
      const values = [id, userId, provider, providerAccountId, accessToken, refreshToken, expiresAt, scope];

      const client = await pool.connect();
      const result = await client.query<IAccount>(query, values);
      client.release();

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  export async function remove(id: string) {
    try {
      const query = `DELETE FROM "account" WHERE "id" = $1`;
      const values = [id];

      const client = await pool.connect();
      await client.query(query, values);
      client.release();
    } catch (error) {
      throw error;
    }
  }

  export async function findById(id: string) {
    try {
      const query = `SELECT * FROM "account" WHERE "id" = $1 LIMIT 1`;
      const values = [id];

      const client = await pool.connect();
      const result = await client.query<IAccount>(query, values);
      client.release();

      if (!result.rowCount || result.rowCount === 0) {
        return null
      }

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  export async function findAll(limit: number = 10, offset: number = 0) {
    try {
      const query = `SELECT * FROM "account" LIMIT $1 OFFSET $2`;
      const values = [limit, offset];

      const client = await pool.connect();
      const result = await client.query<IAccount>(query, values);
      client.release();

      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  export async function findByUserId(userId: string) {
    try {
      const query = `SELECT * FROM "account" WHERE "user_id" = $1`;
      const values = [userId];

      const client = await pool.connect();
      const result = await client.query<IAccount>(query, values);
      client.release();

      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}