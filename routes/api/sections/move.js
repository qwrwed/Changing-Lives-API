const express = require('express');
const router = express.Router();
const utils = require('../../../utils');

//Postman can be used to test post request {"sectionId": 1, "moveUp": true}
router.post('/', (req, res) => {
    try {
        function verify() {
            return new Promise((resolve) => {
                resolve(utils.tokenVerify(req.header('Authorization')));
            });
        }
        verify().then((result) => {
            if (!result) {
                res.sendStatus(403);
                return;
            }
            const sectionId = req.body.sectionId;
            const moveUp = (req.body.moveUp == 'true');
            if (!isNaN(sectionId)) {
                if (moveUp) {
                    //get position of one above (lower position) and add 1
                    utils.mysql_query(res, 'SELECT position FROM sections WHERE section_id = ?', [sectionId], (results, res) => {
                        if (results[0]['position'] == 0) {
                            return res.sendStatus(200);
                        }
                        utils.mysql_query(res, 'UPDATE sections SET position = position + 1 WHERE position = ?', [results[0]['position']-1], (results, res) => {
                            const queryString = 'UPDATE sections SET position = position - 1 where section_id = ?';
                            utils.mysql_query(res, queryString, [sectionId], (results, res) => {res.sendStatus(200);});
                        });
                    });
                } else {
                    //get position of one above (lower position) and add 1
                    utils.mysql_query(res, 'SELECT position FROM sections WHERE section_id = ?', [sectionId], (results, res) => {
                        utils.mysql_query(res, 'SELECT MAX(position) FROM sections', [], (out, res) => {
                            if (results[0]['position'] == out[0]['MAX(position)']) {
                                return res.sendStatus(200);
                            }
                            utils.mysql_query(res, 'UPDATE sections SET position = position - 1 WHERE position = ?', [results[0]['position']+1], (results, res) => {
                                const queryString = 'UPDATE sections SET position = position + 1 where section_id = ?';
                                utils.mysql_query(res, queryString, [sectionId], (results, res) => {res.sendStatus(200);});
                            });
                        });
                    });
                }
            } else { //no section was provided so the request makes no sense
                return res.sendStatus(400);
            }
        });

    } catch (err) {
        res.sendStatus(500);
    }
});

module.exports = router;