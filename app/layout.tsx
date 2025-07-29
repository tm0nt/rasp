import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ClientProviders } from "@/components/ClientProviders";
import Script from "next/script";
import { cookies } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

async function getAppConfig() {
  const cookieStore = await cookies();

  const getCookieValue = (name: string) => {
    const value = cookieStore.get(name)?.value;
    return value ? decodeURIComponent(value) : "";
  };

  return {
    data: {
      site_name: getCookieValue("app_site_name"),
      site_description: getCookieValue("app_site_description"),
      seo_meta_keywords: getCookieValue("app_meta_keywords"),
      site_favicon: getCookieValue("app_site_favicon"),
      site_url: getCookieValue("app_site_url"),
      seo_google_analytics: getCookieValue("app_ga_id"),
      seo_facebook_pixel: getCookieValue("app_fb_pixel") || "",
      support_email: getCookieValue("app_support_email"),
      support_phone: getCookieValue("app_support_phone"),
      welcome_bonus: getCookieValue("app_welcome_bonus") || "",
      referral_bonus: getCookieValue("app_referral_bonus") || "",
      min_withdrawal: getCookieValue("app_min_withdrawal") || "",
      maintenance_mode: getCookieValue("app_maintenance_mode") || "false",
      rtp_value: getCookieValue("app_rtp_value") || "",
    },
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const appConfig = await getAppConfig();
  const configData = appConfig?.data || {};

  return {
    title: configData.site_name || "Raspou Ganhou - Raspadinhas Online",
    description:
      configData.site_description ||
      "Jogue raspadinhas online e ganhe prêmios incríveis!",
    keywords: configData.seo_meta_keywords || "raspadinha, jogos online, prêmios, PIX",
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, appConfig] = await Promise.all([
    getServerSession(authOptions),
    getAppConfig(),
  ]);

  const configData = appConfig?.data || {};

  // App configuration
  const appConfigData = {
    siteName: configData.site_name,
    siteUrl: configData.site_url,
    seo_google_analytics: configData.seo_google_analytics,
    seo_facebook_pixel: configData.seo_facebook_pixel,
    supportEmail: configData.support_email,
    supportPhone: configData.support_phone,
    welcomeBonus: configData.welcome_bonus,
    referralBonus: configData.referral_bonus,
    minWithdrawal: configData.min_withdrawal,
    rtpValue: configData.rtp_value,
  };

  return (
    <html lang="pt-BR">
      <head>
        {/* Google Analytics */}
        {appConfigData.seo_google_analytics && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${appConfigData.seo_google_analytics}`}
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${appConfigData.seo_google_analytics}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}

        {/* Facebook Pixel */}
        {appConfigData.seo_facebook_pixel && (
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
                fbq('init', '${appConfigData.seo_facebook_pixel}');
                fbq('track', 'PageView');
            `}
          </Script>
        )}

        {/* Favicon */}
        <link rel="icon" href={configData.site_favicon || "/favicon.ico"} />
      </head>
      <body className={inter.className}>
        <Providers session={session}>
          <ClientProviders appConfig={appConfigData}>{children}</ClientProviders>
        </Providers>

        {/* Facebook Pixel noscript fallback */}
        {appConfigData.seo_facebook_pixel && (
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${appConfigData.seo_facebook_pixel}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        )}
      </body>
    </html>
  );
}
