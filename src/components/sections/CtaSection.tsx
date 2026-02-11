import { Button } from "../ui/button";

const CtaSection = () => {
  return (
    <section className="py-20 px-4 text-center">
      <div className="w-full text-center px-4 md:px-8">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-primary mb-6">
          Because your child deserves calm.
        </h2>
        <p className="text-foreground/80 mb-8">
          Start building a clearer, calmer co-parenting structure today.
        </p>

        <Button variant="coral" size="xl" aria-label="Start your co-parenting plan">
          Start Your Plan
        </Button>
      </div>
    </section>
  );
};

export default CtaSection;
