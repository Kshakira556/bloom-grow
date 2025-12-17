import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const features = [
  {
    title: "Control",
    description: "Know your child's whereabout and manage with ease",
  },
  {
    title: "Child-first",
    description: "Ensure your child gets the attention and care they need",
  },
  {
    title: "Mediation",
    description: "Professional guidance and assistance every step of the way",
  },
  {
    title: "Milestones",
    description: "Make sure no parent gets left in the dark using a milestone tracker",
  },
  {
    title: "Vault",
    description: "Emergency vault with your child's important information at hand",
  },
  {
    title: "Messaging",
    description: "Moderated messaging with AI safeguards aids communication",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Gradient Background Section */}
      <div className="gradient-bg flex-1">
        <Navbar />

        {/* Hero Section */}
        <section className="py-12 px-4">
          <div className="container max-w-4xl mx-auto text-center">
            <p className="text-primary font-display text-xl md:text-2xl italic mb-2 animate-fade-in">
              You're not alone, you're amazing, and we're here to help.
            </p>
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-8 animate-slide-up">
              Meet your pocket-sized parenting partner.
            </h1>

            {/* Family Illustration Placeholder */}
            <div className="max-w-md mx-auto mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="aspect-[4/3] bg-gradient-to-br from-cub-teal-light to-cub-mint-light rounded-3xl flex items-center justify-center">
                <svg viewBox="0 0 400 300" className="w-full h-full p-8">
                  {/* Mom figure */}
                  <circle cx="120" cy="100" r="25" fill="hsl(25, 50%, 60%)" /> {/* head */}
                  <path d="M100 130 Q120 140 140 130 L145 200 H95 Z" fill="hsl(0, 0%, 95%)" /> {/* body */}
                  <path d="M95 100 Q85 80 100 70 Q120 60 140 70 Q155 80 145 100" fill="hsl(25, 30%, 25%)" /> {/* hair */}
                  
                  {/* Lightning bolts */}
                  <path d="M165 80 L175 100 L168 100 L178 120 L165 95 L172 95 Z" fill="hsl(45, 90%, 70%)" />
                  <path d="M225 80 L235 100 L228 100 L238 120 L225 95 L232 95 Z" fill="hsl(45, 90%, 70%)" />
                  
                  {/* Dad figure */}
                  <circle cx="280" cy="100" r="25" fill="hsl(25, 40%, 55%)" /> {/* head */}
                  <path d="M260 130 Q280 140 300 130 L305 200 H255 Z" fill="hsl(170, 30%, 60%)" /> {/* body */}
                  <path d="M260 90 Q280 75 300 90" fill="hsl(25, 30%, 30%)" /> {/* hair */}
                  
                  {/* Child figure */}
                  <circle cx="200" cy="150" r="20" fill="hsl(25, 45%, 65%)" /> {/* head */}
                  <path d="M185 170 Q200 178 215 170 L218 230 H182 Z" fill="hsl(170, 40%, 70%)" /> {/* body */}
                  <path d="M185 145 Q200 135 215 145" fill="hsl(25, 30%, 30%)" /> {/* hair */}
                  
                  {/* Hands on child's shoulders (crossed arms pose) */}
                  <ellipse cx="183" cy="178" rx="8" ry="6" fill="hsl(25, 50%, 60%)" />
                  <ellipse cx="217" cy="178" rx="8" ry="6" fill="hsl(25, 40%, 55%)" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* Why CUB Section */}
        <section className="py-12 px-4">
          <div className="container max-w-5xl mx-auto">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-primary text-center mb-12">
              Why CUB?
            </h2>

            {/* Feature Cards Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="bg-card rounded-3xl p-6 shadow-sm text-center animate-slide-up"
                  style={{ 
                    animationDelay: `${index * 0.1}s`,
                    borderRadius: '30px'
                  }}
                >
                  <h3 className="font-display font-bold text-lg text-cub-coral mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-foreground/80 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Index;
