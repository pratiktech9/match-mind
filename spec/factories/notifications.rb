FactoryBot.define do
  factory :notification do
    title { "MyString" }
    message { "MyText" }
    notification_type { "MyString" }
    priority { "MyString" }
    status { "MyString" }
    engineer { nil }
    client { nil }
    client_opportunity { nil }
    read_at { "2025-09-28 14:36:43" }
  end
end
