const axios = require('axios');

async function postToFacebook(blogPost) {
  const pageAccessToken = process.env.FACEBOOK_ACCESS_TOKEN; // Ensure this is a page access token
  const pageId = process.env.FACEBOOK_PAGE_ID; // Ensure this is the correct Page ID
  const apiUrl = `https://graph.facebook.com/v21.0/${pageId}/feed`;

  const postData = {
    message: `New blog post: "${blogPost.title}"\n\n${blogPost.description}\n\nRead more: ${process.env.FRONTEND_URL}/blog-details/${blogPost._id}`, // Ensure this URL is publicly accessible
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

module.exports = { postToFacebook };
