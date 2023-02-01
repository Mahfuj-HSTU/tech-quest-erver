const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
require("dotenv").config();

// middleware
app.use(cors());
app.use(express.json());
const courses = require("./data/courses.json");

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pl2ayam.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const usersCollection = client.db("techQuest").collection("users");
    const allJobsCollection = client.db("techQuest").collection("recruiterJobPosts");
    const recruiterJobPostsCollection = client.db("techQuest").collection("recruiterJobPosts");
    const applicationCollection = client.db("techQuest").collection("applications");
    const courseCollection = client.db("techQuest").collection("courses");
    const test = client.db("techQuest").collection("test"); // created by jayem for testing
    

    // Create post method for add job section
    app.post("/alljobs", async (req, res) => {
      const jobPostDetails = req.body;
      const result = await allJobsCollection.insertOne(jobPostDetails);
      // console.log( result );
      res.send(result);
    });
    
    // deleting job by id
    app.delete('/delete-job/:id', async(req, res)=>{
      const id = req.params.id;
      // console.log(id);
      const filter = { _id: ObjectId(id)};
      const result = await recruiterJobPostsCollection.deleteOne(filter);
      // const result = await test.deleteOne(filter);
      res.send(result);
    })

    // my jobs
    app.get("/myjobs", async (req, res) => {
      const email = req.query.email;
      // console.log( email );
      const query = { email: email };
      const jobs = await applicationCollection.find(query).toArray();
      // console.log( result );
      res.send(jobs);
    });

    // recruiter job posts
    app.get("/recruiterJobPosts", async (req, res) => {
      const query = {};
      const result = await recruiterJobPostsCollection.find(query).toArray();
      // const result = await test.find(query).toArray();
      res.send(result);
    });

    // post users
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // storing job seekers application
    app.post("/applications", async (req, res) => {
      const application = req.body;
      // console.log(application);
      const result = await applicationCollection.insertOne(application);
      // console.log(result);
      res.send(result);
    });

    // created a search query - it is not complete
    app.get("/search/:title", async (req, res) => {
      // const title = req.query;
      const title = req.params.title;
      // const country = req.params.country;
      //   console.log(title);
      const filter = { $search: { title } };
      const result = await recruiterJobPostsCollection
        .aggregate([
          {
            $search: {
              index: "job_title",
              text: {
                query: title,
                path: {
                  wildcard: "*",
                },
              },
            },
          },
        ])
        .toArray();
      res.send(result);
    });

    // Posts recruiters
    app.get("/recruiterJobPosts/:email", async (req, res) => {
      const email = req.params.email;
      let query = {};
      if (email) {
        query = { recruiterEmail: email };
      }
      // console.log(email);
      // const filter = { recruiterEmail: email };
      const result = await recruiterJobPostsCollection.find(query).toArray();
      res.send(result);
    });

    // getting a specific job
    app.get("/job-details/:id", async (req, res) => {
      const id = req.params.id;
      //   console.log( id );
      const filter = { _id: ObjectId(id) };
      const result = await recruiterJobPostsCollection.findOne(filter);
      //   console.log( result );
      res.send(result);
    });

    // post users
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // storing job seekers application
    app.post("/applications", async (req, res) => {
      const application = req.body;
      const result = await applicationCollection.insertOne(application);
      res.send(result);
    });

    // getting user to check role
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      // console.log( email );
      const user = await usersCollection.findOne(query);
      res.send(user);
    });

    // getting all application from db
    app.get("/applications", async (req, res) => {
      const result = await applicationCollection.find({}).toArray();
      res.send(result);
    });

    // courses
    app.get("/courses", async(req, res) => {
      const courses = await courseCollection.find({}).toArray()
      res.send(courses);
    });

    app.get("/courses/:id", async(req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id)}
      const result = await courseCollection.findOne(filter);
      res.send(result);
    });
  } catch {
    (e) => {
      console.error("error inside run function: ", e);
    };
  }
}

run().catch((e) => console.error("run function error..", e));

app.get("/", (req, res) => {
  res.send("Tech Quest server is running...");
});

app.listen(port, () => {
  console.log(`Tech Quest server is running on ${port}`);
});
