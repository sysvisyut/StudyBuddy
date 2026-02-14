import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./configs/schema.js",
  dbCredentials: {
    url: 'postgresql://neondb_owner:npg_bTFnS1HCvif0@ep-twilight-sunset-aiewj6bk-pooler.c-4.us-east-1.aws.neon.tech/studybuddy?sslmode=require&channel_binding=require'
  },
});
