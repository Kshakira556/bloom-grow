import { homeContent } from "@/content/home";
import { delayClass } from "@/utils/animation";

const FeaturesSection = () => {
  return (
    <section className="py-16 px-4">
      <div className="w-full px-4 md:px-8">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-primary text-center mb-12">
          Why CUB?
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {homeContent.features.map((feature, index) => (
            <div
              key={feature.title}
              className={`bg-card rounded-3xl p-6 shadow-sm text-center hover:shadow-md transition animate-slide-up ${delayClass(index)}`}
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
  );
};

export default FeaturesSection;
