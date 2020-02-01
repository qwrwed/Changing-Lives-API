const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const tv = require('../tokenVerify');

//Postman can be used to test post request {"sectionId": 1} or {"user_id": 1}
router.post('/', (req, res) => {
    try {
        function verify() {
            return new Promise((resolve) => {
                resolve(tv.tokenVerify(req.header('Authorization')));
            });
        }
        verify().then((result) => {
            if (!result) {
                res.sendStatus(403);
                return;
            }
            const connection = mysql.createConnection({
                host: process.env.MYSQL_HOST,
                user: process.env.MYSQL_USER,
                password: process.env.MYSQL_PASSWORD,
                database: process.env.MYSQL_DATABASE
            });

            let sec_id = req.body.sectionId || '';
            let usr_id = req.body.userId || '';

            connection.connect((err) => {
                if (err) throw err;
            });

            if (sec_id !== '') {
                connection.query('DELETE FROM sections WHERE section_id = ?', [sec_id], (err) => {
                    if (err) throw res.sendStatus(400);
                });
                connection.query('DELETE FROM files WHERE section_id = ?', [sec_id], (err) => {
                    if (err) throw res.sendStatus(400);
                });

            } else if (usr_id !== '') {
                connection.query('DELETE FROM sections WHERE user_id = ?', [usr_id], (err) => {
                    if (err) throw res.sendStatus(400);
                });
                connection.query('DELETE FROM files WHERE user_id = ?', [usr_id], (err) => {
                    if (err) throw res.sendStatus(400);
                });
            }

            connection.end();

            res.sendStatus(200);
        });

    } catch (err) {
        res.sendStatus(500);
    }
});

module.exports = router;