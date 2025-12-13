import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Calendar,
  MessageSquare,
  BookOpen,
  Shield,
  Heart,
  Users,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Shared Calendar",
    description: "Coordinate schedules seamlessly with a shared custody calendar that keeps everyone informed.",
    color: "bg-cub-sage-light text-cub-sage",
  },
  {
    icon: MessageSquare,
    title: "Secure Messaging",
    description: "Communicate respectfully with built-in moderation tools and message history.",
    color: "bg-cub-coral-light text-cub-coral",
  },
  {
    icon: BookOpen,
    title: "Child Journal",
    description: "Document milestones, moods, and special moments to share with your co-parent.",
    color: "bg-cub-honey-light text-cub-honey",
  },
  {
    icon: Shield,
    title: "Neutral Moderation",
    description: "Optional third-party oversight ensures productive, child-focused conversations.",
    color: "bg-cub-lavender-light text-cub-lavender",
  },
];

const benefits = [
  "Reduce conflict with structured communication",
  "Keep children at the center of every decision",
  "Document important moments for both parents",
  "Access everything from any device",
  "Bank-level security for your family's data",
  "24/7 support when you need it",
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="hero-gradient pt-32 pb-20 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
                Co-Parenting Made Simple
              </span>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Putting Your Child{" "}
                <span className="text-primary">First</span>, Together
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl">
                CUB helps separated parents communicate better, coordinate schedules,
                and focus on what matters most—your children's wellbeing.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register">
                  <Button size="lg" className="gap-2">
                    Get Started Free
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/signin">
                  <Button variant="outline" size="lg">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="bg-card rounded-3xl shadow-soft p-8 relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-cub-sage-light flex items-center justify-center">
                    <Heart className="w-6 h-6 text-cub-sage" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-lg">Today's Focus</p>
                    <p className="text-muted-foreground text-sm">Emma's soccer practice at 4pm</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span className="text-sm">3 visits scheduled this week</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
                    <MessageSquare className="w-5 h-5 text-cub-coral" />
                    <span className="text-sm">2 new messages from Alex</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
                    <BookOpen className="w-5 h-5 text-cub-honey" />
                    <span className="text-sm">New journal entry added</span>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-cub-coral-light rounded-full -z-10 animate-float" />
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-cub-sage-light rounded-full -z-10 animate-float" style={{ animationDelay: "1s" }} />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Co-Parent{" "}
              <span className="text-primary">Peacefully</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our thoughtfully designed tools help you focus on your children,
              not the conflict.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="card-feature group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                Built for Families,{" "}
                <span className="text-primary">By Parents</span>
              </h2>
              <p className="text-muted-foreground mb-8">
                We understand the challenges of co-parenting because we've lived them.
                CUB was designed to reduce stress and put your children first.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-card rounded-3xl shadow-soft p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-cub-honey-light flex items-center justify-center">
                    <Users className="w-8 h-8 text-cub-honey" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-2xl">10,000+</p>
                    <p className="text-muted-foreground">Families Helped</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-medium"
                    >
                      ⭐
                    </div>
                  ))}
                </div>
                <p className="text-muted-foreground text-sm mt-4">
                  "CUB changed how we communicate. Our kids notice the difference."
                </p>
                <p className="font-medium text-sm mt-2">— Sarah M., Mom of 2</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Co-Parenting{" "}
            <span className="text-primary">Better</span>?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of families who have transformed their co-parenting
            relationship with CUB.
          </p>
          <Link to="/register">
            <Button size="lg" className="gap-2">
              Create Free Account
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
