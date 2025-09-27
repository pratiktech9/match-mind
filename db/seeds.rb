# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

puts "Creating skills..."
skills_data = [
  "Ruby", "Python", "JavaScript", "React", "Ruby on Rails", "Django", 
  "Node.js", "Vue.js", "PostgreSQL", "MySQL", "MongoDB", "Redis", 
  "AWS", "Docker", "Kubernetes", "GraphQL", "REST API", "Machine Learning",
  "TypeScript", "Go", "Java", "Angular", "Microservices", "DevOps", "Agile"
]

skills = skills_data.map do |skill_name|
  Skill.find_or_create_by!(name: skill_name)
end

puts "Created #{skills.count} skills"

puts "Creating engineers..."

# Engineer profiles data
engineers_data = [
  {
    name: "Alex Chen",
    email: "alex.chen@example.com",
    status: "available",
    country: "Canada",
    current_client: nil,
    industry_experience: "Technology",
    utilization: 0,
    target_rate: 85,
    notes: "Full-stack developer with expertise in Ruby on Rails and React. Passionate about building scalable web applications and mentoring junior developers.",
    skills: ["Ruby", "Ruby on Rails", "React", "PostgreSQL", "AWS", "Docker"]
  },
  {
    name: "Maria Gonzalez",
    email: "maria.gonzalez@example.com",
    status: "on_project",
    country: "Spain",
    current_client: "TechCorp",
    industry_experience: "AI/ML",
    utilization: 80,
    target_rate: 95,
    notes: "Senior software engineer specializing in Python and machine learning. Led multiple AI-powered projects from conception to production.",
    skills: ["Python", "Django", "Machine Learning", "PostgreSQL", "Docker", "AWS"]
  },
  {
    name: "Raj Patel",
    email: "raj.patel@example.com",
    status: "available",
    country: "India",
    current_client: nil,
    industry_experience: "DevOps",
    utilization: 0,
    target_rate: 75,
    notes: "DevOps engineer with strong background in cloud infrastructure and automation. Expert in containerization and CI/CD pipelines.",
    skills: ["JavaScript", "Node.js", "AWS", "Docker", "Kubernetes", "DevOps"]
  },
  {
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    status: "available",
    country: "United States",
    current_client: nil,
    industry_experience: "Frontend",
    utilization: 0,
    target_rate: 80,
    notes: "Frontend specialist with a keen eye for UX/UI design. Experienced in building responsive and accessible web applications.",
    skills: ["JavaScript", "React", "TypeScript", "Vue.js", "GraphQL", "REST API"]
  },
  {
    name: "David Kim",
    email: "david.kim@example.com",
    status: "rolling_off_soon",
    country: "South Korea",
    current_client: "BigTech Solutions",
    industry_experience: "Enterprise",
    utilization: 90,
    target_rate: 120,
    notice_date: 30.days.from_now,
    notes: "Senior architect with extensive experience in microservices and distributed systems. Led engineering teams at multiple startups.",
    skills: ["Java", "Microservices", "Kubernetes", "PostgreSQL", "Redis", "AWS"]
  },
  {
    name: "Anna Mueller",
    email: "anna.mueller@example.com",
    status: "available",
    country: "Germany",
    current_client: nil,
    industry_experience: "Backend",
    utilization: 0,
    target_rate: 90,
    notes: "Backend engineer focused on building robust APIs and database optimization. Strong advocate for clean code and testing.",
    skills: ["Go", "PostgreSQL", "Redis", "Docker", "REST API", "Microservices"]
  },
  {
    name: "Carlos Silva",
    email: "carlos.silva@example.com",
    status: "on_project",
    country: "Brazil",
    current_client: "Innovate Labs",
    industry_experience: "Fullstack",
    utilization: 75,
    target_rate: 85,
    notes: "Full-stack developer with experience in agile methodologies. Enjoys working on innovative projects and learning new technologies.",
    skills: ["JavaScript", "Node.js", "React", "MongoDB", "AWS", "Agile"]
  },
  {
    name: "Emily Brown",
    email: "emily.brown@example.com",
    status: "available",
    country: "United Kingdom",
    current_client: nil,
    industry_experience: "Web Development",
    utilization: 0,
    target_rate: 65,
    notes: "Junior developer eager to grow and contribute to meaningful projects. Strong foundation in modern web technologies.",
    skills: ["TypeScript", "React", "Node.js", "PostgreSQL", "Docker", "REST API"]
  },
  {
    name: "Luke Taylor",
    email: "luke.taylor@example.com",
    status: "available",
    country: "Australia",
    current_client: nil,
    industry_experience: "Fullstack",
    utilization: 0,
    target_rate: 100,
    notes: "Senior developer with expertise in both frontend and backend technologies. Passionate about performance optimization.",
    skills: ["Ruby", "Ruby on Rails", "JavaScript", "Vue.js", "PostgreSQL", "Redis"]
  },
  {
    name: "Priya Sharma",
    email: "priya.sharma@example.com",
    status: "on_project",
    country: "India",
    current_client: "CloudCorp",
    industry_experience: "Cloud Architecture",
    utilization: 85,
    target_rate: 78,
    notes: "Cloud solutions architect with focus on scalable infrastructure. Experienced in migrating legacy systems to modern platforms.",
    skills: ["Python", "AWS", "Docker", "Kubernetes", "MongoDB", "DevOps"]
  },
  {
    name: "James Wilson",
    email: "james.wilson@example.com",
    status: "available",
    country: "United States",
    current_client: nil,
    industry_experience: "Enterprise",
    utilization: 0,
    target_rate: 130,
    notes: "Tech lead with extensive experience in enterprise applications. Specialized in building high-performance, secure systems.",
    skills: ["Java", "Microservices", "PostgreSQL", "AWS", "Docker", "Agile"]
  },
  {
    name: "Nina Petrov",
    email: "nina.petrov@example.com",
    status: "available",
    country: "Russia",
    current_client: nil,
    industry_experience: "Frontend",
    utilization: 0,
    target_rate: 70,
    notes: "Frontend developer with strong design background. Focuses on creating intuitive user experiences and modern interfaces.",
    skills: ["JavaScript", "React", "TypeScript", "GraphQL", "REST API", "Docker"]
  }
]

