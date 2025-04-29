interface Polygon {
  type: "Polygon",
  coordinates: Array<Array<[number, number] | [number, number, number]>>,
  bbox?: [number, number, number, number],
  crs?: {
    type: string,
    properties: {
      [key: string]: any
    }
  }
}

interface Point {
  type: "Point",
  coordinates: [number, number],
  bbox?: [number, number, number, number],
  crs?: {
    type: string,
    properties: {
      [key: string]: any
    }
  }
}

interface LineString {
  type: "LineString",
  coordinates: Array<[number, number]>,
  bbox?: [number, number, number, number],
  crs?: {
    type: string,
    properties: {
      [key: string]: any
    }
  }
}

interface Feature {
  type: "Feature",
  id?: string,
  geometry: Polygon | Point | LineString,
  properties?: {
    [key: string]: any
  }
}

interface FeatureCollection {
  type: "FeatureCollection",
  features: Feature[],
  bbox?: [number, number, number, number],
  crs?: {
    type: string,
    properties: {
      [key: string]: any
    }
  }
}

interface Top5DayRoute {
  day: string,
  total_routes: number
}

interface Top5HourRoute{
  hour: number,
  total_routes: number
}
 interface MonthlyIncidents {
  month: number,
  total_incidents: number
 }

 interface RecommendedHour {
  quarter_hour: string;
  traffic_jams: number;
}

interface Stats {
  total_users: number,
  total_routes: number,
  average_distance_km: number,
  total_distance_km: number,
  total_time: number,
  monthly_routes: number,
  average_time: number,
  total_signalements: number,
  total_accidents: number,
  total_traffic_jams: number,
  total_road_closed: number,
  total_police_control: number,
  total_roadblock: number,
  top5_days_routes: Top5DayRoute[],
  top5_hours_routes: Top5HourRoute[],
  monthly_incidents: MonthlyIncidents[],
  recommended_hours: RecommendedHour[],
}

interface UserInfo {
  sub: string,
  name?: string,
  given_name?: string,
  family_name?: string,
  picture?: string,
  email: string,
  email_verified: boolean
}