import type { Metadata } from "next";
import { Noto_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import DynamicLayout from "../components/ui/DynamicLayout";
import Script from "next/script";
import WhatsAppWidget from "../components/ui/WhatsAppWidget";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.helpsoluciones.com.co"),
  title: {
    default: "Help Soluciones | Mantenimiento de Servidores y Redes TI en Colombia",
    template: "%s | Help Soluciones",
  },
  description: "Expertos en mantenimiento de servidores, cableado estructurado y soporte técnico TI en Colombia. Infraestructura segura 24/7 para su empresa.",
  keywords: ["mantenimiento de servidores", "soporte técnico TI", "cableado estructurado", "redes wifi para empresas", "seguridad informática colombia", "consultoría TI", "Help Soluciones"],
  authors: [{ name: "Help Soluciones" }],
  creator: "Help Soluciones",
  publisher: "Help Soluciones",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: "https://www.helpsoluciones.com.co",
    siteName: "Help Soluciones",
    title: "Help Soluciones | Ingeniería y Soporte TI en Colombia",
    description: "Líderes en infraestructura tecnológica. Mantenimiento preventivo, redes y servidores.",
    images: [
      {
        url: "/images/premium_hero_1.png",
        width: 1200,
        height: 630,
        alt: "Help Soluciones - Infraestructura TI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Help Soluciones | Mantenimiento y Soporte TI",
    description: "Soluciones robustas en servidores y redes para su empresa en Colombia.",
    images: ["/images/premium_hero_1.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://www.helpsoluciones.com.co",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body
        className={`${notoSans.variable} ${spaceGrotesk.variable} antialiased bg-white text-zinc-900 font-body flex flex-col min-h-screen`}
      >
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
        <DynamicLayout />
        <WhatsAppWidget />

        {/* Structured Data (JSON-LD) for Local Business */}
        <Script id="structured-data" type="application/ld+json" strategy="afterInteractive">
          {`
            {
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "Help Soluciones",
              "image": "https://www.helpsoluciones.com.co/images/premium_hero_1.png",
              "@id": "https://www.helpsoluciones.com.co",
              "url": "https://www.helpsoluciones.com.co",
              "telephone": "+573102172251",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Carrera 93 F 127 B 12",
                "addressLocality": "Bogotá",
                "addressCountry": "CO"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 4.711,
                "longitude": -74.0721
              },
              "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday"
                ],
                "opens": "08:00",
                "closes": "18:00"
              },
              "sameAs": [
                "https://www.facebook.com/helpsoluciones",
                "https://www.instagram.com/helpsoluciones"
              ]
            }
          `}
        </Script>

        <Script id="faq-schema" type="application/ld+json" strategy="afterInteractive">
          {`
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "¿Por qué es vital el mantenimiento preventivo de servidores para mi empresa?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "El mantenimiento preventivo garantiza la continuidad de su negocio al detectar fallas potenciales antes de que causen una interrupción. Asegura un uptime del 99.9% mediante optimización y actualizaciones críticas."
                  }
                },
                {
                  "@type": "Question",
                  "name": "¿Qué beneficios ofrece un cableado estructurado certificado?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Un cableado certificado elimina cuellos de botella, reduce interferencias y cumple con normativas internacionales, soportando tecnologías de alta demanda como videollamadas 4K y VoIP sin latencia."
                  }
                },
                {
                  "@type": "Question",
                  "name": "¿Brindan soporte técnico remoto y presencial en toda Colombia?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Sí, ofrecemos soporte técnico remoto inmediato y cobertura presencial en Bogotá y las principales ciudades de Colombia para infraestructura física y hardware."
                  }
                }
              ]
            }
          `}
        </Script>

        {/* HelpMarketer Visitor Tracker */}
        <Script id="helpmarketer-tracker" strategy="afterInteractive">
          {`
(function() {
  var SUPABASE_URL = '${process.env.NEXT_PUBLIC_SUPABASE_URL || ""}';
  var SUPABASE_KEY = '${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""}';

  function getDevice() {
    return /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
  }

  function trackVisit() {
    fetch(SUPABASE_URL + '/rest/v1/visitantes_web', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer':        'return=minimal'
      },
      body: JSON.stringify({
        path:       window.location.pathname || '/',
        device:     getDevice(),
        referrer:   document.referrer || 'Directo',
        user_agent: navigator.userAgent,
        fecha:      new Date().toISOString()
      })
    }).catch(function() {});
  }

  trackVisit();
})();
          `}
        </Script>
      </body>
    </html>
  );
}
