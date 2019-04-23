"use strict";

(function () {

    let activeSingleBets = [];
    let activeCategoryBets = [];
    let currentSpinExpiration;
    let balance = 5;
    let spinTimer;
    let username;

    window.onload = function () {
        // 1) Show login page
        
        // 2) Register all div clicks to record a bet
        let bettingDivs = document.getElementsByClassName("betting-square");
        for (let i = 0; i < bettingDivs.length; i++) {
            bettingDivs[i].onclick = recordBet;
        }
        // 3) Load current bet divs
        displayBets();
        // 4) Load first roulette spin by sending GET to service
        startSpin();
    }

    function startSpin(){
        // send a GET to service asking for current spin
        let url = "https://roulette-extravaganza.herokuapp.com/?";
        url += "type=getSpin";
        fetch(url)
            .then(checkStatus)
            .then(function(response){
                currentSpinExpiration = new Date(response);
                console.log(response);
                spinTimer = setInterval(spinTimerTick, 1000);
            });
    }

    /** Called when spin timer timeout happens**/
    function spinTimerTick() {
        let timeLeft = currentSpinExpiration - new Date();
        console.log(timeLeft);
        if (timeLeft < 0) {
            // Current Spin has officially ended taking in bets
            // 1) call stopTimer() to clear the Interval
            stopTimer();
            // 2) sendBets() will send a user's bets to server. 
            // server will respond with spin value
            sendBets();
            // 3) send a GET to get spin results from service
            setTimeout(startSpin, 12000);
        }
        updateTimer(timeLeft);
    }

    function stopTimer() {
        clearInterval(spinTimer);
    }

    function sendBets() {
        // Function will compile a json object to send to the server
        // Which contains username, balance, single number bets, category bets,
        let url = "https://roulette-extravaganza.herokuapp.com/?";
        let sendingJSON = {
            type: "bets",
            userID: username,
            balance: balance,
            singleNumberBets: activeSingleBets,
            categoryBets: activeCategoryBets
        };

        fetch(url, {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(sendingJSON),
            })
            .then(checkStatus)
            .then(function (response) {
                let receivingJSON = JSON.parse(response);
                console.log(receivingJSON.type);
                activeCategoryBets = [];
                activeSingleBets = [];
                displaySpinVal(receivingJSON.spinVal, (receivingJSON.balance - balance));
            });

    }

    /**checks if response status is passable value
      200-300 is acceptable, else it is not. return
      Promise.reject error**/
    function checkStatus(response) {
        if (response.status >= 200 && response.status < 300) {
            return response.text();
        } else {
            document.getElementById("message-input").value = "Error";
            return Promise.reject(new Error(response.status + ": " + response.statusText));
        }
    }

    function displaySpinVal(spinVal, balanceChange){
        let numDivs = document.getElementsByClassName("single-bet");
        
        let runs = 0;
        let interval = setInterval(function(){
            if(runs === 30){
                clearInterval(interval);
                for(let i = 0; i < numDivs.length; i++){
                    if(numDivs[i].children[0].innerHTML === spinVal){
                        numDivs[i].classList.add("highlighted");
                    }
                    setTimeout(function(){
                        numDivs[i].classList.remove("highlighted");
                    }, 6000);
                }
                displayBets(balanceChange);

            }
            else{
                runs++;
                let random = Math.floor(Math.random() * 37);
                numDivs[random].classList.add("highlighted");
                setTimeout(function(){
                    numDivs[random].classList.remove("highlighted");
                }, 200);
            }

        }, 200);
    }


    function updateTimer(timeLeft) {
        let spinDiv = document.getElementById("current-spin-div");
        let timerP = document.createElement("p");
        spinDiv.innerHTML = "";
        if(timeLeft < 0){
            timeLeft = 0;
        }
        if (Math.round(timeLeft / 1000) < 10) {
            timerP.innerHTML = "0:0" + Math.round(timeLeft / 1000);
        } else {
            timerP.innerHTML = "0:" + Math.round(timeLeft / 1000);
        }
        spinDiv.appendChild(timerP);

    }

    


    function recordBet() {
        if (balance <= 0) {
            return;
        }
        let text = this.children[0].innerHTML;
        if (text === "2 to 1") {
            text += " " + this.id;
        }
        let exists = false;
        if (this.classList.contains("category-bet")) {
            for (let i = 0; i < activeCategoryBets.length; i++) {
                if (activeCategoryBets[i].name === text) {
                    activeCategoryBets[i].amount++;
                    exists = true;
                }
            }
            if (!exists) {
                activeCategoryBets.push({
                    name: text,
                    amount: 1
                })
            }
        } else {
            for (let i = 0; i < activeSingleBets.length; i++) {
                if (activeSingleBets[i].name === text) {
                    activeSingleBets[i].amount++;
                    exists = true;
                }
            }
            if (!exists) {
                activeSingleBets.push({
                    name: text,
                    amount: 1
                })
            }
        }
        balance--;
        displayBets();
    }

    function displayBets(result) {
        let newDiv, newP, h3, h2;
        let activeSingleBetsDiv = document.getElementById("active-single-bets-div");
        let activeCategoryBetsDiv = document.getElementById("active-category-bets-div");
        let balanceDiv = document.getElementById("balance-div");

        if(result){
            balance += result;
        }
        balanceDiv.innerHTML = "";
        h2 = document.createElement("h2");
        h2.innerHTML = "$" + balance;
        balanceDiv.appendChild(h2);


        if (result != null) {
            let resultDiv = document.createElement("h4");
            if (result > 0) {
                resultDiv.innerHTML = "You have won!    " + result + "$";
            }
            else{
                resultDiv.innerHTML = "You did not win anything";
            }
            balanceDiv.appendChild(resultDiv);
        }

        activeSingleBetsDiv.innerHTML = "";
        h3 = document.createElement("h3");
        h3.innerHTML = "Single Number Bets";
        activeSingleBetsDiv.appendChild(h3);
        for (let i = 0; i < activeSingleBets.length; i++) {
            newDiv = document.createElement("div");
            newP = document.createElement("p");
            newP.innerHTML = "<strong>" + activeSingleBets[i].name + "</strong>  $" + activeSingleBets[i].amount;
            newDiv.appendChild(newP);
            activeSingleBetsDiv.appendChild(newDiv);
        }

        activeCategoryBetsDiv.innerHTML = "";
        h3 = document.createElement("h3");
        h3.innerHTML = "Category Bets";
        activeCategoryBetsDiv.appendChild(h3);
        for (let i = 0; i < activeCategoryBets.length; i++) {
            newDiv = document.createElement("div");
            newP = document.createElement("p");
            newP.innerHTML = "<strong>" + activeCategoryBets[i].name + "</strong>  $" + activeCategoryBets[i].amount;
            newDiv.appendChild(newP);
            activeCategoryBetsDiv.appendChild(newDiv);
        }
    }
})();