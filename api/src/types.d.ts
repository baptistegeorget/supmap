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