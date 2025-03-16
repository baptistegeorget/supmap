import zod from "zod";

export const signInSchema = zod.object({
  email: zod.string({ required_error: "Email is required" })
    .email({ message: "Invalid email" }),
  password: zod.string({ required_error: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(255, { message: "Password must be at most 255 characters long" })
});

export const createUserSchema = zod.object({
  email: zod.string({ required_error: "Email is required" })
    .email({ message: "Invalid email" }),
  name: zod.string({ required_error: "Name is required" })
    .min(1, { message: "Name must be at least 1 character long" })
    .max(255, { message: "Name must be at most 255 characters long" }),
  password: zod.string({ required_error: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(255, { message: "Password must be at most 255 characters long" }),
  picture: zod.string()
    .url({ message: "Invalid URL" })
    .optional()
});

export const updateUserSchema = zod.object({
  email: zod.string()
    .email({ message: "Invalid email" })
    .optional(),
  name: zod.string()
    .min(1, { message: "Name must be at least 1 character long" })
    .max(255, { message: "Name must be at most 255 characters long" })
    .optional(),
  password: zod.string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(255, { message: "Password must be at most 255 characters long" })
    .optional(),
  picture: zod.string()
    .url({ message: "Invalid URL" })
    .optional()
});

export const createRoleSchema = zod.object({
  name: zod.string({ required_error: "Name is required" })
    .min(1, { message: "Name must be at least 1 character long" })
    .max(255, { message: "Name must be at most 255 characters long" }),
  isAdministrator: zod.boolean()
    .optional(),
  canManageUsers: zod.boolean()
    .optional(),
  canManageRoles: zod.boolean()
    .optional(),
  canManageAlerts: zod.boolean()
    .optional()
});

export const updateRoleSchema = zod.object({
  name: zod.string()
    .min(1, { message: "Name must be at least 1 character long" })
    .max(255, { message: "Name must be at most 255 characters long" })
    .optional(),
  isAdministrator: zod.boolean()
    .optional(),
  canManageUsers: zod.boolean()
    .optional(),
  canManageRoles: zod.boolean()
    .optional(),
  canManageAlerts: zod.boolean()
    .optional()
});

export const createRouteSchema = zod.object({
  start: zod.object({
    latitude: zod.number({ required_error: "Latitude is required" }),
    longitude: zod.number({ required_error: "Longitude is required" })
  }),
  end: zod.object({
    latitude: zod.number({ required_error: "Latitude is required" }),
    longitude: zod.number({ required_error: "Longitude is required" })
  })
});

export const idSchema = zod.string({ required_error: "ID is required" })
  .regex(/^[1-9]\d{0,18}$/, { message: "Invalid ID" })
  .refine((val) => BigInt(val) <= BigInt("9223372036854775807"), { message: "Invalid ID" });

export const offsetSchema = zod.string({ required_error: "Offset is required" })
  .regex(/^[0-9]{1,10}$/, { message: "Invalid offset" });

export const limitSchema = zod.string({ required_error: "Limit is required" })
  .regex(/^[0-9]{1,10}$/, { message: "Invalid limit" });