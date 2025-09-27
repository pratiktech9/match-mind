# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

# Clear existing data
puts "Clearing existing data..."
User.destroy_all
Engineer.destroy_all
Client.destroy_all
ClientOpportunity.destroy_all
Skill.destroy_all
Match.destroy_all

# Create Skills
puts "Creating skills..."
skills_data = [
  # Programming Languages
  { name: "Ruby" },
  { name: "Python" },
  { name: "JavaScript" },
  { name: "TypeScript" },
  { name: "Java" },
  { name: "Go" },

  # Frameworks
  { name: "Ruby on Rails" },
  { name: "React" },
  { name: "Vue.js" },
  { name: "Angular" },
  { name: "Node.js" },
  { name: "Django" },
  { name: "Spring Boot" },

  # Databases
  { name: "PostgreSQL" },
  { name: "MySQL" },
  { name: "MongoDB" },
  { name: "Redis" },

  # Cloud & DevOps
  { name: "AWS" },
  { name: "Docker" },
  { name: "Kubernetes" },
  { name: "CI/CD" },
  { name: "Terraform" },

  # Frontend
  { name: "HTML/CSS" },
  { name: "Tailwind CSS" },

  # Mobile
  { name: "React Native" },
  { name: "Flutter" },
  { name: "iOS Development" },

  # AI/ML
  { name: "Machine Learning" },
  { name: "TensorFlow" },
  { name: "PyTorch" },

  # Other
  { name: "Git" },
  { name: "REST APIs" },
  { name: "GraphQL" },
  { name: "Microservices" }
]

skills = skills_data.map { |skill_data| Skill.create!(skill_data) }
puts "Created #{skills.count} skills"

# Create Engineers
puts "Creating engineers..."
engineers_data = [
  {
    name: "Sarah Johnson",
    email: "sarah.johnson@tech9.com",
    country: "United States",
    status: "available",
    current_client: nil,
    industry_experience: "5 years",
    target_rate: 85,
    utilization: 0
  },
  {
    name: "Michael Chen",
    email: "michael.chen@tech9.com",
    country: "Canada",
    status: "available_soon",
    current_client: "TechCorp Inc",
    industry_experience: "8 years",
    target_rate: 120,
    utilization: 80
  },
  {
    name: "Emily Rodriguez",
    email: "emily.rodriguez@tech9.com",
    country: "Mexico",
    status: "available",
    current_client: nil,
    industry_experience: "3 years",
    target_rate: 65,
    utilization: 0
  },
  {
    name: "David Kim",
    email: "david.kim@tech9.com",
    country: "South Korea",
    status: "busy",
    current_client: "StartupXYZ",
    industry_experience: "10 years",
    target_rate: 150,
    utilization: 100
  },
  {
    name: "Lisa Wang",
    email: "lisa.wang@tech9.com",
    country: "Singapore",
    status: "available",
    current_client: nil,
    industry_experience: "6 years",
    target_rate: 95,
    utilization: 0
  },
  {
    name: "James Wilson",
    email: "james.wilson@tech9.com",
    country: "United Kingdom",
    status: "available_soon",
    current_client: "GlobalTech",
    industry_experience: "7 years",
    target_rate: 110,
    utilization: 60
  }
]

engineers = engineers_data.map { |engineer_data| Engineer.create!(engineer_data) }
puts "Created #{engineers.count} engineers"

# Assign skills to engineers
puts "Assigning skills to engineers..."

# Sarah - Full-stack Ruby/React developer
sarah = engineers.find { |e| e.name == "Sarah Johnson" }
sarah_skills = skills.select { |s| [ "Ruby", "Ruby on Rails", "JavaScript", "React", "PostgreSQL", "AWS", "Git" ].include?(s.name) }
sarah_skills.each_with_index do |skill, index|
  EngineerSkill.create!(engineer: sarah, skill: skill, level: index < 3 ? "primary" : "secondary")
end

# Michael - Senior Python/ML engineer
michael = engineers.find { |e| e.name == "Michael Chen" }
michael_skills = skills.select { |s| [ "Python", "Django", "Machine Learning", "TensorFlow", "PostgreSQL", "AWS", "Docker", "Git" ].include?(s.name) }
michael_skills.each_with_index do |skill, index|
  EngineerSkill.create!(engineer: michael, skill: skill, level: index < 4 ? "primary" : "secondary")
