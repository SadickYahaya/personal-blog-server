const axios = require('axios');

async function postToLinkedIn(blogPost) {
  try {
    const accessToken = process.env.LINKEDIN_ACCESS_TOKEN; 
    const shareContent = {
      author: `urn:li:person:${process.env.LINKEDIN_PERSON_ID}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: `Check out my new blog post: ${blogPost.title}`
          },
          shareMediaCategory: 'ARTICLE',
          media: [{
            status: 'READY',
            description: {
              text: blogPost.description.substring(0, 200) + '...'
            },
            originalUrl: `${process.env.YOUR_WEBSITE_URL}/blog/${blogPost._id}`,
            title: {
              text: blogPost.title
            }
          }]
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    const response = await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      shareContent,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    );

    console.log('LinkedIn post created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error posting to LinkedIn:', error.response ? error.response.data : error.message);
    throw error;
  }
}

module.exports = { postToLinkedIn };
