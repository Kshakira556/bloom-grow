import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "./test-utils";
import SignIn from "@/pages/SignIn";
import { useAuth } from "@/hooks/useAuth";
import { vi } from "vitest";

vi.mock("@/hooks/useAuth");

const mockUseAuth = useAuth as unknown as ReturnType<typeof vi.fn>;

describe("SignIn Page / AuthForm Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("submits correctly with valid credentials", async () => {
    const mockLogin = vi.fn().mockResolvedValue({ id: "1", role: "parent" });
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: mockLogin,
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderWithProviders(<SignIn />);

    // Simulate user typing
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await userEvent.type(emailInput, "test@test.com");
    await userEvent.type(passwordInput, "password123");
    await userEvent.click(submitButton);

    // Ensure login is called with correct values
    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockLogin).toHaveBeenCalledWith("test@test.com", "password123");
  });

  test("shows validation errors for empty fields and prevents submission", async () => {
    const mockLogin = vi.fn();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: mockLogin,
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderWithProviders(<SignIn />);

    // Inputs should be empty initially
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    expect(emailInput).toHaveValue("");
    expect(passwordInput).toHaveValue("");

    // Click submit without typing
    await userEvent.click(submitButton);

    // Ensure required fields are present and login is not called
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
    expect(mockLogin).not.toHaveBeenCalled(); // should prevent submission
  });
  
  test("prevents submission with empty fields", async () => {
    const mockLogin = vi.fn();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: mockLogin,
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderWithProviders(<SignIn />);

    const submitButton = screen.getByRole("button", { name: /sign in/i });
    
    // Try submitting empty form
    await userEvent.click(submitButton);

    // Login should NOT be called
    expect(mockLogin).not.toHaveBeenCalled();
  });
});
