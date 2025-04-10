if (!process.env.GRAPHHOPPER_API_KEY) throw new Error("Missing environment variable: GRAPHHOPPER_API_KEY");

const API_KEY = process.env.GRAPHHOPPER_API_KEY;

export type RoutingProfile = "car" | "car_avoid_motorway" | "car_avoid_ferry" | "car_avoid_toll" | "small_truck" | "truck" | "scooter" | "foot" | "hike" | "bike" | "mtb" | "racingbike" | "ecargobike" | "as_the_crow_flies";

export interface CustomModel {
  /**
   * See [speed customization](https://docs.graphhopper.com/openapi/routing/postroute#tag/Custom-Model/Customizing-speed)
   */
  speed?: Array<{
    if?: string,
    else_if?: string,
    else?: string,
    limit_to?: string,
    multiply_by?: string
  }>,
  /**
   * See [priority customization](https://docs.graphhopper.com/openapi/routing/postroute#tag/Custom-Model/Customizing-priority)
   */
  priority?: Array<{
    if?: string,
    else_if?: string,
    else?: string,
    multiply_by?: string
  }>,
  /**
   * Use higher values to prefer shorter routes. See [here](https://docs.graphhopper.com/openapi/routing/postroute#tag/Custom-Model/Customizing-distance_influence) for more details.  
   * Default `70`
   */
  distance_influence?: number,
  /**
   * Areas are given in a GeoJson format as FeatureCollection. See more details and an example [here](https://docs.graphhopper.com/openapi/routing/postroute#tag/Custom-Model/Define-areas).
   */
  areas?: FeatureCollection
}

