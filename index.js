const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = 5000;
const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World!");
});

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const database = client.db("aiverse");
        const promtsCollection = database.collection("promts");
         app.post("/api/promts", async (req, res) => {
            const promt = req.body;
            const newPromt = {
                ...promt,
                createdAt: new Date(),
            };
            console.log('promts' , newPromt);
            const result = await promtsCollection.insertOne(newPromt);
            res.send(result);
        });
        app.get("/api/promts", async (req, res) => {
           
            const cursor = promtsCollection.find();
            const result = await cursor.toArray();
            res.send(result || {});
        });
        app.get("/api/promts/:id", async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id),
            };
             console.log("id is : ",id)
            const result = await promtsCollection.findOne(query);
            res.send(result || {});
        });
        await client.db("admin").command({ ping: 1 });
        console.log(
            "Pinged your deployment. You successfully connected to MongoDB!",
        );
    } catch (error) {
        console.error(error);
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
