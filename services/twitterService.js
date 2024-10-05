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
  
  // Craft the tweet
  const maxTweetLength = 280;
  const ellipsis = '...';
  const readMore = 'Read more:';
  const separator = '\n\n';

  let tweet = `${blogPost.title}${separator}`;
  const remainingLength = maxTweetLength - tweet.length - blogUrl.length - readMore.length - 2 * separator.length - ellipsis.length;

  if (descriptionExcerpt.length > remainingLength) {
    descriptionExcerpt = descriptionExcerpt.substring(0, remainingLength).trim() + ellipsis;
  }

  tweet += `${descriptionExcerpt}${separator}${readMore} ${blogUrl}`;

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
