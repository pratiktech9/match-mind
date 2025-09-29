require "json"

class McpServer
  def initialize
    @tools = {
      "find_matches_for_opportunity" => {
        name: "find_matches_for_opportunity",
        description: "Find matching engineers for a given opportunity",
        inputSchema: {
          type: "object",
          properties: {
            opportunity_id: {
              type: "integer",
              description: "The ID of the opportunity to find matches for"
            }
          },
          required: [ "opportunity_id" ]
        }
      },
      "find_matches_for_engineer" => {
        name: "find_matches_for_engineer",
        description: "Find matching opportunities for a given engineer",
        inputSchema: {
          type: "object",
          properties: {
            engineer_id: {
              type: "integer",
              description: "The ID of the engineer to find matches for"
            }
          },
          required: [ "engineer_id" ]
        }
      },
      "create_match" => {
        name: "create_match",
        description: "Create a match between an engineer and opportunity",
        inputSchema: {
          type: "object",
          properties: {
            engineer_id: {
              type: "integer",
              description: "The ID of the engineer"
            },
            opportunity_id: {
              type: "integer",
              description: "The ID of the opportunity"
            }
          },
          required: [ "engineer_id", "opportunity_id" ]
        }
      },
      "trigger_matching" => {
        name: "trigger_matching",
        description: "Trigger the AI matching process for all or specific opportunities",
        inputSchema: {
          type: "object",
          properties: {
            opportunity_id: {
              type: "integer",
              description: "Optional: ID of specific opportunity to match"
            }
          }
        }
      },
      "get_automation_status" => {
        name: "get_automation_status",
        description: "Get the current status of automation jobs and scheduled tasks",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      "schedule_regular_matching" => {
        name: "schedule_regular_matching",
        description: "Schedule regular automated matching checks",
        inputSchema: {
          type: "object",
          properties: {
            frequency: {
              type: "string",
              description: "Frequency: hourly, daily, weekly",
              enum: [ "hourly", "daily", "weekly" ]
            },
            enabled: {
              type: "boolean",
              description: "Enable or disable the automation"
            }
          },
          required: [ "frequency", "enabled" ]
        }
      },
      "get_match_insights" => {
        name: "get_match_insights",
        description: "Get AI-powered insights about matching patterns and recommendations",
        inputSchema: {
          type: "object",
          properties: {
            days: {
              type: "integer",
              description: "Number of days to analyze (default: 7)"
            }
          }
        }
      },
      "auto_create_high_score_matches" => {
        name: "auto_create_high_score_matches",
        description: "Automatically create matches for high-scoring engineer-opportunity pairs",
        inputSchema: {
          type: "object",
          properties: {
            min_score: {
              type: "integer",
              description: "Minimum score to auto-create matches (default: 85)"
            },
            max_matches: {
              type: "integer",
              description: "Maximum number of matches to create (default: 10)"
            }
          }
        }
      },
      "run_automation_cycle" => {
        name: "run_automation_cycle",
        description: "Run a complete automation cycle including matching, insights, and notifications",
        inputSchema: {
          type: "object",
          properties: {
            min_score: {
              type: "integer",
              description: "Minimum score for matches (default: 75)"
            },
            max_matches: {
              type: "integer",
              description: "Maximum matches to create (default: 50)"
            },
            send_notifications: {
              type: "boolean",
              description: "Whether to send notifications (default: true)"
            }
          }
        }
      },
      "natural_language_search" => {
        name: "natural_language_search",
        description: "Search for matches using natural language queries",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: 'Natural language search query (e.g., "Find React developers in New York under $100/hour")'
            }
          },
          required: [ "query" ]
        }
      },
      "ai_recommendation" => {
        name: "ai_recommendation",
        description: "Get AI-powered recommendations for improving matches",
        inputSchema: {
          type: "object",
          properties: {
            context: {
              type: "string",
              description: 'Context for recommendations (e.g., "low match scores", "skill gaps")'
            }
          }
        }
      },
      "conversational_summary" => {
        name: "conversational_summary",
        description: "Get a human-friendly summary of matching data",
        inputSchema: {
          type: "object",
          properties: {
            type: {
              type: "string",
              description: "Type of summary needed",
              enum: [ "daily_report", "match_analysis", "system_health" ]
            }
          },
          required: [ "type" ]
        }
      }
    }
  end

  def handle_request(request)
    case request["method"]
    when "tools/list"
      list_tools
    when "tools/call"
      call_tool(request["params"])
    else
      error_response("Unknown method: #{request['method']}")
    end
  rescue => e
    error_response("Error processing request: #{e.message}")
  end

  private

  def list_tools
    {
      tools: @tools.values
    }
  end

  def call_tool(params)
    tool_name = params["name"]
    arguments = params["arguments"]

    case tool_name
    when "find_matches_for_opportunity"
      find_matches_for_opportunity(arguments["opportunity_id"])
    when "find_matches_for_engineer"
      find_matches_for_engineer(arguments["engineer_id"])
    when "create_match"
      create_match(arguments["engineer_id"], arguments["opportunity_id"])
    when "trigger_matching"
      trigger_matching(arguments["opportunity_id"])
    when "get_automation_status"
      get_automation_status
    when "schedule_regular_matching"
      schedule_regular_matching(arguments["frequency"], arguments["enabled"])
    when "get_match_insights"
      get_match_insights(arguments["days"] || 7)
    when "auto_create_high_score_matches"
      auto_create_high_score_matches(arguments["min_score"] || 85, arguments["max_matches"] || 10)
    when "run_automation_cycle"
      run_automation_cycle(
        arguments["min_score"] || 75,
        arguments["max_matches"] || 50,
        arguments["send_notifications"] != false
      )
    when "natural_language_search"
      natural_language_search(arguments["query"])
    when "ai_recommendation"
      ai_recommendation(arguments["context"])
    when "conversational_summary"
      conversational_summary(arguments["type"])
    else
      error_response("Unknown tool: #{tool_name}")
    end
  end

  def find_matches_for_opportunity(opportunity_id)
    opportunity = ClientOpportunity.find(opportunity_id)
    matches = MatchingService.find_matches_for_opportunity(opportunity)

    formatted_matches = matches.map do |match|
      {
        engineer_id: match[:engineer].id,
        engineer_name: match[:engineer].name,
        score: match[:score],
        explanation: match[:explanation],
        skills: match[:engineer].skills.pluck(:name)
      }
    end

    {
      content: [
        {
          type: "text",
          text: "Found #{formatted_matches.count} matches for opportunity: #{opportunity.title}"
        }
      ],
      matches: formatted_matches
    }
  rescue ActiveRecord::RecordNotFound
    error_response("Opportunity not found with ID: #{opportunity_id}")
  end

  def find_matches_for_engineer(engineer_id)
    engineer = Engineer.find(engineer_id)
    matches = MatchingService.find_matches_for_engineer(engineer)

    formatted_matches = matches.map do |match|
      {
        opportunity_id: match[:opportunity].id,
        opportunity_title: match[:opportunity].title,
        client_name: match[:opportunity].client.name,
        score: match[:score],
        explanation: match[:explanation],
        required_skills: match[:opportunity].skills.pluck(:name)
      }
    end

    {
      content: [
        {
          type: "text",
          text: "Found #{formatted_matches.count} matches for engineer: #{engineer.name}"
        }
      ],
      matches: formatted_matches
    }
  rescue ActiveRecord::RecordNotFound
    error_response("Engineer not found with ID: #{engineer_id}")
  end

  def create_match(engineer_id, opportunity_id)
    engineer = Engineer.find(engineer_id)
    opportunity = ClientOpportunity.find(opportunity_id)

    # Calculate AI score and explanation
    score = MatchingService.calculate_match_score(engineer, opportunity)
    explanation = MatchingService.generate_explanation(engineer, opportunity, score)

    # Create the match record
    match = Match.create!(
      engineer: engineer,
      client: opportunity.client,
      client_opportunity: opportunity,
      score: score,
      explanation: explanation,
      status: "pending",
      matched_at: Time.current
    )

    {
      content: [
        {
          type: "text",
          text: "Created match between #{engineer.name} and #{opportunity.title} with #{score}% compatibility"
        }
      ],
      match: {
        id: match.id,
        score: score,
        explanation: explanation,
        status: match.status
      }
    }
  rescue ActiveRecord::RecordNotFound => e
    error_response("Engineer or Opportunity not found")
  end

  def trigger_matching(opportunity_id = nil)
    begin
      if opportunity_id
        job = MatchingJob.perform_later(opportunity_id)
        message = "Matching triggered for opportunity ID #{opportunity_id}"
      else
        job = MatchingJob.perform_later
        message = "Matching triggered for all active opportunities"
      end

      {
        content: [
          {
            type: "text",
            text: message
          }
        ],
        job_id: job.job_id,
        success: true
      }
    rescue => e
      error_response("Failed to trigger matching: #{e.message}")
    end
  end

  def get_automation_status
    begin
      # Check Sidekiq stats
      sidekiq_stats = Sidekiq::Stats.new

      # Get recent job history
      recent_jobs = Sidekiq::DeadSet.new.size + Sidekiq::RetrySet.new.size

      # Get scheduled jobs
      scheduled_jobs = Sidekiq::ScheduledSet.new
      automated_matching_jobs = scheduled_jobs.select { |job| job.klass == "AutomatedMatchingJob" }
      cleanup_jobs = scheduled_jobs.select { |job| job.klass == "MatchingCleanupJob" }

      {
        content: [
          {
            type: "text",
            text: "Automation Status Report - Simplified Schedule"
          }
        ],
        automation: {
          sidekiq_status: {
            processed: sidekiq_stats.processed,
            failed: sidekiq_stats.failed,
            busy: sidekiq_stats.workers_size,
            enqueued: sidekiq_stats.enqueued,
            scheduled: sidekiq_stats.scheduled_size,
            retry_set: sidekiq_stats.retry_size,
            dead_set: sidekiq_stats.dead_size
          },
          scheduled_jobs: {
            automated_matching: automated_matching_jobs.map do |job|
              {
                scheduled_at: job.at,
                args: job.args,
                queue: job.queue,
                description: "Runs every 4 hours - handles matching, insights, and notifications"
              }
            end,
            weekly_cleanup: cleanup_jobs.map do |job|
              {
                scheduled_at: job.at,
                args: job.args,
                queue: job.queue,
                description: "Runs weekly - cleans up old matches and duplicates"
              }
            end
          },
          last_matching_run: get_last_matching_run,
          next_scheduled_run: get_next_scheduled_run
        }
      }
    rescue => e
      error_response("Failed to get automation status: #{e.message}")
    end
  end

  def schedule_regular_matching(frequency, enabled)
    begin
      if enabled
        case frequency
        when "hourly"
          # Use AutomatedMatchingJob instead of MatchingJob
          AutomatedMatchingJob.set(cron: "0 * * * *").perform_later({
            "min_score" => 70,
            "auto_create_high_score" => true,
            "high_score_threshold" => 80,
            "send_notifications" => true
          })
          message = "Scheduled hourly comprehensive automation"
        when "daily"
          # Schedule AutomatedMatchingJob to run daily at 2 AM
          AutomatedMatchingJob.set(cron: "0 2 * * *").perform_later({
            "min_score" => 75,
            "auto_create_high_score" => true,
            "high_score_threshold" => 85,
            "send_notifications" => true
          })
          message = "Scheduled daily comprehensive automation at 2 AM"
        when "weekly"
          # Schedule AutomatedMatchingJob to run weekly on Sundays at 2 AM
          AutomatedMatchingJob.set(cron: "0 2 * * 0").perform_later({
            "min_score" => 80,
            "auto_create_high_score" => true,
            "high_score_threshold" => 90,
            "send_notifications" => true
          })
          message = "Scheduled weekly comprehensive automation on Sundays at 2 AM"
        else
          return error_response("Invalid frequency. Use: hourly, daily, or weekly")
        end
      else
        # Cancel scheduled automation jobs
        Sidekiq::ScheduledSet.new.each do |job|
          job.delete if [ "AutomatedMatchingJob", "MatchingJob" ].include?(job.klass)
        end
        message = "Disabled automated matching"
      end

      {
        content: [
          {
            type: "text",
            text: message
          }
        ],
        success: true,
        frequency: frequency,
        enabled: enabled,
        note: "Using comprehensive AutomatedMatchingJob that includes matching, insights, and notifications"
      }
    rescue => e
      error_response("Failed to schedule automation: #{e.message}")
    end
  end

  def get_match_insights(days = 7)
    begin
      insights = AutomationInsightsService.generate_match_insights(days)

      {
        content: [
          {
            type: "text",
            text: "Match Insights for the last #{days} days"
          }
        ],
        insights: {
          period_days: days,
          summary: insights[:summary],
          trends: insights[:trends],
          recommendations: insights[:recommendations],
          top_skills: insights[:top_skills],
          match_quality: insights[:match_quality]
        }
      }
    rescue => e
      error_response("Failed to generate insights: #{e.message}")
    end
  end

  def auto_create_high_score_matches(min_score = 85, max_matches = 10)
    begin
      created_matches = []

      # Find all active opportunities
      opportunities = ClientOpportunity.where(status: "active").limit(20)

      opportunities.each do |opportunity|
        # Find potential matches
        matches = MatchingService.find_matches_for_opportunity(opportunity)

        # Filter high-score matches
        high_score_matches = matches.select { |match| match[:score] >= min_score }

        high_score_matches.first(max_matches).each do |match_data|
          engineer = match_data[:engineer]

          # Check if match already exists
          existing_match = Match.find_by(
            engineer: engineer,
            client: opportunity.client,
            client_opportunity: opportunity
          )

          unless existing_match
            match = Match.create!(
              engineer: engineer,
              client: opportunity.client,
              client_opportunity: opportunity,
              score: match_data[:score],
              explanation: match_data[:explanation],
              status: "pending",
              matched_at: Time.current
            )

            created_matches << {
              match_id: match.id,
              engineer_name: engineer.name,
              opportunity_title: opportunity.title,
              score: match_data[:score]
            }
          end
        end

        break if created_matches.count >= max_matches
      end

      {
        content: [
          {
            type: "text",
            text: "Auto-created #{created_matches.count} high-score matches"
          }
        ],
        created_matches: created_matches,
        min_score_threshold: min_score,
        success: true
      }
    rescue => e
      error_response("Failed to auto-create matches: #{e.message}")
    end
  end

  def run_automation_cycle(min_score = 75, max_matches = 50, send_notifications = true)
    begin
      results = {
        started_at: Time.current,
        matches_created: 0,
        insights_generated: 0,
        notifications_sent: 0
      }

      # Step 1: Auto-create high-score matches
      high_score_response = auto_create_high_score_matches(min_score, max_matches)
      if high_score_response && !high_score_response[:error]
        results[:matches_created] = high_score_response[:created_matches]&.count || 0
      end

      # Step 2: Generate insights
      insights_response = get_match_insights(1) # Last 24 hours
      if insights_response && !insights_response[:error]
        results[:insights_generated] = 1
      end

      # Step 3: Send notifications if enabled
      if send_notifications
        notification_response = trigger_matching
        if notification_response && !notification_response[:error]
          results[:notifications_sent] = 1
        end
      end

      results[:completed_at] = Time.current
      results[:duration_seconds] = (results[:completed_at] - results[:started_at]).to_i

      {
        content: [
          {
            type: "text",
            text: "Automation cycle completed in #{results[:duration_seconds]} seconds"
          }
        ],
        cycle_results: results,
        success: true
      }

    rescue => e
      error_response("Automation cycle failed: #{e.message}")
    end
  end

  private

  def get_last_matching_run
    # Get the most recent AutomatedMatchingJob completion
    begin
      Match.maximum(:created_at)
    rescue
      nil
    end
  end

  def get_next_scheduled_run
    # Get next scheduled AutomatedMatchingJob
    begin
      scheduled_jobs = Sidekiq::ScheduledSet.new
      next_job = scheduled_jobs.find { |job| job.klass == "AutomatedMatchingJob" }
      next_job&.at
    rescue
      nil
    end
  end

  def error_response(message)
    {
      error: {
        code: -1,
        message: message
      }
    }
  end

  def natural_language_search(query)
    begin
      # Parse natural language query into search parameters
      parsed_query = parse_natural_language(query)

      # Execute search based on parsed parameters
      results = execute_search(parsed_query)

      {
        content: [
          {
            type: "text",
            text: "Search results for: '#{query}'"
          }
        ],
        query: query,
        parsed_parameters: parsed_query,
        results: results,
        natural_language_summary: generate_search_summary(results, query)
      }
    rescue => e
      error_response("Natural language search failed: #{e.message}")
    end
  end

  def ai_recommendation(context)
    begin
      recommendations = generate_ai_recommendations(context)

      {
        content: [
          {
            type: "text",
            text: "AI recommendations based on: #{context}"
          }
        ],
        context: context,
        recommendations: recommendations,
        priority_actions: recommendations.select { |r| r[:priority] == "high" }
      }
    rescue => e
      error_response("AI recommendation failed: #{e.message}")
    end
  end

  def conversational_summary(type)
    begin
      summary_data = case type
      when "daily_report"
        generate_daily_report
      when "match_analysis"
        generate_match_analysis
      when "system_health"
        generate_system_health_summary
      else
        { error: "Unknown summary type" }
      end

      {
        content: [
          {
            type: "text",
            text: summary_data[:human_text]
          }
        ],
        summary_type: type,
        data: summary_data[:data],
        conversational_text: summary_data[:human_text]
      }
    rescue => e
      error_response("Conversational summary failed: #{e.message}")
    end
  end

  private

  def parse_natural_language(query)
    # Simple keyword extraction (in production, use NLP service)
    parsed = {
      skills: [],
      location: nil,
      budget_max: nil,
      availability: nil
    }

    # Extract skills
    skills = [ "React", "Python", "Ruby", "Java", "JavaScript", "Node.js", "Rails", "Django" ]
    skills.each do |skill|
      if query.downcase.include?(skill.downcase)
        parsed[:skills] << skill
      end
    end

    # Extract budget
    budget_match = query.match(/\$(\d+)/i)
    if budget_match
      parsed[:budget_max] = budget_match[1].to_i
    end

    # Extract location
    locations = [ "New York", "San Francisco", "Remote", "London", "Toronto" ]
    locations.each do |location|
      if query.downcase.include?(location.downcase)
        parsed[:location] = location
      end
    end

    parsed
  end

  def execute_search(parsed_query)
    # Find opportunities or engineers based on parsed query
    if parsed_query[:skills].any?
      # Search for engineers with these skills
      engineers = Engineer.available
                         .joins(:skills)
                         .where(skills: { name: parsed_query[:skills] })
                         .distinct
                         .limit(10)

      engineers.map do |engineer|
        {
          type: "engineer",
          id: engineer.id,
          name: engineer.name,
          skills: engineer.skills.pluck(:name),
          country: engineer.country,
          target_rate: engineer.target_rate,
          status: engineer.status
        }
      end
    else
      []
    end
  end

  def generate_search_summary(results, query)
    if results.any?
      "I found #{results.count} matching #{results.first[:type]}s for '#{query}'. The top matches have relevant skills and availability."
    else
      "I couldn't find any matches for '#{query}'. Try adjusting your criteria or check if there are available candidates with those skills."
    end
  end

  def generate_ai_recommendations(context)
    recommendations = []

    case context.downcase
    when "low match scores"
      recommendations << {
        priority: "high",
        action: "expand_skill_requirements",
        message: "Consider broadening skill requirements to find more matches",
        impact: "Could increase matches by 30-50%"
      }
      recommendations << {
        priority: "medium",
        action: "adjust_budget",
        message: "Review budget ranges to attract more candidates",
        impact: "Better budget alignment improves match scores"
      }
    when "skill gaps"
      recommendations << {
        priority: "high",
        action: "training_program",
        message: "Consider internal training for high-potential engineers",
        impact: "Develop skills internally rather than hiring externally"
      }
      recommendations << {
        priority: "medium",
        action: "partner_search",
        message: "Look for consulting partners with required skills",
        impact: "Faster access to specialized skills"
      }
    else
      recommendations << {
        priority: "medium",
        action: "general_optimization",
        message: "Run automated matching more frequently",
        impact: "Stay on top of new opportunities and availability changes"
      }
    end

    recommendations
  end

  def generate_daily_report
    insights = AutomationInsightsService.generate_match_insights(1)
    summary = insights[:summary]

    human_text = "Today's matching report: We processed #{summary[:total_matches]} matches with an average quality score of #{summary[:average_score]}%. #{summary[:high_score_matches]} were high-quality matches worth immediate attention."

    if insights[:recommendations].any?
      human_text += " Key recommendations: #{insights[:recommendations].first[:message]}"
    end

    {
      data: insights,
      human_text: human_text
    }
  end

  def generate_match_analysis
    recent_matches = Match.includes(:engineer, :client_opportunity, :client)
                         .where("created_at > ?", 7.days.ago)
                         .limit(100)

    avg_score = recent_matches.average(:score)&.round(1) || 0
    high_score_count = recent_matches.where("score >= 85").count

    human_text = "Match analysis for the past week: #{recent_matches.count} total matches created with #{avg_score}% average score. #{high_score_count} matches scored 85% or higher, indicating excellent compatibility."

    {
      data: {
        total_matches: recent_matches.count,
        average_score: avg_score,
        high_score_matches: high_score_count,
        score_distribution: calculate_score_distribution(recent_matches)
      },
      human_text: human_text
    }
  end

  def generate_system_health_summary
    automation_status = get_automation_status
    sidekiq_stats = automation_status.dig(:automation, :sidekiq_status) || {}

    health_score = calculate_health_score(sidekiq_stats)

    human_text = case health_score
    when 90..100
      "System health is excellent! All automation jobs are running smoothly with #{sidekiq_stats[:processed]} jobs completed and only #{sidekiq_stats[:failed]} failures."
    when 70..89
      "System health is good with minor issues. #{sidekiq_stats[:failed]} failed jobs out of #{sidekiq_stats[:processed]} total. Monitor for trends."
    else
      "System health needs attention. High failure rate detected. #{sidekiq_stats[:failed]} failed jobs require investigation."
    end

    {
      data: {
        health_score: health_score,
        sidekiq_stats: sidekiq_stats,
        status: health_score >= 90 ? "excellent" : health_score >= 70 ? "good" : "needs_attention"
      },
      human_text: human_text
    }
  end

  def calculate_score_distribution(matches)
    return {} if matches.empty?

    {
      excellent: matches.where("score >= 90").count,
      good: matches.where("score >= 75 AND score < 90").count,
      fair: matches.where("score >= 60 AND score < 75").count,
      poor: matches.where("score < 60").count
    }
  end

  def calculate_health_score(sidekiq_stats)
    processed = sidekiq_stats[:processed] || 0
    failed = sidekiq_stats[:failed] || 0

    return 100 if processed == 0 # No activity yet

    failure_rate = (failed.to_f / processed) * 100

    case failure_rate
    when 0..1 then 100
    when 1..5 then 90
    when 5..10 then 80
    when 10..20 then 70
    else 50
    end
  end
end
