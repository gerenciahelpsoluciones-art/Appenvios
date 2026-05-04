import type { Metadata } from "next";
import { Noto_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import DynamicLayout from "../components/ui/DynamicLayout";
import Script from "next/script";

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
