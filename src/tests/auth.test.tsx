import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "./test-utils";
import { AuthPage } from "@/components/auth/AuthPage";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { vi } from "vitest";

vi.mock("@/hooks/useAuth"); // mock for import

const mockUseAuth = useAuth as unknown as ReturnType<typeof vi.fn>;
const SignInPng = "/img/signinpage.png";
const CubLogo = "/images/cublogo.png";

describe("AuthPage & Navbar Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders AuthPage children correctly", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderWithProviders(
      <AuthPage title="Login" illustration={SignInPng}>
        <p>Login Form Here</p>
      </AuthPage>
    );

    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByText("Login Form Here")).toBeInTheDocument();
    expect(screen.getByAltText("Login")).toHaveAttribute("src", "/img/signinpage.png");
  });

  test("Navbar shows auth links when logged out", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderWithProviders(<Navbar />);

    expect(screen.getByText(/register/i)).toBeInTheDocument();
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });

  test("Navbar shows user menu when logged in", () => {
    const mockLogout = vi.fn();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "1", full_name: "Test User", role: "parent" },
      login: vi.fn(),
      register: vi.fn(),
      logout: mockLogout,
    });

    renderWithProviders(<Navbar />);

    expect(screen.queryByText(/register/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
  });

  test("Logout button calls logout function", async () => {
    const mockLogout = vi.fn();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "1", full_name: "Test User", role: "parent" },
      login: vi.fn(),
      register: vi.fn(),
      logout: mockLogout,
    });

    renderWithProviders(<Navbar />);

    await userEvent.click(screen.getByRole("button", { name: /logout/i }));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});