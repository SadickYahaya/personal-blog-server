const express = require('express');
const router = express.Router();
const axios = require('axios');

// Facebook Authentication
const fbClientId = process.env.FACEBOOK_APP_ID;
const fbClientSecret = process.env.FACEBOOK_APP_SECRET;

router.get('/facebook/token', async (req, res) => {
  try {
    const response = await axios.get('https://graph.facebook.com/oauth/access_token', {
      params: {
        client_id: fbClientId,
        client_secret: fbClientSecret,
        grant_type: 'client_credentials'
      }
    });

    const accessToken = response.data.access_token;
    console.log('Facebook Access Token:', accessToken);
    res.json({ accessToken });
  } catch (error) {
    console.error('Error obtaining Facebook access token:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to obtain access token' });
  }
});

router.get('/facebook/page-token', async (req, res) => {
  const { fbUserAccessToken, pageId } = req.query; // Get user access token and page ID from query parameters
  try {
    const response = await axios.get(`https://graph.facebook.com/${pageId}?fields=access_token`, {
      params: {
        access_token: fbUserAccessToken
      }
    });

    const pageAccessToken = response.data.access_token;
    console.log('Facebook Page Access Token:', pageAccessToken);
    res.json({ pageAccessToken });
  } catch (error) {
    console.error('Error obtaining Facebook page access token:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to obtain page access token' });
  }
});

module.exports = router;
