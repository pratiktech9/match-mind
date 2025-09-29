# 🧠 Match Mind: AI-Powered Talent Matching Platform

Match Mind is a sophisticated Ruby on Rails application that uses **AI-powered automation** to intelligently match engineers with client opportunities. The system combines automatic status management, scheduled background jobs, and AI-driven matching algorithms to create an intelligent recruitment platform.

## 🎯 **Key Features**

### 🤖 **AI-Powered Matching System**
- **Dual-Layer AI Scoring**: Uses OpenRouter API (GPT-3.5-turbo) with intelligent fallback
- **Realistic Match Scoring**: AI prevents unrealistic high scores across all matches
- **Smart Explanations**: AI-generated explanations for every match decision
- **Skill Gap Analysis**: Identifies market demand vs available talent

### 🔄 **Advanced Automation**
- **AutomatedMatchingJob**: Runs every 4 hours, creates high-score matches automatically
- **EngineerStatusUpdateJob**: Daily status updates based on project dates
- **MatchingCleanupJob**: Weekly cleanup of old matches
- **Real-time Status Calculation**: Automatic availability based on notice/end/return dates

### 🚀 **MCP (Model Context Protocol) Integration**
- **AI Assistant Ready**: Compatible with ChatGPT, Claude, and other AI tools
- **9 AI-Accessible Tools**: From finding matches to scheduling automation
- **Voice Assistant Support**: Ready for Alexa, Google Assistant integration
- **Slack/Teams Bot Ready**: MCP endpoint enables easy bot development

### 📊 **Intelligent Insights & Analytics**
- **AutomationInsightsService**: Generates comprehensive matching analytics
- **Trend Analysis**: Daily match patterns and quality metrics
- **Smart Recommendations**: AI suggestions for improving match quality
- **Real-time Notifications**: Context-aware alerts for stakeholders

## 🛠 **Technical Stack**

- **Backend**: Ruby 8.0.3, Rails with PostgreSQL
- **Frontend**: React with Bootstrap 5, real-time status preview
- **AI Integration**: OpenRouter API (GPT-3.5-turbo)
- **Background Jobs**: ActiveJob with cron scheduling
- **Protocol**: MCP for AI assistant integration
- **Deployment**: Docker + Heroku ready

## 📋 **System Requirements**

* **Ruby version**: 3.2.0+
* **Rails version**: 8.0.3
* **Database**: PostgreSQL 13+
* **Node.js**: 18+ (for React components)
* **Redis**: For background job processing

## 🚀 **Quick Start**

### 1. **Clone and Setup**
```bash
git clone https://github.com/pratiktech9/match-mind.git
cd match-mind
bundle install
yarn install
```

### 2. **Environment Configuration**
```bash
cp env.example .env
# Add your OpenRouter API key for AI matching:
# OPENROUTER_API_KEY=your_api_key_here
```

### 3. **Database Setup**
```bash
rails db:create
rails db:migrate
rails db:seed
```

### 4. **Run the Application**
```bash
# Start all services (Rails + React + Jobs)
./bin/dev

# Or individual components:
rails server          # Backend API
npm run build:watch   # React frontend
bundle exec sidekiq   # Background jobs
```

## 🤖 **AI Integration Examples**

### **ChatGPT Plugin Integration**
```python
import requests

# Find matches via AI assistant
response = requests.post('http://localhost:3000/mcp', json={
    "method": "tools/call",
    "params": {
        "name": "find_matches_for_opportunity",
        "arguments": {"opportunity_id": 123}
    }
})
```

### **Automated Workflow Example**
```ruby
# Every 4 hours, the system automatically:
# 1. Creates high-score matches (85%+ compatibility)
# 2. Generates AI insights about trends
# 3. Sends intelligent notifications
# 4. Updates engineer availability status
```

### **Available MCP Tools**
| Tool | Purpose | AI Use Case |
|------|---------|-------------|
| `find_matches_for_opportunity` | Find engineers for jobs | *"Find React developers"* |
| `auto_create_high_score_matches` | Create automatic matches | *"Create today's best matches"* |
| `get_match_insights` | Analytics & trends | *"Show me this week's insights"* |
| `schedule_regular_matching` | Set up automation | *"Schedule hourly matching"* |
| `get_automation_status` | System health check | *"How is automation performing?"* |

## 📊 **Automation Schedule**

```yaml
# Runs automatically via cron jobs:

Every 4 hours (00:00, 04:00, 08:00, 12:00, 16:00, 20:00):
  - AutomatedMatchingJob: AI matching + insights + notifications

Daily at 6:00 AM:
  - EngineerStatusUpdateJob: Update all engineer availability

Weekly on Sundays at 3:00 AM:
  - MatchingCleanupJob: Clean up old matches
```

## 🎯 **Real-World Scenarios**

### **Scenario 1: AI Assistant**
*"Hey AI, find me the best Ruby developers for our fintech startup role"*

→ AI calls MCP endpoint
→ Returns ranked matches with explanations
→ Creates notifications for high-score matches

### **Scenario 2: Automated Operations**
*Morning: Status updates run automatically*
*Afternoon: High-score matches created*
*Evening: AI insights generated and shared*

### **Scenario 3: Slack Bot**
*"/match find react developers budget 150"*

→ Bot parses request and calls MCP server
→ AI analyzes requirements and finds matches
→ Returns formatted results in Slack

## 🔧 **Key Innovations**

### **1. Intelligent Status Management**
- **Date-based automation**: Engineers automatically marked as "rolling_off_soon" 30 days before notice date
- **Real-time preview**: UI shows status changes as users modify dates
- **Foreign key relationships**: Migrated from string-based to proper client associations

### **2. AI-First Architecture**
- **MCP Protocol**: Makes entire system immediately compatible with AI assistants
- **Realistic AI scoring**: Prevents artificial score inflation across matches
- **Conversational interfaces**: Ready for voice assistants and chatbots

### **3. Production-Ready Automation**
- **Self-healing**: Comprehensive error handling and graceful degradation
- **Scalable**: Background job architecture handles high loads
- **Monitored**: Detailed logging and smart notifications

## 📚 **Documentation**

- **[MCP Integration Guide](README_MCP.md)**: Complete guide for AI assistant integration
- **[AI Assistant Examples](doc/ai_assistant_integration.md)**: Real-world AI integration patterns
- **[Deployment Guide](DEPLOYMENT.md)**: Production deployment instructions
- **[Google SSO Setup](GOOGLE_SSO_SETUP.md)**: Authentication configuration

## 🚢 **Deployment**


### **Heroku Deployment**
```bash
# Deploy to Heroku with automated jobs
./bin/deploy-heroku
```

### **Environment Variables**
```bash
OPENROUTER_API_KEY=your_api_key          # Required for AI matching
DATABASE_URL=postgres://...              # PostgreSQL connection
REDIS_URL=redis://...                    # Background jobs
GOOGLE_CLIENT_ID=your_google_id          # OAuth authentication
```

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎪 **Demo & Screenshots**

- **Live Demo**: [https://match-mind-demo.herokuapp.com](https://match-mind-app-2b4594c59d02.herokuapp.com/)]
- **MCP Endpoint**: `POST https://match-mind-app-2b4594c59d02.herokuapp.com/mcp`

---

**Match Mind** represents the future of AI-powered recruitment - where intelligent automation meets human expertise to create perfect talent matches. The system runs autonomously while providing full transparency and control to human recruiters.
