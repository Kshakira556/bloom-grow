import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Menu, X, User } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/visits", label: "Visits" },
  { href: "/journal", label: "Journal" },
  { href: "/children", label: "Children" },
];

const authLinks = [
  { href: "/register", label: "Register" },
  { href: "/signin", label: "Sign In" },
];

// CUB Bear Logo Component
function CubLogo({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 48 48" 
      className={className}
      fill="none"
    >
      {/* Main face - light green */}
      <circle cx="24" cy="26" r="18" fill="hsl(145, 50%, 75%)" />
      {/* Left ear */}
      <circle cx="10" cy="14" r="8" fill="hsl(145, 50%, 75%)" />
      <circle cx="10" cy="14" r="5" fill="hsl(145, 45%, 65%)" />
      {/* Right ear */}
      <circle cx="38" cy="14" r="8" fill="hsl(145, 50%, 75%)" />
      <circle cx="38" cy="14" r="5" fill="hsl(145, 45%, 65%)" />
      {/* Eyes */}
      <circle cx="18" cy="24" r="2.5" fill="hsl(170, 45%, 28%)" />
      <circle cx="30" cy="24" r="2.5" fill="hsl(170, 45%, 28%)" />
      {/* Nose */}
      <ellipse cx="24" cy="30" rx="3" ry="2" fill="hsl(170, 45%, 28%)" />
      {/* Mouth */}
      <path d="M21 33 Q24 36 27 33" stroke="hsl(170, 45%, 28%)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <CubLogo className="w-10 h-10" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
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
          {authLinks.map((link) => (
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
          <Link 
            to="/dashboard" 
            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            <User className="w-5 h-5 text-primary-foreground" />
          </Link>
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
            {navLinks.map((link) => (
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
            {authLinks.map((link) => (
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
          </nav>
        </div>
      )}
    </header>
  );
}
