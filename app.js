require('dotenv').config();
const express = require('express');
const {engine} = require('express-handlebars');
const fs = require('fs')
const Multer = require('multer');
const path = require('path');
const defaultPath = './public/uploads';
const cors = require('cors');
const routes = require('./routes')

const app = express()
app.use(cors());

const port = process.env.PORT || 3006
let db = require('./knexfile');
let environment = process.env.NODE_ENV;
global.knex = require('knex')(db[environment]);

let storage = Multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, defaultPath);
    },
    filename: function (req, file, callback) {
        callback(null, Date.now() + '-' + file.originalname);
    }
});

let upload = Multer({
    storage: storage,
    limits: 500 * 1024
});
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(upload.any());
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
    console.log(req.path, new Date());
    next();
})

app.use("/api", routes);

app.get('/redirect',async (req,res,next) => {
    if (req.query.reelID){
        await knex('reels').where('id',req.query.reelID).then(response => {
            if (response.length > 0){
                return res.render('redirect',{data : {...response[0],share_image : 'https://share.applykart.co/' + response[0].share_image}})
            }
        })
    }
})

app.get("/",(req,res) => {
    return res.send("server up")
})
app.listen(port, () => {
    console.log("Port is up on ", port)
})