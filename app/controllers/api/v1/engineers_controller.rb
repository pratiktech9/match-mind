class Api::V1::EngineersController < Api::V1::ApplicationController
  before_action :set_engineer, only: [:show, :update, :destroy]

  # GET /api/v1/engineers
  def index
    @engineers = Engineer.includes(:skills, :engineer_skills)

    # Apply search filter
    if params[:search].present?
      @engineers = @engineers.search(params[:search])
    end

    # Apply status filter
    if params[:status].present?
      case params[:status]
      when 'available'
        @engineers = @engineers.available
      when 'rolling_off_soon'
        @engineers = @engineers.rolling_off_soon
      when 'on_project'
        @engineers = @engineers.on_project
      end
    end

    # Apply skills filter
    if params[:skills].present?
      skill_names = params[:skills].is_a?(Array) ? params[:skills] : params[:skills].split(',')
      @engineers = @engineers.with_skills(skill_names)
    end

    # Apply country filter
    if params[:country].present?
      @engineers = @engineers.by_country(params[:country])
    end

    # Apply industry filter
    if params[:industry].present?
      @engineers = @engineers.by_industry(params[:industry])
    end

    # Pagination
    page = params[:page]&.to_i || 1
    per_page = params[:per_page]&.to_i || 10
    per_page = [per_page, 50].min # Max 50 per page

    @engineers = @engineers.page(page).per(per_page)

    render json: {
      data: @engineers.map { |engineer| engineer_json(engineer) },
      meta: {
        current_page: page,
        per_page: per_page,
        total_count: @engineers.total_count,
        total_pages: @engineers.total_pages
      }
    }
  end

  # GET /api/v1/engineers/:id
  def show
    render json: { data: engineer_json(@engineer, detailed: true) }
  end

  # POST /api/v1/engineers
  def create
    @engineer = Engineer.new(engineer_params)

    if @engineer.save
      # Add skills if provided
      if params[:skill_ids].present?
        add_skills_to_engineer(@engineer, params[:skill_ids])
      end

      render_success(engineer_json(@engineer), 'Engineer created successfully', :created)
    else
      render_error(@engineer.errors.full_messages.join(', '))
    end
  end

  # PATCH/PUT /api/v1/engineers/:id
  def update
    if @engineer.update(engineer_params)
      # Update skills if provided
      if params[:skill_ids].present?
        @engineer.engineer_skills.destroy_all
        add_skills_to_engineer(@engineer, params[:skill_ids])
      end

      render_success(engineer_json(@engineer), 'Engineer updated successfully')
    else
      render_error(@engineer.errors.full_messages.join(', '))
    end
  end

  # DELETE /api/v1/engineers/:id
  def destroy
    @engineer.destroy
    render_success(nil, 'Engineer deleted successfully')
  end

  private

  def set_engineer
    @engineer = Engineer.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render_error('Engineer not found', :not_found)
  end

  def engineer_params
    params.require(:engineer).permit(
      :name, :email, :country, :status, :current_client, :industry_experience,
      :notice_date, :expected_end_date, :return_date, :notes, :utilization, :target_rate
    )
  end

  def engineer_json(engineer, detailed: false)
    base_json = {
      id: engineer.id,
      name: engineer.name,
      email: engineer.email,
      country: engineer.country,
      status: engineer.status,
      current_client: engineer.current_client,
      industry_experience: engineer.industry_experience,
      utilization: engineer.utilization,
      target_rate: engineer.target_rate,
      skills: engineer.skills.map do |skill|
        engineer_skill = engineer.engineer_skills.find_by(skill: skill)
        {
          id: skill.id,
          name: skill.name,
          level: engineer_skill&.level
        }
      end,
      created_at: engineer.created_at,
      updated_at: engineer.updated_at
    }

    if detailed
      base_json.merge!({
        notice_date: engineer.notice_date,
        expected_end_date: engineer.expected_end_date,
        return_date: engineer.return_date,
        notes: engineer.notes,
        days_until_notice: engineer.days_until_notice,
        days_until_return: engineer.days_until_return,
        primary_skills: engineer.primary_skills.map { |es| { name: es.skill.name, level: es.level } },
        secondary_skills: engineer.secondary_skills.map { |es| { name: es.skill.name, level: es.level } },
        available?: engineer.available?,
        rolling_off_soon?: engineer.rolling_off_soon?,
        on_project?: engineer.on_project?
      })
    end

    base_json
  end

  def add_skills_to_engineer(engineer, skill_data)
    skill_data.each do |skill_info|
      if skill_info.is_a?(Hash)
        skill = Skill.find_or_create_by(name: skill_info[:name] || skill_info['name'])
        level = skill_info[:level] || skill_info['level'] || 'secondary'
        engineer.engineer_skills.create(skill: skill, level: level)
      else
        # If it's just an ID or name
        skill = skill_info.to_s.match(/^\d+$/) ? Skill.find(skill_info) : Skill.find_or_create_by(name: skill_info)
        engineer.engineer_skills.create(skill: skill, level: 'secondary')
      end
    end
  end
end
