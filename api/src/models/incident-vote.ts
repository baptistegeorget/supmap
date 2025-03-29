import { pool } from "../lib/pg.js";

export interface IncidentVote {
  id: string;
  value: boolean;
  incident_id: string;
  created_on: string;
  created_by: string;
  modified_on: string;
  modified_by: string;
}

export class IncidentVoteModel {
  async create(incidentVote: Omit<IncidentVote, "id" | "created_on" | "modified_on" | "modified_by">): Promise<IncidentVote> {
    try {
      const query = `
        INSERT INTO incident_vote (
          value, 
          incident_id, 
          created_by,
          modified_by
        ) 
        VALUES (
          $1, 
          $2, 
          $3,
          $3
        ) 
        RETURNING 
          id, 
          value, 
          incident_id, 
          created_on, 
          created_by, 
          modified_on, 
          modified_by
        `;

      const values = [
        incidentVote.value,
        incidentVote.incident_id,
        incidentVote.created_by,
      ];

      const client = await pool.connect();
      const result = await client.query<IncidentVote>(query, values);
      client.release();
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  async getAll(limit: number = 10, offset: number = 0): Promise<IncidentVote[]> {
    try {
      const query = `
        SELECT 
          id, 
          value, 
          incident_id, 
          created_on, 
          created_by, 
          modified_on, 
          modified_by
        FROM incident_vote
        LIMIT $1 
        OFFSET $2
      `;

      const values = [limit, offset];

      const client = await pool.connect();
      const result = await client.query<IncidentVote>(query, values);
      client.release();
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async getByIncidentId(incidentId: string, limit: number = 10, offset: number = 0): Promise<IncidentVote[]> {
    try {
      const query = `
        SELECT 
          id, 
          value, 
          incident_id, 
          created_on, 
          created_by, 
          modified_on, 
          modified_by
        FROM incident_vote
        WHERE incident_id = $1
        LIMIT $2
        OFFSET $3
      `;

      const values = [incidentId, limit, offset];

      const client = await pool.connect();
      const result = await client.query<IncidentVote>(query, values);
      client.release();
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async getByUserId(userId: string, limit: number = 10, offset: number = 0): Promise<IncidentVote[]> {
    try {
      const query = `
        SELECT 
          id, 
          value, 
          incident_id, 
          created_on, 
          created_by, 
          modified_on, 
          modified_by
        FROM incident_vote
        WHERE created_by = $1
        LIMIT $2
        OFFSET $3
      `;

      const values = [userId, limit, offset];

      const client = await pool.connect();
      const result = await client.query<IncidentVote>(query, values);
      client.release();
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async getById(id: string): Promise<IncidentVote | null> {
    try {
      const query = `
        SELECT 
          id, 
          value, 
          incident_id, 
          created_on, 
          created_by, 
          modified_on, 
          modified_by
        FROM incident_vote
        WHERE id = $1
      `;

      const values = [id];

      const client = await pool.connect();
      const result = await client.query<IncidentVote>(query, values);
      client.release();
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, incidentVote: Omit<IncidentVote, "id" | "created_on" | "created_by" | "modified_on">): Promise<IncidentVote> {
    try {
      const query = `
        UPDATE incident_vote
        SET 
          value = $2, 
          incident_id = $3, 
          modified_by = $4,
          modified_on = NOW()
        WHERE id = $1
        RETURNING 
          id, 
          value, 
          incident_id, 
          created_on, 
          created_by, 
          modified_on, 
          modified_by
      `;

      const values = [
        id,
        incidentVote.value,
        incidentVote.incident_id,
        incidentVote.modified_by
      ];

      const client = await pool.connect();
      const result = await client.query<IncidentVote>(query, values);
      client.release();
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const query = `
        DELETE FROM incident_vote
        WHERE id = $1
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