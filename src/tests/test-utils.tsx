import React, { ReactNode } from "react";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";

// Add more providers here if needed (VaultContext, PlanContext, etc.)

interface RenderWithProvidersProps {
  children: ReactNode;
}

/**
 * Custom render wrapper for RTL tests.
 * Automatically wraps with Router + global providers.
 */
export const renderWithProviders = (
  ui: React.ReactElement
) => {
  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
    <AuthProvider>
      <BrowserRouter>{children}</BrowserRouter>
    </AuthProvider>
  );

  return render(ui, { wrapper: Wrapper });
};
