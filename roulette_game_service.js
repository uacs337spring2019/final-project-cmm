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

    let currentWinningVal;
    let currentSpinEnd;
    let gameInterval;

    app.use(function (req, res, next) {
        // Processes CORS errors
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers",
            "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });
    
    app.get('/', function (request, response) {
        // GET request to service

        if(request.query.type){
            if (request.query.type === "getSpin") {
                console.log("GET : getSpin request received");
                response.send("" + (currentSpinEnd - new Date()));
            }
        }
        else{
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
        let numVal = Number(currentWinningVal);
        for (let i = 0; i < activeCategoryBets.length; i++) {
            name = activeCategoryBets[i].name;
            amount = activeCategoryBets[i].amount;
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
                        if (redNums[j].toString() === numVal) {
                            console.log("RED");
                            balance += (amount * 2);
                        }
                    }
                    break;
                case "BLACK":
                    let blackNums = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];
                    for (let j = 0; j < blackNums.length; j++) {
                        if (blackNums[j].toString() === numVal) {
                            balance += (amount * 2);
                            console.log("BLACK");
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
                    if (numVal > 0 && numVal % 3 === 0) {
                        balance += (amount * 3);
                    }
                    break;
                case "2 to 1 row-2":
                    if (numVal + 1 % 3 === 0) {
                        balance += (amount * 3);
                    }
                    break;
                case "2 to 1 row-3":
                    if (numVal + 2 % 3 === 0) {
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
            if (name === numVal) {
                balance += (amount * 36);
            }
            console.log(balance);
            return balance;
        }

    }
    app.listen(process.env.PORT);
})();