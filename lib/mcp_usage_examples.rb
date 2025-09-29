require "net/http"
require "json"

# Examples of how to use the MCP endpoint
class McpUsageExamples
  BASE_URL = "http://localhost:3000"

  def self.run_all_examples
    puts "🤖 MCP Server Usage Examples\n\n"

    # Example 1: List available tools
    puts "1. Listing Available Tools:"
    list_tools
    puts "\n" + "="*50 + "\n"

    # Example 2: Find matches for opportunity
    puts "2. Find Matches for Opportunity:"
    find_matches_for_opportunity(1)
    puts "\n" + "="*50 + "\n"

    # Example 3: Find matches for engineer
    puts "3. Find Matches for Engineer:"
    find_matches_for_engineer(1)
    puts "\n" + "="*50 + "\n"

    # Example 4: Get automation status
    puts "4. Get Automation Status:"
    get_automation_status
    puts "\n" + "="*50 + "\n"

    # Example 5: Auto-create high score matches
    puts "5. Auto-Create High Score Matches:"
    auto_create_high_score_matches
    puts "\n" + "="*50 + "\n"

    # Example 6: Get match insights
    puts "6. Get Match Insights:"
    get_match_insights
    puts "\n" + "="*50 + "\n"
  end

  def self.list_tools
    request = { method: "tools/list" }
    response = send_mcp_request(request)
    puts JSON.pretty_generate(response)
  end

  def self.find_matches_for_opportunity(opportunity_id)
    request = {
      method: "tools/call",
      params: {
        name: "find_matches_for_opportunity",
        arguments: { opportunity_id: opportunity_id }
      }
    }
    response = send_mcp_request(request)
    puts JSON.pretty_generate(response)
  end

  def self.find_matches_for_engineer(engineer_id)
    request = {
      method: "tools/call",
      params: {
        name: "find_matches_for_engineer",
        arguments: { engineer_id: engineer_id }
      }
    }
    response = send_mcp_request(request)
    puts JSON.pretty_generate(response)
  end

  def self.get_automation_status
    request = {
      method: "tools/call",
      params: {
        name: "get_automation_status",
        arguments: {}
      }
    }
    response = send_mcp_request(request)
    puts JSON.pretty_generate(response)
  end

  def self.auto_create_high_score_matches
    request = {
      method: "tools/call",
      params: {
        name: "auto_create_high_score_matches",
        arguments: { min_score: 80, max_matches: 5 }
      }
    }
    response = send_mcp_request(request)
    puts JSON.pretty_generate(response)
  end

  def self.get_match_insights
    request = {
      method: "tools/call",
      params: {
        name: "get_match_insights",
        arguments: { days: 7 }
      }
    }
    response = send_mcp_request(request)
    puts JSON.pretty_generate(response)
  end

  def self.trigger_matching
    request = {
      method: "tools/call",
      params: {
        name: "trigger_matching",
        arguments: {}
      }
    }
    response = send_mcp_request(request)
    puts JSON.pretty_generate(response)
  end

  def self.create_match(engineer_id, opportunity_id)
    request = {
      method: "tools/call",
      params: {
        name: "create_match",
        arguments: {
          engineer_id: engineer_id,
          opportunity_id: opportunity_id
        }
      }
    }
    response = send_mcp_request(request)
    puts JSON.pretty_generate(response)
  end

  private

  def self.send_mcp_request(request_data)
    uri = URI("#{BASE_URL}/mcp")
    http = Net::HTTP.new(uri.host, uri.port)

    request = Net::HTTP::Post.new(uri)
    request["Content-Type"] = "application/json"
    request.body = request_data.to_json

    begin
      response = http.request(request)
      JSON.parse(response.body)
    rescue => e
      { error: { code: -1, message: "Request failed: #{e.message}" } }
    end
  end
end

# Usage:
# McpUsageExamples.run_all_examples
