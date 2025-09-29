const { App } = require('@slack/bolt');
const axios = require('axios');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

const MCP_BASE_URL = process.env.MCP_BASE_URL || 'http://localhost:3000';

// Natural language matching command
app.command('/find-match', async ({ command, ack, say }) => {
  await ack();

  try {
    const query = command.text;

    // Use MCP natural language search
    const response = await axios.post(`${MCP_BASE_URL}/mcp`, {
      method: 'tools/call',
      params: {
        name: 'natural_language_search',
        arguments: { query: query }
      }
    });

    const results = response.data;

    if (results.results && results.results.length > 0) {
      const blocks = formatMatchesForSlack(results);
      await say({ blocks });
    } else {
      await say(`No matches found for: "${query}". Try adjusting your search criteria.`);
    }

  } catch (error) {
    console.error('Slack command error:', error);
    await say('Sorry, I encountered an error while searching. Please try again.');
  }
});

// Get AI recommendations
app.command('/get-recommendations', async ({ command, ack, say }) => {
  await ack();

  try {
    const context = command.text || 'general_optimization';

    const response = await axios.post(`${MCP_BASE_URL}/mcp`, {
      method: 'tools/call',
      params: {
        name: 'ai_recommendation',
        arguments: { context: context }
      }
    });

    const recommendations = response.data;
    const blocks = formatRecommendationsForSlack(recommendations);

    await say({ blocks });

  } catch (error) {
    console.error('Recommendations error:', error);
    await say('Sorry, I couldn\'t get recommendations right now.');
  }
});

// Daily report command
app.command('/daily-report', async ({ command, ack, say }) => {
  await ack();

  try {
    const response = await axios.post(`${MCP_BASE_URL}/mcp`, {
      method: 'tools/call',
      params: {
        name: 'conversational_summary',
        arguments: { type: 'daily_report' }
      }
    });

    const report = response.data;

    await say({
      text: "Daily Matching Report",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `📊 *Daily Matching Report*\n\n${report.conversational_text}`
          }
        },
        {
          type: "divider"
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `📈 *Key Metrics:*\n• Total Matches: ${report.data.summary.total_matches}\n• Average Score: ${report.data.summary.average_score}%\n• High-Quality Matches: ${report.data.summary.high_score_matches}`
          }
        }
      ]
    });

  } catch (error) {
    console.error('Daily report error:', error);
    await say('Sorry, I couldn\'t generate the daily report.');
  }
});

// Auto-trigger matching
app.command('/auto-match', async ({ command, ack, say }) => {
  await ack();

  try {
    await say('🚀 Starting automated matching process...');

    const response = await axios.post(`${MCP_BASE_URL}/mcp`, {
      method: 'tools/call',
      params: {
        name: 'auto_create_high_score_matches',
        arguments: {
          min_score: 80,
          max_matches: 10
        }
      }
    });

    const results = response.data;

    if (results.created_matches && results.created_matches.length > 0) {
      const blocks = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `✅ *Auto-matching completed!*\n\nCreated ${results.created_matches.length} high-confidence matches:`
          }
        }
      ];

      results.created_matches.forEach((match, index) => {
        if (index < 3) { // Show first 3 matches
          blocks.push({
            type: "section",
            text: {
              type: "mrkdwn",
              text: `• ${match.engineer_name} → ${match.opportunity_title} (${match.score}% match)`
            }
          });
        }
      });

      if (results.created_matches.length > 3) {
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `... and ${results.created_matches.length - 3} more matches`
          }
        });
      }

      await say({ blocks });
    } else {
      await say('No high-confidence matches were created this time. All current matches may already exist.');
    }

  } catch (error) {
    console.error('Auto-match error:', error);
    await say('Sorry, the auto-matching process failed. Please check the system status.');
  }
});

function formatMatchesForSlack(results) {
  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `🎯 *Search Results*\n\n${results.natural_language_summary}`
      }
    },
    {
      type: "divider"
    }
  ];

  results.results.slice(0, 5).forEach(result => {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `👤 *${result.name}*\n• Skills: ${result.skills.join(', ')}\n• Location: ${result.country}\n• Rate: $${result.target_rate}/hr\n• Status: ${result.status}`
      },
      accessory: {
        type: "button",
        text: {
          type: "plain_text",
          text: "View Profile"
        },
        value: `engineer_${result.id}`,
        action_id: "view_engineer"
      }
    });
  });

  return blocks;
}

function formatRecommendationsForSlack(recommendations) {
  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "🤖 *AI Recommendations*"
      }
    },
    {
      type: "divider"
    }
  ];

  if (recommendations.priority_actions && recommendations.priority_actions.length > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*🔥 High Priority Actions:*"
      }
    });

    recommendations.priority_actions.forEach(action => {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `• ${action.message}\n  _Impact: ${action.impact}_`
        }
      });
    });
  }

  return blocks;
}

// Handle button interactions
app.action('view_engineer', async ({ body, ack, say }) => {
  await ack();

  const engineerId = body.actions[0].value.replace('engineer_', '');

  // In a real implementation, you'd call MCP to get engineer details
  await say(`Opening engineer profile for ID: ${engineerId}`);
});

// Start the Slack app
(async () => {
  await app.start(process.env.PORT || 3001);
  console.log('⚡️ Slack bot is running!');
})();
