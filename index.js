const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

const app = express();
const port = process.env.PORT || 9000;

// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o3yie.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`


//zehad's database uri (*** change for you database ***)
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.j876r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

const corsOptions = {
  origin: ['http://localhost:5173', '*'],
  credentials: true,
  optionalSuccessStatus: 200,
}
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
app.use(morgan('dev'))
app.use(express.json());
app.use(cors(corsOptions));

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    const usersCollection = client.db('fastBite').collection('users');
    const menuCollection = client.db('fastBite').collection('menu');
    const cartCollection = client.db('fastBite').collection('cart');

    app.post('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = req.body;
      const isExist = await usersCollection.findOne(query);
      if (isExist) {
        return res.send(isExist)
      }
      const result = await usersCollection.insertOne({ ...user, role: 'customer', timestamp: Date.now() });
      res.send(result)
    })

    app.get('/user', async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    })
    app.get('/users/role/:email', async (req, res) => {
      const email = req.params.email;
      const result = await usersCollection.findOne({ email });
      // console.log(result)
      res.send({ role: result?.role })
    })

    app.get('/users', async (req, res) => {
      const result = await usersCollection.find().toArray()
      res.send(result);
    })
    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      // console.log(email)
      const query = { email }
      // console.log(query)
      const result = await usersCollection.findOne(query);
      res.send(result);
    })
    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result)
    })

    //get menu items
    app.get('/menu', async (req, res) => {
      const result = await menuCollection.find().toArray();
      res.send(result);
    })

    //get cart items
    app.get('/cartItems', async (req, res) => {
      const email = req.query.email;
      const query = { email };

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
