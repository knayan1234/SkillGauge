/**
 * React Router Configuration
 */
import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/landing.tsx"),
  route("setup", "routes/setup.tsx"),
  route("interview", "routes/interview.tsx"),
  route("*", "routes/notfound.tsx"),
] satisfies RouteConfig;
