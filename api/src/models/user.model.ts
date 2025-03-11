import { pool } from "../lib/pg.js";

export namespace User {
  export interface IUser {
    id: string;
    name: string;
    email: string;
    password: string | null;
    picture: string | null;
    created_at: Date;
  }

  export async function create(email: string, name: string, password?: string, picture?: string) {
    try {
      const query = `INSERT INTO "user" ("email", "name", "password", "picture") VALUES ($1, $2, $3, $4) RETURNING *`;
      const values = [email, name, password, picture];

      const client = await pool.connect();
      const result = await client.query<IUser>(query, values);
      client.release();

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  export async function update(id: string, email: string, name: string, password?: string, picture?: string) {
    try {
      const query = `UPDATE "user" SET "email" = $2, "name" = $3, "password" = $4, "picture" = $5 WHERE "id" = $1 RETURNING *`;
      const values = [id, email, name, password, picture];

      const client = await pool.connect();
      const result = await client.query<IUser>(query, values);
      client.release();

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  export async function remove(id: string) {
    try {
      const query = `DELETE FROM "user" WHERE "id" = $1`;
      const values = [id];

      const client = await pool.connect();
      await client.query<IUser>(query, values);
      client.release();
    } catch (error) {
      throw error;
    }
  }

  export async function findById(id: string) {
    try {
      const query = `SELECT * FROM "user" WHERE "id" = $1 LIMIT 1`;
      const values = [id];

      const client = await pool.connect();
      const result = await client.query<IUser>(query, values);
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
      const query = `SELECT * FROM "user" LIMIT $1 OFFSET $2`;
      const values = [limit, offset];

      const client = await pool.connect();
      const result = await client.query<IUser>(query, values);
      client.release();

      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  export async function findByEmail(email: string) {
    try {
      const query = `SELECT * FROM "user" WHERE "email" = $1 LIMIT 1`;
      const values = [email];

      const client = await pool.connect();
      const result = await client.query<IUser>(query, values);
      client.release();

      if (!result.rowCount || result.rowCount === 0) {
        return null
      }

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}