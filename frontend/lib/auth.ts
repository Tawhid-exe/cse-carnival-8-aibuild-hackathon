import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin } from "better-auth/plugins";

const client = new MongoClient(process.env.MONGODB_URI as string);
const db = client.db();

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL, 
    database: mongodbAdapter(db, {
    client
  }),

  emailAndPassword: { 
    enabled: true, 
  }, 
  socialProviders: { 
    google: { 
            clientId: process.env.GOOGLE_CLIENT_ID as string, 
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, 
        },
  }, 
  plugins: [
    admin()
  ]
});