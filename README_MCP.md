# MCP Server for Match Mind

This MCP (Model Context Protocol) server exposes the MatchingService functionality specifically for **AI assistants and automated tools**.

## 🤖 When to Use MCP Server vs REST API

### Use **MCP Server** (`/mcp` endpoint) for:
- **AI Assistants**: ChatGPT, Claude, custom AI agents
- **Automated Workflows**: Bots that process matches automatically
- **AI-powered Tools**: Third-party services supporting MCP
- **Conversational Interfaces**: Chat-based interactions

### Use **REST API** (`/api/*` endpoints) for:
- **Web/Mobile Apps**: React frontend, mobile applications
- **Human Users**: Interactive dashboards and management tools
- **Custom Integrations**: When you need specific response formats

## 🎯 AI Assistant Integration Examples

### Example 1: ChatGPT Plugin
An AI assistant can ask your system:
```
"Find the top 3 Ruby engineers for opportunity #123"
```

The MCP server provides structured data that the AI can interpret and present naturally.

### Example 2: Automated Matching Bot
```python
# Python bot using MCP
import requests

def find_matches_automatically():
    response = requests.post('https://match-mind-app-2b4594c59d02.herokuapp.com//mcp', json={
        "method": "tools/call",
        "params": {
            "name": "find_matches_for_opportunity",
            "arguments": {"opportunity_id": 123}
        }
    })

    matches = response.json()['matches']
    # AI processes and acts on the matches
```

### Example 3: Slack Bot Integration
```javascript
// Slack bot command: /find-matches 123
app.command('/find-matches', async ({ command, ack, say }) => {
  const opportunityId = command.text;

  const response = await fetch('https://match-mind-app-2b4594c59d02.herokuapp.com//mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'tools/call',
      params: {
        name: 'find_matches_for_opportunity',
        arguments: { opportunity_id: parseInt(opportunityId) }
      }
    })
  });

  const data = await response.json();
  // Bot formats and sends match results to Slack
});
```

## Setup

1. Start your Rails server:
```bash
rails server
```

2. The MCP server is available at: `https://match-mind-app-2b4594c59d02.herokuapp.com//mcp`

## Available Tools

### 1. find_matches_for_opportunity
Find matching engineers for a given opportunity.

**Request:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "find_matches_for_opportunity",
    "arguments": {
      "opportunity_id": 123
    }
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Found 5 matches for opportunity: Senior Rails Developer"
    }
  ],
  "matches": [
    {
      "engineer_id": 1,
      "engineer_name": "John Doe",
      "score": 85,
      "explanation": "Strong match with Ruby and Rails experience...",
      "skills": ["Ruby", "Rails", "PostgreSQL"]
    }
  ]
}
```

### 2. find_matches_for_engineer
Find matching opportunities for a given engineer.

**Request:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "find_matches_for_engineer",
    "arguments": {
      "engineer_id": 456
    }
  }
}
```

## 🤖 AI Automation Features

The MCP server now includes powerful automation capabilities for regular match checking and AI-driven insights.

### Available Automation Tools

#### 1. get_automation_status
Check the current status of all automation jobs.

```json
{
  "method": "tools/call",
  "params": {
    "name": "get_automation_status",
    "arguments": {}
  }
}
```

#### 2. schedule_regular_matching
Schedule automated matching at regular intervals.

```json
{
  "method": "tools/call",
  "params": {
    "name": "schedule_regular_matching",
    "arguments": {
      "frequency": "daily",
      "enabled": true
    }
  }
}
```

#### 3. get_match_insights
Get AI-powered insights about matching patterns.

```json
{
  "method": "tools/call",
  "params": {
    "name": "get_match_insights",
    "arguments": {
      "days": 7
    }
  }
}
```

#### 4. auto_create_high_score_matches
Automatically create matches for high-scoring pairs.

```json
{
  "method": "tools/call",
  "params": {
    "name": "auto_create_high_score_matches",
    "arguments": {
      "min_score": 85,
      "max_matches": 10
    }
  }
}
```

## 🔄 MCP-Powered Automation Workflow

### AutomatedMatchingJob now uses MCP Server
The scheduled `AutomatedMatchingJob` now exclusively uses MCP Server tools for all automation tasks:

1. **get_automation_status** - Checks system health before starting
2. **auto_create_high_score_matches** - Creates matches via MCP protocol
3. **get_match_insights** - Generates AI insights via MCP
4. **trigger_matching** - Triggers additional matching if needed
5. **run_automation_cycle** - Complete automation cycle via MCP

### Benefits of MCP-Powered Jobs
- **Consistent Protocol**: All automation uses the same MCP interface
- **Better Monitoring**: Full visibility through MCP status tools
- **AI Integration**: Seamless integration with AI assistants
- **Standardized Responses**: All results follow MCP format
- **Error Handling**: Consistent error reporting via MCP protocol

