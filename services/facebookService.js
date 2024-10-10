const axios = require('axios');

// Arrays of engaging titles and calls to action
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
  const pageAccessToken = process.env.FACEBOOK_ACCESS_TOKEN; // Ensure this is a page access token
  const pageId = process.env.FACEBOOK_PAGE_ID; // Ensure this is the correct Page ID
  const apiUrl = `https://graph.facebook.com/v21.0/${pageId}/feed`;

  // Randomly select a title
  const randomTitle = titles[Math.floor(Math.random() * titles.length)];

  // Format the description
  const formattedDescription = formatDescription(blogPost.description);
  
  // Determine the call to action based on the length of the post
  const callToAction = (formattedDescription.length < 60000) 
    ? `👉 Visit my blog for more posts like this! ${process.env.FRONTEND_URL}`
    : callsToAction[Math.floor(Math.random() * callsToAction.length)];

  const postData = {
    message: `${randomTitle}\n\n` + // Randomly selected engaging title
              `📖 ${blogPost.title}\n\n` + // Bold title for emphasis
              `📝 \n${formattedDescription}\n\n` + // Format the description for readability
              `${callToAction}\n\n` + // Conditional call to action
              `#BlogPost #NewContent #ReadNow #StayInformed #YourHashtag`, // Added hashtags for reach
    link: `${process.env.FRONTEND_URL}/blog-details/${blogPost._id}`, // Ensure this URL is publicly accessible
    access_token: pageAccessToken // Use the page access token
  };

  try {
    const response = await axios.post(apiUrl, postData);
    // Consider checking response data here
    return response.data;
  } catch (error) {
    console.error('Error posting to Facebook:', error.message); // Log the error message
    // ... existing error handling ...
    if (error.response && error.response.status === 403) {
      console.error('Permission issue: Check your access token and permissions.');
    }
    throw error; // Rethrow the error after logging
  }
}

// Function to format the delta description into a readable format
function formatDescription(deltaDescription) {
  try {
    const descriptionContent = JSON.parse(deltaDescription);
    return descriptionContent.ops.map(op => op.insert || '').join('').trim(); // Convert delta to plain text
  } catch (error) {
    console.error('Error parsing delta description:', error);
    return 'Description not available.'; // Fallback in case of error
  }
}

module.exports = { postToFacebook };
