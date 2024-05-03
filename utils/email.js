const nodemailer = require("nodemailer");
const sendEmail = async options => {
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
        user: "ahmedhorizon2021@gmail.com",
        pass: "fbkyptkxtufrwgwh",
    },
});

// async..await is not allowed in global scope, must use a wrapper
const mailOptions = {
    from: 'OptiTrack_Team <optitrack>',
    to: options.email,
    subject: options.subject,
    text: options.message
    // html:
};

// 3) Actually send the email
await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