engineers = engineers_data.map do |engineer_data|
  engineer_attrs = engineer_data.except(:skills)
  engineer = Engineer.find_or_create_by!(email: engineer_attrs[:email]) do |e|
    engineer_attrs.each { |key, value| e.send("#{key}=", value) }
  end

  # Add skills to engineer
  engineer_skills = engineer_data[:skills].each_with_index.map do |skill_name, index|
    skill = skills.find { |s| s.name == skill_name }
    if skill
      level = index < 3 ? "primary" : "secondary"  # First 3 skills are primary, rest are secondary
      EngineerSkill.find_or_create_by!(engineer: engineer, skill: skill) do |es|
        es.level = level
      end
    end
  end.compact

  engineer
end

puts "Created #{engineers.count} engineers"

puts "Creating clients..."

clients_data = [
  {
    name: "TechCorp Startup",
    geo: "North America",
    industry: "Technology",
    employment_type: "Contract",
    notes: "Early stage startup looking for full-stack developers to build MVP",
    skills_needed: ["Ruby", "Ruby on Rails", "React", "PostgreSQL"]
  },
  {
    name: "BigTech Solutions",
    geo: "Global",
    industry: "Enterprise Software",
    employment_type: "Full-time",
    notes: "Large enterprise needing senior architects for microservices platform",
    skills_needed: ["Java", "Microservices", "AWS", "Kubernetes"]
  },
  {
    name: "Innovate Labs",
    geo: "Europe",
    industry: "AI/ML",
    employment_type: "Contract",
    notes: "R&D lab working on cutting-edge machine learning applications",
    skills_needed: ["Python", "Machine Learning", "Docker", "AWS"]
  }
]

clients = clients_data.map do |client_data|
  client_attrs = client_data.except(:skills_needed)
  client = Client.find_or_create_by!(name: client_attrs[:name]) do |c|
    client_attrs.each { |key, value| c.send("#{key}=", value) }
  end

  # Add required skills to client  
  client_skills = client_data[:skills_needed].each_with_index.map do |skill_name, index|
    skill = skills.find { |s| s.name == skill_name }
    if skill
      importance = index < 2 ? ClientSkill::REQUIRED : ClientSkill::PREFERRED
      ClientSkill.find_or_create_by!(client: client, skill: skill) do |cs|
        cs.importance = importance
      end
    end
  end.compact

  client
end

puts "Created #{clients.count} clients"

puts "Creating sample matches..."

# Create some sample matches
matches_data = [
  { engineer_index: 0, client_index: 0, score: 95.0 },
  { engineer_index: 2, client_index: 0, score: 85.0 },
  { engineer_index: 1, client_index: 2, score: 92.0 },
  { engineer_index: 4, client_index: 1, score: 88.0 },
  { engineer_index: 8, client_index: 0, score: 90.0 }
]

matches = matches_data.map do |match_data|
  engineer = engineers[match_data[:engineer_index]]
  client = clients[match_data[:client_index]]
  
  Match.find_or_create_by!(engineer: engineer, client: client) do |match|
    match.score = match_data[:score]
  end
end

puts "Created #{matches.count} matches"

puts "\n=== Seed data created successfully! ==="
puts "📊 Summary:"
puts "  - #{Skill.count} skills"
puts "  - #{Engineer.count} engineers"
puts "  - #{Client.count} clients"
puts "  - #{Match.count} matches"
puts "\n🚀 You can now test the application with sample data!"
