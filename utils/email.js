const nodemailer = require("nodemailer");
const sendEmail = async options => {
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: "ahmedhorizon2021@gmail.com",
        pass: "fbkyptkxtufrwgwh",
    },
});

const mailOptions = {
    from: 'OptiTrack_Team <optitrack>',
    to: options.email,
    subject: options.subject,
    html: `
            <div style="text-align: center;">
                <h1 style="color: #444;">${options.subject}</h1>
                <img src="cid:unique@gitttt.gif" style="width: 50%; height: 50%;" />
<p style="font-size: 15px;">${options.message}</p>            </div>
        `,
    attachments: [{
        filename: 'gitttt.gif',
        path: __dirname + '/gitttt.gif', // replace with the path to your gif
        cid: 'unique@gitttt.gif' // same cid value as in the html img src
    }]
};

// 3) Actually send the email
await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