export interface Options {
  /**
   * The routing profile. It determines the network, speed and other physical attributes used when computing the route. See the section about [routing profiles](https://docs.graphhopper.com/openapi/routing/postroute#tag/Map-Data-and-Routing-Profiles) for more details and valid profile values.  
   * Example: `"bike"`
   */
  profile: RoutingProfile,
  /**
   * The points for the route in an array of `[longitude,latitude]`. For instance, if you want to calculate a route from point A to B to C then you specify `points: [ [A_longitude, A_latitude], [B_longitude, B_latitude], [C_longitude, C_latitude]]`.  
   * Example: `[[11.539421,48.118477],[11.559023,48.12228]]`
   */
  points: [number, number][],
  /**
   * Specifies a hint for each point in the `points` array to prefer a certain street for the closest location lookup. E.g. if there is an address or house with two or more neighboring streets you can control for which street the closest location is looked up. Make sure you do not include the house number of city name and only the street name to improve the quality of the matching.  
   * Example: `["Lindenschmitstraße","Thalkirchener Str."]`
   */
  point_hints?: string[],
  /**
   * 'Snapping' is the process of finding the closest road location for GPS coordinates provided in the `points` array. The `snap_preventions` array allows you to prevent snapping to specific types of roads. For example, if the array includes bridge, then the routing engine will avoid snapping to a bridge, even if it is the closest road for the given point. Note that once snapped the routing algorithm can still route over bridges (or the other values). To avoid this you need to use the `custom_model`.  
   * Example: `["motorway","ferry","tunnel"]`
   */
  snap_preventions?: Array<"motorway" | "trunk" | "bridge" | "ford" | "tunnel" | "ferry">,
  /**
   * It specifies on which side a point should be relative to the driver when she leaves/arrives at a start/target/via point. You need to specify this parameter for either none or all points. Only supported for motor vehicle profiles and OpenStreetMap.  
   * Example: ["any","right"]
   */
  curbsides?: Array<"any" | "right" | "left">,
  /**
   * The locale of the resulting turn instructions. E.g. `pt_PT` for Portuguese or `de` for German.  
   * Default `"en"`
   */
  locale?: string,
  /**
   * If true, a third coordinate, the altitude, is included with all positions in the response. This changes the format of the points and snapped_waypoints fields of the response, in both their encodings. Unless you switch off the points_encoded parameter, you need special code on the client side that can handle three-dimensional coordinates.  
   * Default `false`
   */
  elevation?: boolean,
  /**
   * Read more about the usage of path details [here](https://discuss.graphhopper.com/t/2539).  
   * Example: `["road_class","surface"]`
   */
  details?: Array<"street_name" | "street_ref" | "street_destination" | "leg_time" | "leg_distance" | "roundabout" | "country" | "time" | "distance" | "max_speed" | "max_weight" | "max_width" | "toll" | "road_class" | "road_class_link" | "road_access" | "road_environment" | "hazmat" | "hazmat_tunnel" | "hazmat_water" | "lanes" | "surface" | "smoothness" | "hike_rating" | "mtb_rating" | "foot_network" | "bike_network">,
  /**
   * Normally, the calculated route will visit the points in the order you specified them. If you have more than two points, you can set this parameter to `"true"` and the points may be re-ordered to minimize the total travel time. Keep in mind that the limits on the number of locations of the Route Optimization API applies, and the request costs more credits.  
   * Default `"false"`
   */
  optimize?: "true" | "false",
  /**
   * If instructions should be calculated and returned  
   * Default `true`
   */
  instructions?: boolean,
  /**
   * If the points for the route should be calculated at all.  
   * Default `true`
   */
  calc_points?: boolean,
  /**
   * If `true`, the output will be formatted.  
   * Default `false`
   */
  debug?: boolean,
  /**
   * Allows changing the encoding of location data in the response. The default is polyline encoding, which is compact but requires special client code to unpack. (We provide it in our JavaScript client library!) Set this parameter to `false` to switch the encoding to simple coordinate pairs like `[lon,lat]`, or `[lon,lat,elevation]`. See the description of the response format for more information.  
   * Default `true`
   */
  points_encoded?: boolean,
  /**
   * Use this parameter in combination with one or more parameters from below.  
   * Default `false`
   */
  "ch.disable"?: boolean,
  /**
   * The custom_model modifies the routing behaviour of the specified profile. See the [detailed documentation](https://docs.graphhopper.com/openapi/routing/postroute#tag/Custom-Model). Below is a complete request example in Berlin that limits all speeds to 100km/h, excludes motorways and makes shorter routes a bit more likely than the default due to a higher distance_influence. Note that it also includes the `"ch.disabled": true` parameter which is required to make use of `custom_model`.
   * ```json
   * {
   *   "points": [
   *     [
   *       13.31543,
   *       52.509535
   *     ],
   *     [
   *       13.29779,
   *       52.512434
   *     ]
   *   ],
   *   "profile": "car",
   *   "ch.disable": true,
   *   "custom_model": {
   *     "speed": [
   *       {
   *         "if": "true",
   *         "limit_to": "100"
   *       }
   *     ],
   *     "priority": [
   *       {
   *         "if": "road_class == MOTORWAY",
   *         "multiply_by": "0"
   *       }
   *     ],
   *     "distance_influence": 100
   *   }
   * } 
   * ```
   */
  custom_model?: CustomModel,
  /**
   * Favour a heading direction for a certain point. Specify either one heading for the start point or as many as there are points. In this case headings are associated by their order to the specific points. Headings are given as north based clockwise angle between 0 and 360 degree. This parameter also influences the tour generated with `algorithm=round_trip` and forces the initial direction. Requires `ch.disable=true`.
   */
  headings?: number[],
  /**
   * Time penalty in seconds for not obeying a specified heading. Requires `ch.disable=true`.  
   * Default `300`
   */
  heading_penalty?: number,
  /**
   * If `true`, u-turns are avoided at via-points with regard to the `heading_penalty`. Requires `ch.disable=true`.  
   * Default `false`
   */
  pass_through?: boolean,
  /**
   * Rather than looking for the shortest or fastest path, this parameter lets you solve two different problems related to routing: With `alternative_route`, we give you not one but several routes that are close to optimal, but not too similar to each other. With `round_trip`, the route will get you back to where you started. This is meant for fun (think of a bike trip), so we will add some randomness. The `round_trip` option requires `ch.disable=true`. You can control both of these features with additional parameters, see below.
   */
  algorithm?: "round_trip" | "alternative_route",
  /**
   * If `algorithm=round_trip`, this parameter configures approximative length of the resulting round trip. Requires ch.disable=true.  
   * Default `10000`
   */
  "round_trip.distance"?: number,
  /**
   * If `algorithm=round_trip`, this sets the random seed. Change this to get a different tour for each value.
   */
  "round_trip.seed"?: number,
  /**
   * If `algorithm=alternative_route`, this parameter sets the number of maximum paths which should be calculated. Increasing can lead to worse alternatives.  
   * Default `2`
   */
  "alternative_route.max_paths"?: number,
  /**
   * If `algorithm=alternative_route`, this parameter sets the factor by which the alternatives routes can be longer than the optimal route. Increasing can lead to worse alternatives.  
   * Default `1.4`
   */
  "alternative_route.max_weight_factor"?: number,
  /**
   * If `algorithm=alternative_route`, this parameter specifies how similar an alternative route can be to the optimal route. Increasing can lead to worse alternatives.  
   * Default `0.6`
   */
  "alternative_route.max_share_factor"?: number
}

export interface Headers {
  /**
   * Your current daily credit limit.
   */
  "X-RateLimit-Limit": number,
  /**
   * Your remaining credits until the reset.
   */
  "X-RateLimit-Remaining": number,
  /**
   * The number of seconds that you have to wait before a reset of the credit count is done.
   */
  "X-RateLimit-Reset": number,
  /**
   * The credit costs for this request. Note it could be a decimal and even negative number, e.g. when an async request failed.
   */
  "X-RateLimit-Credits": number
}

