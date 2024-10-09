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
    
    // Increase max post length to utilize more of LinkedIn's character limit
    const maxPostLength = 2600;
    const truncatedText = truncateText(structuredText, maxPostLength);

    // Add "Continue reading" prompt if the text was truncated
    const continueReading = structuredText.length > maxPostLength ? `\n\nContinue reading on my blog: ${process.env.FRONTEND_URL}/blog-details/${blogPost._id} ` : "";

    // Enhanced hashtags with more trending and relevant options
    const hashtags = [
      "#TechInnovation", "#AITrends", "#FutureOfTech", "#DataScience", "#CyberSecurity",
      "#CloudComputing", "#MachineLearning", "#DigitalTransformation", "#TechLeadership",
      "#EmergingTech", "#SoftwareEngineering", "#BigData", "#IoT", "#Blockchain",
      "#DevOps", "#ArtificialIntelligence", "#CodeLife", "#TechInsights", "#InnovationMatters",
      "#TechForGood", "#StartupLife", "#TechCommunity", "#FutureSkills", "#TechTrends2023"
    ];

    // Improved call-to-actions with more engaging language
    const callToActions = [
      "🚀 Dive deeper into this tech revolution on my blog:",
      "🔍 Uncover game-changing insights on my blog:",
      "💡 Want to stay ahead in tech? Explore more on my blog:",
      "🌟 Join the innovation conversation on my blog:",
      "🔮 Predict the future of tech with me on my blog:",
      "🧠 Expand your tech mindset on my blog:",
      "🌐 Navigate the digital frontier on my blog:", 
      "⚡ Power up your tech knowledge on my blog:",
      "🎯 Target your tech skills. In-depth analysis awaits:",
      "🔑 Unlock the secrets of tomorrow's tech. Read on:"
    ];

    // Function to get random items from an array
    const getRandomItems = (array, count) => {
      const shuffled = array.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    };

    // Select more hashtags for better discoverability
    const selectedHashtags = getRandomItems(hashtags, 7).join(" ");
    const selectedCTA = getRandomItems(callToActions, 1)[0];

    const blogPostUrl = `${process.env.FRONTEND_URL}`;
    const callToAction = `\n\n${selectedCTA} ${blogPostUrl}\n\n${selectedHashtags}`;

    // Add an attention-grabbing opener
    const opener = `🔥 ${blogPost.title}\n\n`;

    const postText = `${opener}${truncatedText}${continueReading}${callToAction}`;
    
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
            },
            // Add a custom thumbnail if available
            thumbnails: [
              {
                image: asset
              }
            ]
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