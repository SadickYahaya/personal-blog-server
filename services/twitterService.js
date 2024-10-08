const { TwitterApi } = require('twitter-api-v2');

async function postToTwitter(blogPost) {
  const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  });

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
  
  // Craft an engaging tweet
  const maxTweetLength = 280;
  const ellipsis = '...';
  const callToAction = 'Check it out:';
  const separator = '\n\n';

  // Create an array of catchy openers
  const openers = [
    "🚀 New blog post alert!",
    "📝 Fresh insights:",
    "🔥 Hot off the press:",
    "💡 Thought-provoking read:",
    "🌟 You won't want to miss this:",
  ];

  // Randomly select an opener
  const opener = openers[Math.floor(Math.random() * openers.length)];

  let tweet = `${opener} "${blogPost.title}"${separator}`;
  const remainingLength = maxTweetLength - tweet.length - blogUrl.length - callToAction.length - 2 * separator.length - ellipsis.length;

  if (descriptionExcerpt.length > remainingLength) {
    // Find the last space within the remaining length to avoid cutting words
    const lastSpaceIndex = descriptionExcerpt.lastIndexOf(' ', remainingLength);
    descriptionExcerpt = descriptionExcerpt.substring(0, lastSpaceIndex > 0 ? lastSpaceIndex : remainingLength).trim() + ellipsis;
  }

  tweet += `${descriptionExcerpt}${separator}${callToAction} ${blogUrl}`;

  // Add relevant hashtags if there's room
  const hashtags = ' #blog #tech #mustread';
  if (tweet.length + hashtags.length <= maxTweetLength) {
    tweet += hashtags;
  }

  console.log('Attempting to post tweet:', tweet);

  try {
    const response = await client.v2.tweet(tweet);
    console.log('Posted to Twitter:', response);
    return response;
  } catch (error) {
    console.error('Error posting to Twitter:', error);
    if (error.data) {
      console.error('Twitter API Error Data:', JSON.stringify(error.data, null, 2));
    }
    throw error;
  }
}

module.exports = { postToTwitter };
