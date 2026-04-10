'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const ContactCTA = dynamic(() => import("../ContactCTA"), { ssr: false });
const Certifications = dynamic(() => import("../Certifications"), { ssr: false });

export default function DynamicHomeSections() {
  return (
    <>
      <ContactCTA />
      <Certifications />
    </>
  );
}
