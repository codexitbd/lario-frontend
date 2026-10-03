import Script from 'next/script'
import type { Settings } from '@/lib/schemas'

/**
 * Analytics and pixels the admin switched on (Settings → Tracking & scripts).
 * An empty ID renders nothing. IDs are validated by the backend and
 * JSON-encoded here, so none can break out of its script. proxy.ts opens the
 * Content-Security-Policy for exactly these hosts.
 */
export function TrackingHead({ tracking }: { tracking: Settings['tracking'] }) {
  const id = (value: string | null | undefined) => JSON.stringify(value ?? '')

  return (
    <>
      {tracking.gtm_id ? (
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',${id(tracking.gtm_id)});`}
        </Script>
      ) : null}

      {tracking.ga4_id ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(tracking.ga4_id)}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${id(tracking.ga4_id)});`}
          </Script>
        </>
      ) : null}

      {tracking.meta_pixel_id ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${id(tracking.meta_pixel_id)});fbq('track','PageView');`}
        </Script>
      ) : null}

      {tracking.tiktok_pixel_id ? (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load(${id(tracking.tiktok_pixel_id)});ttq.page();}(window,document,'ttq');`}
        </Script>
      ) : null}

      {tracking.snap_pixel_id ? (
        <Script id="snap-pixel" strategy="afterInteractive">
          {`(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u);})(window,document,'https://sc-static.net/scevent.min.js');snaptr('init',${id(tracking.snap_pixel_id)});snaptr('track','PAGE_VIEW');`}
        </Script>
      ) : null}
    </>
  )
}

/** First thing in <body>: the GTM no-JS frame and the admin's early custom code. */
export function TrackingBodyStart({ tracking }: { tracking: Settings['tracking'] }) {
  return (
    <>
      {tracking.gtm_id ? (
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(tracking.gtm_id)}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
      ) : null}
      {/* Admin code runs as written on a full page load (Settings → Tracking & scripts). */}
      {tracking.custom_head ? <div hidden dangerouslySetInnerHTML={{ __html: tracking.custom_head }} /> : null}
      {tracking.custom_body_start ? <div hidden dangerouslySetInnerHTML={{ __html: tracking.custom_body_start }} /> : null}
    </>
  )
}

export function TrackingBodyEnd({ tracking }: { tracking: Settings['tracking'] }) {
  return tracking.custom_body_end ? <div hidden dangerouslySetInnerHTML={{ __html: tracking.custom_body_end }} /> : null
}
