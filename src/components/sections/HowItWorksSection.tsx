import { homeContent } from "@/content/home";
import { delayClass } from "@/utils/animation";

const HowItWorksSection = () => {
  return (
    <section className="py-16 px-4">
      <div className="w-full text-center px-4 md:px-8">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-primary mb-12">
          How It Works
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {homeContent.steps.map((step, index) => (
            <div
              key={step.number}
              className={`bg-card rounded-3xl p-6 shadow-sm text-center animate-slide-up ${delayClass(index)}`}
            >
              <div className="text-cub-coral font-display text-3xl font-bold mb-3">
                {step.number}
              </div>
              <h3 className="font-display font-semibold mb-2">
                {step.title}
              </h3>
              <p className="text-foreground/80 text-sm">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
