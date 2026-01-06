const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
var admin = require("firebase-admin")
require("dotenv").config()
var serviceAccount = require("./serviceKey.json");
const app = express()
const port = process.env.PORT || 3000;

app.use(cors())
app.use(express.json())

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.ke7g9qv.mongodb.net/?appName=Cluster0`


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.get("/", (req, res) => {
    res.send('Hello FinEase')
})

const verifyFirebaseToken = async (req, res, next) => {
    const authorization = req.headers.authorization;

    if(!authorization){
        res.status(401).send({
            message: "unauthorized access!"
        })
    }

    const token = authorization.split(' ')[1]

    try {
        await admin.auth().verifyIdToken(token)
        next();
    } catch(error) {
        res.status(401).send({
            message: "unauthorized access!"
        })
    }    
}


async function run() {
    try {
        // await client.connect();

        const db = client.db("financeDB");
        const dataCollection = db.collection("main-data");

        app.get('/my-transaction', verifyFirebaseToken, async (req, res) => {
            const email = req.query.email;
            const cursor = dataCollection.find({ email : email }).sort({amount : -1});
            const result = await cursor.toArray();
            res.send(result)
        })

        app.get('/my-transaction/:id', verifyFirebaseToken, async (req, res) => {
            const {id} = req.params;
            const query = { _id: new ObjectId(id) }
            const result = await dataCollection.findOne(query)
            res.send(result)
        })

        app.post('/my-transaction', async (req, res) => {
            const data = req.body;
            const result = await dataCollection.insertOne(data)
            res.send(result)
        })

        app.put('/my-transaction/:id', async (req, res) => {
            const {id} = req.params
            const data = req.body;
            
            const filter = { _id: new ObjectId(id) }
            const update = {
                $set: data
            }

            const result = await dataCollection.updateOne(filter, update)
            res.send(result)
        })

        app.delete('/my-transaction/:id', async (req, res) => {
            const {id} = req.params;
            const filter = { _id: new ObjectId(id) };
            const result = await dataCollection.deleteOne(filter)
            res.send(result)
        })



        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Running port is ${port}`);
})