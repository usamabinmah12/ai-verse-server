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
    
    // await client.connect();
    const database = client.db("aiverse");
    const promtsCollection = database.collection("promts");
    // const usersCollection = database.collection("user");
    const usersCollection = database.collection("user");
    const planCollection = database.collection("plans");
    const reviewsCollection = database.collection("reviews");
    const subscriptionCollection = database.collection("subscriptions");

    const verifyToken = (req, res, next) => {
      console.log("headers", req.headers);
      const authHeader = req.headers?.authorization;
      if (!authHeader) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = authHeader.split(" ")[1];
      if (!token) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      next();
    };

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
    app.post("/api/reviews", async (req, res) => {
      const promt = req.body;
      const newPromt = {
        ...promt,
        createdAt: new Date(),
      };
      console.log("promts", newPromt);
      const result = await reviewsCollection.insertOne(newPromt);
      res.send(result);
    });
    app.get("/api/promts",  async (req, res) => {
      const {page=1 , limit=3} = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      const result = await promtsCollection.find().skip(skip).limit(Number(limit)).toArray();
      // const result = await cursor.toArray();
      const totalData = await promtsCollection.countDocuments();
      const totalPage = Math.ceil(totalData/Number(limit));
      res.send({data:result , page:Number(page), totalPage} || {});
      // const result = await promtsCollection.find().toArray();
      // res.send(result || {});
    });
    app.get("/api/users",  async (req, res) => {
      const cursor = usersCollection.find();
      const result = await cursor.toArray();
      res.send(result || {});
    });
    app.get("/api/subscriptions", async (req, res) => {
      const cursor = subscriptionCollection.find();
      const result = await cursor.toArray();
      res.send(result || {});
    });
    app.get("/api/reviews", async (req, res) => {
      const cursor = reviewsCollection.find();
      const result = await cursor.toArray();
      res.send(result || {});
    });
    app.delete("/api/deletePromt/:id", async (req, res) => {
      try {
        
        const { id } = req.params;
        console.log("ID received for deletion:", id);

        
        const result = await promtsCollection.deleteOne({
          _id: new ObjectId(id),
        });

        
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
    
    app.put("/api/editpromt/:id", async (req, res) => {
      try {
       
        const { id } = req.params;
        const updatedData = req.body;

        console.log("Updating Prompt ID:", id);
        console.log("New Data received:", updatedData);

        
        const result = await promtsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData },
        );

        
        return res.status(200).json({
          success: true,
          message: "Prompt updated successfully!",
          
        });
      } catch (error) {
        console.error("Edit API Error:", error);
        return res.status(500).json({
          success: false,
          message: "Internal server error",
          error: error.message,
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
    app.patch("/api/promt/:id", async (req, res) => {
      try {
        const id = req.params.id;

        
        if (!ObjectId.isValid(id)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid Prompt ID" });
        }

        const filter = { _id: new ObjectId(id) };

        
        const updatedDoc = {
          $inc: {
            copyCount: 1,
          },
        };

        const result = await promtsCollection.updateOne(filter, updatedDoc);

        
        if (result.modifiedCount > 0) {
          return res.status(200).json({
            success: true,
            message: "Copy count updated successfully!",
          });
        } else {
          return res.status(404).json({
            success: false,
            message: "Prompt not found or count not changed",
          });
        }
      } catch (error) {
        console.error("Error updating copy count:", error);
        return res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    });
    app.post("/api/subscriptions", async (req, res) => {
      const data = req.body;
      const subsInfo = {
        ...data,
        createdAt: new Date(),
      };

      const result = await subscriptionCollection.insertOne(subsInfo);

      
      const filter = { email: data.email };
      
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
    // await client.db("admin").command({ ping: 1 });
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
