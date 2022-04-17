const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const { ObjectId } = require('mongodb');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');

const configFile = fs.readFileSync(`${__dirname}/private/config.json`);
const config = JSON.parse(configFile);
const url = `mongodb://${config.mongo3}:${config.mongo4}`;

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./images");
    },
    filename: (req, file, cb) => {
        cb(null, "KuByX__" + Date.now() + "__" + file.originalname + ".png");
    }
});

const upload = multer({storage: fileStorage});

const app = express();
const port = 9129;

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(cors());

app.use('/css', express.static('public/css'));
app.use('/images', express.static('images'));

app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/public/index.html`);
});

app.post('/images/post', upload.single("image"), (req, res) => {
    MongoClient.connect(url, (err, db) => {
        if (err) throw err;

        var dbObj = db.db('image_uploaders');

        dbObj.collection('images').insertOne({name:req.file.filename}, (err, result) => {
            if (err) throw err;

            var data = {id: result.insertedId, name: req.file.filename}

            console.log(data);

            res.render(`${__dirname}/public/uploaded.html`, {shareUrl: `http://kubyx.nl/images/fetch/${result.insertedId}`});
            
            db.close();
        });
    });
});

app.get('/images/fetch/:imgID', (req, res) => {
    MongoClient.connect(url, (err, db) => {
        if (err) throw err;

        var dbObj = db.db('image_uploaders');
        dbObj.collection('images').findOne(ObjectId(req.params.imgID), (err, result) => {
            if (err) throw err;

            res.send("<img src='/images/" + result.name + "'>");
            db.close();
        });
    });
});

app.listen(port, () => {
    console.log(`Listening to ${port}`);
});