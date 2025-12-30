import { Navbar } from "@/presentation/components/landing/navbar"
import { Hero } from "@/presentation/components/landing/hero"
import { Benefits } from "@/presentation/components/landing/benefits"
import { HowItWorks } from "@/presentation/components/landing/how-it-works"
import { WhyNexaSection } from "@/presentation/components/landing/why-nexa"
import { Pricing } from "@/presentation/components/landing/pricing"
import { Footer } from "@/presentation/components/landing/footer"
import { Testimonials } from "@/presentation/components/landing/testimonials"
import { FAQ } from "@/presentation/components/landing/faq"
import { FinalCTA } from "@/presentation/components/landing/final-cta"

export default function LandingPage() {
  return (
    <div className="min-h-screen transition-colors duration-300 bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <WhyNexaSection />
        <HowItWorks />
        <Testimonials />
        <Benefits />
        <Pricing />
        <FinalCTA />
        <FAQ />
      </main>
      <Footer />
    </div>
  )
}
