import React from 'react';
import Hero from '../components/Hero';
import Services from '../components/Services';
import About from '../components/About';
import DynamicHomeSections from '../components/ui/DynamicHomeSections';
import FAQ from '../components/FAQ';

export default function Home() {
  return (
    <div className="flex justify-center w-full">
      <div className="flex flex-col w-full max-w-[1200px]">
        <Hero />
        <Services />
        <About />
        <FAQ />
        <DynamicHomeSections />
      </div>
    </div>
  );
}