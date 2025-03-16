import { pool } from "@lib/pg.js";

export namespace Role {
  export interface IRole {
    id: string;
    name: string;
    is_administrator: boolean;
    can_manage_users: boolean;
    can_manage_roles: boolean;
    can_manage_alerts: boolean;
  }

  export async function create(name: string, isAdministrator?: boolean, canManageUsers?: boolean, canManageRoles?: boolean, canManageAlerts?: boolean) {
    try {
      const query = `INSERT INTO "role" ("name", "is_administrator", "can_manage_users", "can_manage_roles", "can_manage_alerts") VALUES ($1, $2, $3, $4, $5) RETURNING *`;
      const values = [name, isAdministrator || false, canManageUsers || false, canManageRoles || false, canManageAlerts || false];

      const client = await pool.connect();
      const result = await client.query<IRole>(query, values);
      client.release();

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  export async function update(id: string, name: string, isAdministrator?: boolean, canManageUsers?: boolean, canManageRoles?: boolean, canManageAlerts?: boolean) {
    try {
      const query = `UPDATE "role" SET "name" = $1, "is_administrator" = $2, "can_manage_users" = $3, "can_manage_roles" = $4, "can_manage_alerts" = $5 WHERE "id" = $6 RETURNING *`;
      const values = [name, isAdministrator, canManageUsers, canManageRoles, canManageAlerts, id];

      const client = await pool.connect();
      const result = await client.query<IRole>(query, values);
      client.release();

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  export async function remove(id: string) {
    try {
      const query = `DELETE FROM "role" WHERE "id" = $1 RETURNING *`;
      const values = [id];

      const client = await pool.connect();
      await client.query<IRole>(query, values);
      client.release();
    } catch (error) {
      throw error;
    }
  }

  export async function findById(id: string) {
    try {
      const query = `SELECT * FROM "role" WHERE "id" = $1 LIMIT 1`;
      const values = [id];

      const client = await pool.connect();
      const result = await client.query<IRole>(query, values);
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
      const query = `SELECT * FROM "role" LIMIT $1 OFFSET $2`;
      const values = [limit, offset];

      const client = await pool.connect();
      const result = await client.query<IRole>(query, values);
      client.release();

      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  export async function findByName(name: string) {
    try {
      const query = `SELECT * FROM "role" WHERE "name" = $1 LIMIT 1`;
      const values = [name];

      const client = await pool.connect();
      const result = await client.query<IRole>(query, values);
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