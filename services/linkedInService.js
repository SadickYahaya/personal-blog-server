const axios = require('axios');
const QuillDeltaToHtmlConverter = require('quill-delta-to-html').QuillDeltaToHtmlConverter;
const { JSDOM } = require('jsdom');

function convertDeltaToHtml(delta) {
  try {
    const converter = new QuillDeltaToHtmlConverter(delta.ops, {});
    return converter.convert();
  } catch (error) {
    console.error('Error converting Delta to HTML:', error);
    return '';
  }
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength - 3) + '...';
}

function stripHtml(html) {
  const dom = new JSDOM(html);
  return dom.window.document.body.textContent || "";
}

async function registerImage(accessToken, imageUrl) {
  try {
    const response = await axios.post(
      'https://api.linkedin.com/v2/assets?action=registerUpload',
      {
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: `urn:li:person:${process.env.LINKEDIN_PERSON_ID}`,
          serviceRelationships: [
            {
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent'
            }
          ]
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      }
    );

    const uploadUrl = response.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
    const asset = response.data.value.asset;

    // Upload the image to the provided URL
    await axios.put(uploadUrl, await axios.get(imageUrl, { responseType: 'arraybuffer' }).then(response => response.data), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
      }
    });

    return asset;
  } catch (error) {
    console.error('Error registering image:', error.response ? error.response.data : error.message);
    throw error;
  }
}

async function postToLinkedIn(blogPost) {
  try {
    const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
    
    // Parse the description content
    const descriptionContent = JSON.parse(blogPost.description);
    
    // Convert Quill Delta to HTML
    const descriptionHtml = convertDeltaToHtml(descriptionContent);
    
    // Strip HTML and truncate
    const plainText = stripHtml(descriptionHtml);
    const maxPostLength = 2900; // Leave some room for the title and intro text
    const truncatedText = truncateText(plainText, maxPostLength);

    const postText = `${blogPost.title}\n\n${truncatedText}`;
    
    // Final check to ensure we're within the limit
    const finalPostText = truncateText(postText, 3000);

    // Ensure the image URL is absolute
    const imageUrl = blogPost.image.startsWith('http') 
      ? blogPost.image 
      : `${process.env.IMAGE_URL}${blogPost.image}`;

    console.log('Image URL being registered:', imageUrl);

    // Register the image with LinkedIn
    const asset = await registerImage(accessToken, imageUrl);

    const shareContent = {
      author: `urn:li:person:${process.env.LINKEDIN_PERSON_ID}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: finalPostText
          },
          shareMediaCategory: 'IMAGE',
          media: [{
            status: 'READY',
            description: {
              text: truncateText(blogPost.title, 200)
            },
            media: asset,
            title: {
              text: truncateText(blogPost.title, 200)
            }
          }]
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    console.log('Full shareContent:', JSON.stringify(shareContent, null, 2));

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

    console.log(`LinkedIn post created for "${blogPost.title}":`, response.data);
    console.log(`Post URL: https://www.linkedin.com/feed/update/${response.data.id}`);
    return response.data;
  } catch (error) {
    console.error('Error posting to LinkedIn:', error.response ? error.response.data : error.message);
    throw error;
  }
}

module.exports = { postToLinkedIn };
