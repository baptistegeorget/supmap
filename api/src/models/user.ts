import { pool } from "../lib/pg.js";

export interface User {
  id: string;
  email: string;
  name: string;
  password: string | null;
  picture: string | null;
  role: "user" | "admin";
  created_on: string;
  modified_on: string;
}

export class UserModel {
  async create(user: Omit<User, "id" | "role" | "created_on" | "modified_on">): Promise<User> {
    try {
      const query = `
        INSERT INTO "user" (
          "email", 
          "name", 
          "password", 
          "picture"
        ) 
        VALUES (
          $1, 
          $2, 
          $3, 
          $4
        ) 
        RETURNING
          "id", 
          "email",
          "name", 
          "password",
          "picture", 
          "role",
          "created_on",
          "modified_on"
      `;

      const values = [
        user.email,
        user.name,
        user.password,
        user.picture
      ];

      const client = await pool.connect();
      const result = await client.query<User>(query, values);
      client.release();
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  async getAll(limit: number = 10, offset: number = 0): Promise<User[]> {
    try {
      const query = `
        SELECT
          "id", 
          "email",
          "name", 
          "password",
          "picture", 
          "role",
          "created_on",
          "modified_on"
        FROM "user" 
        LIMIT $1 
        OFFSET $2
      `;

      const values = [limit, offset];

      const client = await pool.connect();
      const result = await client.query<User>(query, values);
      client.release();
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async getById(id: string): Promise<User | null> {
    try {
      const query = `
        SELECT
          "id", 
          "email",
          "name", 
          "password",
          "picture", 
          "role",
          "created_on",
          "modified_on"
        FROM "user" 
        WHERE "id" = $1 
        LIMIT 1
      `;

      const values = [id];

      const client = await pool.connect();
      const result = await client.query<User>(query, values);
      client.release();
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  async getByEmail(email: string): Promise<User | null> {
    try {
      const query = `
        SELECT
          "id", 
          "email",
          "name", 
          "password",
          "picture", 
          "role",
          "created_on",
          "modified_on"
        FROM "user" 
        WHERE "email" = $1 
        LIMIT 1
      `;

      const values = [email];

      const client = await pool.connect();
      const result = await client.query<User>(query, values);
      client.release();
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  async getStats(start: Date, end: Date): Promise<Stats> {
    try {
      const query = `
          SELECT
            (SELECT COUNT(*) FROM "user" WHERE "created_on" BETWEEN $1 AND $2) AS total_users,
            (SELECT COUNT(*) FROM "route" WHERE "created_on" BETWEEN $1 AND $2) AS total_routes,
            (SELECT ROUND(COALESCE(AVG((graphhopper_response->'paths'->0->>'distance')::FLOAT / 1000), 0)::NUMERIC, 2) FROM "route" WHERE "created_on" BETWEEN $1 AND $2) AS average_distance_km,
            (SELECT ROUND(COALESCE(SUM((graphhopper_response->'paths'->0->>'distance')::FLOAT / 1000), 0)::NUMERIC, 2) FROM "route" WHERE "created_on" BETWEEN $1 AND $2) AS total_distance_km,
            (SELECT json_agg(sub) FROM (SELECT EXTRACT(MONTH FROM "created_on")::INTEGER AS month, COUNT(*) AS user_count FROM "user" WHERE "created_on" BETWEEN $1 AND $2 GROUP BY month ORDER BY month) sub) AS monthly_users,
            (SELECT CONCAT(
              FLOOR(COALESCE(SUM((graphhopper_response->'paths'->2->>'time')::INTEGER), 0) / 1000 / 3600)::INT, 'h',
              FLOOR((COALESCE(SUM((graphhopper_response->'paths'->2->>'time')::INTEGER), 0) / 1000 % 3600) / 60)::INT, 'mn'
            )
            FROM "route"
            WHERE "created_on" BETWEEN $1 AND $2) AS total_time,
            (SELECT CONCAT(
              FLOOR(COALESCE(AVG((graphhopper_response->'paths'->2->>'time')::INTEGER), 0) / 1000 / 3600)::INT, 'h',
              FLOOR((COALESCE(AVG((graphhopper_response->'paths'->2->>'time')::INTEGER), 0) / 1000 % 3600) / 60)::INT, 'mn'
            )
            FROM "route"
            WHERE "created_on" BETWEEN $1 AND $2) AS average_time,
            (SELECT COUNT(*) FROM "incident" WHERE "created_on" BETWEEN $1 AND $2) AS total_signalements,
            (SELECT COUNT(*) FROM "incident" WHERE "type" = 'accident' AND "created_on" BETWEEN $1 AND $2) AS total_accidents,
            (SELECT COUNT(*) FROM "incident" WHERE "type" = 'traffic_jam' AND "created_on" BETWEEN $1 AND $2) AS total_traffic_jams,
            (SELECT COUNT(*) FROM "incident" WHERE "type" = 'road_closed' AND "created_on" BETWEEN $1 AND $2) AS total_road_closed,
            (SELECT COUNT(*) FROM "incident" WHERE "type" = 'police_control' AND "created_on" BETWEEN $1 AND $2) AS total_police_control,
            (SELECT COUNT(*) FROM "incident" WHERE "type" = 'roadblock' AND "created_on" BETWEEN $1 AND $2) AS total_roadblock;
          `;
      const top5DaysQuery = `
        SELECT
          TO_CHAR(created_on, 'YYYY-MM-DD') AS day,
          COUNT(*) AS total_routes
        FROM
          "route"
        WHERE
          created_on BETWEEN $1 AND $2
        GROUP BY
          day
        ORDER BY
          total_routes DESC
        LIMIT 5;
      `;
      const top5HoursQuery = `
        SELECT
          EXTRACT(HOUR FROM created_on)::INTEGER AS hour,
          COUNT(*) AS total_routes
        FROM
          "route"
        WHERE
          created_on BETWEEN $1 AND $2
        GROUP BY
          hour
        ORDER BY
          total_routes DESC
        LIMIT 5;
      `;
      const monthlyIncidentsQuery = `
        SELECT
          EXTRACT(MONTH FROM created_on)::INTEGER AS month,
          COUNT(*) AS incident_count
        FROM
          "incident"
        WHERE
          created_on BETWEEN $1 AND $2
        GROUP BY
          month
        ORDER BY
          month;
      `;

      const values = [start, end];
      const client = await pool.connect();
      const result = await client.query<Stats>(query, values);
      const top5DaysResult = await client.query(top5DaysQuery, [start, end]);
      const top5HoursResult = await client.query(top5HoursQuery, values);
      const monthlyIncidentsResult = await client.query(monthlyIncidentsQuery, [start, end]);
      client.release();
      return {
        ...result.rows[0],
        top5_days_routes: top5DaysResult.rows,
        top5_hours_routes: top5HoursResult.rows,
        monthly_incidents: monthlyIncidentsResult.rows,
      } 
    } catch (error) {
      throw error;
    }
  }

  async getStatsById(id: string, start: Date, end: Date): Promise<Stats> {
    try {
      const query = `
        SELECT 
          (SELECT COUNT(*) FROM "route" WHERE "created_on" BETWEEN $1 AND $2 AND "created_by" = $3) AS total_routes,
          (SELECT ROUND(COALESCE(AVG((graphhopper_response->'paths'->0->>'distance')::FLOAT / 1000), 0)::NUMERIC, 2) FROM "route" WHERE "created_on" BETWEEN $1 AND $2 AND "created_by" = $3) AS average_distance_km,
          (SELECT ROUND(COALESCE(SUM((graphhopper_response->'paths'->0->>'distance')::FLOAT / 1000), 0)::NUMERIC, 2) FROM "route" WHERE "created_on" BETWEEN $1 AND $2 AND "created_by" = $3) AS total_distance_km,
          (SELECT CONCAT(FLOOR(total_ms / 1000 / 3600), 'h', FLOOR((total_ms / 1000 % 3600) / 60), 'mn') FROM (SELECT COALESCE(SUM((graphhopper_response->'paths'->2->>'time')::INTEGER), 0) AS total_ms FROM "route" WHERE "created_on" BETWEEN $1 AND $2) AS subquery) AS total_time,
          (SELECT CONCAT(FLOOR(avg_ms / 1000 / 3600), 'h', FLOOR((avg_ms / 1000 % 3600) / 60), 'mn') FROM (SELECT COALESCE(AVG((graphhopper_response->'paths'->2->>'time')::INTEGER), 0) AS avg_ms FROM "route" WHERE "created_on" BETWEEN $1 AND $2) AS subquery) AS average_time,
          (SELECT COUNT(*) FROM "incident" WHERE "created_on" BETWEEN $1 AND $2 AND "created_by" = $3) AS total_signalements,
          (SELECT COUNT(*) FROM "incident" WHERE "type" = 'accident' AND "created_on" BETWEEN $1 AND $2 AND "created_by" = $3) AS total_accidents,
          (SELECT COUNT(*) FROM "incident" WHERE "type" = 'traffic_jam' AND "created_on" BETWEEN $1 AND $2 AND "created_by" = $3) AS total_traffic_jams,
          (SELECT COUNT(*) FROM "incident" WHERE "type" = 'road_closed' AND "created_on" BETWEEN $1 AND $2 AND "created_by" = $3) AS total_road_closed,
          (SELECT COUNT(*) FROM "incident" WHERE "type" = 'police_control' AND "created_on" BETWEEN $1 AND $2 AND "created_by" = $3) AS total_police_control,
          (SELECT COUNT(*) FROM "incident" WHERE "type" = 'roadblock' AND "created_on" BETWEEN $1 AND $2 AND "created_by" = $3) AS total_roadblock,
          (SELECT json_agg(sub)
            FROM (
              SELECT 
                CASE
                  WHEN EXTRACT(MINUTE FROM created_on) < 15 THEN CONCAT(LPAD(EXTRACT(HOUR FROM created_on)::TEXT, 2, '0'), ':00')
                  WHEN EXTRACT(MINUTE FROM created_on) < 30 THEN CONCAT(LPAD(EXTRACT(HOUR FROM created_on)::TEXT, 2, '0'), ':15')
                  WHEN EXTRACT(MINUTE FROM created_on) < 45 THEN CONCAT(LPAD(EXTRACT(HOUR FROM created_on)::TEXT, 2, '0'), ':30')
                  ELSE CONCAT(LPAD(((EXTRACT(HOUR FROM created_on)::INTEGER + 1) % 24)::TEXT, 2, '0'), ':00')
                END AS quarter_hour,
                COUNT(*) AS traffic_jams
              FROM "incident"
              WHERE "type" = 'traffic_jam'
                AND "created_on" BETWEEN $1 AND $2
                AND "created_by" = $3
              GROUP BY quarter_hour
              ORDER BY traffic_jams DESC
              LIMIT 3
            ) sub
          ) AS recommended_hours
        `;

      const monthlyRoutesQuery = `
        SELECT
          m.month,
          COALESCE(COUNT(r.id), 0) AS route_count
        FROM
          generate_series(1, 12) AS m(month)
        LEFT JOIN route r
          ON EXTRACT(MONTH FROM r.created_on) = m.month
          AND r.created_on BETWEEN $1 AND $2
          AND r.created_by = $3
        GROUP BY m.month
        ORDER BY m.month
      `;

      const values = [start, end, id];

      const client = await pool.connect();
      const result = await client.query<Stats>(query, values);

      const monthlyRoutesResult = await client.query(monthlyRoutesQuery, values);
      const monthlyRoutesArray = Array(12).fill(0);
    
      for (const row of monthlyRoutesResult.rows) {
        const index = parseInt(row.month, 10) - 1;
        monthlyRoutesArray[index] = parseInt(row.route_count, 10);
      }
      
      client.release();
      return {
        ...result.rows[0],
        monthly_routes: monthlyRoutesArray,
      };
        
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, user: Omit<User, "id" | "created_on" | "modified_on">): Promise<User> {
    try {
      const query = `
        UPDATE "user" SET 
          "email" = $2, 
          "name" = $3, 
          "password" = $4, 
          "picture" = $5,
          "role" = $6,
          "modified_on" = NOW() 
        WHERE "id" = $1 
        RETURNING
          "id", 
          "email",
          "name", 
          "password",
          "picture", 
          "role",
          "created_on",
          "modified_on"
      `;

      const values = [
        id,
        user.email,
        user.name,
        user.password,
        user.picture,
        user.role
      ];

      const client = await pool.connect();
      const result = await client.query<User>(query, values);
      client.release();
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const query = `
        DELETE FROM "user" 
        WHERE "id" = $1
      `;

      const values = [id];

      const client = await pool.connect();
      await client.query<User>(query, values);
      client.release();
    } catch (error) {
      throw error;
    }
  }
}