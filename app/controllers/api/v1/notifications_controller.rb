class Api::V1::NotificationsController < Api::V1::ApplicationController
  before_action :set_notification, only: [ :show, :update, :destroy ]

  # GET /api/v1/notifications
  def index
    @notifications = Notification.includes(:engineer, :client, :client_opportunity)

    # Apply filters
    @notifications = @notifications.where(status: params[:status]) if params[:status].present?
    @notifications = @notifications.where(priority: params[:priority]) if params[:priority].present?
    @notifications = @notifications.where(notification_type: params[:type]) if params[:type].present?
    @notifications = @notifications.where(engineer_id: params[:engineer_id]) if params[:engineer_id].present?
    @notifications = @notifications.where(client_id: params[:client_id]) if params[:client_id].present?

    # Sorting
    sort_by = params[:sort_by] || "created_at"
    sort_order = params[:sort_order] || "desc"

    case sort_by
    when "priority"
      priority_order = { "urgent" => 4, "high" => 3, "medium" => 2, "low" => 1 }
      @notifications = @notifications.sort_by { |n| [ priority_order[n.priority] || 0, n.created_at ] }
      @notifications = @notifications.reverse if sort_order == "desc"
    when "created_at"
      @notifications = @notifications.order(created_at: sort_order)
    when "title"
      @notifications = @notifications.order(title: sort_order)
    end

    # Pagination
    page = params[:page]&.to_i || 1
    per_page = params[:per_page]&.to_i || 20
    per_page = [ per_page, 50 ].min # Max 50 per page

    @notifications = @notifications.page(page).per(per_page)

    render json: {
      data: @notifications.map { |notification| notification_json(notification) },
      meta: {
        current_page: page,
        per_page: per_page,
        total_count: @notifications.total_count,
        total_pages: @notifications.total_pages,
        unread_count: Notification.unread.count
      }
    }
  end

  # GET /api/v1/notifications/:id
  def show
    render json: { data: notification_json(@notification, detailed: true) }
  end

  # PATCH/PUT /api/v1/notifications/:id
  def update
    if @notification.update(notification_params)
      render json: {
        data: notification_json(@notification),
        message: "Notification updated successfully"
      }
    else
      render json: {
        error: @notification.errors.full_messages.join(", ")
      }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/notifications/:id
  def destroy
    @notification.destroy
    render json: { message: "Notification deleted successfully" }
  end

  # PATCH /api/v1/notifications/:id/mark_read
  def mark_read
    @notification.mark_as_read!
    render json: {
      data: notification_json(@notification),
      message: "Notification marked as read"
    }
  end

  # PATCH /api/v1/notifications/:id/mark_unread
  def mark_unread
    @notification.mark_as_unread!
    render json: {
      data: notification_json(@notification),
      message: "Notification marked as unread"
    }
  end

  # PATCH /api/v1/notifications/:id/archive
  def archive
    @notification.archive!
    render json: {
      data: notification_json(@notification),
      message: "Notification archived"
    }
  end

  # PATCH /api/v1/notifications/mark_all_read
  def mark_all_read
    updated_count = Notification.unread.update_all(status: "read", read_at: Time.current)
    render json: {
      message: "#{updated_count} notifications marked as read"
    }
  end

  # GET /api/v1/notifications/summary
  def summary
    summary_data = {
      total: Notification.count,
      unread: Notification.unread.count,
      by_priority: {
        urgent: Notification.urgent.unread.count,
        high: Notification.by_priority("high").unread.count,
        medium: Notification.by_priority("medium").unread.count,
        low: Notification.by_priority("low").unread.count
      },
      by_type: {
        rolling_off_soon: Notification.by_type("rolling_off_soon").unread.count,
        potential_match: Notification.by_type("potential_match").unread.count,
        new_opportunity: Notification.by_type("new_opportunity").unread.count,
        skill_gap: Notification.by_type("skill_gap").unread.count,
        budget_mismatch: Notification.by_type("budget_mismatch").unread.count,
        availability_change: Notification.by_type("availability_change").unread.count
      },
      recent: Notification.recent.limit(5).map { |n| notification_json(n) }
    }

    render json: { data: summary_data }
  end

  # POST /api/v1/notifications/generate_insights
  def generate_insights
    InsightsJob.perform_later
    render json: {
      message: "Insights generation started. Check back in a few minutes for new notifications."
    }
  end

  private

  def set_notification
    @notification = Notification.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Notification not found" }, status: :not_found
  end

  def notification_params
    params.require(:notification).permit(:title, :message, :notification_type, :priority, :status)
  end

  def notification_json(notification, detailed: false)
    base_json = {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      notification_type: notification.notification_type,
      priority: notification.priority,
      status: notification.status,
      read_at: notification.read_at,
      created_at: notification.created_at,
      updated_at: notification.updated_at,
      time_ago: notification.time_ago,
      icon: notification.icon,
      priority_color: notification.priority_color
    }

    if detailed
      base_json.merge!({
        engineer: notification.engineer ? {
          id: notification.engineer.id,
          name: notification.engineer.name,
          email: notification.engineer.email,
          status: notification.engineer.status
        } : nil,
        client: notification.client ? {
          id: notification.client.id,
          name: notification.client.name,
          industry: notification.client.industry
        } : nil,
        client_opportunity: notification.client_opportunity ? {
          id: notification.client_opportunity.id,
          title: notification.client_opportunity.title,
          job_role: notification.client_opportunity.job_role,
          status: notification.client_opportunity.status
        } : nil
      })
    end

    base_json
  end
end
