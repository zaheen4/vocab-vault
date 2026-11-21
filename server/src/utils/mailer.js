export async function sendPasswordResetEmail({ email, resetUrl }) {
  const production = process.env.NODE_ENV === 'production'
  const devLinkEnabled = process.env.DEV_RESET_LINK === 'true'

  if (!production && devLinkEnabled) {
    console.log(`[AUTH] Password reset requested for: ${email}`)
    console.log(`[AUTH] Reset URL: ${resetUrl}`)
    return true
  }

  if (!production) {
    console.log('[AUTH] Password reset requested (link withheld; set DEV_RESET_LINK=true to print it)')
    return true
  }

  if (!process.env.SMTP_HOST) {
    console.error('[AUTH] Password reset email not sent: SMTP unavailable')
    return false
  }

  try {
    const nodemailer = await import('nodemailer').catch(() => null)
    if (!nodemailer) {
      console.error('[AUTH] Password reset email not sent: SMTP unavailable')
      return false
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'VocabVault <noreply@vocabvault.local>',
      to: email,
      subject: 'Reset your VocabVault password',
      text: `Hello,\n\nA password reset was requested for your VocabVault account.\nClick the link below to set a new password:\n\n${resetUrl}\n\nThis link is valid for 15 minutes.\nIf you did not request this, you can safely ignore this email.\n`,
    })
    return true
  } catch {
    console.error('[AUTH] Password reset email not sent: SMTP unavailable')
    return false
  }
}
