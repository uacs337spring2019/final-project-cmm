/*
Programmer: Christopher Metz
Course: CSC 337
Assignment: Homework 8 - Chat-It
Description: node.js service for chatit.js
*/

"use strict";
(function () {
    /* global require */
    const express = require("express");
    const app = express();
    let fs = require('fs');
    let mysql = require('mysql');
    let con = mysql.createConnection({
        host: "us-cdbr-iron-east-02.cleardb.net",
        user: "b43dc6cf7d6820",
        password: "2414e5ae",
        database: "heroku_62979d63eba07b5"
    });

    const bodyParser = require('body-parser');
    const jsonParser = bodyParser.json();

    let currentWinningVal;
    let currentSpinEnd;
    let gameInterval;

    createDBTable();
    createNextSpin();

    app.use(function (req, res, next) {
        // Processes CORS errors
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers",
            "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    app.get('/', function (request, response) {
        // GET request to service

        if (request.query.type) {
            if (request.query.type === "getSpin") {
                console.log("GET : getSpin request received");
                response.send("" + (currentSpinEnd - new Date()));
            }
            else if(request.query.type === "getLeaderboard"){
                console.log("GET leaderboard request");
                getLeaderboard(response);
            }
        } else {
            console.log("rendering HTML");
            app.use(express.static("public"));
            response.sendFile("/app/public/roulette_game.html");

        }
    });

    app.post('/', jsonParser, function (request, response) {
        // POST request to service
        // requesting service is trying to POST a new
        // chat message to be stored in messages.txt

        console.log("POST received");
        if (request.body.type === "bets") {
            processBets(response, request.body.singleNumberBets, request.body.categoryBets, request.body.balance, request.body.userID);
        } else if (request.body.type === "login") {
            console.log("login received");
            userLogin(response, request.body.userID);
        }
        else if(request.body.type === "logout"){
            userLogout(response,request.body.userID);
        }

    });

    function getLeaderboard(response){
        var sql = "SELECT * FROM users WHERE loggedIn = 1";
        con.query(sql, function(err,rows,fields){
            if(err) throw err;
            let leaderBoard = [];
            for(let i = 0; i < rows.length; i++){
                if(i != rows.length - 1){
                    leaderBoard.push(rows[i].userID + ": $" + rows[i].balance + "~~~");
                }
                else{
                    leaderBoard.push(rows[i].userID + ": $" + rows[i].balance
                }
            }
            console.log(leaderBoard.toString());
            response.send(leaderBoard.toString());
        })
    }

    function userLogout(response,userID){
        let sql = "UPDATE users ";
        sql += "SET loggedIn = FALSE ";
        sql += "WHERE userID = '" + userID + "'";
        con.query(sql, function(err){
            if(err) throw err;
            console.log("logout from " + userID);
            response.send(JSON.stringify({
                type: "logout-response"
            }));
        });
    }

    function userLogin(response, userID) {
        let balance = -1;
        var sql = "SELECT * FROM users WHERE userID = '" + userID + "'";
        con.query(sql, function (err, rows, fields) {
            if (err) throw err;
            // if result is empty, userID does not exist in table
            if (!rows.length) {
                balance = createNewUser(response, userID);
            } else {
                console.log("username exists, check if logged in for user " + userID);
                                
                if (rows[0].loggedIn.toString() === '1') {
                    console.log("user is logged in");
                    balance = -1;
                } else {
                    balance = Number(rows[0].balance);
                }
                response.send(JSON.stringify({
                    type: "login-response",
                    userID: userID,
                    balance: balance
                }));
            }
        });
    }

    function createNewUser(response, userID){
        let balance = 0;
        let sql = "INSERT INTO users (userID, loggedIn) ";
        sql += "VALUES ('" + userID + "', TRUE)";
        con.query(sql, function(err,rows, fields){
            if(err) throw err;
            console.log("New user created for userID=" + userID);
            balance = 5;
            response.send(JSON.stringify({
                type: "login-response",
                userID: userID,
                balance: balance
            }));
        });
    }

    function createDBTable() {
        con.connect(function (err) {
            if (err) throw err;
            let sql = "DROP TABLE users";
            con.query(sql, function (err, result) {
                if (err) throw err;
                console.log("Table dropped");
            });
            sql = "CREATE TABLE users (";
            sql += "userID VARCHAR(255) NOT NULL,";
            sql += "balance INT DEFAULT 5,";
            sql += "loggedIn boolean DEFAULT false,"
            sql += "betTimeout INT DEFAULT 0,"
            sql += "PRIMARY KEY (userID))";
            con.query(sql, function (err, result) {
                if (err) throw err;
                console.log("Table created");
            })
        });
    }

    function gameTick() {
        let timeLeft = currentSpinEnd - new Date();
        if (timeLeft < 0) {
            // Current Spin has officially ended
            console.log("***Spin timer ended");
            clearInterval(gameInterval);
            console.log("Waiting 10 seconds for local spin animation");
            setTimeout(createNextSpin, 10000);

        }
    }


    function createNextSpin() {
        currentWinningVal = getWinner();
        currentSpinEnd = new Date();
        currentSpinEnd.setSeconds(currentSpinEnd.getSeconds() + 15);
        console.log("***New Spin starting, winning val = " + currentWinningVal);
        gameInterval = setInterval(gameTick, 1000);
    }

    function getWinner() {
        var random = Math.floor(Math.random() * 38) - 1;
        if (random == -1) {
            return "00";
        }
        return random.toString(10);
    }

    function processBets(response, activeSingleBets, activeCategoryBets, balance, userID) {
        let name, amount;
        let numVal = Number(currentWinningVal);
        for (let i = 0; i < activeCategoryBets.length; i++) {
            name = activeCategoryBets[i].name;
            amount = activeCategoryBets[i].amount;
            console.log(name);
            switch (name) {
                case "1 to 18":
                    if (numVal > 0 && numVal < 19) {
                        balance += (amount * 2);
                    }
                    break;
                case "EVEN":
                    if (numVal % 2 === 0) {
                        balance += (amount * 2);
                    }
                    break;
                case "RED":
                    let redNums = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]
                    for (let j = 0; j < redNums.length; j++) {
                        if (redNums[j].toString() === currentWinningVal) {
                            balance += (amount * 2);
                        }
                    }
                    break;
                case "BLACK":
                    let blackNums = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];
                    for (let j = 0; j < blackNums.length; j++) {
                        if (blackNums[j].toString() === currentWinningVal) {
                            balance += (amount * 2);
                        }
                    }
                    break;
                case "ODD":
                    if (numVal % 2 === 1) {
                        balance += (amount * 2);
                    }
                    break;
                case "19 to 36":
                    if (numVal > 18 && numVal < 36) {
                        balance += (amount * 2);
                    }
                    break;
                case "2 to 1 row-1":
                    if (numVal > 0 && (numVal % 3 === 0)) {
                        balance += (amount * 3);
                    }
                    break;
                case "2 to 1 row-2":
                    if ((numVal + 1) % 3 === 0) {
                        balance += (amount * 3);
                    }
                    break;
                case "2 to 1 row-3":
                    if ((numVal + 2) % 3 === 0) {
                        balance += (amount * 3);
                    }
                    break;
                case "1st 12":
                    if (numVal > 0 && numVal < 13) {
                        balance += (amount * 3);
                    }
                    break;
                case "2nd 12":
                    if (numVal > 12 && numVal < 25) {
                        balance += (amount * 3);
                    }
                    break;
                case "3rd 12":
                    if (numVal > 24 && numVal < 37) {
                        balance += (amount * 3);
                    }
                    break;
                default:
                    console.log("Unknown switch on category bets");
            }
        }
        for (let i = 0; i < activeSingleBets.length; i++) {
            name = activeSingleBets[i].name;
            amount = activeSingleBets[i].amount;
            if (name === currentWinningVal) {
                balance += (amount * 36);
            }
        }
        response.send(JSON.stringify({
            type: "bet-response",
            userID: userID,
            balance: balance,
            spinVal: currentWinningVal
        }));
        updateBalance(userID, balance);

    }

    function updateBalance(userID, balance){
        let sql = "UPDATE users ";
        sql += "SET balance = " + balance + " ";
        sql += "WHERE userID = '" + userID + "'";
        con.query(sql, function(err){
            if(err) throw err;
            console.log("Balance updated in DB");
        });
    }

    app.listen(process.env.PORT);
})();