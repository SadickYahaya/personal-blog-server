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

function convertDeltaToStructuredText(delta) {
  let result = '';
  let listDepth = 0;
  let inCodeBlock = false;

  for (const op of delta.ops) {
    if (typeof op.insert === 'string') {
      let text = op.insert;
      
      if (op.attributes) {
        // Remove the header formatting
        // if (op.attributes.header) {
        //   const headerLevel = op.attributes.header;
        //   text = `${'#'.repeat(headerLevel)} ${text}`;
        // }
        if (op.attributes.bold) {
          text = `**${text}**`;
        }
        if (op.attributes.italic) {
          text = `*${text}*`;
        }
        if (op.attributes.underline) {
          text = `__${text}__`;
        }
        if (op.attributes.strike) {
          text = `~~${text}~~`;
        }
        if (op.attributes.link) {
          text = `[${text}](${op.attributes.link})`;
        }
        if (op.attributes.list) {
          const listType = op.attributes.list;
          const prefix = listType === 'bullet' ? '• ' : `${listDepth + 1}. `;
          text = `${' '.repeat(listDepth * 2)}${prefix}${text}`;
        }
      }

      result += text;
    } else if (op.insert && op.insert.image) {
      result += `![Image](${op.insert.image})`;
    }

    if (op.attributes && op.attributes.list) {
      listDepth++;
    } else {
      listDepth = 0;
    }

    if (op.attributes && op.attributes['code-block'] && !inCodeBlock) {
      result += '```\n';
      inCodeBlock = true;
    } else if ((!op.attributes || !op.attributes['code-block']) && inCodeBlock) {
      result += '\n```\n';
      inCodeBlock = false;
    }
  }

  return result.trim();
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
    
    // Convert Quill Delta to structured text
    const structuredText = convertDeltaToStructuredText(descriptionContent);
    
    const maxPostLength = 2650; // Further reduced to accommodate the catchy CTA
    const truncatedText = truncateText(structuredText, maxPostLength);

    // Add a more engaging call-to-action with the blog post URL
    const blogPostUrl = `${process.env.FRONTEND_URL}`;
    const callToAction = `\n\nExplore more tech insights on my blog: ${blogPostUrl}\n\n#TechTrends #InnovationInsights #AI #MachineLearning #DigitalTransformation #FutureOfWork #CloudComputing #Cybersecurity #DataScience #TechLeadership`;

    const postText = `${truncatedText}${callToAction}`;
    
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
