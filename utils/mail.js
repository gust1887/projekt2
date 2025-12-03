const nodemailer = require('nodemailer');

// Simpel opsætning af Gmail-transportør som i et lærereksempel
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'cbs2025test@gmail.com',
        pass: 'testpassword123'
    }
});

// Bekræfter at transportøren er klar
transporter.verify((error, success) => {
    if (error) {
        console.error('Mailer fejl', error);
    } else {
        console.log('Mailer klar til at sende e-mails');
    }
});

// Enkel hjælpefunktion til at sende mails
function sendMail(to, subject, text) {
    const mailOptions = {
        from: 'CBS-2025 <cbs2025test@gmail.com>',
        to,
        subject,
        text
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
