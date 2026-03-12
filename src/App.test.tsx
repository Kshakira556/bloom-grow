import { render } from "@testing-library/react";
import App from "./App";
import { AuthProvider } from "@/context/AuthContext";

describe("App", () => {
  it("renders without crashing", () => {
    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    );

    expect(document.body).toBeInTheDocument();
  });
});