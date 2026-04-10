'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

const ScrollToTopButton: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);

        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <>
            {isVisible && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-28 right-6 z-40 p-3 rounded-full bg-slate-900 text-white shadow-xl transition-all duration-300 hover:bg-primary hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50 animate-in fade-in zoom-in-50"
                    aria-label="Volver arriba"
                >
                    <ArrowUp size={24} />
                </button>
            )}
        </>
    );
};

export default ScrollToTopButton;
