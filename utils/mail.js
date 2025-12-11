require('dotenv').config();
const nodemailer = require('nodemailer');

// Simpel opsætning af Gmail-transportør, nu med konfiguration fra .env
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Bekræfter at transportøren er klar
transporter.verify((error) => {
    if (error) {
        console.error('Mailer fejl', error);
    } else {
        console.log('Mailer klar til at sende e-mails');
    }
});

// Enkel hjælpefunktion til at sende mails
const sendMail = (to, subject, text, html) => {
    const mailOptions = {
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
        html
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.error('Kunne ikke sende mail', err);
            return;
        }
        console.log('Mail sendt:', info.response);
    });
}

module.exports = { sendMail };
