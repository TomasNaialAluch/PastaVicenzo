import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { ProcessSection } from "@/components/process-section"
import { AboutSection } from "@/components/about-section"
import { SocialContact } from "@/components/social-contact"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <ProcessSection />
        <AboutSection />
        <SocialContact />
      </main>
      <Footer />
    </div>
  )
}
