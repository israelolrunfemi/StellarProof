import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Navigation from "@/components/Navigation";
import Sections from "@/components/Sections";

export default function Home() {
  return (
    <div className="min-h-screen bg-darkblue-dark font-sans">
      <Header />
      <Navigation />
      <main className="w-full">
        <Hero />
        <Sections />
      </main>
    </div>
  );
}
