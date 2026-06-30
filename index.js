const express = require('express');
const dotenv = require("dotenv")
const cors = require("cors")
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

dotenv.config()
const app = express();
const port = process.env.PORT || 8000;
app.use(cors())
app.use(express.json())




const uri = "mongodb+srv://ventureconnect:FznRevypdNiryQEm@cluster0.gqu9vmb.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// get
// patch
// put
// post
// delete
// api er nam "startups" hole frontend a base api  er pore  "startups" likhte hoy
// api er nam "/user/opportunity" hole frontend a base api er por a "/user/opportunity " likhte hoy




async function run() {
    try {
        // await client.connect()

        const database = client.db("ventureconnect_db")
        const startupsCollections = database.collection("startups")
        const userCollection = database.collection("user")
        const opportunityCollection = database.collection("opportunity")
        const applicationsCollection = database.collection("applications")
        const paymentsCollections = database.collection("payments")

        app.get("/startups", async (req, res) => {
            // console.log("calling")
            const { userEmail, status, search, filter } = req.query // {userEmail: 'ventureconnectfounder@gmail.com'}
            let query = {} // {userEmail: 'ventureconnectfounder@gmail.com'}
            if (userEmail) {
                query = { userEmail }
            }
            if (status) {
                query = { status }
            }
            if (search) {
                query.name = {
                    $regex: search, $options: "i"
                }
            }
            if (filter) {
                query.industry = filter
            }

            const result = await startupsCollections.find(query).toArray()
            // console.log(status, query, result)
            res.send(result)

        })
        app.get("/startup/:id", async (req, res) => {

            const { id } = req.params
            // console.log(id)

            const query = { _id: new ObjectId(id) }
            const result = await startupsCollections.findOne(query)
            res.send(result)
        })

        app.patch("/startup/:id", async (req, res) => {
            const id = req.params
            const formData = req.body
            const update = {
                $set: formData
            }
            // console.log(formData)
            const query = { _id: new ObjectId(id) }
            const result = await startupsCollections.updateOne(query, update)
            res.send(result)
        })

        app.post("/startups", async (req, res) => {
            const data = req.body
            const result = await startupsCollections.insertOne(data)
            res.send(result)
        })

        app.delete("/startups", async (req, res) => {
            const email = req.query

            const result = await startupsCollections.deleteOne(email)
            res.send(result)
        })


        app.get("/users", async (req, res) => {
            const result = await userCollection.find().toArray()
            res.send(result)
        })
        app.get("/user", async (req, res) => {
            const email = req.query
            const result = await userCollection.findOne(email)
            res.send(result)

        })


        app.patch("/user", async (req, res) => {
            const { id, status } = req.query
            const query = { _id: new ObjectId(id) }
            const result = await userCollection.updateOne(query, { $set: { isBlocked: Boolean(status) } })
            res.send(result)
        })

        app.patch("/user", async (req, res) => {
            const userEmail = req.query
            const formData = req.body
            const update = {
                $set: formData
            }
            const result = await userCollection.updateOne(userEmail, update)
            res.send(result)
        })

        app.get("/user/opportunity", async (req, res) => {
            const email = req.query

            const particularData = {
                // 1 = true, 0 = false
                projection: {
                    _id: 0,
                    opportunity: 1
                }
            }


            const result = await userCollection.findOne(email, particularData)
            // console.log(result)
            res.send(result)


        })
        // opportunity related code
        app.get("/opportunity", async (req, res) => {
            const { userEmail, search, workType, commitmentLevel, industry, limit, skip } = req.query
            let query = {}

            if (search) {
                query = {
                    title: {
                        $regex: search, $options: "i"
                    }
                }
            }
            if (workType) {
                query = { workType }
            }
            if (commitmentLevel) {
                query = { commitmentLevel }

            }
            if (userEmail) {
                query.userEmail = userEmail
            }
            if (industry) {
                const userQuery = { industry }
                const particularData = {
                    projection: {
                        _id: 0,
                        userEmail: 1
                    }
                }

                const userEmail = await startupsCollections.find(userQuery, particularData).toArray()
                // next code
                query = { $or: userEmail }
            }


            const result = await opportunityCollection.find(query).skip(Number(skip) || 0).limit(Number(limit) || 0).toArray()
            if (limit) {
                const dataCount = await opportunityCollection.countDocuments()
                res.send({ result, dataCount })
                // console.log(dataCount)
            }
            else {
                res.send(result)
            }



        })

       
        // })
        app.get("/opportunity/:id", async (req, res) => {
            const { id } = req.params
            const query = { _id: new ObjectId(id) }
            const result = await opportunityCollection.findOne(query)
            res.send(result)

        })
        app.patch("/opportunity", async (req, res) => {
            const { id } = req.query
            const data = req.body
            const query = { _id: new ObjectId(id) }
            const update = { $set: data }
            const result = await opportunityCollection.updateOne(query, update)
            res.send(result)
        })
        app.post("/opportunity", async (req, res) => {
            const data = req.body
            const email = req.query
            const insert = await opportunityCollection.insertOne(data)
            if (insert.insertedId) {
                const update = {
                    $inc: { opportunity: -1 }
                }
                const result = await userCollection.updateOne(email, update)
                res.send({ insert, result })
            }

        })


        app.delete("/opportunity/:id", async (req, res) => {
            const { id } = req.params
            const query = { _id: new ObjectId(id) }
            const result = await opportunityCollection.deleteOne(query)
            res.send(result)
            // console.log(id)
        })


        // admin dashboard apis here

        app.get("/founder/dashboard", async (req, res) => {
            const { email, startupName } = req.query
            console.log(startupName)
            console.log(email)
            const opportunityCount = await opportunityCollection.countDocuments({ userEmail: email })
            const applicationCount = await applicationsCollection.countDocuments({ startupName: startupName })
            const query = { status: "accepted", startupName: startupName }
            const acceptedApplication = await applicationsCollection.countDocuments(query)
            const result = { opportunityCount, applicationCount, acceptedApplication }
            console.log(result)
            res.send(result)
        })

        app.get("/admin/dashboard", async (req, res) => {
           
            const totalUsersCount = await userCollection.countDocuments()
            const totalStartupsCount = await startupsCollections.countDocuments()
            const totalOpportunityCount = await opportunityCollection.countDocuments()

            const allAmounts = await paymentsCollections.find({}, { projection: { _id: 0, amount: 1 } }).toArray()
            console.log(allAmounts)
            let revenue = 0
            allAmounts.forEach((items) => {
                revenue = revenue + items.amount
            })
            res.send({ totalUsersCount, totalStartupsCount, totalOpportunityCount, revenue })



        })


        // applications api

        app.get("/applications", async (req, res) => {
            const { userEmail, startupName } = req.query
            let query = {}
            if (userEmail) {
                query = { userEmail }
            }
            if (startupName) {
                query = { startupName }
            }
            const result = await applicationsCollection.find(query).toArray()
            res.send(result)
        })

        app.patch("/application", async (req, res) => {
            const { id, status } = req.query //
            const query = { _id: new ObjectId(id) } //
            const update = { // 
                $set: { status }
            }
            const result = await applicationsCollection.updateOne(query, update) // 
            console.log(query, update) //

            res.send(result) //

        })

        app.post("/applications", async (req, res) => {
            const data = req.body
            const today = new Date() // date string
            data.appliedAt = today
            const result = await applicationsCollection.insertOne(data)
            res.send(result)
        })
        // payments
        app.get("/payments", async (req, res) => {
            const result = await paymentsCollections.find().toArray()
            res.send(result)
        })
        app.post("/payments", async (req, res) => {
            const data = req.body
            data.status = "complete"
            data.createdAt = new Date()
            const result = await paymentsCollections.insertOne(data)
            const query = { email: data.email }
            const update = { $set: { plan: "Premium" } }
            await userCollection.updateOne(query, update)
            res.send(result)
        })




        // specials api

        app.get("/role", async (req, res) => {
            const email = req.query
            const particularData = {
                projection: {
                    _id: 0,
                    role: 1
                }
            }

            const result = await userCollection.findOne(email, particularData)
            res.send(result)

        })

        // others

        app.get("/featured-startups", async (req, res) => {
            const sort = { id: -1 }
            const result = await startupsCollections.find().sort(sort).limit(6).toArray()
            res.send(result)
        })

        app.get("/featured-opportunity", async (req, res) => {
            const sort = { id: -1 }
            const result = await opportunityCollection.find().sort(sort).limit(6).toArray()
            res.send(result)
        })



        app.get("/isStartup", async (req, res) => {
            const userEmail = req.query
            const projection = {
                projection: {
                    name: 1
                }
            }
            const result = await startupsCollections.findOne(userEmail, projection)
            res.send(result)
        })



        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);









































app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    // console.log(`Example app listening on port ${port}`);
});