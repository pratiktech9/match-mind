class McpController < ApplicationController
  before_action :initialize_mcp_server
  skip_before_action :verify_authenticity_token

  def handle_request
    request_data = JSON.parse(request.body.read)

    # Log AI assistant requests for analytics
    log_ai_request(request_data)

    response_data = @mcp_server.handle_request(request_data)

    # Add AI-friendly metadata to responses
    response_data = enhance_for_ai(response_data, request_data)

    render json: response_data
  rescue JSON::ParserError => e
    render json: { error: { code: -1, message: "Invalid JSON: #{e.message}" } }, status: 400
  rescue => e
    Rails.logger.error "MCP Server error: #{e.message}"
    render json: { error: { code: -1, message: "Server error: #{e.message}" } }, status: 500
  end

  private

  def initialize_mcp_server
    @mcp_server = McpServer.new
  end

  def log_ai_request(request_data)
    # Log for AI analytics (optional)
    Rails.logger.info "MCP Request: #{request_data['method']} - #{request_data.dig('params', 'name')}"
  end

  def enhance_for_ai(response_data, request_data)
    # Add AI-friendly metadata
    if response_data && !response_data[:error]
      response_data[:ai_metadata] = {
        timestamp: Time.current.iso8601,
        request_type: request_data['method'],
        tool_used: request_data.dig('params', 'name'),
        response_format: 'mcp_v1',
        human_readable: generate_human_summary(response_data, request_data)
      }
    end

    response_data
  end

  def generate_human_summary(response_data, request_data)
    case request_data.dig('params', 'name')
    when 'find_matches_for_opportunity'
      matches_count = response_data.dig(:matches)&.count || 0
      "Found #{matches_count} matching engineers for this opportunity"
    when 'find_matches_for_engineer'
      matches_count = response_data.dig(:matches)&.count || 0
      "Found #{matches_count} matching opportunities for this engineer"
    when 'get_automation_status'
      status = response_data.dig(:automation, :sidekiq_status, :processed) || 0
      "System has processed #{status} jobs total"
    when 'auto_create_high_score_matches'
      created = response_data.dig(:created_matches)&.count || 0
      "Automatically created #{created} high-confidence matches"
    when 'get_match_insights'
      total = response_data.dig(:insights, :summary, :total_matches) || 0
      avg_score = response_data.dig(:insights, :summary, :average_score) || 0
      "Analyzed #{total} matches with #{avg_score}% average score"
    else
      "MCP operation completed successfully"
    end
  end
end
