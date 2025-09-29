# MCP Integration Guide

## Current Status
The MCP endpoint `/mcp` is **implemented but not actively used** in the current application. Here are the potential use cases:

## 🤖 Possible Use Cases

### 1. **AI Assistant Integration**
```python
# Example: ChatGPT Plugin or Custom AI Assistant
import openai
import requests

def find_best_matches_for_role(role_description):
    # AI processes the role description
    # Then calls MCP server to find matches

    response = requests.post('http://localhost:3000/mcp', json={
        "method": "tools/call",
        "params": {
            "name": "find_matches_for_opportunity",
            "arguments": {"opportunity_id": 1}
        }
    })

    matches = response.json()
    return matches
```

### 2. **Slack Bot Integration**
```javascript
// Slack bot that helps recruiters find matches
app.command('/find-engineer', async ({ command, ack, say }) => {
  const opportunityId = command.text;

  const response = await fetch('http://localhost:3000/mcp', {
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

  const matches = await response.json();
  // Format and send to Slack channel
});
```

### 3. **Automated Workflow Integration**
```python
# Zapier, Microsoft Power Automate, or custom workflow
def daily_matching_workflow():
    # Get automation status
    status = requests.post('http://localhost:3000/mcp', json={
        "method": "tools/call",
        "params": {"name": "get_automation_status", "arguments": {}}
    })

    # Auto-create high score matches
    matches = requests.post('http://localhost:3000/mcp', json={
        "method": "tools/call",
        "params": {
            "name": "auto_create_high_score_matches",
            "arguments": {"min_score": 85, "max_matches": 10}
        }
    })

    # Send results to email/Slack/Teams
    return matches.json()
```

### 4. **Third-Party Application Integration**
```php
// PHP application that needs matching data
function getMatchingEngineers($opportunityId) {
    $data = [
        'method' => 'tools/call',
        'params' => [
            'name' => 'find_matches_for_opportunity',
            'arguments' => ['opportunity_id' => $opportunityId]
        ]
    ];

    $response = file_get_contents('http://localhost:3000/mcp', false,
        stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => 'Content-Type: application/json',
                'content' => json_encode($data)
            ]
        ])
    );

    return json_decode($response, true);
}
```

### 5. **Mobile App Integration**
```swift
// iOS app that shows matching data
func findMatches(for engineerId: Int) async {
    let request = MCPRequest(
        method: "tools/call",
        params: MCPParams(
            name: "find_matches_for_engineer",
            arguments: ["engineer_id": engineerId]
        )
    )

    let response = await MCPClient.shared.send(request)
    // Process matches in mobile UI
}
```

### 6. **Business Intelligence Integration**
```python
# Data pipeline for BI tools (Tableau, Power BI)
def extract_matching_insights():
    insights = requests.post('http://localhost:3000/mcp', json={
        "method": "tools/call",
        "params": {
            "name": "get_match_insights",
            "arguments": {"days": 30}
        }
    })

    # Transform data for BI consumption
    return transform_for_bi(insights.json())
```

## 🚀 How to Start Using MCP Endpoint

### Step 1: Test Basic Connectivity
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list"}'
```

### Step 2: Find Your First Match
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "find_matches_for_opportunity",
      "arguments": {"opportunity_id": 1}
    }
  }'
```

### Step 3: Set Up Automation
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "schedule_regular_matching",
      "arguments": {"frequency": "daily", "enabled": true}
    }
  }'
```

## 🔧 Available MCP Tools

1. **find_matches_for_opportunity** - Find engineers for a job
2. **find_matches_for_engineer** - Find opportunities for an engineer
3. **create_match** - Create a match between engineer and opportunity
4. **trigger_matching** - Start the matching process
5. **get_automation_status** - Check automation health
6. **schedule_regular_matching** - Set up automated matching
7. **get_match_insights** - Get AI insights and recommendations
8. **auto_create_high_score_matches** - Auto-create high-confidence matches
9. **run_automation_cycle** - Run complete automation cycle

## 🎯 Why Use MCP Instead of REST API?

| Use Case | REST API | MCP Server |
|----------|----------|------------|
| **Human Users** | ✅ Better | ❌ Overkill |
| **AI Assistants** | ❌ Complex | ✅ Perfect |
| **Automation Tools** | ⚠️ Custom | ✅ Standardized |
| **Third-party Apps** | ✅ Flexible | ✅ Consistent |
| **Mobile Apps** | ✅ Direct | ❌ Unnecessary |
| **Workflow Integration** | ⚠️ Manual | ✅ Automated |

## 🔮 Future Integration Ideas

1. **Microsoft Teams Bot** - Get matches directly in Teams
2. **Google Workspace Add-on** - Match engineers in Gmail/Calendar
3. **Salesforce Integration** - Sync matches with CRM data
4. **HubSpot Workflow** - Automate lead nurturing based on matches
5. **Discord Bot** - Community matching for freelancer networks
6. **LinkedIn Integration** - Auto-message matched candidates
7. **Calendar Scheduling** - Auto-schedule interviews for high matches
8. **Email Campaigns** - Personalized outreach based on match scores

## 📈 Monitoring MCP Usage

```python
# Track MCP endpoint usage
def monitor_mcp_usage():
    status = get_automation_status()
    insights = get_match_insights(30)

    metrics = {
        'matches_created': insights['summary']['total_matches'],
        'average_score': insights['summary']['average_score'],
        'automation_health': status['sidekiq_status']['processed'],
        'last_run': status['last_matching_run']
    }

    return metrics
```

The MCP endpoint is a powerful integration point that's currently underutilized. It's perfect for AI-driven workflows and third-party integrations!
