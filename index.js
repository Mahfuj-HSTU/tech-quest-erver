require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 8000;
const cors = require("cors");
const mongoose = require('mongoose');
const multer = require('multer');
const { MongoClient, ServerApiVersion, ObjectId, CURSOR_FLAGS } = require("mongodb");


// middleware
app.use(cors());
app.use(express.json({ limit: "100mb" }));

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pl2ayam.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

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


const mediaController = require('./controllers/mediaController')
const fs = require('fs')
const path = require('path')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (fs.existsSync('public')) {
      fs.mkdirSync('public');
    }
    if (fs.existsSync('public/videos')) {
      fs.mkdirSync('public/videos')
    }
    cb(null, "public/videos");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() = file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    var ext = path.extname(file.originalname);
    if (ext !== '.mkv' && ext !== '.mp4') {
      return cb(new Error('Only videos are allowed'))
    }
    cb(null, true);
  }
})

// mongoose connection
mongoose.set('strictQuery', true);
mongoose.connect(uri, {
  useNewUrlParser: true,
});
mongoose.connection.on('connected', () => {
  console.log('Connected to mongodb')
})
mongoose.connection.on('error', (err) => {
  console.log('error connecting to mongodb', err)
})


async function run() {
  try {
    const usersCollection = client.db("techQuest").collection("users");
    const allJobsCollection = client.db("techQuest").collection("recruiterJobPosts");
    const recruiterJobPostsCollection = client.db("techQuest").collection("recruiterJobPosts");
    const applicationCollection = client.db("techQuest").collection("applications");
    const savedJobCollection = client.db("techQuest").collection("savedJob");
    const jobSeekersCollection = client.db("techQuest").collection("jobSeekersCollection");
    const courseCollection = client.db("techQuest").collection("courses");
    const coursePaymentCollection = client.db("techQuest").collection("coursePayment");
    const videoCollection = client.db("techQuest").collection("videos");
    const test = client.db("techQuest").collection("test"); // created by jayem for testing

    // Create post method for add job section
    app.post("/all-jobs", async (req, res) => {
      const jobPostDetails = req.body;
      const result = await allJobsCollection.insertOne(jobPostDetails);
      // console.log( result );
      // const filter = { role: "jobSeeker" }
      // const updateDoc = {
      //   $set: {
      //     notification: true
      //   }
      // }
      // const updatedJobseeker = await usersCollection.updateMany(filter, updateDoc)
      res.send(result);
    });

    // deleting job by id
    app.delete("/delete-job/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const filter = { _id: ObjectId(id) };
      const result = await recruiterJobPostsCollection.deleteOne(filter);
      res.send(result);
    });

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
      const jobs = await applicationCollection.find(query).toArray();
      // console.log( result );
      res.send(jobs);
    });

    // all job seekers
    app.get("/jobSeekersCollection", async (req, res) => {
      const search = req.query.search;
      let query = {role: "jobSeeker"};
      if( search.length) {
        query = {
          $text : {
            $search : search
          }
        }
      }

      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    // storing job seekers application
    app.post("/save-applications", async (req, res) => {
      const application = req.body;
      console.log(application);
      const result = await applicationCollection.insertOne(application);
      // console.log(result);
      res.send(result);
    });

    // storing job bookmark
    app.post('/save-job', async(req, res)=>{
      const bookmark = req.body;
      // console.log(bookmark);
      const result = await savedJobCollection.insertOne(bookmark);
      res.send(result)
    });

    // getting saved jobs
    app.get('/saved-job', async(req, res)=>{
      const bookmark = req.body;
      // console.log(bookmark);
      const result = await savedJobCollection.find(bookmark).toArray();
      res.send(result)
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

    // recruiter job posts
    app.get("/recruiterJobPosts", async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { recruiterEmail: email };
      }
      const result = await recruiterJobPostsCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/recruiterJobPosts/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await recruiterJobPostsCollection.deleteOne(filter);
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

    // Collect Applicant for Recruiter
    app.get('/applicant/:id', async (req, res) => {
      const id = req.params.id;
      const query = { "job._id": id };
      const applicant = await applicationCollection.find(query).toArray();
      res.send(applicant)
    })

    // notified recruiter
    app.get('/applicant', async (req, res) => {
      const email = req.query.email;
      const query = { "job.recruiterEmail": email };
      const applicants = await applicationCollection.find(query).toArray();
      const applicants2 = applicants.filter(app => app.notification === 'true')
      // applicants.forEach(applicant=>{
      //   const trueApplicants=applicants.filter(app => app.notification === 'true')
      // })
      res.send(applicants2)
    })

    // Check notification
    app.put('/applicant/:email', async (req, res) => {
      const email = req.params.email;
      const filter = { "job.recruiterEmail": email };
      // const applicants = await applicationCollection.find(query).toArray();
      // const filter = applicants.filter(app => app.notification === 'true')
      const options = { projection: { notification: "true" } };
      // console.log(options)
      const updateDoc = {
        $set: {
          notification: 'false'
        }
      }
      const result = await applicationCollection.updateMany(filter, updateDoc, options);

      res.send(result)
    })

    // app.get( "/jwt", async ( req, res ) => {
    //   const email = req.query.email;
    //   console.log( email );
    //   const query = { email: email };
    //   const user = await usersCollection.findOne( query );
    //   if ( user ) {
    //     const token = jwt.sign( { email }, process.env.ACCESS_TOKEN );
    //     return res.send( { accessToken: token } );
    //   }
    //   console.log( user );
    //   res.status( 401 ).send( { accessToken: "" } );
    // } );

    // post users
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // get all users
    app.get("/users", async (req, res) => {
      const users = await usersCollection.find({}).toArray();
      res.send(users);
    });

    // getting user to check role
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      // console.log( user )
      res.send(user);
    });

    // update user
    app.put('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) }
      const user = req.body;
      // console.log( user )
      const option = { upsert: true }
      const updatedUser = {
        $set: {
          name: user.name,
          email: user.email,
          institute: user.institute,
          address: user.address
        }
      }
      const result = await usersCollection.updateOne(query, updatedUser, option)
      res.send(result)
    })

    // delete users
    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result)
    })

    // deleting myjob from db

    app.delete('/applications/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      console.log(query);
      const result = await applicationCollection.deleteOne(query);
      console.log(result,'this is a rule')
      res.send(result)
    })


    // getting all application from db
    app.get("/applications", async (req, res) => {
      const result = await applicationCollection.find({}).toArray();
      res.send(result);
    });

    // storing a new course
    app.post("/add-course",
      async (req, res) => {
        const courseInfo = req.body;
        const result = await courseCollection.insertOne(courseInfo);
        res.send(result)
      }
    );

    // implementing multer for video upload

    const multer = require('multer');
    const path = require('path');

    // const UPLOADS_FOLDER = './uploads/';

    const storage = multer.diskStorage({
      destination: (req, file, next) => {
        if (!fs.existsSync("uploads")) {
          fs.mkdirSync("uploads")
        }
        next(null, './uploads');
      },
      filename: (req, file, next) => {
        // rename file
        // const fileExt = path.extname(file.originalname);
        // const fileName = file.originalname.replace(fileExt, "").toLowerCase().split(" ").join("-") + "-" + Date.now();
        // next(null, fileName + fileExt);
        next(null, file.originalname);
      }
    })

    const upload = multer({
      dest: './uploads',
      limits: {
        fileSize: 1000000000,
      },
      storage: storage,
      fileFilter: (req, file, next) => {
        // console.log(file);
        if (file.mimetype === 'video/mp4') {
          next(null, true)
        }
        else {
          next(new Error("only mp4 is supported!!!"))
        }
      }
    })

    // adding video test
    app.post('/upload/video', upload.single('video'), async (req, res) => {
      const { originalname } = req.file;
      // console.log( originalname, req.file);
      const videoInfo = { name: originalname };
      const filter = {};
      const query = {}
      // const result = await courseCollection.updateOne(filter, query)
      // res.send(result);
    });

    // getting video - test
    app.get("/video/:id", async (req, res) => {
      const { id } = req.params;
      const result = await courseCollection.findOne({ _id: ObjectId(id) });

      if (result) {
        console.log(result.name);
        // Ensure there is a range given for the video
        const range = req.headers.range;
        if (!range) {
          res.status(400).send("Requires Range header");
        }

        // get video stats (about 61MB)

        // const videoPath = `./uploads/${result.name}`;
        // const videoSize = fs.statSync(`./uploads/${result.name}`).size;

        const video_name = result.video_name;

        const videoPath = `./uploads/${video_name}`;
        const videoSize = fs.statSync(`./uploads/${video_name}`).size;

        // Parse Range
        // Example: "bytes=32324-"
        const CHUNK_SIZE = 10 ** 6; // 1MB
        const start = Number(range.replace(/\D/g, ""));
        const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

        // Create headers
        const contentLength = end - start + 1;
        const headers = {
          "Content-Range": `bytes ${start}-${end}/${videoSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": contentLength,
          "Content-Type": "video/mp4",
        };

        // HTTP Status 206 for Partial Content
        res.writeHead(206, headers);

        // create video read stream for this particular chunk
        const videoStream = fs.createReadStream(videoPath, { start, end });

        // Stream the video chunk to the client
        videoStream.pipe(res);
      }
    });

    app.use((err, req, res, next) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          res.status(500).send("There was an upload error!");
        }
        else {
          res.status(500).send(err.message)
        }
      }
      else {
        res.send('success')
      }
    })

    // getting all courses
    app.get("/courses", async (req, res) => {
      const courses = await courseCollection.find({}).toArray();
      // console.log( courses )
      res.send(courses);
    });

    // getting a single course by id
    app.get("/courses/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await courseCollection.findOne(filter);
      // const result = await test.findOne(filter);
      res.send(result);
    });

    // storing payment info including course details and buyer email
    app.post("/courses/payment/:id/:email", async (req, res) => {
      const email = req.params.email;
      const course_id = req.params.id;
      const filter = { _id: ObjectId(course_id) };
      const courseInfo = await courseCollection.findOne(filter);
      const { title, videoUrl, description, instructor, img } = courseInfo;
      const courseInfoMore = { title, videoUrl, description, instructor, img, course_id, email };
      const coursePayment = await coursePaymentCollection.insertOne(
        courseInfoMore
      );
      // console.log(courseInfoMore);
      res.send(coursePayment);
    });

    // getting all course payment data
    app.get('/all-payment', async (req, res) => {
      const result = await coursePaymentCollection.find({}).toArray();
      // console.log(result);
      res.send(result);
    })



    // post video
    app.post('/videos', upload.fields([{ name: 'videos', maxCount: 5, }]), async (req, res) => {
      const { name } = req.body;
      let videosPath = [];
      if (Array.isArray(req.files.videos) && req.files.videos.length > 0) {
        for (let video of req.files.videos) {
          videosPath.push('/' + video.path)
        }
      }
      try {
        const createMedia = await Media.Create({
          name,
          videos: videosPath
        })
        res.json({ message: "Media created successfully", createMedia })
      } catch (error) {
        console.log(error)
        res.status(400).json(error)
      }
    });

    // delete a course from course collection by admin
    app.delete("/delete-course/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await courseCollection.deleteOne(filter);
      // const result = await test.deleteOne(filter);
      res.send(result);
    })



    // post video
    app.post('/videos', upload.fields([{ name: 'videos', maxCount: 5, }]), async (req, res) => {
      const { name } = req.body;
      let videosPath = [];
      if (Array.isArray(req.files) && req.files.length > 0) {
        for (let video of req.files) {
          videosPath.push('/' + video.path)
        }
      }
      try {
        const createMedia = await Media.Create({
          name,
          videos: videosPath
        })
        res.json({ message: "Media created successfully", createMedia })
      } catch (error) {
        console.log(error)
        res.status(400).json(error)
      }
    });

    // get video
    // app.get( "/videos", async ( req, res ) => {
    //   const video = await videoCollection.find( {} ).toArray()
    //   res.send( video );
    // } );
    app.get('/videos', mediaController.getAll)

    // getting a video by id
    app.get("/videos/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) }
      const result = await videoCollection.findOne(filter);
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
