const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const admin = require("firebase-admin");
require("dotenv").config();

// ======================
// App Initialization
// ======================
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ======================
// Firebase Admin Setup
// ======================
const serviceAccount = require("./serviceKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// ======================
// MongoDB Setup
// ======================
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.ke7g9qv.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// ======================
// Middleware
// ======================
const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedUser = await admin.auth().verifyIdToken(token);
    req.user = decodedUser; // future use
    next();
  } catch (error) {
    res.status(401).send({ message: "Unauthorized access" });
  }
};

// ======================
// Routes
// ======================
app.get("/", (req, res) => {
  res.send("Hello FinEase 🚀");
});

async function run() {
  try {
    // await client.connect();

    const db = client.db("financeDB");
    const transactionCollection = db.collection("main-data");

    // Get all transactions (by email)
    app.get("/my-transaction", verifyFirebaseToken, async (req, res) => {
      const { email } = req.query;

      if (!email) {
        return res.status(400).send({ message: "Email is required" });
      }

      const result = await transactionCollection
        .find({ email })
        .sort({ amount: -1 })
        .toArray();

      res.send(result);
    });

    // Get single transaction
    app.get("/my-transaction/:id", verifyFirebaseToken, async (req, res) => {
      const { id } = req.params;

      const result = await transactionCollection.findOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    });

    // Create transaction
    app.post("/my-transaction", verifyFirebaseToken, async (req, res) => {
      const data = req.body;

      const result = await transactionCollection.insertOne(data);
      res.send(result);
    });

    // Update transaction
    app.put("/my-transaction/:id", verifyFirebaseToken, async (req, res) => {
      const { id } = req.params;
      const updatedData = req.body;

      const result = await transactionCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );

      res.send(result);
    });

    // Delete transaction
    app.delete("/my-transaction/:id", verifyFirebaseToken, async (req, res) => {
      const { id } = req.params;

      const result = await transactionCollection.deleteOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    });

    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error(error);
  }
}

run();

// ======================
// Server Listen
// ======================
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
