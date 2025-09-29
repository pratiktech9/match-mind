# AI Assistant Integration Guide

Your MCP server enables seamless integration with various AI assistants and tools.

## 🤖 Integration Methods

### 1. **ChatGPT Plugin/GPT Integration**

```python
# Custom GPT configuration
import openai
import requests

class MatchMindGPT:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url

    def find_engineer_matches(self, opportunity_description):
        # AI processes natural language
        opportunity_id = self.extract_opportunity_id(opportunity_description)

        response = requests.post(f'{self.base_url}/mcp', json={
            "method": "tools/call",
            "params": {
                "name": "find_matches_for_opportunity",
                "arguments": {"opportunity_id": opportunity_id}
            }
        })

        matches = response.json()
        return self.format_for_chat(matches)

    def format_for_chat(self, matches):
        # Format MCP response for conversational UI
        if matches.get('matches'):
            result = f"Found {len(matches['matches'])} engineers:\n\n"
            for match in matches['matches'][:3]:
                result += f"• {match['engineer_name']} ({match['score']}% match)\n"
                result += f"  Skills: {', '.join(match['skills'])}\n"
                result += f"  Reason: {match['explanation'][:100]}...\n\n"
            return result
        return "No suitable matches found."
```

### 2. **Claude/Anthropic Integration**

```python
# Claude integration with MCP
import anthropic

class ClaudeMatchingAgent:
    def __init__(self, mcp_base_url="http://localhost:3000"):
        self.mcp_url = mcp_base_url
        self.client = anthropic.Anthropic()

    async def analyze_match_request(self, user_message):
        # Use Claude to understand the request
        response = await self.client.messages.create(
            model="claude-3-sonnet-20240229",
            system="""You are a technical recruitment AI. Extract:
            1. Job requirements from user queries
            2. Skill preferences
            3. Budget constraints
            4. Timeline needs""",
            messages=[{"role": "user", "content": user_message}]
        )

        # Convert Claude's analysis to MCP calls
        requirements = self.parse_requirements(response.content)
        matches = await self.call_mcp_server(requirements)

        return self.generate_recommendation(matches)

    def call_mcp_server(self, requirements):
        # Call your MCP server based on Claude's analysis
        return requests.post(f'{self.mcp_url}/mcp', json={
            "method": "tools/call",
            "params": {
                "name": "auto_create_high_score_matches",
                "arguments": {
                    "min_score": requirements.get('min_score', 80),
                    "max_matches": 10
                }
            }
        }).json()
```

### 3. **Slack Bot with AI Capabilities**

```javascript
// Slack bot that uses AI to understand requests
const { App } = require('@slack/bolt');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

// AI-powered matching command
app.command('/find-engineer', async ({ command, ack, say, client }) => {
  await ack();

  const userQuery = command.text; // e.g., "Need a React developer for fintech startup, $120/hr, remote"

  try {
    // Use AI to parse the natural language request
    const requirements = await parseWithAI(userQuery);

    // Call your MCP server
    const response = await fetch('http://localhost:3000/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'tools/call',
        params: {
          name: 'get_match_insights',
          arguments: { days: 7 }
        }
      })
    });

    const insights = await response.json();

    // Format results for Slack
    const blocks = formatForSlack(insights);

    await say({
      text: `Found matching engineers for: ${userQuery}`,
      blocks: blocks
    });

  } catch (error) {
    await say(`Sorry, I couldn't find matches: ${error.message}`);
  }
});

async function parseWithAI(query) {
  // Use OpenAI or another AI service to extract requirements
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{
      role: "system",
      content: "Extract job requirements from user queries. Return JSON with skills, budget, location, etc."
    }, {
      role: "user",
      content: query
    }]
  });

  return JSON.parse(completion.choices[0].message.content);
}
```

### 4. **Microsoft Teams Bot**

```csharp
// C# Teams bot with AI integration
public class MatchingTeamsBot : TeamsActivityHandler
{
    private readonly HttpClient _httpClient;
    private readonly string _mcpBaseUrl;

    protected override async Task OnMessageActivityAsync(ITurnContext<IMessageActivity> turnContext, CancellationToken cancellationToken)
    {
        var userMessage = turnContext.Activity.Text;

        // Use AI to understand the request
        var intent = await AnalyzeIntent(userMessage);

        if (intent.Contains("find engineer") || intent.Contains("match"))
        {
            var matches = await CallMcpServer("auto_create_high_score_matches", new {
                min_score = 75,
                max_matches = 5
            });

            var response = FormatMatchesForTeams(matches);
            await turnContext.SendActivityAsync(response);
        }
    }

    private async Task<object> CallMcpServer(string toolName, object arguments)
    {
        var request = new {
            method = "tools/call",
            @params = new {
                name = toolName,
                arguments = arguments
            }
        };

        var response = await _httpClient.PostAsJsonAsync($"{_mcpBaseUrl}/mcp", request);
        return await response.Content.ReadFromJsonAsync<object>();
    }
}
```

### 5. **Voice Assistant (Alexa/Google)**

```python
# Amazon Alexa skill with MCP integration
from ask_sdk_core.skill_builder import SkillBuilder
from ask_sdk_core.dispatch_components import AbstractRequestHandler
import requests

