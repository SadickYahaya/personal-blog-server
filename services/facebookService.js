const axios = require('axios');

const titles = [
  '🚀 Exciting News!',
  '🌟 Hot Off the Press!',
  '📣 Big Announcement!',
  '✨ Don’t Miss This!',
  '🔥 Just Published!',
];

const callsToAction = [
  '👉 Dive into the details now!',
  '👉 Check it out and let us know what you think!',
  '👉 Join the conversation!',
  '👉 Explore the full story!',
  '👉 Click to read more!',
];

async function postToFacebook(blogPost) {
  const pageAccessToken = process.env.FACEBOOK_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const apiUrl = `https://graph.facebook.com/v21.0/${pageId}/feed`;

  const randomTitle = titles[Math.floor(Math.random() * titles.length)];
  const formattedDescription = formatDescription(blogPost.description);
  
  const callToAction = (formattedDescription.length < 60000) 
    ? `👉 Visit my blog for more posts like this! ${process.env.FRONTEND_URL}`
    : callsToAction[Math.floor(Math.random() * callsToAction.length)];

  const postData = {
    message: `${randomTitle}\n\n` + 
              `📖 ${blogPost.title}\n\n` + 
              `📝 \n${formattedDescription}\n\n` + 
              `${callToAction}\n\n` + 
              `#BlogPost #NewContent #ReadNow #StayInformed #YourHashtag`,
    link: `${process.env.FRONTEND_URL}/blog-details/${blogPost._id}`,
    access_token: pageAccessToken
  };

  try {
    const response = await axios.post(apiUrl, postData);
    return response.data;
  } catch (error) {
    console.error('Error posting to Facebook:', error.message);
    if (error.response && error.response.status === 403) {
      console.error('Permission issue: Check your access token and permissions.');
    }
    throw error;
  }
}

function formatDescription(deltaDescription) {
  try {
    const descriptionContent = JSON.parse(deltaDescription);
    return descriptionContent.ops.map(op => op.insert || '').join('').trim();
  } catch (error) {
    console.error('Error parsing delta description:', error);
    return 'Description not available.';
  }
}

module.exports = { postToFacebook };