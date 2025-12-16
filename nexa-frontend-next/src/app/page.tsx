import { Navbar } from "@/presentation/components/landing/navbar"
import { Hero } from "@/presentation/components/landing/hero"
import { Footer } from "@/presentation/components/landing/footer"

export default function LandingPage() {
  return (
    <div className="min-h-screen transition-colors duration-300 bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
      </main>
      <Footer />
    </div>
  )
}
