import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ClientProviders } from "@/components/ClientProviders";
import Script from 'next/script';
import { cookies } from 'next/headers';

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  
  // Valores padrão caso os cookies não existam
  const defaults = {
    title: "Raspou Ganhou - Raspadinhas Online",
    description: "Jogue raspadinhas online e ganhe prêmios incríveis!",
    keywords: "raspadinha, jogos online, prêmios, PIX",
    siteName: "Raspou Ganhou"
  };

  return {
    title: cookieStore.get('app_site_name')?.value || defaults.title,
    description: cookieStore.get('app_site_description')?.value || defaults.description,
    keywords: cookieStore.get('app_meta_keywords')?.value || defaults.keywords,
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [session, cookieStore] = await Promise.all([
    getServerSession(authOptions),
    cookies()
  ]);

  const gaId = cookieStore.get('app_ga_id')?.value;
  const fbPixel = cookieStore.get('app_fb_pixel')?.value;

  // Configurações básicas do app
  const appConfig = {
    siteName: cookieStore.get('app_site_name')?.value || "Raspou Ganhou",
    seo_google_analytics: gaId,
    seo_facebook_pixel: fbPixel
  };

  return (
    <html lang="pt-BR">
      <head>
        {/* Google Analytics */}
        {gaId && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}

        {/* Facebook Pixel */}
        {fbPixel && (
          <Script id="facebook-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s) {
                if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${fbPixel}');
                fbq('track', 'PageView');
            `}
          </Script>
        )}
      </head>
      <body className={inter.className}>
        <Providers session={session}>
          <ClientProviders appConfig={appConfig}>
            {children}
          </ClientProviders>
        </Providers>

        {/* Facebook Pixel noscript fallback */}
        {fbPixel && (
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${fbPixel}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        )}
      </body>
    </html>
  );
}