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

    const bodyParser = require('body-parser');
    const jsonParser = bodyParser.json();

    app.use(function (req, res, next) {
        // Processes CORS errors
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers",
            "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    app.get('/', function (request, response) {
        // GET request to service
        // requesting service is trying to GET all
        // chat messages that are stored in messages.txt
        let fileText = getChatMessages();
        console.log("GET request received");
        response.send("GET response");
    });

    app.post('/', jsonParser, function (request, response) {
        // POST request to service
        // requesting service is trying to POST a new
        // chat message to be stored in messages.txt

        console.log("POST received");
        console.log("type = " + request.body.type);
        console.log("userID = " + request.body.userID);
        processBets
        response.send(JSON.stringify({
            type: "bet-response",
            userID: request.body.userID,
            balance: request.body.balance
        }));
    });

    let gameInterval = setInterval(gameTick, 1000);
    let currentSpinEnd = new Date();
    let currentWinningVal = getWinner();
    currentSpinEnd.setSeconds(currentSpinEnd.getSeconds() + 15);

    function gameTick(){
        let timeLeft = currentSpinEnd - new Date();
        console.log("Time left" + timeLeft);
        if (timeLeft < 0) {
            // Current Spin has officially ended
            console.log("Spin timer ended");
            clearInterval(currentSpinEnd);
            createNextSpin();

            currentSpinEnd = new Date();
            currentSpinEnd.setSeconds(currentSpinEnd.getSeconds() + 15);

        }
    }

    function createNextSpin(){

    }


    app.listen(3000);
})();