class FindEngineerHandler(AbstractRequestHandler):
    def can_handle(self, handler_input):
        return (ask_utils.is_request_type("IntentRequest")(handler_input) and
                ask_utils.is_intent_name("FindEngineerIntent")(handler_input))

    def handle(self, handler_input):
        # Extract slots (voice parameters)
        slots = handler_input.request_envelope.request.intent.slots
        skills_needed = slots.get('Skills', {}).get('value', '')

        # Call MCP server
        response = requests.post('http://localhost:3000/mcp', json={
            "method": "tools/call",
            "params": {
                "name": "get_match_insights",
                "arguments": {"days": 1}
            }
        })

        insights = response.json()

        # Format for voice response
        speech_text = self.format_for_voice(insights)

        return (handler_input.response_builder
                .speak(speech_text)
                .set_card(SimpleCard("Engineer Matches", speech_text))
                .response)

    def format_for_voice(self, insights):
        if insights.get('insights', {}).get('summary', {}).get('total_matches', 0) > 0:
            return f"I found {insights['insights']['summary']['total_matches']} potential matches with an average score of {insights['insights']['summary']['average_score']}%"
        return "I couldn't find any matching engineers right now."
```

## 🔧 Real-World Use Cases

### Use Case 1: Conversational Recruitment Assistant

```yaml
# AI Assistant Conversation Flow
User: "I need a senior React developer for a fintech project in New York, budget is $150/hour"

AI Assistant:
1. Parses natural language → extracts requirements
2. Calls MCP: find_matches_for_opportunity
3. Analyzes results with AI understanding
4. Responds: "I found 3 excellent matches! Sarah (92% match) has 5 years React + fintech experience..."

User: "Tell me more about Sarah"

AI Assistant:
1. Calls MCP: find_matches_for_engineer with Sarah's ID
2. Gets detailed profile and opportunities
3. Responds: "Sarah is currently available, based in NYC, specializes in React/Node.js..."
```

### Use Case 2: Proactive Automation Agent

```python
# Autonomous AI agent that monitors and acts
class AutomationAgent:
    def run_daily_check(self):
        # 1. Check automation status
        status = self.call_mcp('get_automation_status')

        # 2. Get insights
        insights = self.call_mcp('get_match_insights', {'days': 1})

        # 3. Auto-create high-score matches
        if insights['insights']['summary']['high_score_matches'] < 5:
            self.call_mcp('auto_create_high_score_matches', {
                'min_score': 85,
                'max_matches': 20
            })

        # 4. Send summary to team
        self.notify_team(insights)
```

### Use Case 3: Multi-Channel AI Coordinator

```javascript
// AI that manages multiple communication channels
class MultiChannelAI {
    async processRequest(channel, message, userId) {
        // Understand intent regardless of channel
        const intent = await this.parseIntent(message);

        // Call appropriate MCP tools
        const result = await this.callMcpTool(intent);

        // Format response for specific channel
        switch(channel) {
            case 'slack':
                return this.formatForSlack(result);
            case 'teams':
                return this.formatForTeams(result);
            case 'email':
                return this.formatForEmail(result);
            case 'web':
                return this.formatForWeb(result);
        }
    }
}
```

## 📋 MCP Tools Available for AI Integration

| Tool | Purpose | AI Use Case |
|------|---------|-------------|
| `find_matches_for_opportunity` | Find engineers for jobs | "Find me React developers" |
| `find_matches_for_engineer` | Find jobs for engineers | "What opportunities fit John?" |
| `auto_create_high_score_matches` | Create automatic matches | "Create today's best matches" |
| `get_automation_status` | System health check | "How's the system running?" |
| `get_match_insights` | Analytics & trends | "Show me this week's insights" |
| `trigger_matching` | Start matching process | "Run matching now" |
| `schedule_regular_matching` | Set up automation | "Schedule daily matching" |
| `create_match` | Manual match creation | "Match Sarah with this job" |

## 🚀 Getting Started

### Step 1: Test MCP Connectivity
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list"}'
```

### Step 2: Build AI Integration
```python
# Simple AI integration starter
import requests

def ai_powered_matching(user_query):
    # 1. Use AI to understand the request
    requirements = parse_with_ai(user_query)

    # 2. Call MCP server
    response = requests.post('http://localhost:3000/mcp', json={
        "method": "tools/call",
        "params": {
            "name": "auto_create_high_score_matches",
            "arguments": requirements
        }
    })

    # 3. Format AI-friendly response
    return format_ai_response(response.json())
```

### Step 3: Deploy & Monitor
```python
# Monitor AI integration health
def monitor_ai_integration():
    status = requests.post('http://localhost:3000/mcp', json={
        "method": "tools/call",
        "params": {
            "name": "get_automation_status",
            "arguments": {}
        }
    }).json()

    if status.get('automation', {}).get('sidekiq_status', {}).get('failed', 0) > 10:
        alert_team("MCP integration issues detected!")
```

## 💡 Best Practices

1. **Natural Language Processing**: Use AI to convert human language to MCP parameters
2. **Context Awareness**: Maintain conversation context across multiple MCP calls
3. **Error Handling**: Gracefully handle MCP errors in AI responses
4. **Rate Limiting**: Implement intelligent rate limiting for AI-driven requests
5. **User Privacy**: Ensure AI assistants respect data privacy when accessing matches
6. **Feedback Loop**: Use AI to learn from successful matches and improve recommendations

Your MCP server provides the perfect foundation for sophisticated AI assistant integrations that can understand natural language, make intelligent decisions, and provide human-like interaction with your matching system!
