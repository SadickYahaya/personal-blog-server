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

async function getFacebookAppCredentials() {
  return {
    appId:  process.env.FACEBOOK_APP_ID,
    appSecret: process.env.FACEBOOK_APP_SECRET
  };
}

async function getUserAccessToken() {
  const { appId, appSecret } = await getFacebookAppCredentials();
  try {
    const response = await axios.get('https://graph.facebook.com/v21.0/oauth/access_token', {
      params: {
        client_id: appId,
        client_secret: appSecret,
        grant_type: 'client_credentials',
        scope: 'pages_show_list,pages_read_engagement',
        code:code
      }
    });
    console.log('Successfully retrieved User Access Token'); 
    return response.data.access_token; 
  } catch (error) {
    console.error('Error retrieving User Access Token:', error.message); 
    // throw error;
  }
}

async function getPageAccessToken(userAccessToken, pageId) {
    console.log(pageId, 'page id');
    console.log(userAccessToken, "useraccesstoken");
    try {
        const response = await axios.get(`https://graph.facebook.com/${pageId}`, {
            params: {
                fields: 'access_token', // Request the access token field
                access_token: userAccessToken
            }
        });
        console.log('Successfully retrieved Page Access Token'); 
        console.log(response.data.access_token, "accesstoken");
        return response.data.access_token; 
    } catch (error) {
        console.error('Error retrieving Page Access Token:', error.message); 
        if (error.response) {
            console.error('Response data:', error.response.data); // Log the response data for more context
            console.error('Response status:', error.response.status); // Log the response status
            if (error.response.status === 400) {
                console.error('Bad Request: Check if the page ID is correct and if the access token has the necessary permissions.'); // Specific message for 400
            }
            if (error.response.status === 403) {
                console.error('Permission issue: Check your access token and permissions.'); // Specific message for 403
            }
        }
        return null; // Return null or handle the error as needed
    }
}

async function postToFacebook(blogPost) {
  const userAccessToken = await getUserAccessToken(); 
  console.log(userAccessToken, 'UserToken');
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const pageAccessToken = await getPageAccessToken(userAccessToken, pageId); 
//   console.log(pageAccessToken, 'PageAccessToken');
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
    access_token: pageAccessToken // Use the Page Access Token
  };

  try {
    const response = await axios.post(apiUrl, postData);
    return response.data;
  } catch (error) {
    // console.error('Error posting to Facebook:', error.message);
    // if (error.response && error.response.status === 403) {
    //   console.error('Permission issue: Check your access token and permissions.');
    // }
    // throw error;
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