const express = require('express')
const cors = require("cors");
const fileUpload = require('express-fileupload');
const ObjectID = require("mongodb").ObjectID;
const bodyParser = require("body-parser");
require('dotenv').config()


const app = express()
app.use(cors());
app.use(bodyParser.json());
app.use(fileUpload())

const port = 8000


app.get('/', (req, res) => {
    res.send('Welcome Massage Therapy Center Server')
})

//Database connection
const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.5yvtj.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {

    //database collection
    const adminCollection = client.db("massageTherapyCenter").collection("admin");
    const serviceCollection = client.db("massageTherapyCenter").collection("services");
    const reviewCollection = client.db("massageTherapyCenter").collection("reviews");
    const bookingCollection = client.db("massageTherapyCenter").collection("booking");


    //add admin in database by post method
    app.post('/addAdmin', (req, res) => {
        const adminEmail = req.body
        adminCollection.insertOne(adminEmail)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })


    //add new service in database by post method
    app.post('/addService', (req, res) => {
        const file = req.files.file;
        const serviceName = req.body.serviceName;
        const serviceDescription = req.body.serviceDescription;
        const serviceCharge = req.body.serviceCharge;
        const newImg = file.data
        const encImg = newImg.toString('base64')

        const image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64')
        };

        serviceCollection.insertOne({ serviceName, serviceDescription, serviceCharge, image })
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })

    //get all service from database to show in ui by get request
    app.get("/services", (req, res) => {
        serviceCollection.find({}).sort({ $natural: -1 }).limit(3)
            .toArray((error, documents) => {
                res.send(documents)
            })
    })

    //chek loged in user is a admin or customer 
    app.post('/isAdmin', (req, res) => {
        const email = req.body.email
        adminCollection.find({ email: email })
            .toArray((error, documents) => {
                res.send(documents.length > 0)
            })
    })

    //send review data in database by post request
    app.post('/addReview', (req, res) => {
        const reviewData = req.body
        reviewCollection.insertOne(reviewData)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })

    //get review data from database by get request
    app.get('/reviews', (req, res) => {
        reviewCollection.find({}).sort({ $natural: -1 }).limit(3)
            .toArray((error, documents) => {
                res.send(documents)
            })
    })

    //delet service form database by delet request
    app.delete('/deletService/:id', (req, res) => {
        const id = ObjectID(req.params.id)
        serviceCollection.findOneAndDelete({ _id: id }).then((data) => {
            res.send({ success: !!data.value });
        });
    })

    //get specific  data from database
    app.get("/service/:id", (req, res) => {
        const id = ObjectID(req.params.id);
        serviceCollection.find({ _id: id }).toArray((err, documents) => {
            res.send(documents[0]);
        });
    });

    //booking a service 
    app.post('/bookingAservice', (req, res) => {
        const bookingDetails = req.body
        bookingCollection.insertOne(bookingDetails)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })

    // get booking data from database by get post request
    app.post('/customarBookingsList', (req, res) => {
        const email = req.body.email
        bookingCollection.find({ email: email })
            .toArray((err, bookings) => {
                res.send(bookings)
            })
    })

    // get all booking data from database by get post request
    app.get('/adminBookingsList', (req, res) => {
        bookingCollection.find({})
            .toArray((err, bookings) => {
                res.send(bookings)
            })
    })

    //update status by patch request
    app.patch('/updateBookingStatus', (req, res) => {
        bookingCollection.updateOne({ _id: ObjectID(req.body.id) }, {
            $set: { bookingStatus: req.body.updateStatus }
        })
            .then(result => {
                res.send(result.modifiedCount > 0)
            })
    })

});


app.listen(process.env.PORT || port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
