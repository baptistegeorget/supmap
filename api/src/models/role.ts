import { pool } from "../lib/pg.js";

export namespace Role {
  export interface IRole {
    id: string;
    name: string;
    isAdministrator: boolean;
    canManageUsers: boolean;
    canManageRoles: boolean;
    canManageAlerts: boolean;
  }

  export async function create(
    name: string, 
    isAdministrator: boolean = false, 
    canManageUsers: boolean = false, 
    canManageRoles: boolean = false, 
    canManageAlerts: boolean = false
  ) {
    try {
      const query = `
        INSERT INTO "role" (
          "name", 
          "is_administrator", 
          "can_manage_users", 
          "can_manage_roles", 
          "can_manage_alerts"
        ) 
        VALUES (
          $1, 
          $2, 
          $3, 
          $4, 
          $5
        ) 
        RETURNING
          "id",
          "name",
          "is_administrator" AS "isAdministrator",
          "can_manage_users" AS "canManageUsers",
          "can_manage_roles" AS "canManageRoles",
          "can_manage_alerts" AS "canManageAlerts"
      `;

      const values = [
        name, 
        isAdministrator, 
        canManageUsers, 
        canManageRoles, 
        canManageAlerts
      ];

      const client = await pool.connect();
      const result = await client.query<IRole>(query, values);
      client.release();
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  export async function update(
    id: string, 
    name: string, 
    isAdministrator: boolean, 
    canManageUsers: boolean, 
    canManageRoles: boolean, 
    canManageAlerts: boolean
  ) {
    try {
      const query = `
        UPDATE "role" SET 
          "name" = $1, 
          "is_administrator" = $2, 
          "can_manage_users" = $3, 
          "can_manage_roles" = $4, 
          "can_manage_alerts" = $5 
        WHERE "id" = $6 
        RETURNING
          "id",
          "name",
          "is_administrator" AS "isAdministrator",
          "can_manage_users" AS "canManageUsers",
          "can_manage_roles" AS "canManageRoles",
          "can_manage_alerts" AS "canManageAlerts"
      `;

      const values = [
        name, 
        isAdministrator, 
        canManageUsers, 
        canManageRoles, 
        canManageAlerts, 
        id
      ];

      const client = await pool.connect();
      const result = await client.query<IRole>(query, values);
      client.release();
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  export async function remove(
    id: string
  ) {
    try {
      const query = `
        DELETE FROM "role" 
        WHERE "id" = $1 
      `;

      const values = [id];

      const client = await pool.connect();
      await client.query<IRole>(query, values);
      client.release();
    } catch (error) {
      throw error;
    }
  }

  export async function findById(
    id: string
  ) {
    try {
      const query = `
        SELECT
          "id",
          "name",
          "is_administrator" AS "isAdministrator",
          "can_manage_users" AS "canManageUsers",
          "can_manage_roles" AS "canManageRoles",
          "can_manage_alerts" AS "canManageAlerts"
        FROM "role" 
        WHERE "id" = $1 
        LIMIT 1
      `;

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

  export async function findAll(
    limit: number = 10, 
    offset: number = 0
  ) {
    try {
      const query = `
        SELECT
          "id",
          "name",
          "is_administrator" AS "isAdministrator",
          "can_manage_users" AS "canManageUsers",
          "can_manage_roles" AS "canManageRoles",
          "can_manage_alerts" AS "canManageAlerts"
        FROM "role" 
        LIMIT $1 
        OFFSET $2`
      ;

      const values = [
        limit, 
        offset
      ];

      const client = await pool.connect();
      const result = await client.query<IRole>(query, values);
      client.release();
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  export async function findByName(
    name: string
  ) {
    try {
      const query = `
        SELECT
          "id",
          "name",
          "is_administrator" AS "isAdministrator",
          "can_manage_users" AS "canManageUsers",
          "can_manage_roles" AS "canManageRoles",
          "can_manage_alerts" AS "canManageAlerts"
        FROM "role" 
        WHERE "name" = $1 
        LIMIT 1
      `;

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