import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AccessRevoked() {
  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 px-4">
        <div className="container max-w-xl mx-auto">
          <Card className="rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle>Access revoked</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your mediator/admin access for this business has been disabled or removed. Your account can still sign in,
                but you can’t access business tools right now.
              </p>
              <div className="flex gap-2">
                <Button asChild variant="outline" className="rounded-full">
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
                <Button asChild className="rounded-full">
                  <Link to="/signin">Sign in again</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

