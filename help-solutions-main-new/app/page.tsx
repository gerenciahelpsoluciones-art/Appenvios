import React from 'react';
import Hero from '../components/Hero';
import TrustBadges from '../components/TrustBadges';
import Services from '../components/Services';
import About from '../components/About';
import HelpDesk from '../components/HelpDesk';
import DynamicHomeSections from '../components/ui/DynamicHomeSections';
import FAQ from '../components/FAQ';

export default function Home() {
  return (
    <div className="flex justify-center w-full">
      <div className="flex flex-col w-full max-w-[1200px]">
        <Hero />
        <TrustBadges />
        <Services />
        <About />
        <HelpDesk />
        <FAQ />
        <DynamicHomeSections />
      </div>
    </div>
  );
}