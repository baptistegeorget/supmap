import { pool } from "../lib/pg.js";

export interface Incident {
  id: string;
  type: "accident" | "traffic_jam" | "road_closed";
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  created_on: string;
  created_by: string;
  modified_on: string;
  modified_by: string;
}

export class IncidentModel {
  async create(incident: Omit<Incident, "id" | "created_on" | "modified_on" | "modified_by">): Promise<Incident> {
    try {
      const query = `
        INSERT INTO "incident" (
          "type",
          "location",
          "created_by",
          "modified_by"
        )
        VALUES (
          $1,
          ST_GeomFromGeoJSON($2),
          $3,
          $3
        )
        RETURNING
          "id",
          "type",
          json_build_object(
            'type', 'Point',
            'coordinates', ST_AsGeoJSON("location")::json->'coordinates'
          ) AS "location",
          "created_on",
          "created_by",
          "modified_on",
          "modified_by"
      `;

      const values = [
        incident.type,
        incident.location,
        incident.created_by
      ];

      const client = await pool.connect();
      const result = await client.query<Incident>(query, values);
      client.release();
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  async getAll(limit: number = 10, offset: number = 0): Promise<Incident[]> {
    try {
      const query = `
        SELECT
          "id",
          "type",
          json_build_object(
            'type', 'Point',
            'coordinates', ST_AsGeoJSON("location")::json->'coordinates'
          ) AS "location",
          "created_on",
          "created_by",
          "modified_on",
          "modified_by"
        FROM "incident"
        LIMIT $1 
        OFFSET $2
      `;

      const values = [limit, offset];

      const client = await pool.connect();
      const result = await client.query<Incident>(query, values);
      client.release();
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async getByUserId(userId: string, limit: number = 10, offset: number = 0): Promise<Incident[]> {
    try {
      const query = `
        SELECT
          "id",
          "type",
          json_build_object(
            'type', 'Point',
            'coordinates', ST_AsGeoJSON("location")::json->'coordinates'
          ) AS "location",
          "created_on",
          "created_by",
          "modified_on",
          "modified_by"
        FROM "incident"
        WHERE "created_by" = $1
        LIMIT $2 
        OFFSET $3
      `;

      const values = [userId, limit, offset];

      const client = await pool.connect();
      const result = await client.query<Incident>(query, values);
      client.release();
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async getByLocation(location: { type: "Point"; coordinates: [number, number] }, radius: number = 1000, limit: number = 10, offset: number = 0): Promise<Incident[]> {
    try {
      const query = `
        SELECT
          "id",
          "type",
          json_build_object(
            'type', 'Point',
            'coordinates', ST_AsGeoJSON("location")::json->'coordinates'
          ) AS "location",
          "created_on",
          "created_by",
          "modified_on",
          "modified_by"
        FROM "incident"
        WHERE ST_DWithin(
          "location",
          ST_GeomFromGeoJSON($1),
          $2
        )
        LIMIT $3 
        OFFSET $4
      `;

      const values = [
        location,
        radius,
        limit,
        offset
      ];

      const client = await pool.connect();
      const result = await client.query<Incident>(query, values);
      client.release();
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async getRecents(time: number, limit: number = 10, offset: number = 0): Promise<Incident[]> {
    try {
      const query = `
        SELECT
          i."id",
          i."type",
          json_build_object(
            'type', 'Point',
            'coordinates', ST_AsGeoJSON(i."location")::json->'coordinates'
          ) AS "location",
          i."created_on",
          i."created_by",
          i."modified_on",
          i."modified_by"
        FROM "incident" i
        LEFT JOIN "incident_vote" iv ON i."id" = iv."incident_id"
        WHERE 
          i."created_on" >= NOW() - ($1 || ' milliseconds')::interval
          OR i."modified_on" >= NOW() - ($1 || ' milliseconds')::interval
          OR iv."created_on" >= NOW() - ($1 || ' milliseconds')::interval
          OR iv."modified_on" >= NOW() - ($1 || ' milliseconds')::interval
        LIMIT $2
        OFFSET $3
      `;

      const values = [
        time, 
        limit, 
        offset
      ];

      const client = await pool.connect();
      const result = await client.query<Incident>(query, values);
      client.release();
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async getById(id: string): Promise<Incident | null> {
    try {
      const query = `
        SELECT
          "id",
          "type",
          json_build_object(
            'type', 'Point',
            'coordinates', ST_AsGeoJSON("location")::json->'coordinates'
          ) AS "location",
          "created_on",
          "created_by",
          "modified_on",
          "modified_by"
        FROM "incident"
        WHERE "id" = $1
      `;

      const values = [id];

      const client = await pool.connect();
      const result = await client.query<Incident>(query, values);
      client.release();
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, incident: Omit<Incident, "id" | "created_on" | "created_by" | "modified_on">): Promise<Incident> {
    try {
      const query = `
        UPDATE "incident" SET
          "type" = $2,
          "location" = ST_GeomFromGeoJSON($3),
          "modified_on" = NOW(),
          "modified_by" = $4
        WHERE "id" = $1
        RETURNING
          "id",
          "type",
          json_build_object(
            'type', 'Point',
            'coordinates', ST_AsGeoJSON("location")::json->'coordinates'
          ) AS "location",
          "created_on",
          "created_by",
          "modified_on",
          "modified_by"
      `;

      const values = [
        id,
        incident.type,
        incident.location,
        incident.modified_by
      ];

      const client = await pool.connect();
      const result = await client.query<Incident>(query, values);
      client.release();
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const query = `
        DELETE FROM "incident"
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