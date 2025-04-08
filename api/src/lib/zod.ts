import {
  string as zodString,
  object as zodObject,
  number as zodNumber,
  enum as zodEnum,
  array as zodArray,
  tuple as zodTuple,
  boolean as zodBoolean
} from "zod";

export const emailSchema = zodString(
  {
    required_error: "Email is required."
  }
).email(
  {
    message: "Invalid email."
  }
).max(
  50,
  {
    message: "Email must be at most 50 characters long."
  }
);

export const userNameSchema = zodString(
  {
    required_error: "Name is required."
  }
).min(
  1,
  {
    message: "Name must be at least 1 character long."
  }
).max(
  32,
  {
    message: "Name must be at most 32 characters long."
  }
);

export const passwordSchema = zodString(
  {
    required_error: "Password is required."

  }
).min(
  12,
  {
    message: "Password must be at least 12 characters long."
  }
).max(
  32,
  {
    message: "Password must be at most 32 characters long."
  }
);

export const pictureSchema = zodString(
  {
    required_error: "Picture is required."
  }
).url(
  {
    message: "Invalid URL."
  }
);

export const idSchema = zodString(
  {
    required_error: "ID is required."
  }
).regex(
  /^[1-9]\d{0,18}$/,
  {
    message: "Invalid ID."
  }
).refine(
  value => BigInt(value) <= 9223372036854775807n,
  {
    message: "Invalid ID."
  }
);

export const limitSchema = zodNumber(
  {
    required_error: "Limit is required."
  }
).int(
  {
    message: "Limit must be an integer."
  }
).positive(
  {
    message: "Limit must be positive."
  }
).max(
  100,
  {
    message: "Limit must be at most 100."
  }
).optional();

export const offsetSchema = zodNumber(
  {
    required_error: "Offset is required."
  }
).int(
  {
    message: "Offset must be an integer."
  }
).nonnegative(
  {
    message: "Offset must be non-negative."
  }
).optional();

export const routingProfileSchema = zodEnum(
  [
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
    "ecargobike",
    "as_the_crow_flies"
  ],
  {
    required_error: "Routing profile is required."
  }
);

export const incidentTypeSchema = zodEnum(
  [
    "accident",
    "traffic_jam",
    "road_closed"
  ],
  {
    required_error: "Incident type is required."
  }
);

export const geometryPointSchema = zodTuple(
  [
    zodNumber(
      {
        required_error: "Longitude is required."
      }
    ).min(
      -180,
      {
        message: "Longitude must be at least -180."
      }
    ).max(
      180,
      {
        message: "Longitude must be at most 180."
      }
    ),
    zodNumber(
      {
        required_error: "Latitude is required."
      }
    ).min(
      -90,
      {
        message: "Latitude must be at least -90."
      }
    ).max(
      90,
      {
        message: "Latitude must be at most 90."
      }
    )
  ]
)

export const postUserSchema = zodObject(
  {
    name: userNameSchema,
    email: emailSchema,
    password: passwordSchema,
    picture: pictureSchema.optional()
  }
);

export const patchUserSchema = zodObject(
  {
    name: userNameSchema.optional(),
    email: emailSchema.optional(),
    password: passwordSchema.optional(),
    picture: pictureSchema.optional(),
    currentPassword: passwordSchema.optional()
  }
);

export const signInSchema = zodObject(
  {
    email: emailSchema,
    password: passwordSchema
  }
);

export const googleCallbackSchema = zodObject(
  {
    code: zodString(
      {
        required_error: "Code is required."
      }
    )
  }
);

export const postRouteSchema = zodObject(
  {
    profile: routingProfileSchema,
    points: zodArray(
      geometryPointSchema,
      {
        required_error: "Points are required."
      }
    ).min(
      2,
      {
        message: "At least 2 points are required."
      }
    )
  }
);

export const patchRouteSchema = zodObject(
  {
    profile: routingProfileSchema,
    points: zodArray(
      geometryPointSchema,
      {
        required_error: "Points are required."
      }
    ).min(
      2,
      {
        message: "At least 2 points are required."
      }
    )
  }
);

export const postIncidentSchema = zodObject(
  {
    type: incidentTypeSchema,
    location: geometryPointSchema
  }
);

export const patchIncidentSchema = zodObject(
  {
    type: incidentTypeSchema.optional(),
    location: geometryPointSchema.optional()
  }
);

export const postIncidentVoteSchema = zodObject(
  {
    value: zodBoolean(
      {
        required_error: "Value is required."
      }
    )
  }
);

export const patchIncidentVoteSchema = zodObject(
  {
    value: zodBoolean(
      {
        required_error: "Value is required."
      }
    ).optional()
  }
);

export const getStatsSchema = zodObject(
  {
    start: zodString(
      {
        required_error: "Start date is required."
      }
    ).regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/,
      {
        message: "Invalid start date format. Use YYYY-MM-DDTHH:MM:SSZ."
      }
    ).refine(
      value => new Date(value).getTime() > 0,
      {
        message: "Invalid start date."
      }
    ).transform(value => new Date(value)),
    end: zodString(
      {
        required_error: "End date is required."
      }
    ).regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/,
      {
        message: "Invalid end date format. Use YYYY-MM-DDTHH:MM:SSZ."
      }
    ).refine(
      value => new Date(value).getTime() > 0,
      {
        message: "Invalid end date."
      }
    ).transform(value => new Date(value))
  }
).refine(
  data => data.start.getTime() < data.end.getTime(),
  {
    message: "Start date must be before end date."
  }
);