import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Menu, X, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import CubLogoPng from "@/assets/images/cub logo.png";

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth(); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Add Moderator link if user is a mediator
  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/visits", label: "Visits" },
    { href: "/messages", label: "Messages" },
    { href: "/journal", label: "Journal" },
    { href: "/children", label: "Children" },
    ...(isAuthenticated && (user?.role === "mediator" || user?.role === "admin")
        ? [{ href: "/admin/moderator", label: "Moderator" }]
        : []),
  ];

  const authLinks = [
    { href: "/register", label: "Register" },
    { href: "/signin", label: "Sign In" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src={CubLogoPng}
            alt="CUB Logo"
            className="w-12 h-12 object-contain"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {isAuthenticated &&
            navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "nav-link",
                  location.pathname === link.href && "active"
                )}
              >
                {link.label}
              </Link>
            ))}
        </nav>

        {/* Auth Links + Profile */}
        <div className="hidden md:flex items-center gap-4">
          {!isAuthenticated ? (
            authLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "nav-link",
                  location.pathname === link.href && "active"
                )}
              >
                {link.label}
              </Link>
            ))
          ) : (
            <>
              <button
                onClick={handleLogout}
                className="nav-link text-red-500 hover:text-red-600"
              >
                Logout
              </button>

              <Link
                to="/dashboard"
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                <User className="w-5 h-5 text-primary-foreground" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-secondary/50 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-card border-b border-border shadow-lg animate-slide-up">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {isAuthenticated &&
              navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-xl transition-colors",
                    location.pathname === link.href
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary"
                  )}
                >
                  {link.label}
                </Link>
              ))}

            <hr className="my-2 border-border" />

            {!isAuthenticated
              ? authLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "px-4 py-3 rounded-xl transition-colors",
                      location.pathname === link.href
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-secondary"
                    )}
                  >
                    {link.label}
                  </Link>
                ))
              : (
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-4 py-3 rounded-xl text-left text-red-500 hover:bg-secondary"
                >
                  Logout
                </button>
              )}
          </nav>
        </div>
      )}
    </header>
  );
}
