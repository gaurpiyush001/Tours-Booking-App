// Creating Email utility Function Handler
const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

//whenever we want to send a new email, is to import this email class and use it
//new Email(user, url).sendWelcome(); //whenever user sign in our application

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Piyush Gaur <${process.env.EMAIL_FROM}>`;
  }

  //Now creating a method here in order to create a transport
  newTransport() {
    //now here we want to have different transports when we are in production or not
    // console.log(process.send.NODE_ENV);
    if (process.env.NODE_ENV === 'production') {
      //In  Production ---> send real emails by SendGrid
      // console.log('In production for sendgrid', process.env);
      // console.log(process.env.SENDGRID_EMAIL_FROM, 'verified email of sendgrid');
      return nodemailer.createTransport({
        service: 'SendGrid', //In nodemailer some services are already pre-defined such as nodemailer, so we no need to specify server and the port explicitly
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD
        }
      });
    }
    //In development ---> we can use mailtrap application
    return nodemailer.createTransport({
      //service: 'Gmail',
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
      // we should activate "less secure app" option in our gmail account
    });
  }

  //send Method ->This will do actual sending and this will recieve a template and a subject
  async send(template /*pugtemplate*/, subject) {
    //this is a broad send function
    // Send the actual email
    // 1) Render HTML based on a pug template
    //In past we generally just create a template and pass the name of template in render function as a response
    //So render function behind the scenes create HTML based on pug tmeplates and send it to client
    //------------BUT IN THIS CASE WE DO NOT WANT TO RENDER, BUT JUST want to create html from template and send that html as EMAIL
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    }); //this will take a file and render a pug code into a REAL HTML

    // 2) Define email options
    const mailOptions = {
      from: process.env.SENDGRID_EMAIL_FROM,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html)
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  // below is a specific send function, when a new user signs in out website
  async sendWelcome() {
    console.log('testing for sendgrid in welcome');
    //this will call send with the template and the subject, that we want for this email
    await this.send('welcome', 'Welcome to my Tour Boooking App!'); //so this will help us in creating different emails in all kinds of different situations
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)'
    );
  }
};

//below we will pass various field values of an email like, where we want to send an emailTo, the SubjectLine, emailContent
//nodemailer have some pre-defined services for which we don't need to configure options manually
//const sendEmail = async options => {
// 1) Create a transporter
//transporter is basically a service(for ex-:gmail) that will actually responsible for sending the email, bcz its not NodeJs which will send the email Itself
//So we need to always create a transporter and thats always the same no matter which sevice we are using
/*const transporter = nodemailer.createTransport({
    //service: 'Gmail',
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
    // we should activate "less secure app" option in our gmail account
  });*/

// 2) Define the email options
// const mailOptions = {
//   from: 'Piyush Gaur <gaurpiyush001@gmail.com>',
//   to: options.email,
//   subject: options.subject,
//   text: options.message
// };

// 3) Actually send the email with nodemailer, below is an Asynchronous function
// await transporter.sendMail(mailOptions);
//};
// module.exports = sendEmail;
