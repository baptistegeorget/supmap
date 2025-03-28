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

  async update(id: string, user: Omit<User, "id" | "role" | "created_on" | "modified_on">): Promise<User> {
    try {
      const query = `
        UPDATE "user" SET 
          "email" = $2, 
          "name" = $3, 
          "password" = $4, 
          "picture" = $5,
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