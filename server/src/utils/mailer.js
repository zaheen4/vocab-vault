// Development console logger and optional production email transport dispatcher
export async function sendPasswordResetEmail({ email, resetUrl }) {
  if (process.env.NODE_ENV !== 'production' || !process.env.SMTP_HOST) {
    console.log(`[AUTH] Password reset requested for: ${email}`)
    console.log(`[AUTH] Reset URL: ${resetUrl}`)
    return true
  }

  try {
    const nodemailer = await import('nodemailer').catch(() => null)
    if (!nodemailer) {
      console.warn('[AUTH] SMTP_HOST set but nodemailer unavailable; logging reset link.')
      console.log(`[AUTH] Reset URL for ${email}: ${resetUrl}`)
      return true
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
  } catch (err) {
    console.error('[AUTH] Failed to dispatch password reset email:', err)
    return false
  }
}
