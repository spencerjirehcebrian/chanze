// scripts/init-mongo.js
// This script initializes the MongoDB database and creates indexes

db = db.getSiblingDB("chanze");

// Create collections
db.createCollection("users");
db.createCollection("task_templates");
db.createCollection("task_items");

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ email_verification_token: 1 });
db.users.createIndex({ password_reset_token: 1 });

db.task_templates.createIndex({ user_id: 1 });
db.task_templates.createIndex({ user_id: 1, name: 1 });

db.task_items.createIndex({ user_id: 1 });
db.task_items.createIndex({ template_id: 1 });
db.task_items.createIndex({ user_id: 1, template_id: 1 });

print("Database initialized successfully!");
