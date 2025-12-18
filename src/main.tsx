import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext.tsx";

// Get the root element
const container = document.getElementById("root")!;

// Create a root and render
createRoot(container).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);