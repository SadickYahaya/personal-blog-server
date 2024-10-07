const axios = require('axios');

async function postToLinkedIn(blogPost) {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  const personId = process.env.LINKEDIN_PERSON_ID;

  // Extract a plain text excerpt from the description
  let descriptionExcerpt = '';
  try {
    const descriptionContent = JSON.parse(blogPost.description);
    descriptionExcerpt = descriptionContent.ops.map(op => op.insert || '').join('').trim();
  } catch (error) {
    console.error('Error parsing description:', error);
    descriptionExcerpt = 'Check out my latest blog post!';
  }

  const blogUrl = `${process.env.FRONTEND_URL}/blog-details/${blogPost._id}`;
  
  // Craft the LinkedIn post
  const maxPostLength = 3000; // LinkedIn's character limit for posts
  const ellipsis = '...';
  const readMore = 'Read more:';
  const separator = '\n\n';

  let post = `${blogPost.title}${separator}`;
  const remainingLength = maxPostLength - post.length - blogUrl.length - readMore.length - 2 * separator.length - ellipsis.length;

  if (descriptionExcerpt.length > remainingLength) {
    descriptionExcerpt = descriptionExcerpt.substring(0, remainingLength).trim() + ellipsis;
  }

  post += `${descriptionExcerpt}${separator}${readMore} ${blogUrl}`;

  console.log('Attempting to post to LinkedIn:', post);

  const payload = {
    author: `urn:li:person:${personId}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: post
        },
        shareMediaCategory: 'NONE'
      }
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
    }
  };

  try {
    const response = await axios.post('https://api.linkedin.com/v2/ugcPosts', payload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    console.log('Posted to LinkedIn:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error posting to LinkedIn:', error.response ? error.response.data : error.message);
    throw error;
  }
}

module.exports = { postToLinkedIn };
