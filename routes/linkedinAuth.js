const express = require('express');
const router = express.Router();
const axios = require('axios');

const clientId = process.env.LINKEDIN_CLIENT_ID;
const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

router.get('/linkedin', (req, res) => {
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20w_member_social%20email`;
  res.redirect(authUrl);
});

router.get('/linkedin/callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret
      }
    });

    const accessToken = tokenResponse.data.access_token;
    console.log('Access Token:', accessToken);

    // Get user profile to obtain person ID
    const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const personId = profileResponse.data.sub;
    console.log('Person ID:', personId);

    res.send('Authentication successful! You can close this window.');
  } catch (error) {
    console.error('Error during LinkedIn authentication:', error.response ? error.response.data : error.message);
    res.status(500).send('Authentication failed');
  }
});

module.exports = router;