const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

const app = express();
const port = process.env.PORT || 9000;

// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o3yie.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

const corsOptions = {
  origin: ['http://localhost:5173'],
  // origin: [],
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
    const usersCollection = client.db('Fast-Bite').collection('users');
    const menuCollection = client.db('fastBite').collection('menu');
    const cartCollection = client.db('fastBite').collection('cart');
    const restaurantCollection = client.db('Fast-Bite').collection('restaurant');
    const becomeMemberCollection = client.db('Fast-Bite').collection('become-member');
    const riderCollection = client.db('Fast-Bite').collection('rider');

    // Save the user to the database.
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
    // get the user database
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

    // restaurantCollection
    app.get('/restaurant', async (req, res) => {
      // console.log(req)
      const result = await restaurantCollection.find().toArray();
      console.log(result)
      res.send(result)
    })

    // becomeMemberCollection
    app.post('/become-member', async (req, res) => {
      const memberInfo = req.body;
      const result = await becomeMemberCollection.insertOne(memberInfo);
      res.send(result)
    })

    app.get('/become-member', async (req, res) => {
      const result = await becomeMemberCollection.find().toArray();
      // console.log(result)
      res.send(result)
    })
    app.get('/become-member/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email }
      const result = await becomeMemberCollection.findOne(query);
      // console.log(result)
      res.send(result)
    })

    app.delete('/become-member/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await becomeMemberCollection.deleteOne(query);

      res.send(result)
    })

    // Rider crud operation in the database.
    app.post('/rider/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }

      let result = await becomeMemberCollection.findOne(query);
      let filter = { email: result.email }
      let result1 = await usersCollection.findOne(filter);
      const updateDoc = {
        $set: {
          role: result.role
        }
      }
      result.isApprove = true;
      result = await riderCollection.insertOne(result);
      result1 = await usersCollection.updateOne(filter, updateDoc)
      const result3 = await becomeMemberCollection.deleteOne(query);

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
