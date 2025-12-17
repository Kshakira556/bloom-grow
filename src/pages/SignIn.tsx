import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import { Mail, Lock } from "lucide-react";

export default function SignIn() {
  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-3xl">
          {/* Auth Card with Illustration */}
          <div className="bg-card rounded-3xl shadow-lg overflow-hidden flex flex-col md:flex-row">
            {/* Illustration Side */}
            <div className="md:w-1/2 bg-gradient-to-br from-cub-teal-light to-cub-mint-light p-8 flex items-center justify-center">
              <svg viewBox="0 0 200 200" className="w-full max-w-[200px]">
                {/* Mother holding baby */}
                <circle cx="100" cy="70" r="30" fill="hsl(25, 50%, 60%)" /> {/* head */}
                <path d="M70 100 Q100 120 130 100 L140 180 H60 Z" fill="hsl(165, 40%, 70%)" /> {/* body */}
                <path d="M60 70 Q50 50 70 40 Q100 25 130 40 Q150 50 140 70" fill="hsl(25, 30%, 25%)" /> {/* hair */}
                {/* Baby */}
                <circle cx="115" cy="130" r="18" fill="hsl(25, 45%, 65%)" /> {/* baby head */}
                <ellipse cx="115" cy="155" rx="12" ry="15" fill="hsl(200, 60%, 80%)" /> {/* baby body */}
                {/* Arms holding baby */}
                <path d="M80 120 Q100 140 110 145" stroke="hsl(25, 50%, 60%)" strokeWidth="8" fill="none" strokeLinecap="round" />
                <path d="M120 120 Q115 140 115 145" stroke="hsl(25, 50%, 60%)" strokeWidth="8" fill="none" strokeLinecap="round" />
              </svg>
            </div>

            {/* Form Side */}
            <div className="md:w-1/2 p-8">
              <h1 className="text-2xl font-display font-bold text-center mb-8">Sign In</h1>
              
              <div className="space-y-5">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email ID"
                    className="pl-12 bg-cub-mint-light border-0 rounded-full h-12"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Password"
                    className="pl-12 bg-cub-mint-light border-0 rounded-full h-12"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember" className="border-primary data-[state=checked]:bg-primary" />
                    <label htmlFor="remember" className="text-muted-foreground cursor-pointer">
                      Remember me
                    </label>
                  </div>
                  <Link to="/forgot-password" className="text-primary hover:underline italic">
                    Forgot password?
                  </Link>
                </div>

                <Button className="w-full rounded-full h-12" asChild>
                  <Link to="/dashboard">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
