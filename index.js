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
    const usersCollection = database.collection("user");
    const planCollection = database.collection("plans");
    const subscriptionCollection = database.collection("subscriptions");
    app.post("/api/promts", async (req, res) => {
      const promt = req.body;
      const newPromt = {
        ...promt,
        createdAt: new Date(),
      };
      console.log("promts", newPromt);
      const result = await promtsCollection.insertOne(newPromt);
      res.send(result);
    });
    app.get("/api/promts", async (req, res) => {
      const cursor = promtsCollection.find();
      const result = await cursor.toArray();
      res.send(result || {});
    });
    app.get("/api/subscriptions", async (req, res) => {
      const cursor = subscriptionCollection.find();
      const result = await cursor.toArray();
      res.send(result || {});
    });
    app.delete("/api/deletePromt/:id", async (req, res) => {
      try {
        // ১. ইউআরএল থেকে আইডি বের করা
        const { id } = req.params;
        console.log("ID received for deletion:", id);

        // ২. আপনার ডাটাবেজ ডিলিট কুয়েরি (যেমন Mongoose বা MongoDB)
        const result = await promtsCollection.deleteOne({
          _id: new ObjectId(id),
        });

        // ৩. ফ্রন্টএন্ডে সফল রেসপন্স পাঠানো
        return res.status(200).json({
          success: true,
          message: "Prompt deleted successfully",
        });
      } catch (error) {
        console.error("Delete error:", error);
        return res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    });
   
    app.get("/api/promts/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      console.log("id is : ", id);
      const result = await promtsCollection.findOne(query);
      res.send(result || {});
    });
    app.get("/api/plans", async (req, res) => {
      const query = {};
      if (req.query.plan_id) {
        query.id = req.query.plan_id;
      }
      const plan = await planCollection.findOne(query);
      res.send(plan || {});
    });

    app.patch("/api/promts/:id", async (req, res) => {
      const id = req.params.id;
      const updatedStatus = req.body;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: updatedStatus.status,
        },
      };
      const result = await promtsCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
    app.post("/api/subscriptions", async (req, res) => {
      const data = req.body;
      const subsInfo = {
        ...data,
        createdAt: new Date(),
      };

      const result = await subscriptionCollection.insertOne(subsInfo);

      // update the user plan information
      const filter = { email: data.email };
      // update the value of the 'quantity' field to 5
      const updateDocument = {
        $set: {
          plan: data.planId,
        },
      };

      const updateResult = await usersCollection.updateOne(
        filter,
        updateDocument,
      );
      res.send(updateResult);
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
