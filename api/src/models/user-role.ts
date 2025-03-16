import { pool } from "@lib/pg.js";

export namespace UserRole {
  export interface IUserRole {
    user_id: string;
    role_id: string;
  }

  export async function create(userId: string, roleId: string) {
    try {
      const query = `INSERT INTO "user_role" ("user_id", "role_id") VALUES ($1, $2) RETURNING *`;
      const values = [userId, roleId];

      const client = await pool.connect();
      const result = await client.query<IUserRole>(query, values);
      client.release();

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  export async function remove(userId: string, roleId: string) {
    try {
      const query = `DELETE FROM "user_role" WHERE "user_id" = $1 AND "role_id" = $2`;
      const values = [userId, roleId];

      const client = await pool.connect();
      await client.query(query, values);
      client.release();
    } catch (error) {
      throw error;
    }
  }

  export async function findByUserId(userId: string, limit: number = 10, offset: number = 0) {
    try {
      const query = `SELECT * FROM "user_role" WHERE "user_id" = $1 LIMIT $2 OFFSET $3`;
      const values = [userId, limit, offset];

      const client = await pool.connect();
      const result = await client.query<IUserRole>(query, values);
      client.release();

      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  export async function findByRoleId(roleId: string, limit: number = 10, offset: number = 0) {
    try {
      const query = `SELECT * FROM "user_role" WHERE "role_id" = $1 LIMIT $2 OFFSET $3`;
      const values = [roleId, limit, offset];

      const client = await pool.connect();
      const result = await client.query<IUserRole>(query, values);
      client.release();

      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}