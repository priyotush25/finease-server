// server.js
const express = require("express");
const cors = require("cors");
const { connectDB, getDB } = require("./db");
const { ObjectId } = require("mongodb");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

connectDB().then(() => console.log("Database ready!"));

// ---------- Add Transaction ----------
app.post("/transactions", async (req, res) => {
  const transaction = req.body;
  transaction.date = new Date(transaction.date);
  const result = await getDB()
    .collection("transactions")
    .insertOne(transaction);
  res.send(result);
});

// ---------- Get All Transactions by User ----------
app.get("/transactions", async (req, res) => {
  const { email } = req.query;
  const transactions = await getDB()
    .collection("transactions")
    .find({ userEmail: email })
    .toArray();
  res.send(transactions);
});

// ---------- Get Single Transaction ----------
app.get("/transactions/:id", async (req, res) => {
  const { id } = req.params;
  const transaction = await getDB()
    .collection("transactions")
    .findOne({ _id: new ObjectId(id) });
  res.send(transaction);
});

// ---------- Update Transaction ----------
app.put("/transactions/:id", async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  updatedData.date = new Date(updatedData.date);
  const result = await getDB()
    .collection("transactions")
    .updateOne({ _id: new ObjectId(id) }, { $set: updatedData });
  res.send(result);
});

// ---------- Delete Transaction ----------
app.delete("/transactions/:id", async (req, res) => {
  const { id } = req.params;
  const result = await getDB()
    .collection("transactions")
    .deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
