import zod from "zod";

export const emailSchema = zod.string({ required_error: "Email is required" }).email({ message: "Invalid email" });
export const nameSchema = zod.string({ required_error: "Name is required" }).min(1, { message: "Name must be at least 1 character long" }).max(32, { message: "Name must be at most 32 characters long" });
export const passwordSchema = zod.string({ required_error: "Password is required" }).min(12, { message: "Password must be at least 12 characters long" }).max(32, { message: "Password must be at most 32 characters long" });
export const pictureSchema = zod.string({ required_error: "Picture is required" }).url({ message: "Invalid URL" });
export const idSchema = zod.string({ required_error: "ID is required" }).regex(/^[1-9]\d{0,18}$/, { message: "Invalid ID" }).refine((val) => BigInt(val) <= BigInt("9223372036854775807"), { message: "Invalid ID" });
export const positiveIntegerSchema = zod.number({ required_error: "Number is required" }).int({ message: "Number must be an integer" }).positive({ message: "Number must be positive" });

export const createUserSchema = zod.object({
  email: emailSchema,
  name: nameSchema,
  password: passwordSchema,
  picture: pictureSchema.optional()
});

export const updateUserSchema = zod.object({
  email: emailSchema.optional(),
  name: nameSchema.optional(),
  password: passwordSchema.optional(),
  currentPassword: passwordSchema.optional(),
  picture: pictureSchema.optional()
});

export const signInSchema = zod.object({
  email: emailSchema,
  password: passwordSchema
});

export const googleCallbackSchema = zod.object({
  code: zod.string({ required_error: "Code is required" })
});

export const createRouteSchema = zod.object({
  profile: zod.enum([
    "car",
    "car_avoid_motorway",
    "car_avoid_ferry",
    "car_avoid_toll",
    "small_truck",
    "truck",
    "scooter",
    "foot",
    "hike",
    "bike",
    "mtb",
    "racingbike",
    "ecargobike"
  ], { required_error: "Profile is required" }),
  points: zod.array(zod.tuple([zod.number(), zod.number()]), { required_error: "Points are required" }).min(2, { message: "At least 2 points are required" })
});

export const createIncidentSchema = zod.object({
  type: zod.enum([
    "accident",
    "traffic_jam",
    "road_closed"
  ], { required_error: "Type is required" }),
  location: zod.object({
    type: zod.literal("Point"),
    coordinates: zod.tuple([zod.number(), zod.number()])
  }, { required_error: "Location is required" })
});

export const updateIncidentSchema = zod.object({
  type: zod.enum([
    "accident",
    "traffic_jam",
    "road_closed"
  ], { required_error: "Type is required" }).optional(),
  location: zod.object({
    type: zod.literal("Point"),
    coordinates: zod.tuple([zod.number(), zod.number()])
  }, { required_error: "Location is required" }).optional()
});