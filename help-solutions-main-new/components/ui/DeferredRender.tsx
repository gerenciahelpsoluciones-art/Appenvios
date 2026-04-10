'use client';

import React, { useState, useEffect } from 'react';

interface DeferredRenderProps {
  children: React.ReactNode;
  delay?: number;
}

const DeferredRender: React.FC<DeferredRenderProps> = ({ children, delay = 2000 }) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Render after delay
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, delay);

    // Or render on scroll
    const handleScroll = () => {
      setShouldRender(true);
      window.removeEventListener('scroll', handleScroll);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [delay]);

  if (!shouldRender) return null;

  return <>{children}</>;
};

export default DeferredRender;
