import { pool } from "../lib/pg.js";

export namespace Route {
  interface IRoute {
    id: string;
    user_id: string;
    start_point: string;
    end_point: string;
    route: string;
    distance: number;
    duration: number;
    created_at: Date;
  }

  export async function create(userId: string, startPoint: GeometryPoint, endPoint: GeometryPoint, route: GeometryPoint[], distance: number, duration: number) {
    try {
      const startPointValue = `ST_GeomFromText('POINT(${startPoint.longitude} ${startPoint.latitude})', 4326)`;
      const endPointValue = `ST_GeomFromText('POINT(${endPoint.longitude} ${endPoint.latitude})', 4326)`;
      const routeValue = `ST_GeomFromText('LINESTRING(${route.map(point => `${point.longitude} ${point.latitude}`).join(', ')})', 4326)`;

      const query = `INSERT INTO "route" ("user_id", "start_point", "end_point", "route", "distance", "duration") VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
      const values = [userId, startPointValue, endPointValue, routeValue, distance, duration];

      const client = await pool.connect();
      const result = await client.query<IRoute>(query, values);
      client.release();

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  export async function update(id: string, userId: string, startPoint: GeometryPoint, endPoint: GeometryPoint, route: GeometryPoint[], distance: number, duration: number) {
    try {
      const startPointValue = `ST_GeomFromText('POINT(${startPoint.longitude} ${startPoint.latitude})', 4326)`;
      const endPointValue = `ST_GeomFromText('POINT(${endPoint.longitude} ${endPoint.latitude})', 4326)`;
      const routeValue = `ST_GeomFromText('LINESTRING(${route.map(point => `${point.longitude} ${point.latitude}`).join(', ')})', 4326)`;

      const query = `UPDATE "route" SET "user_id" = $2, "start_point" = $3, "end_point" = $4, "route" = $5, "distance" = $6, "duration" = $7 WHERE "id" = $1 RETURNING *`;
      const values = [id, userId, startPointValue, endPointValue, routeValue, distance, duration];

      const client = await pool.connect();
      const result = await client.query<IRoute>(query, values);
      client.release();

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  export async function remove(id: string) {
    try {
      const query = `DELETE FROM "route" WHERE "id" = $1`;
      const values = [id];

      const client = await pool.connect();
      await client.query<IRoute>(query, values);
      client.release();
    } catch (error) {
      throw error;
    }
  }

  export async function findById(id: string) {
    try {
      const query = `SELECT * FROM "route" WHERE "id" = $1 LIMIT 1`;
      const values = [id];

      const client = await pool.connect();
      const result = await client.query<IRoute>(query, values);
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
      const query = `SELECT * FROM "route" LIMIT $1 OFFSET $2`;
      const values = [limit, offset];

      const client = await pool.connect();
      const result = await client.query<IRoute>(query, values);
      client.release();

      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  export async function findByUserId(userId: string, limit: number = 10, offset: number = 0) {
    try {
      const query = `SELECT * FROM "route" WHERE "user_id" = $1 LIMIT $2 OFFSET $3`;
      const values = [userId, limit, offset];

      const client = await pool.connect();
      const result = await client.query<IRoute>(query, values);
      client.release();

      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}