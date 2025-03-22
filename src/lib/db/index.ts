// import { neon, neonConfig } from "@neondatabase/serverless";
// import { drizzle } from "drizzle-orm/neon-http";

// neonConfig.fetchConnectionCache = true;

// // if (!process.env.DATABASE_URL) {
// //   throw new Error("database url not found");
// // }

// const sql = neon("postgresql://neondb_owner:npg_H1mQ9gTMdrNL@ep-broad-violet-a5w5118g-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require");

// export const db = drizzle(sql);



import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon("postgresql://neondb_owner:npg_H1mQ9gTMdrNL@ep-broad-violet-a5w5118g-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require");
const db = drizzle(sql, { schema });
