import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./App.tsx";
import "./index.css";

export const createRoot = ViteReactSSG(
  { routes },
  ({ router, routes, isClient, initialState }) => {
    // Custom setups if needed
  }
);