export interface Path {
  /**
   * The total distance, in meters. To get this information for one 'leg' please read [this blog post](https://www.graphhopper.com/blog/2019/11/28/routing-api-using-path-details/).
   */
  distance: number,
  /**
   * The total travel time, in milliseconds. To get this information for one 'leg' please read [this blog post](https://www.graphhopper.com/blog/2019/11/28/routing-api-using-path-details/).
   */
  time: number,
  /**
   * The total ascent, in meters.
   */
  ascend: number,
  /**
   * The total descent, in meters.
   */
  descend: number,
  /**
   * The geometry of the route. The format depends on the value of `points_encoded`.
   */
  points: LineString | string,
  /**
   * The snapped input points. The format depends on the value of `points_encoded`.
   */
  snapped_waypoints: LineString | string,
  /**
   * Whether the `points` and `snapped_waypoints` fields are polyline-encoded strings rather than JSON arrays of coordinates. See the field description for more information on the two formats.
   */
  points_encoded: boolean,
  /**
   * The bounding box of the route geometry. Format: `[minLon, minLat, maxLon, maxLat]`.
   */
  bbox: [number, number, number, number],
  /**
   * The instructions for this route. This feature is under active development, and our instructions can sometimes be misleading, so be mindful when using them for navigation.
   */
  instructions: Array<{
    /**
     * A description what the user has to do in order to follow the route. The language depends on the locale parameter.
     */
    text: string,
    /**
     * The name of the street to turn onto in order to follow the route.
     */
    street_name: string,
    /**
     * The distance for this instruction, in meters.
     */
    distance: number,
    /**
     * The duration for this instruction, in milliseconds.
     */
    time: number,
    /**
     * Two indices into `points`, referring to the beginning and the end of the segment of the route this instruction refers to.
     */
    interval: [number, number],
    /**
     * A number which specifies the sign to show:
     * 
     * | Instruction Sign Number | Description                                                                                                            |
     * |-------------------------|------------------------------------------------------------------------------------------------------------------------|
     * | -98                     | an U-turn without the knowledge if it is a right or left U-turn                                                        |
     * | -8                      | a left U-turn                                                                                                          |
     * | -7                      | keep left                                                                                                              |
     * | -6                      | **not yet used**: leave roundabout                                                                                     |
     * | -3                      | turn sharp left                                                                                                        |
     * | -2                      | turn left                                                                                                              |
     * | -1                      | turn slight left                                                                                                       |
     * | 0                       | continue on street                                                                                                     |
     * | 1                       | turn slight right                                                                                                      |
     * | 2                       | turn right                                                                                                             |
     * | 3                       | turn sharp right                                                                                                       |
     * | 4                       | the finish instruction before the last point                                                                           |
     * | 5                       | the instruction before a via point                                                                                     |
     * | 6                       | the instruction before entering a roundabout                                                                           |
     * | 7                       | keep right                                                                                                             |
     * | 8                       | a right U-turn                                                                                                         |
     * | *                       | **For future compatibility** it is important that all clients are able to handle also unknown instruction sign numbers |
     */
    sign: number,
    /**
     * Only available for roundabout instructions (sign is 6). The count of exits at which the route leaves the roundabout.
     */
    exit_number: number,
    /**
     * Only available for roundabout instructions (sign is 6). The radian of the route within the roundabout `0 < r < 2*PI` for clockwise and `-2*PI < r < 0` for counterclockwise turns.
     */
    turn_angle: number
  }>,
  /**
   * Details, as requested with the `details` parameter. Consider the value `{"street_name": [[0,2,"Frankfurter Straße"],[2,6,"Zollweg"]]}`. In this example, the route uses two streets: The first, Frankfurter Straße, is used between `points[0]` and `points[2]`, and the second, Zollweg, between `points[2]` and `points[6]`. Read more about the usage of path details [here](https://discuss.graphhopper.com/t/2539).
   */
  details: any,
  /**
   * An array of indices (zero-based), specifiying the order in which the input points are visited. Only present if the `optimize` parameter was used.
   */
  points_order: number[]
}

export interface Body {
  paths: Array<Path>,
  info: {
    /**
     * Attribution according to our documentation is necessary if no white-label option included.
     */
    copyrights: string[],
    took: number
  }
}

export class GraphHopperError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GraphHopperError";
  }
}

/**
 * Calculate a route
 * @param options Options to calculate the route
 * @returns The route response body
 * @throws Error if the GraphHopper API key is not set or if the request fails
 */
export async function getRoute(options: Options) {
  try {
    const graphhopperResponse = await fetch(`https://graphhopper.com/api/1/route?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(options)
    });

    if (!graphhopperResponse.ok) {
      const message = (await graphhopperResponse.json()).message as string;

      throw new GraphHopperError(message);
    }

    return await graphhopperResponse.json() as Body;
  } catch (error) {
    throw error;
  }
}