### Example: Complete Automation Cycle
```python
# AI Assistant can trigger full automation
import requests

response = requests.post('https://match-mind-app-2b4594c59d02.herokuapp.com//mcp', json={
    "method": "tools/call",
    "params": {
        "name": "run_automation_cycle",
        "arguments": {
            "min_score": 80,
            "max_matches": 20,
            "send_notifications": True
        }
    }
})

cycle_results = response.json()['cycle_results']
print(f"Created {cycle_results['matches_created']} matches")
print(f"Generated {cycle_results['insights_generated']} insights")
```

### Scheduled Automation Flow
```
Every 4 hours:
AutomatedMatchingJob → MCP Server → {
  1. Check system status
  2. Auto-create high-score matches
  3. Generate insights & recommendations
  4. Trigger additional matching
  5. Send notifications
  6. Log comprehensive results
}
```

This ensures that all automation is:
- ✅ **MCP-Compliant**: Uses standardized protocol
- ✅ **AI-Accessible**: Can be monitored/controlled by AI assistants
- ✅ **Consistent**: Same interface for manual and automated operations
- ✅ **Observable**: Full visibility into automation health and results

## 📊 Automation Insights

The system provides AI-powered insights including:
- **Match Quality Trends**: Score distributions over time
- **Skill Gap Analysis**: In-demand skills vs. available talent
- **Budget Compatibility**: Rate vs. budget mismatches
- **Geographic Patterns**: Location-based matching success
- **Automation Recommendations**: AI suggestions for process optimization

## 🚀 Getting Started with Automation

1. **Enable Basic Automation**:
```bash
curl -X POST https://match-mind-app-2b4594c59d02.herokuapp.com//mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "schedule_regular_matching",
      "arguments": {
        "frequency": "daily",
        "enabled": true
      }
    }
  }'
```

2. **Check Status**:
```bash
curl -X POST https://match-mind-app-2b4594c59d02.herokuapp.com//mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "get_automation_status",
      "arguments": {}
    }
  }'
```

3. **Get Weekly Insights**:
```bash
curl -X POST https://match-mind-app-2b4594c59d02.herokuapp.com//mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "get_match_insights",
      "arguments": {
        "days": 7
      }
    }
  }'
```

The MCP server now acts as a complete AI automation hub for your matching system!

## Usage Examples

### cURL
```bash
curl -X POST https://match-mind-app-2b4594c59d02.herokuapp.com//mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/list"
  }'
```

### Ruby Client
```ruby
require_relative 'lib/mcp_client_example'

client = McpClientExample.new
matches = client.find_matches_for_opportunity(1)
puts matches
```

### Rails Console
```ruby
# In rails console
mcp = McpServer.new
request = { 'method' => 'tools/list' }
response = mcp.handle_request(request)
puts response
```

## Integration Options

### 1. Pure MCP Protocol (Recommended for AI Assistants)
```bash
curl -X POST https://match-mind-app-2b4594c59d02.herokuapp.com//mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "find_matches_for_opportunity",
      "arguments": {"opportunity_id": 1}
    }
  }'
```

### 2. REST API with MCP Format
```bash
curl -X GET "https://match-mind-app-2b4594c59d02.herokuapp.com//api/opportunities/1/matches?format=mcp"
```

### 3. Traditional REST API (for existing frontend)
```bash
curl -X GET "https://match-mind-app-2b4594c59d02.herokuapp.com//api/opportunities/1/matches"
```

## Available Tools (Extended)

### 3. create_match
Create a match between engineer and opportunity with AI scoring.

### 4. trigger_matching
Trigger the background matching process.

## 🔄 Protocol Comparison

### Traditional REST API Response:
```json
{
  "opportunity": {...},
  "matches": [
    {
      "engineer": {...},
      "score": 85,
      "explanation": "Strong Ruby skills..."
    }
  ]
}
```

### MCP Protocol Response:
```json
{
  "content": [
    {
      "type": "text",
      "text": "Found 5 matches for opportunity: Senior Rails Developer"
    }
  ],
  "matches": [
    {
      "engineer_id": 1,
      "engineer_name": "John Doe",
      "score": 85,
      "explanation": "Strong Ruby skills...",
      "skills": ["Ruby", "Rails", "PostgreSQL"]
    }
  ]
}
```

The MCP format is designed to be easily consumed by AI systems, while REST API gives you full control over the data structure.

## **Real-World Scenarios:**

### **MatchingController is used when:**
1. A recruiter logs into your web app and clicks "Find Matches"
2. A mobile app displays opportunity details and match scores
3. An internal tool needs to trigger batch matching processes
4. You're building custom integrations with specific format requirements

### **MCP Server is used when:**
1. An AI assistant like ChatGPT needs to answer: *"Who are the best Ruby engineers for this startup role?"*
2. An automated workflow bot checks for new matches every hour
3. A third-party AI tool integrates with your matching system
4. You want to provide AI agents with structured access to your data

## **Key Differences:**

| Aspect | MatchingController | MCP Server |
|--------|-------------------|------------|
| **Primary Users** | Human developers, web/mobile apps | AI assistants, automated tools |
| **Protocol** | HTTP REST | MCP (Model Context Protocol) |
| **Response Format** | Custom JSON | Standardized MCP format |
| **Integration** | Custom API clients | AI tools that support MCP |
| **Use Case** | Interactive applications | AI-powered automation |

