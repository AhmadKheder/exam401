'use strict';

require('dotenv').config();
const express = require('express');
const pg = require('pg');
const cors = require('cors');
const methodOverride = require('method-override');
const superagent = require('superagent');

const server = express();
server.use(cors());
server.use(express.static('./public'));
server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(methodOverride('_method'));
server.set('view engine', 'ejs');
const client = new pg.Client(process.env.DATABASE_URL);

const PORT = process.env.PORT || 3040;

server.get('/homeJokes', homeJokes);
server.post('/addToJList', addToDB);
server.get('/favjokes', favjokes);
server.get('/rand', randjk);
server.put('/update/:id', updateitem);
server.delete('/delete/:id', deleteItem);
server.get('/', (req, res) => {
    let sql = `select * from list`;
    client.query(sql).then((result) => {
        res.render('index.ejs', { DBcontent: result.rows });

    })
});

function homeJokes(req, res) {
    let url = `https://official-joke-api.appspot.com/jokes/programming/ten`;

    superagent.get(url)
        .then(result => {
            let jokesArrObj = result.body.map((joke, index) => {
                let jkObj = new Joke(joke);
                jkObj.count = index + 1;
                return jkObj;
            });
            res.render('homejokes.ejs', { jokes: jokesArrObj });
            // console.log(jokesArrObj);
        })
}

function addToDB(req, res) {
    let { count, type, setup, punchline } = req.body;

    // let count = req.params.count;
    console.log(count, type, setup, punchline);
    let query = `insert into list (count, type, setup, punchline) values($1,$2,$3,$4); `;
    let values = [count, type, setup, punchline];

    client.query(query, values)
        .then(() => {
            res.redirect('/');
        })
}

function favjokes(req, res) {
    let sql = `select * from list;`;
    client.query(sql)
        .then(result => {
            res.render('favjokes.ejs', { DBjokes: result.rows })
        })
}

function randjk(req, res) {
    let url = `https://official-joke-api.appspot.com/jokes/programming/random`;

    superagent.get(url)
        .then(result => {
            console.log(result.body[0]);



            res.render('random.ejs', { joke: result.body[0] });
        })
}

function updateitem(req, res) {
    let id = req.params.id;
    let { count, type, setup, punchline } = req.body;

    let sql = `update list set count=$1, type=$2, setup=$3,punchline=$4 where id=$5;`;
    let values = [count, type, setup, punchline, id];
    client.query(sql, values)
        .then(() => {
            res.redirect('/favjokes');
        })
}

function deleteItem(req, res) {
    let id = req.params.id;
    let sql = `delete from list where id=$1;`;
    let value = [id];
    client.query(sql, value)
        .then(() => {
            res.redirect('/favjokes');
        })
}

function Joke(obj) {

    this.type = obj.type;
    this.setup = obj.setup;
    this.punchline = obj.punchline;
    Joke.all.push(this);
}
Joke.all = [];
client.connect()
    .then(() => {

        server.listen(PORT, () => {
            console.log(`Server started at port: ${PORT}`);

        })
    })