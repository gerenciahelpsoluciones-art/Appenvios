import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Supplies from "@/components/Supplies";
import Portfolio from "@/components/Portfolio";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-white">
      <Header />
      <Hero />
      <Services />
      <Supplies />
      <Portfolio />
      <Contact />
      <Footer />
    </main>
  );
}
