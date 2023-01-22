const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
require("dotenv").config();

// middleware
app.use(cors());
app.use(express.json());

const courses = require( './data/courses.json' )

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pl2ayam.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
    // try {
    //     const test = client.db('techQuest').collection('test');
       
    //     const usersCollection = client.db('techQuest').collection('users');
    //     const recruiterJobPostsCollection = client.db('techQuest').collection('recruiterJobPosts');
  try {
    const test = client.db('techQuest').collection('test');
    const usersCollection = client.db("techQuest").collection("users");
    const myJobs = client.db('techQuest').collection('myjobs');
    const recruiterJobPostsCollection = client.db("techQuest").collection("recruiterJobPosts");
    const applicationCollection = client.db("techQuest").collection("applications");

        app.get("/allJobs", async (req, res) => {
            const result = await test.find({}).toArray();
            // console.log(result);
            res.send(result);
        });
      

        // my jobs 
        app.get("/myjobs", async (req, res) => {
            const email = req.query.email;
            console.log(email);
            const query = { email:email}
            const jobs = await myJobs.find(query).toArray();
            // console.log(result);
            res.send(jobs);
        });

        // recruiter job posts

        // Posts recruiters
        app.get('/recruiterJobPosts', async (req, res) => {
            const query = {};
            const result = await recruiterJobPostsCollection.find(query).toArray();
            res.send(result);
        });
    app.get("/allJobs", async (req, res) => {
      const result = await test.find({}).toArray();
      // console.log(result);
      res.send(result);
    });

    // Posts recruiters
    app.get("/recruiterJobPosts", async (req, res) => {
      const query = {};
      const result = await recruiterJobPostsCollection.find(query).toArray();
      res.send(result);
    });

    // getting a specific job
    app.get('/job-details/:id',async(req,res)=>{
      const id = req.params.id;
      console.log(id);
      const filter = { _id: ObjectId(id)}
      const result = await recruiterJobPostsCollection.findOne(filter);
      console.log(result);
      res.send(result);
    })

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

        // get recruiter
        // check buyer
        app.get( '/users/recruiter/:email', async ( req, res ) => {
            const email = req.params.email
            const query = { email }
            // console.log( email );
            const user = await usersCollection.findOne( query )
            res.send( { isRecruiter: user?.role === 'recruiter' } )
        } )

        // check jobSeeker
        app.get( '/users/jobSeeker/:email', async ( req, res ) => {
            const email = req.params.email
            const query = { email }
            // console.log( email );
            const user = await usersCollection.findOne( query )
            res.send( { isJobSeeker: user?.role === 'jobSeeker' } )
        } )

        app.get( '/courses', ( req, res ) => {
            res.send( courses )
        } )
    // getting all application from db
    app.get("/applications", async (req, res) => {
      const result = await applicationCollection.find({}).toArray();
      res.send(result);
    });

    app.get("/courses", (req, res) => {
      res.send(courses);
    });

    app.get("/courses/:id", (req, res) => {
      const id = req.params.id;
      const selectedCourse = courses.find((course) => course.id === id);
      res.send(selectedCourse);
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
