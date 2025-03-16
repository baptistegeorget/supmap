import { pool } from "../lib/pg.js";

export namespace Route {
  interface IRoute {
    id: string;
    userId: string;
    start: any;
    end: any;
    route: any;
    distance: number;
    duration: number;
    createdAt: Date;
  }

  export async function create(
    userId: string, 
    start: [number, number], 
    end: [number, number], 
    route: Array<[number, number]>, 
    distance: number, 
    duration: number
  ) {
    try {
      const query = `
        INSERT INTO "route" (
          "user_id", 
          "start", 
          "end", 
          "route", 
          "distance", 
          "duration"
        ) 
        VALUES (
          $1, 
          ST_GeomFromText('POINT(${start[1]} ${start[0]})', 4326), 
          ST_GeomFromText('POINT(${end[1]} ${end[0]})', 4326), 
          ST_GeomFromText('LINESTRING(${route.map(([latitude, longitude]) => `${longitude} ${latitude}`).join(', ')})', 4326), 
          $2, 
          $3
        )
        RETURNING 
          "id",
          "user_id" AS "userId",
          ST_AsGeoJSON("start") AS "start",
          ST_AsGeoJSON("end") AS "end",
          ST_AsGeoJSON("route") AS "route",
          "distance",
          "duration",
          "created_at" AS "createdAt"
      `;

      const values = [
        userId, 
        distance, 
        duration
      ];

      const client = await pool.connect();
      const result = await client.query<IRoute>(query, values);
      client.release();
      result.rows[0].start = JSON.parse(result.rows[0].start);
      result.rows[0].end = JSON.parse(result.rows[0].end);
      result.rows[0].route = JSON.parse(result.rows[0].route);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}