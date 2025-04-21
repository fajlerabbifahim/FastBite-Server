const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;


const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.8esgxxo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

const corsOptions = {
  origin: ["http://localhost:5173"],
  // origin: [],
  credentials: true,
  optionalSuccessStatus: 200,
};
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
app.use(morgan("dev"));
app.use(express.json());
app.use(cors(corsOptions));

async function run() {
  try {

    // *********** All Collection List ************

    const usersCollection = client.db("Fast-Bite").collection("users");

    const restaurantReviewCollection = client
      .db("Fast-Bite")
      .collection("restaurantReviews");
    const restaurantCollection = client
      .db("Fast-Bite")
      .collection("restaurants");
    const becomeMemberCollection = client
      .db("Fast-Bite")
      .collection("become-member");
    const riderCollection = client.db("Fast-Bite").collection("rider");
    const sellerCollection = client.db("Fast-Bite").collection("seller");
    const foodsCollection = client.db("Fast-Bite").collection("foods");
    const ordersCollection = client.db("Fast-Bite").collection("orders");
    const addToCartCollection = client.db("Fast-Bite").collection("addToCart");

    // Save the user to the database.
    app.post("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = req.body;
      const isExist = await usersCollection.findOne(query);
      if (isExist) {
        return res.send(isExist);
      }
      const result = await usersCollection.insertOne({
        ...user,
        role: "customer",
        timestamp: Date.now(),
      });
      res.send(result);
    });
    // get the user database
    app.get("/user", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });
    app.get("/users/role/:email", async (req, res) => {
      const email = req.params.email;
      const result = await usersCollection.findOne({ email });
      // console.log(result)
      res.send({ role: result?.role });
    });

    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      // console.log(email)
      const query = { email };
      // console.log(query)
      const result = await usersCollection.findOne(query);
      res.send(result);
    });
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    // ***************Restaurant Related apis****************
    // get owner restaurant by email
    app.get("/owner/:email", async (req, res) => {
      const email = req.params.email;
      const query = { owner_email: email };
      const result = await restaurantCollection.find(query).toArray();
      res.send(result);
    });

    // get all restaurant
    app.get("/restaurants", async (req, res) => {
      const data = await restaurantCollection.find().toArray();
      res.send(data);
    });

    //get top reviews restaurant

    app.get("/restaurants/top", async (req, res) => {
      try {
        const topRestaurants = await restaurantCollection
          .find()
          .sort({ stars: -1 })
          .limit(5)
          .toArray();

        res.send(topRestaurants);
      } catch (error) {
        res.status(500).send({ error: "Something went wrong!" });
      }
    });

    //get specific restaurant data

    app.get("/restaurantDetails/:id", async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ error: "Invalid restaurant ID" });
      }
      try {
        const result = await restaurantCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!result) {
          return res.status(404).send({ error: "Restaurant not found" });
        }
        console.log(result);
        res.send(result);
      } catch (error) {
        console.error("Error fetching restaurant details:", error);
        res.status(500).send({ error: "Internal server error" });
      }
    });

    // =================food Related apis====================

    app.get("/popularDishes", async (req, res) => {
      const data = await foodsCollection.find().toArray();
      const result = data.slice(0, 8);
      res.send(result);
    });

    app.get("/foods", async (req, res) => {
      const result = await foodsCollection.find().toArray();
      res.send(result);
    });

    app.delete("/food/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodsCollection.deleteOne(query);
      res.send(result)
    })

    //get food item for restaurant details page by there restaurant id

    app.get("/restaurantFoods/:id", async (req, res) => {
      const id = req.params.id;
      const result = await foodsCollection.find({ restaurantId: id }).toArray();
      res.send(result);
    });

    // ==================review related apis==================

    // post a restaurant reviews
    app.post("/restaurantReviews", async (req, res) => {
      const review = req.body;
      const result = await restaurantReviewCollection.insertOne(review);
      res.send(result);
    });

    //get individual restaurant review by id
    app.get("/restaurantReviews/:id", async (req, res) => {
      const id = req.params.id;
      const result = await restaurantReviewCollection
        .find({
          restaurantID: id,
        })
        .toArray();
      res.send(result);
    });
    app.get("/food-details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const food = await foodsCollection.findOne(query);
      const restaurantId = food.restaurantId;
      // console.log(restaurantId)
      const filter = { _id: new ObjectId(restaurantId) };
      const restaurant = await restaurantCollection.findOne(filter);
      const owner_email = restaurant.owner_email;
      const email = { email: owner_email };
      const owner = await usersCollection.findOne(email);

      res.send({ food, restaurant, owner });
    });

    // becomeMemberCollection
    app.post("/become-member", async (req, res) => {
      const memberInfo = req.body;
      const result = await becomeMemberCollection.insertOne(memberInfo);
      res.send(result);
    });

    app.get("/become-member", async (req, res) => {
      const result = await becomeMemberCollection.find().toArray();
      // console.log(result)
      res.send(result);
    });
    app.get("/become-member/:email", async (req, res) => {
      const email = req.params.email;
      const query = { owner_email: email };
      const result = await becomeMemberCollection.findOne(query);
      // console.log(result)
      res.send(result);
    });

    app.delete("/become-member/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await becomeMemberCollection.deleteOne(query);

      res.send(result);
    });

    // Rider crud operation in the database.
    app.post("/member/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      let result = await becomeMemberCollection.findOne(query);
      let filter = { email: result.owner_email };
      const updateDoc = {
        $set: {
          role: result.role,
        },
      };
      await usersCollection.updateOne(filter, updateDoc);
      result.isApprove = true;
      let newResult;
      if (result.role === 'rider') {
        newResult = await riderCollection.insertOne(result);
      }
      else {
        newResult = await restaurantCollection.insertOne(result);
      }
      await becomeMemberCollection.deleteOne(query);

      res.send(newResult);
    });

    // get menu items
    app.get("/menu", async (req, res) => {
      const result = await menuCollection.find().toArray();
      res.send(result);
    });
    // ---------------------------------------------------------------------------------------------------
    // order collection

    app.post("/addToCart", async (req, res) => {
      const orderInfo = req.body;
      const existingOrder = await addToCartCollection.findOne({
        customer_email: orderInfo.customer_email,
        food_id: orderInfo.food_id,
      });
      await foodsCollection.updateOne(
        { _id: new ObjectId(orderInfo.food_id) },
        { $inc: { quantity: -1 } }
      );
      if (existingOrder) {
        const updatedQuantity = existingOrder.quantity + 1;
        const updatedPrice = existingOrder.price + orderInfo.price;
        const updateResult = await addToCartCollection.updateOne(
          { _id: existingOrder._id },
          {
            $set: {
              quantity: updatedQuantity,
              price: updatedPrice,
            },
          }
        );
        res.send(updateResult);
      } else {
        const insertResult = await addToCartCollection.insertOne(orderInfo);
        res.send(insertResult);
      }
    });

    // my-order
    app.get("/addToCart/:email", async (req, res) => {
      const email = req.params.email;
      const query = { customer_email: email };
      const result = await addToCartCollection.find(query).toArray();
      res.send(result);
    })

    app.delete("/deleteCartItem/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await addToCartCollection.deleteOne(query);
      res.send(result);
    })


    // payment
    app.post('/create-payment-intent', async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      });
      res.send({
        clientSecret: paymentIntent.client_secret
      })

    })
    app.post('/orders', async (req, res) => {
      const payment = req.body;
      for (const item of payment.Cart) {
        const order = {
          customer_email: item.customer_email,
          food_id: item.food_id,
          food_name: item.food_name,
          food_image: item.food_image,
          price: item.price,
          quantity: item.quantity,
          owner_email: item.owner_email,
          status: 'isPending'
        };
        await ordersCollection.insertOne(order); // Insert each item as an order
      }
      const result = await addToCartCollection.deleteMany({ customer_email: payment.customer_email });
      res.send(result);
    })


    app.get('/orders', async (req, res) => {

      const result = await ordersCollection.find().sort({ _id: -1 }).limit(6).toArray();
      const result1 = await ordersCollection.aggregate([
        {
          $group: {
            _id: null,
            totalPrice: { $sum: "$price" }
          }
        }
      ]).toArray();

      // console.log("Total Price:", result1[0]?.totalPrice || 0);

      res.send({ result, result1 })
    })


    app.get('/orders/:email', async (req, res) => {
      const email = req.params.email;
      const query = { customer_email: email };
      const result = await ordersCollection.find(query).toArray();
      res.send(result);
    })





    // ---------------------------------------------------------------------------------------------------

    //get cart items
    // app.get("/cartItems", async (req, res) => {
    //   const email = req.query.email;
    //   const query = { email };

    //   const result = await cartCollection.findOne(query);
    //   res.send(result);
    // });
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
