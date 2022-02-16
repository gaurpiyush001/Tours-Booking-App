// Creating Email utility Function Handler
const nodemailer = require('nodemailer');
//below we will pass various field values of an email like, where we want to send an emailTo, the SubjectLine, emailContent
//nodemailer have some pre-defined services for which we don't need to configure options manually
const sendEmail = async options => {
  // 1) Create a transporter
  //transporter is basically a service(for ex-:gmail) that will actually responsible for sending the email, bcz its not NodeJs which will send the email Itself
  //So we need to always create a transporter and thats always the same no matter which sevice we are using
  const transporter = nodemailer.createTransport({
    //service: 'Gmail',
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
    // we should activate "less secure app" option in our gmail account
  });

  // 2) Define the email options
  const mailOptions = {
    from: 'Piyush Gaur <gaurpiyush001@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
  };

  // 3) Actually send the email with nodemailer, below is an Asynchronous function
  await transporter.sendMail(mailOptions);
};
module.exports = sendEmail;
