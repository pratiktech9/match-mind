require_relative "../../services/matching_service"

class Api::MatchingController < ApplicationController
  skip_before_action :verify_authenticity_token
  # before_action :authenticate_user! # Commented out for testing

  def index
    matches = Match.includes(:engineer, :client, :client_opportunity)
    
    # Apply filters
    matches = matches.by_status(params[:status]) if params[:status].present?
    matches = matches.by_client(params[:client_id]) if params[:client_id].present?
    matches = matches.by_engineer(params[:engineer_id]) if params[:engineer_id].present?
    matches = matches.by_opportunity(params[:opportunity_id]) if params[:opportunity_id].present?
    matches = matches.high_score(params[:min_score]) if params[:min_score].present?
    
    # Pagination
    page = params[:page]&.to_i || 1
    per_page = params[:per_page]&.to_i || 20
    per_page = [per_page, 50].min # Max 50 per page
    
    matches = matches.page(page).per(per_page)
    
    render json: {
      data: matches.map { |match| match_json(match) },
      meta: {
        current_page: page,
        per_page: per_page,
        total_count: matches.total_count,
        total_pages: matches.total_pages
      }
    }
  end

  def trigger_matching
    if params[:opportunity_id].present?
      # Trigger matching for specific opportunity
      MatchingJob.perform_later(params[:opportunity_id])
      message = "Matching triggered for specific opportunity"
    else
      # Trigger matching for all active opportunities
      MatchingJob.perform_later
      message = "Matching triggered for all active opportunities"
    end
    
    render json: {
      success: true,
      message: message,
      job_id: "queued"
    }
  end

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
      client_opportunity: opportunity,
      score: score,
      explanation: explanation,
      status: 'pending',
      matched_at: Time.current
    )

    render json: {
      data: match_json(match),
      message: "Match created successfully"
    }
  end

  def update_match_status
    match = Match.find(params[:id])
    
    if match.update(status: params[:status])
      render json: {
        data: match_json(match),
        message: "Match status updated successfully"
      }
    else
      render json: {
        error: match.errors.full_messages.join(", ")
      }, status: :unprocessable_entity
    end
  end

  private

  def authenticate_user!
    unless session[:user_id]
      render json: { error: "Authentication required" }, status: :unauthorized
    end
  end

  def match_json(match)
    {
      id: match.id,
      engineer: {
        id: match.engineer.id,
        name: match.engineer.name,
        email: match.engineer.email,
        country: match.engineer.country,
        status: match.engineer.status,
        skills: match.engineer.skills.map { |s| { id: s.id, name: s.name } }
      },
      client: {
        id: match.client.id,
        name: match.client.name,
        industry: match.client.industry
      },
      opportunity: match.client_opportunity ? {
        id: match.client_opportunity.id,
        title: match.client_opportunity.title,
        job_role: match.client_opportunity.job_role,
        budget: match.client_opportunity.budget,
        status: match.client_opportunity.status
      } : nil,
      score: match.score,
      explanation: match.explanation,
      status: match.status,
      matched_at: match.matched_at,
      created_at: match.created_at,
      updated_at: match.updated_at
    }
  end
end
