import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

import HeroSection from "@/components/sections/HeroSection";
import ProblemSection from "@/components/sections/ProblemSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import TrustSection from "@/components/sections/TrustSection";
import CtaSection from "@/components/sections/CtaSection";
import { Helmet } from "react-helmet";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>CUB Co-Parenting App</title>
        <meta
          name="description"
          content="CUB brings structure, clarity, and calm to co-parenting — track schedules, communicate safely, and stay aligned for your child."
        />
        <meta property="og:title" content="CUB Calm Co-Parenting App" />
        <meta
          property="og:description"
          content="CUB brings structure, clarity, and calm to co-parenting — track schedules, communicate safely, and stay aligned for your child."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yourdomain.com" />
        <meta
          property="og:image"
          content="https://yourdomain.com/og-image.png"
        />

        {/* Structured JSON-LD for SEO */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "CUB Co-Parenting App",
            "url": "https://yourdomain.com",
            "description": "CUB brings structure, clarity, and calm to co-parenting — track schedules, communicate safely, and stay aligned for your child.",
            "publisher": {
              "@type": "Organization",
              "name": "CUB",
              "logo": {
                "@type": "ImageObject",
                "url": "https://yourdomain.com/og-image.png"
              }
            }
          })}
        </script>
      </Helmet>

      <div className="gradient-bg flex-1">
        <Navbar />

        <main>
          <HeroSection />
          <ProblemSection />
          <HowItWorksSection />
          <FeaturesSection />
          <TrustSection />
          <CtaSection />
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Index;
