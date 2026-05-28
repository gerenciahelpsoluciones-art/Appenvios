import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "A&L Soluciones Integrales S.A.S. | Eventos, Catering y Suministros en Colombia",
  description: "Empresa líder en organización de eventos corporativos, marketing experiencial, catering y suministro empresarial en Bogotá y más de 15 ciudades de Colombia. Más de 10 años de experiencia.",
  keywords: ["organización de eventos Bogotá", "catering corporativo Colombia", "marketing experiencial", "suministros empresariales", "eventos corporativos Colombia", "logística de eventos Bogotá", "A&L Soluciones"],
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: "https://www.aylsoluciones.com.co",
    siteName: "A&L Soluciones Integrales S.A.S.",
    title: "A&L Soluciones Integrales | Eventos, Catering y Suministros en Colombia",
    description: "Líderes en organización de eventos corporativos, marketing experiencial, catering y suministro empresarial. Bogotá y más de 15 ciudades.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "A&L Soluciones Integrales" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "A&L Soluciones Integrales | Eventos y Catering en Colombia",
    description: "Líderes en organización de eventos, marketing experiencial y catering corporativo en Colombia.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "A&L Soluciones Integrales S.A.S.",
    "description": "Empresa líder en organización de eventos corporativos, marketing experiencial, catering y suministro empresarial en Colombia.",
    "url": "https://www.aylsoluciones.com.co",
    "telephone": "+573105566421",
    "email": "gerencia@ayl.com",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Bogotá",
      "addressCountry": "CO"
    },
    "areaServed": "Colombia",
    "priceRange": "$$",
    "openingHours": "Mo-Fr 08:00-18:00",
    "sameAs": []
  };

  return (
    <html lang="es" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
