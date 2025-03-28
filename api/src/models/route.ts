import { pool } from "../lib/pg.js";

export interface Route {
  id: string;
  graphhopper_response: object;
  created_on: string;
  created_by: string;
  modified_on: string;
  modified_by: string;
}

export class RouteModel {
  async create(route: Omit<Route, "id" | "created_on" | "modified_on" | "modified_by">): Promise<Route> {
    try {
      const query = `
        INSERT INTO "route" (
          "graphhopper_response",
          "created_by",
          "modified_by"
        )
        VALUES (
          $1,
          $2,
          $3
        )
        RETURNING
          "id",
          "graphhopper_response",
          "created_on",
          "created_by",
          "modified_on",
          "modified_by"
      `;

      const values = [
        route.graphhopper_response,
        route.created_by,
        route.created_by
      ];

      const client = await pool.connect();
      const result = await client.query<Route>(query, values);
      client.release();
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  async getAll(limit: number = 10, offset: number = 0): Promise<Route[]> {
    try {
      const query = `
        SELECT
          "id",
          "graphhopper_response",
          "created_on",
          "created_by",
          "modified_on",
          "modified_by"
        FROM "route"
        LIMIT $1 
        OFFSET $2
      `;

      const values = [limit, offset];

      const client = await pool.connect();
      const result = await client.query<Route>(query, values);
      client.release();
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async getByUserId(userId: string, limit: number = 10, offset: number = 0): Promise<Route[]> {
    try {
      const query = `
        SELECT
          "id",
          "graphhopper_response",
          "created_on",
          "created_by",
          "modified_on",
          "modified_by"
        FROM "route"
        WHERE "created_by" = $1
        LIMIT $2 
        OFFSET $3
      `;

      const values = [userId, limit, offset];

      const client = await pool.connect();
      const result = await client.query<Route>(query, values);
      client.release();
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async getById(id: string): Promise<Route | null> {
    try {
      const query = `
        SELECT
          "id",
          "graphhopper_response",
          "created_on",
          "created_by",
          "modified_on",
          "modified_by"
        FROM "route"
        WHERE "id" = $1
      `;

      const values = [id];

      const client = await pool.connect();
      const result = await client.query<Route>(query, values);
      client.release();

      if (!result.rowCount || result.rowCount === 0) return null;

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, route: Omit<Route, "id" | "created_on" | "created_by" | "modified_on">): Promise<Route> {
    try {
      const query = `
        UPDATE "route" SET
          "graphhopper_response" = $2,
          "modified_on" = NOW(),
          "modified_by" = $3
        WHERE "id" = $1
        RETURNING
          "id",
          "graphhopper_response",
          "created_on",
          "created_by",
          "modified_on",
          "modified_by"
      `;
      const values = [
        id,
        route.graphhopper_response,
        route.modified_by
      ];

      const client = await pool.connect();
      const result = await client.query<Route>(query, values);
      client.release();
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const query = `
        DELETE FROM "route"
        WHERE "id" = $1
      `;

      const values = [id];

      const client = await pool.connect();
      await client.query(query, values);
      client.release();
    } catch (error) {
      throw error;
    }
  }
}