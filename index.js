// server.js
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { MongoClient, ObjectId } from "mongodb";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGO_URI);
let transactionsCollection;

client.connect().then(() => {
  const db = client.db("fineaseDB");
  transactionsCollection = db.collection("transactions");
  console.log("MongoDB connected");
});

// ---------- Add Transaction ----------
app.post("/transactions", async (req, res) => {
  const transaction = req.body;
  transaction.date = new Date(transaction.date);
  const result = await transactionsCollection.insertOne(transaction);
  res.send(result);
});

// ---------- Get All Transactions by User ----------
app.get("/transactions", async (req, res) => {
  const { email } = req.query;
  const query = { userEmail: email };
  const transactions = await transactionsCollection.find(query).toArray();
  res.send(transactions);
});

// ---------- Get Single Transaction ----------
app.get("/transactions/:id", async (req, res) => {
  const { id } = req.params;
  const transaction = await transactionsCollection.findOne({
    _id: new ObjectId(id),
  });
  res.send(transaction);
});

// ---------- Update Transaction ----------
app.put("/transactions/:id", async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  updatedData.date = new Date(updatedData.date);
  const result = await transactionsCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updatedData }
  );
  res.send(result);
});

// ---------- Delete Transaction ----------
app.delete("/transactions/:id", async (req, res) => {
  const { id } = req.params;
  const result = await transactionsCollection.deleteOne({
    _id: new ObjectId(id),
  });
  res.send(result);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
