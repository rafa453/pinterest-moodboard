import { Resend } from 'resend'

const FROM = process.env.RESEND_FROM_EMAIL ?? 'Moodboard <noreply@moodboard.app>'

export async function sendRecoveryEmail(
  to: string,
  boardSlug: string,
  editToken: string
) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const boardUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${boardSlug}?token=${editToken}`

  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Token akses board kamu',
    html: `
      <!DOCTYPE html>
      <html lang="id">
      <head><meta charset="UTF-8"></head>
      <body style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 16px;color:#09090B;">
        <p style="margin-bottom:16px;">Kamu meminta token edit untuk board moodboard kamu.</p>
        <p style="margin-bottom:8px;font-weight:500;">Token edit:</p>
        <pre style="background:#f4f4f5;padding:12px 16px;border-radius:6px;font-size:13px;word-break:break-all;">${editToken}</pre>
        <p style="margin-top:24px;margin-bottom:8px;">Atau klik link ini untuk langsung masuk ke mode edit:</p>
        <a href="${boardUrl}" style="display:inline-block;background:#27272a;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px;margin-bottom:32px;">
          Buka Board →
        </a>
        <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0;">
        <p style="font-size:12px;color:#64748b;">
          Jangan bagikan token ini ke siapa pun. Token ini memberikan akses edit penuh ke board kamu.
        </p>
      </body>
      </html>
    `,
  })
}
