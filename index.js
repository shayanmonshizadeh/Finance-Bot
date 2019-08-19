const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config({ path: 'variables.env' });
const app = express();
const mysql = require('mysql');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const db = mysql.createConnection ({
    host: 'us-cdbr-iron-east-02.cleardb.net',
    user: 'b0e0fc8c37bf37',
    password: 'dc55c2c4',
    database: 'heroku_c3e0e807ac4e90f'
});

db.connect((err) => {
    if (err) {
        console.log(err);
    } else {
    console.log('Connected to database');
    }
});
global.db = db;
var rows;


console.log(rows);
app.listen(3000, () => console.log('Webhook server is listening, port 3000'));

const verificationController = require('./controllers/verification');
const messageWebhookController = require('./controllers/messageWebhook');
app.get('/', verificationController);
app.post('/', messageWebhookController);
















/* const mysql = require('mysql');
const mysqlx = require('@mysql/xdevapi');

const config = {
    password: 'supernova7',
    user: 'fb',
    host: 'localhost'
};

mysqlx
    .getSession(config)
    .then(session => {
        console.log(session.inspect());
        // { user: 'root', host: 'localhost', port: 33060 }
        return session.sql('use financebot')
            .execute()
            .then(() => {
                return session.sql('INSERT INTO expenses VALUES (NULL, "12-08-19 16:43:13", "food", 12.2, "LAK", 1)')
                    .execute(row => {
                        console.log("tf")
                        console.log(row)
                    });
    })
    
    })
    .catch(err => {
        console.log(err);
    });
    */