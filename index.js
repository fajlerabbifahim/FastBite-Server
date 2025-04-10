const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o3yie.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.8jenr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // const usersCollection = client.db('Fast-Bite').collection('users');
    // const menuCollection = client.db('fastBite').collection('menu');
    // const cartCollection = client.db('fastBite').collection('cart');
    // const restaurantCollection = client.db('Fast-Bite').collection('restaurant');
    // const becomeMemberCollection = client.db('Fast-Bite').collection('become-member');
    // const riderCollection = client.db('Fast-Bite').collection('rider');

    // *********** All Collection List ************

    const usersCollection = client.db("Fast-Bite").collection("users");
    const restaurantCollection = client.db("Fast-Bite").collection("restaurants");
    const becomeMemberCollection = client.db("Fast-Bite").collection("become-member");
    const riderCollection = client.db("Fast-Bite").collection("rider");
    const foodsCollection = client.db("Fast-Bite").collection("foods");
    const ordersCollection = client.db("Fast-Bite").collection("orders");

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
        console.log(result)
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

    app.get("/food-details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const food = await foodsCollection.findOne(query);
      const restaurantId = food.restaurantId;
      // console.log(restaurantId)
      const filter = { _id: new ObjectId(restaurantId) };
      const restaurant = await restaurantCollection.findOne(filter)
      const owner_email = restaurant.owner_email;
      const email = { email: owner_email };
      const owner = await usersCollection.findOne(email);


      res.send({ food, restaurant, owner });
    })

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
      const query = { email };
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
    app.post("/rider/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      let result = await becomeMemberCollection.findOne(query);
      let filter = { email: result.email };
      let result1 = await usersCollection.findOne(filter);
      const updateDoc = {
        $set: {
          role: result.role,
        },
      };
      result.isApprove = true;
      result = await riderCollection.insertOne(result);
      result1 = await usersCollection.updateOne(filter, updateDoc);
      const result3 = await becomeMemberCollection.deleteOne(query);

      res.send(result);
    });

    // get menu items
    app.get("/menu", async (req, res) => {
      const result = await menuCollection.find().toArray();
      res.send(result);
    });
    // ---------------------------------------------------------------------------------------------------
    // order collection
    // app.post("/orders", async (req, res) => {
    //   const orderInfo = req.body; // { email: "...", food: { id: "abc123" } }
    //   const emailQuery = { email: orderInfo.email };

    //   let user = await ordersCollection.findOne(emailQuery);
    //   let newUser; // বাইরে declare করলাম যাতে পরে access করা যায়

    //   if (user) {
    //     const foodId = orderInfo.food.id;

    //     // cart থেকে খাবার খুঁজে বের করো
    //     const foodIndex = user.cart.findIndex(item => item.foodId === foodId);

    //     if (foodIndex !== -1) {
    //       // খাবার থাকলে quantity বাড়াও
    //       user.cart[foodIndex].quantity += 1;
    //     } else {
    //       // না থাকলে নতুন করে cart এ যোগ করো
    //       user.cart.push({ foodId: foodId, quantity: 1 });
    //     }

    //     // cart আপডেট করে ডাটাবেসে save করো
    //     const result = await ordersCollection.updateOne(
    //       { email: orderInfo.email },
    //       { $set: { cart: user.cart } }
    //     );

    //     res.send({ success: true, message: "Order updated", result });
    //   } else {
    //     // ইউজার না থাকলে নতুন ইউজার তৈরি করো
    //     newUser = {
    //       email: orderInfo.email,
    //       cart: [{ foodId: orderInfo.food.id, quantity: 1 }]
    //     };

    //     const result = await ordersCollection.insertOne(newUser);
    //     res.send({ success: true, message: "New user and order created", result });
    //   }

    //   // চাইলে এখানে newUser কে log করতে পারো
    //   if (newUser) {
    //     console.log("New user created:", newUser.email);
    //   }
    // });


    // app.post("/orders", async (req, res) => {
    //   const orderInfo = req.body; 
    //   const emailQuery = { email: orderInfo.email };

    //   let user = await ordersCollection.findOne(emailQuery);
    //   let newUser; 

    //   if (user) {
    //     const foodId = orderInfo.food.id;

    //     const foodIndex = user.cart.findIndex(item => item.foodId === foodId);

    //     if (foodIndex !== -1) {

    //       user.cart[foodIndex].quantity += 1;
    //     } else {

    //       user.cart.push({ foodId: foodId, quantity: 1 });
    //     }


    //     const result = await ordersCollection.updateOne(
    //       { email: orderInfo.email },
    //       { $set: { cart: user.cart } }
    //     );


    //     await foodsCollection.updateOne(
    //       { _id: new ObjectId(foodId) }, 
    //       { $inc: { quantity: -1 } } 
    //     );

    //     res.send(result);
    //   } else {

    //     newUser = {
    //       email: orderInfo.email,
    //       cart: [{ foodId: orderInfo.food.id, quantity: 1 }]
    //     };

    //     const result = await ordersCollection.insertOne(newUser);


    //     await foodsCollection.updateOne(
    //       { _id: new ObjectId(orderInfo.food.id) }, 
    //       { $inc: { quantity: -1 } }
    //     );

    //     res.send(result);
    //   }
    //   if (newUser) {
    //     console.log("New user created:", newUser.email);
    //   }
    // });

    app.post("/orders", async (req, res) => {
      const orderInfo = req.body;
      const emailQuery = { email: orderInfo.email };

      // Step 1: Find food details from DB to get name, price, and restaurantId
      const foodItem = await foodsCollection.findOne({ _id: new ObjectId(orderInfo.food.foodId) });

      if (!foodItem) {
        return res.status(404).send({ message: "Food not found" });
      }

      const foodId = orderInfo.food.foodId;
      const foodImage = orderInfo.food.foodImage;
      const restaurantId = foodItem.restaurantId;
      const foodName = foodItem.name;
      const unitPrice = foodItem.price;

      let user = await ordersCollection.findOne(emailQuery);

      if (user) {
        const foodIndex = user.cart.findIndex(item => item.foodId === foodId);

        if (foodIndex !== -1) {
          // Update existing food item in cart
          user.cart[foodIndex].quantity += 1;
          user.cart[foodIndex].price = user.cart[foodIndex].quantity * unitPrice;
        } else {
          // Add new item to cart
          user.cart.push({
            foodId: foodId,
            name: foodName,
            quantity: 1,
            price: unitPrice,
            restaurantId: restaurantId,
            image: foodImage
          });
        }
        const totalQuantity = user.cart.reduce((sum, item) => sum + item.quantity, 0);
        const result = await ordersCollection.updateOne(
          { email: orderInfo.email },
          { $set: { cart: user.cart, totalQuantity } }
        );
        // Reduce quantity from foodsCollection
        await foodsCollection.updateOne(
          { _id: new ObjectId(foodId) },
          { $inc: { quantity: -1 } }
        );

        res.send(result);
      } else {
        // If user doesn't exist, create new
        const newUser = {
          email: orderInfo.email,
          cart: [
            {
              foodId: foodId,
              name: foodName,
              quantity: 1,
              price: unitPrice,
              restaurantId: restaurantId,
              image: foodImage

            }
          ],
          status: 'isPending',
          totalQuantity: 1
        };

        const result = await ordersCollection.insertOne(newUser);

        await foodsCollection.updateOne(
          { _id: new ObjectId(foodId) },
          { $inc: { quantity: -1 } }
        );

        res.send(result);
      }
    });

    // my-order
    app.get("/my-order/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await ordersCollection.findOne(query);
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
