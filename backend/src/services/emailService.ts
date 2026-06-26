import nodemailer from 'nodemailer';

const smtpConfigured =
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS;

const transporter = smtpConfigured
    ? nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT ?? 587),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
          },
      })
    : null;

export const sendOtpEmail = async (email: string, otp: string): Promise<void> => {
    const subject = 'NimbusCloud — Codice di verifica';
    const html = `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
            <h2 style="color: #16a34a; margin-bottom: 8px;">NimbusCloud</h2>
            <p style="color: #374151; line-height: 1.6;">Hai richiesto il reset della password. Usa questo codice OTP:</p>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #15803d;">${otp}</span>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Il codice scade tra 15 minuti. Se non hai richiesto tu il reset, ignora questa email.</p>
        </div>
    `;

    if (!transporter) {
        console.log(`[NimbusCloud OTP] Email: ${email} | Codice: ${otp}`);
        return;
    }

    await transporter.sendMail({
        from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
        to: email,
        subject,
        html,
    });
};
