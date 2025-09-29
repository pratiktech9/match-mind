require "net/http"
require "json"

class McpClientExample
  def initialize(base_url = "http://localhost:3000")
    @base_url = base_url
  end

  # List available tools
  def list_tools
    request = {
      method: "tools/list"
    }

    send_request(request)
  end

  # Find matches for an opportunity
  def find_matches_for_opportunity(opportunity_id)
    request = {
      method: "tools/call",
      params: {
        name: "find_matches_for_opportunity",
        arguments: {
          opportunity_id: opportunity_id
        }
      }
    }

    send_request(request)
  end

  # Find matches for an engineer
  def find_matches_for_engineer(engineer_id)
    request = {
      method: "tools/call",
      params: {
        name: "find_matches_for_engineer",
        arguments: {
          engineer_id: engineer_id
        }
      }
    }

    send_request(request)
  end

  private

  def send_request(request_data)
    uri = URI("#{@base_url}/mcp")
    http = Net::HTTP.new(uri.host, uri.port)

    request = Net::HTTP::Post.new(uri)
    request["Content-Type"] = "application/json"
    request.body = request_data.to_json

    response = http.request(request)
    JSON.parse(response.body)
  rescue => e
    { error: { code: -1, message: "Request failed: #{e.message}" } }
  end
end

# Usage examples:
if __FILE__ == $0
  client = McpClientExample.new

  puts "=== Listing available tools ==="
  puts JSON.pretty_generate(client.list_tools)

  puts "\n=== Finding matches for opportunity ID 1 ==="
  puts JSON.pretty_generate(client.find_matches_for_opportunity(1))

  puts "\n=== Finding matches for engineer ID 1 ==="
  puts JSON.pretty_generate(client.find_matches_for_engineer(1))
end
