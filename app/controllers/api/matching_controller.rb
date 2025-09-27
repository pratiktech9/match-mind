require_relative "../../services/matching_service"

class Api::MatchingController < ApplicationController
  skip_before_action :verify_authenticity_token
  # before_action :authenticate_user! # Commented out for testing

  def find_matches_for_opportunity
    opportunity = ClientOpportunity.find(params[:opportunity_id])
    matches = MatchingService.find_matches_for_opportunity(opportunity)

    render json: {
      opportunity: opportunity.as_json(include: [ :client, :skills ]),
      matches: matches.map do |match|
        {
          engineer: match[:engineer].as_json(include: :skills),
          score: match[:score],
          explanation: match[:explanation]
        }
      end
    }
  end

  def find_matches_for_engineer
    engineer = Engineer.find(params[:engineer_id])
    matches = MatchingService.find_matches_for_engineer(engineer)

    render json: {
      engineer: engineer.as_json(include: :skills),
      matches: matches.map do |match|
        {
          opportunity: match[:opportunity].as_json(include: [ :client, :skills ]),
          score: match[:score],
          explanation: match[:explanation]
        }
      end
    }
  end

  def create_match
    engineer = Engineer.find(params[:engineer_id])
    opportunity = ClientOpportunity.find(params[:opportunity_id])

    # Calculate AI score and explanation
    score = MatchingService.calculate_match_score(engineer, opportunity)
    explanation = MatchingService.generate_explanation(engineer, opportunity, score)

    # Create the match record
    match = Match.create!(
      engineer: engineer,
      client: opportunity.client,
      score: score,
      explanation: explanation
    )

    render json: {
      match: match.as_json,
      engineer: engineer.as_json(include: :skills),
      opportunity: opportunity.as_json(include: [ :client, :skills ])
    }
  end

  private

  def authenticate_user!
    unless session[:user_id]
      render json: { error: "Authentication required" }, status: :unauthorized
    end
  end
end