end

# Emily - Frontend specialist
emily = engineers.find { |e| e.name == "Emily Rodriguez" }
emily_skills = skills.select { |s| [ "JavaScript", "React", "Vue.js", "HTML/CSS", "Tailwind CSS", "Git" ].include?(s.name) }
emily_skills.each_with_index do |skill, index|
  EngineerSkill.create!(engineer: emily, skill: skill, level: index < 3 ? "primary" : "secondary")
end

# David - DevOps/Backend expert
david = engineers.find { |e| e.name == "David Kim" }
david_skills = skills.select { |s| [ "Go", "Docker", "Kubernetes", "AWS", "Terraform", "CI/CD", "Microservices", "Git" ].include?(s.name) }
david_skills.each_with_index do |skill, index|
  EngineerSkill.create!(engineer: david, skill: skill, level: index < 4 ? "primary" : "secondary")
end

# Lisa - Mobile developer
lisa = engineers.find { |e| e.name == "Lisa Wang" }
lisa_skills = skills.select { |s| [ "React Native", "Flutter", "iOS Development", "JavaScript", "Git" ].include?(s.name) }
lisa_skills.each_with_index do |skill, index|
  EngineerSkill.create!(engineer: lisa, skill: skill, level: index < 2 ? "primary" : "secondary")
end

# James - Full-stack Java developer
james = engineers.find { |e| e.name == "James Wilson" }
james_skills = skills.select { |s| [ "Java", "Spring Boot", "JavaScript", "React", "PostgreSQL", "AWS", "Docker", "Git" ].include?(s.name) }
james_skills.each_with_index do |skill, index|
  EngineerSkill.create!(engineer: james, skill: skill, level: index < 3 ? "primary" : "secondary")
end

# Create Clients
puts "Creating clients..."
clients_data = [
  {
    name: "TechCorp Inc",
    industry: "Technology"
  },
  {
    name: "StartupXYZ",
    industry: "Fintech"
  },
  {
    name: "GlobalTech",
    industry: "E-commerce"
  },
  {
    name: "HealthTech Solutions",
    industry: "Healthcare"
  },
  {
    name: "EduTech Innovations",
    industry: "Education"
  }
]

clients = clients_data.map { |client_data| Client.create!(client_data) }
puts "Created #{clients.count} clients"

# Create Client Opportunities
puts "Creating client opportunities..."
opportunities_data = [
  {
    client: clients.find { |c| c.name == "TechCorp Inc" },
    title: "Senior Ruby on Rails Developer",
    description: "Looking for an experienced Rails developer to work on our core platform. Must have strong Ruby skills and experience with large-scale applications.",
    geo: "Remote",
    employment_type: "Contract",
    job_role: "Backend Developer",
    status: "active",
    priority: "high",
    budget: 120000,
    start_date: Date.current + 2.weeks,
    end_date: Date.current + 6.months
  },
  {
    client: clients.find { |c| c.name == "StartupXYZ" },
    title: "React Frontend Developer",
    description: "Join our fast-growing fintech startup as a frontend developer. Work with modern React stack and contribute to our user-facing applications.",
    geo: "San Francisco, CA",
    employment_type: "Full-time",
    job_role: "Frontend Developer",
    status: "active",
    priority: "high",
    budget: 95000,
    start_date: Date.current + 1.month,
    end_date: nil
  },
  {
    client: clients.find { |c| c.name == "GlobalTech" },
    title: "Python Machine Learning Engineer",
    description: "Seeking a ML engineer to build recommendation systems and data pipelines. Experience with TensorFlow/PyTorch required.",
    geo: "London, UK",
    employment_type: "Contract",
    job_role: "ML Engineer",
    status: "active",
    priority: "medium",
    budget: 140000,
    start_date: Date.current + 3.weeks,
    end_date: Date.current + 8.months
  },
  {
    client: clients.find { |c| c.name == "HealthTech Solutions" },
    title: "DevOps Engineer",
    description: "Looking for a DevOps engineer to manage our cloud infrastructure and deployment pipelines. AWS and Kubernetes experience required.",
    geo: "Remote",
    employment_type: "Contract",
    job_role: "DevOps Engineer",
    status: "active",
    priority: "high",
    budget: 130000,
    start_date: Date.current + 1.week,
    end_date: Date.current + 4.months
  },
  {
    client: clients.find { |c| c.name == "EduTech Innovations" },
    title: "React Native Mobile Developer",
    description: "Join our mobile team to build cross-platform educational apps. React Native experience and mobile app portfolio required.",
    geo: "Remote",
    employment_type: "Full-time",
    job_role: "Mobile Developer",
    status: "active",
    priority: "medium",
    budget: 85000,
    start_date: Date.current + 2.months,
    end_date: nil
  }
]

