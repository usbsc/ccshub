import { RouterProvider } from "react-router";
import { router } from "./routes";
import { ThemeProvider } from "./context/ThemeContext";
import { NFHSProvider } from "./context/NFHSContext";

export default function App() {
  return (
    <ThemeProvider>
      <NFHSProvider>
        <RouterProvider router={router} />
      </NFHSProvider>
    </ThemeProvider>
  );
}
