const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;

async function connectDB() {
  // await client.connect();

  db = client.db("fineaseDB");
  console.log("MongoDB connected!");
  return db;
}

function getDB() {
  if (!db) throw new Error("Database not connected!");
  return db;
}

module.exports = { connectDB, getDB };
