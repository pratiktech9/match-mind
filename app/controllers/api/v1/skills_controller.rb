class Api::V1::SkillsController < Api::V1::ApplicationController
  # GET /api/v1/skills
  def index
    @skills = Skill.all

    # Apply search filter if provided
    if params[:search].present?
      @skills = @skills.search(params[:search])
    end

    # Apply category filter if provided
    if params[:category].present?
      @skills = @skills.by_category(params[:category])
    end

    # Order by name by default
    @skills = @skills.order(:name)

    render json: {
      data: @skills.map { |skill| skill_json(skill) }
    }
  end

  # GET /api/v1/skills/:id
  def show
    @skill = Skill.find(params[:id])
    render json: { data: skill_json(@skill, detailed: true) }
  rescue ActiveRecord::RecordNotFound
    render_error("Skill not found", :not_found)
  end

  private

  def skill_json(skill, detailed: false)
    base_json = {
      id: skill.id,
      name: skill.name,
      created_at: skill.created_at,
      updated_at: skill.updated_at
    }

    if detailed
      base_json.merge!({
        engineer_count: skill.engineer_count,
        opportunity_count: skill.opportunity_count,
        demand_score: skill.demand_score,
        category: skill.category
      })
    end

    base_json
  end
end
