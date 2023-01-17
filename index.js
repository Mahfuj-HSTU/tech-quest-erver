const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;
require("dotenv").config();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pl2ayam.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const test = client.db('techQuest').collection('tes');
        const usersCollection = client.db('techQuest').collection('users');
        const recruiterJobPostsCollection = client.db('techQuest').collection('recruiterJobPosts');


        app.get("/allJobs", async (req, res) => {
            const result = await test.find({}).toArray();
            // console.log(result);
            res.send(result);
        });

        // Posts recruiters
        app.get('/recruiterJobPosts', async (req, res) => {
            const query = {};
            const result = await recruiterJobPostsCollection.find(query).toArray();
            res.send(result);
        })

        // post users
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result)
        })
    }
    catch {
        e => {
            console.error('error inside run function: ', e);
        }
    }
}

run().catch((e) => console.log("run function error..", e));

app.get("/", (req, res) => {
  res.send("Tech Quest server is running...");
});

app.listen(port, () => {
  console.log(`Tech Quest server is running on ${port}`);
});
