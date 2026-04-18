import { ViteReactSSG } from "vite-react-ssg";
import { HelmetProvider } from "react-helmet-async";
import { routes } from "./App.tsx";
import "./index.css";

export const createRoot = ViteReactSSG(
  { routes },
  ({ isClient }) => {
    // vite-react-ssg wraps the whole tree in its own HelmetProvider during SSG.
    // On the client it also does the same via its index.mjs bootstrap, so no
    // additional setup is needed here.
  }
);