import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import IndexPng from "@/assets/images/index page.png";

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
                <img
                src={IndexPng}
                alt="Sign in illustration"
                className="w-full max-w-[200px] h-auto object-contain"
              />
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
