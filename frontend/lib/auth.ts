import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin } from "better-auth/plugins";

declare global {
  var _mongoClient: MongoClient | undefined;
}

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/campusos";
const client = global._mongoClient || new MongoClient(uri);

if (process.env.NODE_ENV !== "production") {
  global._mongoClient = client;
}

const db = client.db("campusos");

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  database: mongodbAdapter(db, {
    client,
    transaction: false,
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
    admin(),
  ],
});