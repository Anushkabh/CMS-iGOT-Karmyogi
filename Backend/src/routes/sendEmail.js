const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SENDERS_EMAIL,
        pass: process.env.SENDERS_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.SENDERS_EMAIL,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info("Email sent", { to, response: info.response });
    return true;
  } catch (error) {
    logger.error("Error sending email", { to, error: error.message });
    return false;
  }
};

module.exports = { sendEmail };
