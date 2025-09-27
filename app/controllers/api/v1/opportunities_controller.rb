class Api::V1::OpportunitiesController < Api::V1::ApplicationController
  before_action :set_opportunity, only: [ :show, :update, :destroy ]

  # GET /api/v1/opportunities
  def index
    @opportunities = ClientOpportunity.includes(:client, :skills)

    # Apply search filter
    if params[:search].present?
      @opportunities = @opportunities.where("title ILIKE ? OR description ILIKE ? OR job_role ILIKE ?",
                                           "%#{params[:search]}%", "%#{params[:search]}%", "%#{params[:search]}%")
    end

    # Apply client filter
    if params[:client_id].present?
      @opportunities = @opportunities.where(client_id: params[:client_id])
    end

    # Apply status filter
    if params[:status].present?
      @opportunities = @opportunities.where(status: params[:status])
    end

    # Apply priority filter
    if params[:priority].present?
      @opportunities = @opportunities.where(priority: params[:priority])
    end

    # Apply employment type filter
    if params[:employment_type].present?
      @opportunities = @opportunities.where(employment_type: params[:employment_type])
    end

    # Apply geo filter
    if params[:geo].present?
      @opportunities = @opportunities.where("geo ILIKE ?", "%#{params[:geo]}%")
    end

    # Sorting
    sort_by = params[:sort_by] || "created_at"
    sort_order = params[:sort_order] || "desc"

    case sort_by
    when "title"
      @opportunities = @opportunities.order(title: sort_order)
    when "client_id"
      @opportunities = @opportunities.joins(:client).order("clients.name #{sort_order}")
    when "status"
      @opportunities = @opportunities.order(status: sort_order)
    when "priority"
      @opportunities = @opportunities.order(priority: sort_order)
    when "budget"
      @opportunities = @opportunities.order(budget: sort_order)
    when "created_at"
      @opportunities = @opportunities.order(created_at: sort_order)
    end

    # Pagination
    page = params[:page]&.to_i || 1
    per_page = params[:per_page]&.to_i || 10
    per_page = [ per_page, 50 ].min # Max 50 per page

    @opportunities = @opportunities.page(page).per(per_page)

    render json: {
      data: @opportunities.map { |opportunity| opportunity_json(opportunity) },
      meta: {
        current_page: page,
        per_page: per_page,
        total_count: @opportunities.total_count,
        total_pages: @opportunities.total_pages
      }
    }
  end

  # GET /api/v1/opportunities/:id
  def show
    render json: { data: opportunity_json(@opportunity, detailed: true) }
  end

  # POST /api/v1/opportunities
  def create
    @opportunity = ClientOpportunity.new(opportunity_params)

    if @opportunity.save
      # Add skills if provided
      if params[:opportunity][:skill_ids].present?
        add_skills_to_opportunity(@opportunity, params[:opportunity][:skill_ids])
      end

      render_success(opportunity_json(@opportunity), "Opportunity created successfully", :created)
    else
      render_error(@opportunity.errors.full_messages.join(", "))
    end
  end

  # PATCH/PUT /api/v1/opportunities/:id
  def update
    if @opportunity.update(opportunity_params)
      # Update skills if provided
      if params[:opportunity][:skill_ids].present?
        @opportunity.client_opportunity_skills.destroy_all
        add_skills_to_opportunity(@opportunity, params[:opportunity][:skill_ids])
      end

      render_success(opportunity_json(@opportunity), "Opportunity updated successfully")
    else
      render_error(@opportunity.errors.full_messages.join(", "))
    end
  end

  # DELETE /api/v1/opportunities/:id
  def destroy
    @opportunity.destroy
    render_success(nil, "Opportunity deleted successfully")
  end

  private

  def set_opportunity
    @opportunity = ClientOpportunity.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render_error("Opportunity not found", :not_found)
  end

  def opportunity_params
    params.require(:opportunity).permit(
      :client_id, :title, :description, :geo, :employment_type, :job_role,
      :status, :priority, :budget, :start_date, :end_date
    )
  end

  def opportunity_json(opportunity, detailed: false)
    base_json = {
      id: opportunity.id,
      client_id: opportunity.client_id,
      client: opportunity.client ? {
        id: opportunity.client.id,
        name: opportunity.client.name,
        industry: opportunity.client.industry
      } : nil,
      title: opportunity.title,
      description: opportunity.description,
      geo: opportunity.geo,
      employment_type: opportunity.employment_type,
      job_role: opportunity.job_role,
      status: opportunity.status,
      priority: opportunity.priority,
      budget: opportunity.budget,
      start_date: opportunity.start_date,
      end_date: opportunity.end_date,
      created_at: opportunity.created_at,
      updated_at: opportunity.updated_at
    }

    if detailed
      base_json.merge!({
        skills: opportunity.skills.map { |skill| { id: skill.id, name: skill.name } },
        required_skills: opportunity.required_skills.map { |skill| { id: skill.id, name: skill.name } },
        optional_skills: opportunity.optional_skills.map { |skill| { id: skill.id, name: skill.name } }
      })
    end

    base_json
  end

  def add_skills_to_opportunity(opportunity, skill_data)
    skill_data.each do |skill_info|
      if skill_info.is_a?(Hash)
        skill = Skill.find_or_create_by(name: skill_info[:name] || skill_info["name"])
        importance = skill_info[:importance] || skill_info["importance"] || 1
        required = skill_info[:required] || skill_info["required"] || false
        opportunity.client_opportunity_skills.create(skill: skill, importance: importance, required: required)
      else
        # If it's just an ID or name
        skill = skill_info.to_s.match(/^\d+$/) ? Skill.find(skill_info) : Skill.find_or_create_by(name: skill_info)
        opportunity.client_opportunity_skills.create(skill: skill, importance: 1, required: false)
      end
    end
  end
end
