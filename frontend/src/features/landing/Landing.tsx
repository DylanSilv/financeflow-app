import { LandingNavbar } from './components/navbar';
import { HeroSection } from './components/hero-section';
import { FeaturesSection } from './components/features-section';
import { PricingSection } from './components/pricing-section';
import { FaqSection } from './components/faq-section';
import { CtaSection } from './components/cta-section';
import { LandingFooter } from './components/footer';

export default function Landing() {
  return (
    <div className="bg-background min-h-screen overflow-x-hidden">
      <LandingNavbar />

      <main>
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <FaqSection />
        <CtaSection />
      </main>

      <LandingFooter />
    </div>
  );
}