opportunities = opportunities_data.map { |opp_data| ClientOpportunity.create!(opp_data) }
puts "Created #{opportunities.count} opportunities"

# Assign skills to opportunities
puts "Assigning skills to opportunities..."

# Senior Ruby on Rails Developer
rails_opp = opportunities.find { |o| o.title.include?("Ruby on Rails") }
rails_opp.skills << skills.select { |s| [ "Ruby", "Ruby on Rails", "PostgreSQL", "AWS", "Git" ].include?(s.name) }
rails_opp.client_opportunity_skills.find_by(skill: skills.find { |s| s.name == "Ruby" }).update!(required: true, importance: 5)
rails_opp.client_opportunity_skills.find_by(skill: skills.find { |s| s.name == "Ruby on Rails" }).update!(required: true, importance: 5)

# React Frontend Developer
react_opp = opportunities.find { |o| o.title.include?("React Frontend") }
react_opp.skills << skills.select { |s| [ "JavaScript", "React", "HTML/CSS", "Git" ].include?(s.name) }
react_opp.client_opportunity_skills.find_by(skill: skills.find { |s| s.name == "React" }).update!(required: true, importance: 5)
react_opp.client_opportunity_skills.find_by(skill: skills.find { |s| s.name == "JavaScript" }).update!(required: true, importance: 4)

# Python ML Engineer
ml_opp = opportunities.find { |o| o.title.include?("Machine Learning") }
ml_opp.skills << skills.select { |s| [ "Python", "Machine Learning", "TensorFlow", "PostgreSQL", "AWS" ].include?(s.name) }
ml_opp.client_opportunity_skills.find_by(skill: skills.find { |s| s.name == "Python" }).update!(required: true, importance: 5)
ml_opp.client_opportunity_skills.find_by(skill: skills.find { |s| s.name == "Machine Learning" }).update!(required: true, importance: 5)

# DevOps Engineer
devops_opp = opportunities.find { |o| o.title.include?("DevOps") }
devops_opp.skills << skills.select { |s| [ "AWS", "Docker", "Kubernetes", "Terraform", "CI/CD" ].include?(s.name) }
devops_opp.client_opportunity_skills.find_by(skill: skills.find { |s| s.name == "AWS" }).update!(required: true, importance: 5)
devops_opp.client_opportunity_skills.find_by(skill: skills.find { |s| s.name == "Docker" }).update!(required: true, importance: 4)

# React Native Mobile Developer
mobile_opp = opportunities.find { |o| o.title.include?("React Native") }
mobile_opp.skills << skills.select { |s| [ "React Native", "JavaScript", "Git" ].include?(s.name) }
mobile_opp.client_opportunity_skills.find_by(skill: skills.find { |s| s.name == "React Native" }).update!(required: true, importance: 5)
mobile_opp.client_opportunity_skills.find_by(skill: skills.find { |s| s.name == "JavaScript" }).update!(required: true, importance: 4)

puts "✅ Sample data created successfully!"
puts ""
puts "📊 Summary:"
puts "- #{skills.count} skills"
puts "- #{engineers.count} engineers"
puts "- #{clients.count} clients"
puts "- #{opportunities.count} opportunities"
puts ""
puts "🎯 Ready to test AI matching!"
puts "Try these API endpoints:"
puts "- GET /api/opportunities/1/matches (find engineers for Rails opportunity)"
puts "- GET /api/engineers/1/matches (find opportunities for Sarah)"
puts "- POST /api/matches (create a match with AI scoring)"
