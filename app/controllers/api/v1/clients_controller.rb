class Api::V1::ClientsController < Api::V1::ApplicationController
  before_action :set_client, only: [ :show, :update, :destroy ]

  # GET /api/v1/clients
  def index
    @clients = Client.includes(:client_opportunities)

    # Apply search filter
    if params[:search].present?
      @clients = @clients.where("name ILIKE ? OR industry ILIKE ?",
                               "%#{params[:search]}%", "%#{params[:search]}%")
    end

    # Apply industry filter
    if params[:industry].present?
      @clients = @clients.where(industry: params[:industry])
    end

    # Apply status filter (based on active opportunities)
    if params[:status].present?
      case params[:status]
      when "active"
        @clients = @clients.joins(:client_opportunities)
                          .where(client_opportunities: { status: "active" })
                          .distinct
      when "inactive"
        @clients = @clients.left_joins(:client_opportunities)
                          .where(client_opportunities: { id: nil })
      end
    end

    # Apply location filter (based on opportunities)
    if params[:location].present?
      @clients = @clients.joins(:client_opportunities)
                        .where("client_opportunities.geo ILIKE ?", "%#{params[:location]}%")
                        .distinct
    end

    # Sorting
    sort_by = params[:sort_by] || "name"
    sort_order = params[:sort_order] || "asc"

    case sort_by
    when "name"
      @clients = @clients.order(name: sort_order)
    when "industry"
      @clients = @clients.order(industry: sort_order)
    when "created_at"
      @clients = @clients.order(created_at: sort_order)
    end

    # Pagination
    page = params[:page]&.to_i || 1
    per_page = params[:per_page]&.to_i || 10
    per_page = [ per_page, 50 ].min # Max 50 per page

    @clients = @clients.page(page).per(per_page)

    render json: {
      data: @clients.map { |client| client_json(client) },
      meta: {
        current_page: page,
        per_page: per_page,
        total_count: @clients.total_count,
        total_pages: @clients.total_pages
      }
    }
  end

  # GET /api/v1/clients/:id
  def show
    render json: { data: client_json(@client, detailed: true) }
  end

  # POST /api/v1/clients
  def create
    @client = Client.new(client_params)

    if @client.save
      render_success(client_json(@client), "Client created successfully", :created)
    else
      render_error(@client.errors.full_messages.join(", "))
    end
  end

  # PATCH/PUT /api/v1/clients/:id
  def update
    if @client.update(client_params)
      render_success(client_json(@client), "Client updated successfully")
    else
      render_error(@client.errors.full_messages.join(", "))
    end
  end

  # DELETE /api/v1/clients/:id
  def destroy
    @client.destroy
    render_success(nil, "Client deleted successfully")
  end

  private

  def set_client
    @client = Client.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render_error("Client not found", :not_found)
  end

  def client_params
    params.require(:client).permit(:name, :industry)
  end

  def client_json(client, detailed: false)
    base_json = {
      id: client.id,
      name: client.name,
      industry: client.industry,
      active_opportunities_count: client.active_opportunities.count,
      total_budget: client.total_budget,
      created_at: client.created_at,
      updated_at: client.updated_at
    }

    if detailed
      base_json.merge!({
        opportunities: client.client_opportunities.map do |opportunity|
          {
            id: opportunity.id,
            title: opportunity.title,
            status: opportunity.status,
            priority: opportunity.priority,
            budget: opportunity.budget,
            geo: opportunity.geo,
            employment_type: opportunity.employment_type,
            job_role: opportunity.job_role,
            start_date: opportunity.start_date,
            end_date: opportunity.end_date,
            skills: opportunity.skills.map { |skill| { id: skill.id, name: skill.name } }
          }
        end,
        skills_used: client.skills_used.map { |skill| { id: skill.id, name: skill.name } }
      })
    end

    base_json
  end
end
