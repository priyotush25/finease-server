// index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const admin = require("firebase-admin");

const app = express();
app.use(cors());
app.use(express.json());

// ======================
// Firebase Admin (Base64 decode)
// ======================
const serviceAccountJSON = Buffer.from(
  process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
  "base64"
).toString("utf-8");

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(serviceAccountJSON)),
});

// ======================
// MongoDB Setup
// ======================
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.ke7g9qv.mongodb.net/?retryWrites=true&w=majority`;

let cachedClient = null;
let cachedDb = null;

async function connectToMongo() {
  if (cachedClient && cachedDb) return { client: cachedClient, db: cachedDb };

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();
  const db = client.db("financeDB");

  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

// ======================
// Middleware: Firebase Token Verify
// ======================
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).send({ message: "Unauthorized" });

    const token = authHeader.split(" ")[1];
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch {
    res.status(401).send({ message: "Invalid token" });
  }
};

// ======================
// Routes
// ======================
app.get("/", (req, res) => {
  res.send("Hello FinEase Server");
});

// Async wrapper to ensure DB is connected before routes
app.use(async (req, res, next) => {
  try {
    const { db } = await connectToMongo();
    req.db = db;
    req.transactionCollection = db.collection("main-data");
    next();
  } catch (error) {
    console.error("MongoDB connection error:", error);
    res.status(500).send({ message: "Database connection failed" });
  }
});

// ======================
// GET all transactions
// ======================
app.get("/my-transaction", verifyFirebaseToken, async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).send({ message: "Email required" });
    if (email !== req.user.email) return res.status(403).send({ message: "Forbidden" });

    const result = await req.transactionCollection
      .find({ email })
      .sort({ date: -1 })
      .toArray();

    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to fetch transactions" });
  }
});

// ======================
// GET single transaction
// ======================
app.get("/my-transaction/:id", verifyFirebaseToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).send({ message: "Invalid ID" });

    const result = await req.transactionCollection.findOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to fetch transaction" });
  }
});

// ======================
// CREATE transaction
// ======================
app.post("/my-transaction", verifyFirebaseToken, async (req, res) => {
  try {
    const data = req.body;
    data.email = req.user.email;

    const result = await req.transactionCollection.insertOne(data);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to create transaction" });
  }
});

// ======================
// UPDATE transaction
// ======================
app.put("/my-transaction/:id", verifyFirebaseToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).send({ message: "Invalid ID" });

    const result = await req.transactionCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: req.body }
    );

    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to update transaction" });
  }
});

// ======================
// DELETE transaction
// ======================
app.delete("/my-transaction/:id", verifyFirebaseToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).send({ message: "Invalid ID" });

    const result = await req.transactionCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to delete transaction" });
  }
});

// ======================
// Vercel Serverless Export
// ======================
module.exports = app;
