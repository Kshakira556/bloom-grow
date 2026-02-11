import IndexPng from "@/assets/images/index page.png";
import { delayClass } from "@/utils/animation";
import { Button } from "../ui/button";

const HeroSection = () => {
  return (
    <section className="py-16 px-4">
      <div className="w-full text-center px-4 md:px-8">
        <p className="text-primary font-display text-xl md:text-2xl italic mb-3 animate-fade-in">
          You're not alone, you're amazing, and we're here to help.
        </p>

        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-6 animate-slide-up">
          Meet your pocket-sized parenting partner.
        </h1>

        <p className="text-foreground/80 max-w-2xl mx-auto mb-10">
          CUB brings structure, clarity, and calm to co-parenting —
          so your child experiences stability, not stress.
        </p>

        <div className={`max-w-md mx-auto mb-10 animate-fade-in ${delayClass(2, 100)}`}>
            <div className="aspect-[4/3] bg-gradient-to-br from-cub-teal-light to-cub-mint-light rounded-3xl flex items-center justify-center shadow-md">
                <img
                    src={IndexPng}
                    alt="Illustration of calm co-parenting coordination"
                    className="w-full max-w-[220px] h-auto object-contain"
                    />
            </div>
        </div>

        <div className="flex justify-center gap-4 flex-wrap">
          <Button variant="coral" size="lg">
            Get Started
            </Button>
            <Button variant="outline" size="lg">
            Learn More
            </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
