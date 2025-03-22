import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: "ep-broad-violet-a5w5118g-pooler.us-east-2.aws.neon.tech",
    port: 5432, // Default PostgreSQL port
    user: "neondb_owner",
    password: "npg_H1mQ9gTMdrNL", // Replace with your actual password
    database: "neondb",
    ssl: true, // Enable SSL for secure connection
  },
});
