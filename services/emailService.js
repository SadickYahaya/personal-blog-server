const Subscriber = require('../models/Subscriber');
const createTransporter = require('../helpers/emailService');
const QuillDeltaToHtmlConverter = require('quill-delta-to-html').QuillDeltaToHtmlConverter;

async function sendNewsletterEmails(blogPost) {
  try {
    const subscribers = await Subscriber.find().select('email');
    
    console.log('Email configuration:', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: '********' 
      },
    });

    let transporter = createTransporter();

    await transporter.verify();
    console.log('SMTP connection verified successfully');

    for (let subscriber of subscribers) {
      // Parse the description content
      const descriptionContent = JSON.parse(blogPost.description);
      
      // Convert Quill Delta to HTML
      const converter = new QuillDeltaToHtmlConverter(descriptionContent.ops, {});
      const descriptionHtml = converter.convert();

      await transporter.sendMail({
        from: `"Sadiq on Codes" <sadiqoncodes+blog@gmail.com>`,
        to: subscriber.email,
        subject: `${blogPost.title}`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              h1 { color: #2c3e50; margin-bottom: 10px; }
              .meta { font-style: italic; color: #7f8c8d; margin-bottom: 20px; }
              .description { margin-bottom: 30px; }
              .cta-container { text-align: center; margin-bottom: 30px; }
              .cta-button { display: inline-block; background-color: transparent; color: #000000; text-decoration: none; padding: 10px 20px; border-radius: 3px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; font-size: 14px; transition: background-color 0.3s ease; }
              .cta-button:hover { background-color: #2980b9; color: #fff; }
              .footer { margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px; font-size: 12px; color: #7f8c8d; }
              .unsubscribe-link { color: #3498db; text-decoration: none; }
              .author-info { margin-top: 20px; font-style: italic; }
            </style>
          </head>
          <body>
            <h1>${blogPost.title}</h1>
            <p class="meta">By ${blogPost.author} on ${new Date(blogPost.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <div class="description">${descriptionHtml}</div>
            <div class="cta-container">
              <a href="${process.env.FRONTEND_URL}/blog-details/${blogPost._id}" class="cta-button">Read Full Article</a>
            </div>
            <div class="footer">
            <div class="author-info" style="margin-top: 30px; padding: 20px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="font-weight: bold; color: #2c3e50; margin-bottom: 5px;">Abubakar Sadick Yahaya</p>
            <p style="color: #34495e; font-style: italic; margin-bottom: 10px;">Software Developer</p>
            <a href="mailto:sadickashton@live.com" style="color: #3498db; text-decoration: none;">sadickashton@live.com</a>
            </div>
            </div>
            <p>You received this email because you're subscribed to our blog updates. If you no longer wish to receive these emails, you can <a href="${process.env.FRONTEND_URL}/unsubscribe/${subscriber._id}" class="unsubscribe-link">unsubscribe here</a>.</p>
          </body>
          </html>
        `,
      });
    }
    console.log('All newsletter emails sent successfully');
  } catch (error) {
    console.error('Error sending newsletter emails:', error);
    throw error;
  }
}

module.exports = { sendNewsletterEmails };
