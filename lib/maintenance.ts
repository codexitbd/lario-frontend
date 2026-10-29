/**
 * The page every visitor gets while Settings → General → Maintenance mode is on.
 * The proxy answers with it directly (status 503, so search engines treat the
 * outage as temporary and keep the site's rankings), which is why it is plain
 * HTML with its styles inline: no route, no fonts, nothing that can itself be
 * mid-change. The admin's light logo is used when it is https (the site's CSP
 * allows no other image origin); otherwise the bundled gold one. English and Arabic together, as the visitor's language is not
 * known for every path.
 */
export type Maintenance = {
  siteName: string
  logo: string | null
  phone: string | null
  message: { en: string | null; ar: string | null }
}

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)

export function maintenancePage({ siteName, logo, phone, message }: Maintenance): string {
  const name = escape(siteName)
  const text = (locale: 'en' | 'ar', fallback: string) =>
    escape(message[locale] || fallback)

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${name}: under maintenance</title>
<style>
  *{box-sizing:border-box;margin:0}
  body{min-height:100vh;display:grid;place-items:center;padding:2rem 1.25rem;background:#0e1413;color:#f4efe6;font-family:Georgia,'Times New Roman',serif;text-align:center}
  main{max-width:34rem}
  img{height:3.5rem;width:auto;margin-bottom:2.5rem}
  h1{font-weight:400;font-size:clamp(1.75rem,1.2rem+2.4vw,2.75rem);line-height:1.15}
  p{margin-top:1rem;color:#bfb9ac;font:1.0625rem/1.7 system-ui,-apple-system,'Segoe UI',sans-serif}
  hr{width:3rem;margin:2.5rem auto;border:0;border-top:1px solid rgba(232,184,96,.5)}
  [dir=rtl] h1,[dir=rtl] p{font-family:'Geeza Pro','Noto Naskh Arabic',Tahoma,sans-serif}
  a{color:#e8b860;text-decoration:none;border-bottom:1px solid rgba(232,184,96,.5)}
</style>
</head>
<body>
<main>
  <img src="${escape(logo?.startsWith('https://') ? logo : '/golden-logo.png')}" alt="${name}">
  <section>
    <h1>We will be back shortly</h1>
    <p>${text('en', 'Our website is under maintenance. Please check back soon.')}</p>
  </section>
  <hr>
  <section dir="rtl" lang="ar">
    <h1>سنعود قريباً</h1>
    <p>${text('ar', 'موقعنا قيد الصيانة. يرجى العودة قريباً.')}</p>
  </section>
  ${phone ? `<hr><p><a href="tel:${escape(phone)}" dir="ltr">${escape(phone)}</a></p>` : ''}
</main>
</body>
</html>`
}
