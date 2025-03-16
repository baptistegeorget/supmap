import { pool } from "../lib/pg.js";

export namespace Account {
  export interface IAccount {
    id: string;
    userId: number;
    provider: string;
    providerAccountId: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    scope: string;
  }

  export async function create(
    userId: string, 
    provider: string, 
    providerAccountId: string, 
    accessToken: string, 
    refreshToken: string, 
    expiresAt: Date, 
    scope: string
  ) {
    try {
      const query = `
        INSERT INTO "account" (
          "user_id", 
          "provider", 
          "provider_account_id", 
          "access_token", 
          "refresh_token", 
          "expires_at", 
          "scope"
        ) 
        VALUES (
          $1, 
          $2, 
          $3, 
          $4, 
          $5, 
          $6, 
          $7
        ) 
        RETURNING 
          "id", 
          "user_id" AS "userId", 
          "provider", 
          "provider_account_id" AS "providerAccountId", 
          "access_token" AS "accessToken",
          "refresh_token" AS "refreshToken",
          "expires_at" AS "expiresAt",
          "scope"
      `;

      const values = [
        userId, 
        provider, 
        providerAccountId, 
        accessToken, 
        refreshToken, 
        expiresAt, 
        scope
      ];

      const client = await pool.connect();
      const result = await client.query<IAccount>(query, values);
      client.release();
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  export async function findByUserId(
    userId: string
  ) {
    try {
      const query = `
        SELECT 
          "id", 
          "user_id" AS "userId", 
          "provider", 
          "provider_account_id" AS "providerAccountId", 
          "access_token" AS "accessToken",
          "refresh_token" AS "refreshToken",
          "expires_at" AS "expiresAt",
          "scope"
        FROM "account" 
        WHERE "user_id" = $1
      `;

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