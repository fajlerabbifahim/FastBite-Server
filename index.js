const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.j876r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
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
    // await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    const menuCollection = client.db('fastBite').collection('menu');
    const cartCollection = client.db('fastBite').collection('cart');

    //get menu items
    app.get('/menu', async (req, res) => {
      const result = await menuCollection.find().toArray();
      res.send(result);
    })

    //get cart items
    app.get('/cartItems', async(req, res)=>{
      const email = req.query.email;
      const query = {email};

      const result = await cartCollection.findOne(query);
      res.send(result);
    })

    // set cart items in database
    app.put('/cartItems', async (req, res) => {
      const cartItems = req.body;
      const email = req.query.email;
      const query = { email };

      const prevCart = await cartCollection.findOne(query);
      let updatedCart = {};

      if (prevCart) {
        updatedCart.email = email;

        Object.keys(prevCart).forEach((key) => {
          if (key !== "email") {
            updatedCart[key] = prevCart[key];
          }
        });

        Object.keys(cartItems).forEach((key) => {
          if (key !== "email") {
            updatedCart[key] = (updatedCart[key] || 0) + cartItems[key];
          }
        });
      } else {
        updatedCart = { ...cartItems, email }; 
      }

      const options = { upsert: true };
      const updatedDoc = { $set: updatedCart };

      const result = await cartCollection.updateOne(query, updatedDoc, options);

      res.send({ success: true, message: "Cart updated successfully", result });
    })

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// Test API Route
app.get("/", (req, res) => {
  res.send("Server is running... ");
});

// server run
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
