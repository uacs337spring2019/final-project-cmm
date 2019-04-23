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
        console.log(request.query);
        if (request.query) {
            console.log("rendering HTML");
            response.sendFile(path.join(__dirname, "roulette_game.html"));
        }

        if (request.query.type === "getSpin") {
            console.log("GET : getSpin request received");
            response.send(currentSpinEnd.toString());
        }



    });

    app.post('/', jsonParser, function (request, response) {
        // POST request to service
        // requesting service is trying to POST a new
        // chat message to be stored in messages.txt

        console.log("POST received");
        console.log("type = " + request.body.type);
        console.log("userID = " + request.body.userID);
        if (request.body.type === "bets") {
            let newBalance = processBets(request.body.singleNumberBets, request.body.categoryBets, request.body.balance);
            response.send(JSON.stringify({
                type: "bet-response",
                userID: request.body.userID,
                balance: newBalance,
                spinVal: currentWinningVal
            }));
        }

    });

    let currentWinningVal;
    let currentSpinEnd;
    let gameInterval;

    createNextSpin();

    function gameTick() {
        let timeLeft = currentSpinEnd - new Date();
        console.log("  Time left " + timeLeft);
        if (timeLeft < 0) {
            // Current Spin has officially ended
            console.log("Spin timer ended");
            clearInterval(gameInterval);
            console.log("Waiting 10 seconds for local spin animation");
            setTimeout(createNextSpin, 10000);

        }
    }

    function createNextSpin() {
        currentWinningVal = getWinner();
        currentSpinEnd = new Date();
        currentSpinEnd.setSeconds(currentSpinEnd.getSeconds() + 15);
        console.log("New Spin starting, winning val = " + currentWinningVal);
        gameInterval = setInterval(gameTick, 1000);
    }

    function getWinner() {
        var random = Math.floor(Math.random() * 38) - 1;
        if (random == -1) {
            return "00";
        }
        return random.toString(10);
    }

    function processBets(activeSingleBets, activeCategoryBets, balance) {
        let name, amount;
        let initialBalance = balance;
        for (let i = 0; i < activeCategoryBets.length; i++) {
            name = activeCategoryBets[i].name;
            amount = activeCategoryBets[i].amount;
            switch (name) {
                case "1 to 18":
                    if (currentWinningVal > 0 && currentWinningVal < 19) {
                        balance += (amount * 2);
                    }
                    break;
                case "EVEN":
                    if (currentWinningVal % 2 === 0) {
                        balance += (amount * 2);
                    }
                    break;
                case "RED":
                    let redNums = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]
                    for (let j = 0; j < redNums.length; j++) {
                        if (redNums[j].toString() === currentWinningVal) {
                            console.log("RED");
                            balance += (amount * 2);
                        }
                    }
                    break;
                case "BLACK":
                    let blackNums = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];
                    for (let j = 0; j < blackNums.length; j++) {
                        if (blackNums[j].toString() === currentWinningVal) {
                            balance += (amount * 2);
                            console.log("BLACK");
                        }
                    }
                    break;
                case "ODD":
                    if (currentWinningVal % 2 === 1) {
                        balance += (amount * 2);
                    }
                    break;
                case "19 to 36":
                    if (currentWinningVal > 18 && currentWinningVal < 36) {
                        balance += (amount * 2);
                    }
                    break;
                case "2 to 1 row-1":
                    if (currentWinningVal > 0 && currentWinningVal % 3 === 0) {
                        balance += (amount * 3);
                    }
                    break;
                case "2 to 1 row-2":
                    if (currentWinningVal + 1 % 3 === 0) {
                        balance += (amount * 3);
                    }
                    break;
                case "2 to 1 row-3":
                    if (currentWinningVal + 2 % 3 === 0) {
                        balance += (amount * 3);
                    }
                    break;
                case "1st 12":
                    if (currentWinningVal > 0 && currentWinningVal < 13) {
                        balance += (amount * 3);
                    }
                    break;
                case "2nd 12":
                    if (currentWinningVal > 12 && currentWinningVal < 25) {
                        balance += (amount * 3);
                    }
                    break;
                case "3rd 12":
                    if (currentWinningVal > 24 && currentWinningVal < 37) {
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
            console.log(balance);
            return balance;
        }

    }
    app.listen(process.env.PORT);
})();