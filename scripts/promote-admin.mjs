#!/usr/bin/env node

/**
 * promote-admin.mjs
 *
 * Promotes a user to the "admin" role in MongoDB.
 *
 * Usage:
 *   node scripts/promote-admin.mjs <email>
 *
 * Example:
 *   node scripts/promote-admin.mjs prathampatil8421@gmail.com
 *
 * Requirements:
 *   - MONGODB_URI must be set in your .env file (or as an environment variable)
 *   - The user must already exist in the database
 *   - Node.js 20+ (uses process.loadEnvFile which is built-in, no dotenv needed)
 */

import mongoose from "mongoose";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from the project root .env file.
// process.loadEnvFile() is built into Node.js 20+ — no dotenv dependency needed.
try {
  process.loadEnvFile(resolve(__dirname, "..", ".env"));
} catch {
  // .env file may not exist if MONGODB_URI is already in the environment — that's fine.
}

const MONGODB_URI = process.env.DATABASE_URL;

if (!MONGODB_URI) {
  console.error("❌  DATABASE_URL is not set. Check your .env file.");
  process.exit(1);
}

const email = process.argv[2]?.toLowerCase().trim();

if (!email) {
  console.error("Usage:   node scripts/promote-admin.mjs <email>");
  console.error("Example: node scripts/promote-admin.mjs admin@example.com");
  process.exit(1);
}

async function main() {
  try {
    console.log("\n🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected.\n");

    const usersCollection = mongoose.connection.db.collection("users");

    const user = await usersCollection.findOne({ email });

    if (!user) {
      console.error(`❌  No user found with email: ${email}`);
      process.exit(1);
    }

    if (user.role === "admin") {
      console.log(`ℹ️   User "${user.name || email}" is already an admin.`);
      process.exit(0);
    }

    const result = await usersCollection.updateOne(
      { _id: user._id },
      { $set: { role: "admin" } },
    );

    if (result.modifiedCount === 1) {
      console.log(`✅ Successfully promoted "${user.name || email}" to admin!`);
      console.log(`   User ID : ${user._id}`);
      console.log(`   Email   : ${user.email}`);
      console.log(
        "\n💡 The user must sign out and sign back in for the change to take effect.\n",
      );
    } else {
      console.error("❌  Update ran but no documents were modified.");
      process.exit(1);
    }
  } catch (err) {
    console.error(`❌  Error: ${err.message}`);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB.");
  }
}

main();
