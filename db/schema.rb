# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_09_27_113024) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "client_opportunities", force: :cascade do |t|
    t.bigint "client_id", null: false
    t.string "title", null: false
    t.text "description"
    t.string "geo", null: false
    t.string "employment_type", null: false
    t.string "job_role", null: false
    t.string "status", default: "active"
    t.string "priority", default: "medium"
    t.decimal "budget", precision: 10, scale: 2
    t.date "start_date"
    t.date "end_date"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["client_id", "status"], name: "index_client_opportunities_on_client_id_and_status"
    t.index ["client_id"], name: "index_client_opportunities_on_client_id"
    t.index ["employment_type"], name: "index_client_opportunities_on_employment_type"
    t.index ["geo"], name: "index_client_opportunities_on_geo"
    t.index ["job_role"], name: "index_client_opportunities_on_job_role"
  end

  create_table "client_opportunity_skills", force: :cascade do |t|
    t.bigint "client_opportunity_id", null: false
    t.bigint "skill_id", null: false
    t.integer "importance", default: 1
    t.boolean "required", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["client_opportunity_id", "skill_id"], name: "index_client_opp_skills_on_opp_and_skill", unique: true
    t.index ["client_opportunity_id"], name: "index_client_opportunity_skills_on_client_opportunity_id"
    t.index ["importance"], name: "index_client_opportunity_skills_on_importance"
    t.index ["required"], name: "index_client_opportunity_skills_on_required"
    t.index ["skill_id"], name: "index_client_opportunity_skills_on_skill_id"
  end

  create_table "clients", force: :cascade do |t|
    t.string "name"
    t.string "industry"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "engineer_skills", force: :cascade do |t|
    t.bigint "engineer_id", null: false
    t.bigint "skill_id", null: false
    t.string "level"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["engineer_id"], name: "index_engineer_skills_on_engineer_id"
    t.index ["skill_id"], name: "index_engineer_skills_on_skill_id"
  end

  create_table "engineers", force: :cascade do |t|
    t.string "name"
    t.string "email"
    t.string "country"
    t.string "status"
    t.string "current_client"
    t.string "industry_experience"
    t.date "notice_date"
    t.date "expected_end_date"
    t.date "return_date"
    t.text "notes"
    t.integer "utilization"
    t.decimal "target_rate"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_engineers_on_email"
  end

  create_table "matches", force: :cascade do |t|
    t.bigint "engineer_id", null: false
    t.bigint "client_id", null: false
    t.decimal "score"
    t.text "explanation"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["client_id"], name: "index_matches_on_client_id"
    t.index ["engineer_id"], name: "index_matches_on_engineer_id"
  end

  create_table "skills", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_skills_on_name"
  end

  create_table "users", force: :cascade do |t|
    t.string "provider"
    t.string "uid"
    t.string "name"
    t.string "email"
    t.string "role"
    t.string "image_url"
    t.string "token"
    t.datetime "token_expires_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email"
    t.index ["uid"], name: "index_users_on_uid"
  end

  add_foreign_key "client_opportunities", "clients"
  add_foreign_key "client_opportunity_skills", "client_opportunities"
  add_foreign_key "client_opportunity_skills", "skills"
  add_foreign_key "engineer_skills", "engineers"
  add_foreign_key "engineer_skills", "skills"
  add_foreign_key "matches", "clients"
  add_foreign_key "matches", "engineers"
end
