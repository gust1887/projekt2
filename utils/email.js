const nodemailer = require('nodemailer');

// Simpel SMTP-transporter; kan peges på Gmail eller en lokal testserver (MailHog)
const host = process.env.SMTP_HOST || 'smtp.gmail.com';
const port = Number(process.env.SMTP_PORT) || 587;

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465, // Gmail: port 587 med STARTTLS (secure: false), port 465 med SSL (secure: true)
  auth: {
    user: process.env.SMTP_USER, // fx cbs2025dis@gmail.com
    pass: process.env.SMTP_PASS, // app-adgangskode fra Google
  },
});

// Verificer forbindelse til Gmail; log kun fejl/info
transporter.verify((error) => {
  if (error) {
    console.error('SMTP-forbindelse fejlede', error.message);
  } else {
    console.log('SMTP klar til at sende mails');
  }
});

async function sendWelcomeEmail(recipientEmail) {
  const message = {
    from: process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@example.com',
    to: recipientEmail,
    subject: 'Velkommen!',
    text: 'Velkommen til! Din bruger er nu oprettet.',
  };

  await transporter.sendMail(message);
}

module.exports = { sendWelcomeEmail };
