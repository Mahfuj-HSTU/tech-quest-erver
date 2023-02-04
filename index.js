const express = require( "express" );
const app = express();
const cors = require( "cors" );
const { MongoClient, ServerApiVersion, ObjectId } = require( "mongodb" );
const port = process.env.PORT || 5000;
require("dotenv").config();
const jwt = require("jsonwebtoken");


// middleware
app.use( cors() );
app.use( express.json() );
// const courses = require("./data/courses.json");

const uri = `mongodb+srv://${ process.env.DB_USER }:${ process.env.DB_PASS }@cluster0.pl2ayam.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient( uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
} );

// function verifyJWT(req, res, next) {
//   const authHeader = req.headers.authorization;
//   console.log(authHeader);
//   if (!authHeader) {
//     return res.status(401).send({ message: "unauthorized access" });
//   }
//   const token = authHeader.split(" ")[1];
//   console.log(token);
//   jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
//     if (err) {
//       return res.status(403).send({ message: "forbidden access" });
//     }
//     req.decoded = decoded;
//     next();
//   });
// }

async function run() {
  try {
    const usersCollection = client.db( "techQuest" ).collection( "users" );
    const allJobsCollection = client.db( "techQuest" ).collection( "recruiterJobPosts" );
    const recruiterJobPostsCollection = client.db( "techQuest" ).collection( "recruiterJobPosts" );
    const applicationCollection = client.db( "techQuest" ).collection( "applications" );
    const jobSeekersCollection = client.db( "techQuest" ).collection( "jobSeekersCollection" );
    const courseCollection = client.db( "techQuest" ).collection( "courses" );
    const test = client.db( "techQuest" ).collection( "test" ); // created by jayem for testing

    // Create post method for add job section
    app.post( "/alljobs", async ( req, res ) => {
      const jobPostDetails = req.body;
      const result = await allJobsCollection.insertOne( jobPostDetails );
      // console.log( result );
      res.send( result );
    } );

    // deleting job by id
    app.delete( '/delete-job/:id', async ( req, res ) => {
      const id = req.params.id;
      // console.log(id);
      const filter = { _id: ObjectId( id ) };
      const result = await recruiterJobPostsCollection.deleteOne( filter );
      res.send( result );
    } )

    // my jobs
    app.get("/myjobs", async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      console.log(decodedEmail, email);
      console.log(typeof decodedEmail, typeof email);

      // if (email !== decodedEmail) {
      //   return res.status(403).send({ message: "forbiden access" });
      // }

      const query = { email: email };
      const jobs = await applicationCollection.find( query ).toArray();
      // console.log( result );
      res.send( jobs );
    } );

    // getting a specific job
    app.get("/applications/:id", async (req, res) => {
      const id = req.params.id;
      //   console.log( id );
      const filter = { _id: ObjectId(id) };
      const result = await applicationCollection.findOne(filter);
        console.log( result );
      res.send(result);
    });

    // recruiter job posts
    app.get( "/recruiterJobPosts", async ( req, res ) => {
      const query = {};
      const result = await recruiterJobPostsCollection.find( query ).toArray();
      // const result = await test.find(query).toArray();
      res.send( result );
    } );

    app.get( "/jobSeekersCollection", async ( req, res ) => {
      const query = {};
      const result = await jobSeekersCollection.find( query ).toArray();
      res.send( result );
    } );

    // post users
    app.post( "/users", async ( req, res ) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
      console.log(result);
    });

    // Update Users Profile
    app.put( '/users/:email', async ( req, res ) => {
      const email = req.params.email;
      const editProfile = req.body;
      const { name, PresentAddress, ParmanentAddress, mobile } = editProfile;
      // console.log(email, editProfile, PresentAddress);
      const filter = { email };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name,
          PresentAddress,
          ParmanentAddress,
          mobile
        }
      }
      const result = await usersCollection.updateOne( filter, updateDoc, options );
      res.send( result );
    } );

    // storing job seekers application
    app.post( "/applications", async ( req, res ) => {
      const application = req.body;
      const result = await applicationCollection.insertOne( application );
      res.send( result );
    } );

    // created a search query - it is not complete
    app.get( "/search/:title", async ( req, res ) => {
      // const title = req.query;
      const title = req.params.title;
      // const country = req.params.country;
      //   console.log(title);
      const filter = { $search: { title } };
      const result = await recruiterJobPostsCollection
        .aggregate( [
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
        ] )
        .toArray();
      res.send( result );
    } );

    // Posts recruiters
    app.get( "/recruiterJobPosts", async ( req, res ) => {
      const email = req.query.email;
      let query = {}
      if ( email ) {
        query = { recruiterEmail: email };
      }
      const result = await recruiterJobPostsCollection.find( query ).toArray();
      res.send( result );
    } );


    app.delete( '/recruiterJobPosts/:id', async ( req, res ) => {
      const id = req.params.id;
      const filter = { _id: ObjectId( id ) };
      const result = await recruiterJobPostsCollection.deleteOne( filter );
      res.send( result );
    } )

    // getting a specific job
    app.get( "/job-details/:id", async ( req, res ) => {
      const id = req.params.id;
      //   console.log( id );
      const filter = { _id: ObjectId( id ) };
      const result = await recruiterJobPostsCollection.findOne( filter );
      //   console.log( result );
      res.send( result );
    } );

    // post users
    app.post( "/users", async ( req, res ) => {
      const user = req.body;
      const result = await usersCollection.insertOne( user );
      res.send( result );
    } );

    // storing job seekers application
    app.post( "/applications", async ( req, res ) => {
      const application = req.body;
      const result = await applicationCollection.insertOne( application );
      res.send( result );
    } );

    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      console.log(email);
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN);
        return res.send({ accessToken: token });
      }
      console.log(user);
      res.status(401).send({ accessToken: "" });
    });
    
    // get all users
    app.get( '/users', async ( req, res ) => {
      const users = await usersCollection.find( {} ).toArray();
      res.send( users )
    } )

    // delete users
    app.delete( '/users/:id', async ( req, res ) => {
      const id = req.params.id;
      const query = { _id: ObjectId( id ) }
      const result = await usersCollection.deleteOne( query );
      // console.log( result )
      res.send( result )
    } )

    // getting user to check role
    app.get( "/users/:email", async ( req, res ) => {
      const email = req.params.email;
      const user = await usersCollection.findOne( {email} );
      res.send( user );
    } );

    // getting all application from db
    app.get( "/applications", async ( req, res ) => {
      const result = await applicationCollection.find( {} ).toArray();
      res.send( result );
    } );

    // storing course one by one
    app.post(
      "/add-course/:title/:description/:instructor/:img/:price",
      async ( req, res ) => {
        const title = req.params.title;
        const description = req.params.description;
        const instructor = req.params.instructor;
        const img = req.params.img;
        const price = req.params.price;
        // console.log(title,description,instructor,img);
        const courseInfo = { title, description, instructor, img, price };
        const result = await courseCollection.insertOne( courseInfo );
        res.send( result );
      }
    );

    // getting all courses
    app.get( "/courses", async ( req, res ) => {
      const courses = await courseCollection.find( {} ).toArray()
      // const courses = await test.find({}).toArray()
      res.send( courses );
    } );

    // getting a single course by id
    app.get( "/courses/:id", async ( req, res ) => {
      const id = req.params.id;
      const filter = { _id: ObjectId( id ) }
      const result = await courseCollection.findOne( filter );
      // const result = await test.findOne(filter);
      res.send( result );
    } );

    app.delete( '/delete-course/:id', async ( req, res ) => {
      const id = req.params.id;
      const filter = { _id: ObjectId( id ) }
      const result = await courseCollection.deleteOne( filter );
      // const result = await test.deleteOne(filter);
      res.send( result );
    } )

  } catch {
    ( e ) => {
      console.error( "error inside run function: ", e );
    };
  }
}

run().catch( ( e ) => console.error( "run function error..", e ) );

app.get( "/", ( req, res ) => {
  res.send( "Tech Quest server is running..." );
} );

app.listen( port, () => {
  console.log( `Tech Quest server is running on ${ port }` );
} );
