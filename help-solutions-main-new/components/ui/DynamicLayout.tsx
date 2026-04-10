'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { supabase } from '../../app/lib/supabase';

// Dynamic imports for non-critical components to reduce main thread work
const WhatsAppButton = dynamic(() => import("../WhatsAppButton"), { ssr: false });
const ScrollToTopButton = dynamic(() => import("../ScrollToTopButton"), { ssr: false });
const LeadAgent = dynamic(() => import("../LeadAgent"), { ssr: false });
const DeferredRender = dynamic(() => import("./DeferredRender"), { ssr: false });

export default function DynamicLayout() {
  const pathname = usePathname();

  useEffect(() => {
    const logVisit = async () => {
      try {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const device = isMobile ? 'Mobile' : 'Desktop';
        
        await fetch('/api/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: pathname,
            device: device,
            location: 'Colombia'
          })
        });
      } catch (err) {
        console.error('Error logging visit:', err);
      }
    };

    logVisit();
  }, [pathname]);

  return (
    <DeferredRender delay={1000}>
      <LeadAgent />
      <WhatsAppButton />
      <ScrollToTopButton />
    </DeferredRender>
  );
}
