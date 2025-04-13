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

interface Stats {
  total_routes: number,
  average_distance_km: number,
  total_distance_km: number,
  total_time: number,
  average_time: number,
  total_signalements: number,
  total_accidents: number,
  total_traffic_jams: number,
  total_road_closed: number,
  total_police_control: number,
  total_roadblock: number
}