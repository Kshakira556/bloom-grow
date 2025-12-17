import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { User, Mail, Lock } from "lucide-react";

export default function Register() {
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
                {/* Dad with two kids */}
                {/* Dad */}
                <circle cx="100" cy="60" r="25" fill="hsl(25, 45%, 55%)" /> {/* head */}
                <path d="M75 85 Q100 100 125 85 L130 160 H70 Z" fill="hsl(170, 30%, 55%)" /> {/* body */}
                <path d="M80 50 Q100 35 120 50" fill="hsl(25, 30%, 30%)" /> {/* hair */}
                <rect x="75" y="45" width="50" height="8" rx="4" fill="hsl(25, 30%, 30%)" /> {/* beard line */}
                
                {/* Left kid */}
                <circle cx="55" cy="120" r="18" fill="hsl(25, 50%, 65%)" /> {/* head */}
                <path d="M40 138 Q55 148 70 138 L72 180 H38 Z" fill="hsl(200, 50%, 75%)" /> {/* body */}
                
                {/* Right kid */}
                <circle cx="145" cy="120" r="18" fill="hsl(25, 50%, 65%)" /> {/* head */}
                <path d="M130 138 Q145 148 160 138 L162 180 H128 Z" fill="hsl(170, 40%, 70%)" /> {/* body */}
                
                {/* Arms up gestures */}
                <path d="M42 150 L35 130" stroke="hsl(25, 50%, 65%)" strokeWidth="5" strokeLinecap="round" />
                <path d="M68 150 L75 130" stroke="hsl(25, 50%, 65%)" strokeWidth="5" strokeLinecap="round" />
                <path d="M132 150 L125 130" stroke="hsl(25, 50%, 65%)" strokeWidth="5" strokeLinecap="round" />
                <path d="M158 150 L165 130" stroke="hsl(25, 50%, 65%)" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </div>

            {/* Form Side */}
            <div className="md:w-1/2 p-8">
              <h1 className="text-2xl font-display font-bold text-center mb-8">Register</h1>
              
              <div className="space-y-5">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Full Name"
                    className="pl-12 bg-cub-mint-light border-0 rounded-full h-12"
                  />
                </div>

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

                <Button className="w-full rounded-full h-12" asChild>
                  <Link to="/dashboard">Register</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
