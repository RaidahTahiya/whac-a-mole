/*
Names: Raidah Tahiya
Date Created: March 6, 2026
Description: This file contains the JavaScript code for the Wack-a-mole game. It controls
             the game functionality such as, randomizing the location of moles and explosives to
             random hole indicies, changing levels after a time interval is up,updating the 
             scoreboard, displaying messages,and handling the help menu.
*/


// Represents a single active mole or bomb popping out of a hole
class Mole {
    constructor(popup, type, hole) {
        this.popup = popup; //The image element
        this.type = type; //Bomb or mole
        this.hole = hole; //Which hole it belongs to
        this.active = true;
    }
}

// Organizes the tracking of the entire game into one class
class Game {
    constructor() {
        this.score = 0;
        this.currentLevel = 1;
        this.gameOver = false;
        this.activeMoles = [];
        this.timerInterval = null;
        this.flashTimeout = null;
    }

    //Returns different speed settings depending on the level
    getLevelSettings() {
        if (this.currentLevel === 1) {
            return { minDelay: 800, maxDelay: 1500, duration: 1200 }; 
        } else if (this.currentLevel === 2) {
            return { minDelay: 500, maxDelay: 1000, duration: 900 };
        } else {
            return { minDelay: 300, maxDelay: 800, duration: 700 };
        }
    }

    //Adding active moles to an array
    addMole(mole) {
        this.activeMoles.push(mole);
    }

    //Filters out the mole currently active from list
    removeMole(popup) {
        let newList = [];
        for (let i = 0; i < this.activeMoles.length; i++) {
            if (this.activeMoles[i].popup !== popup) {
                newList.push(this.activeMoles[i]); //Adds inactive holes to new list 
            }
        }
        this.activeMoles = newList; //Updates list
    }

    //Finds which mole was clicked from the list and returns information on that
    findMole(popup) {
        for (let i = 0; i < this.activeMoles.length; i++) {
            if (this.activeMoles[i].popup === popup) {
                return this.activeMoles[i];
            }
        }
        return null; //popup not found
    }

    //Hides all moles/bombs when called
    hideAllMoles() {
        for (let i = 0; i < this.activeMoles.length; i++) { //Loops through popups
            this.activeMoles[i].popup.style.display = "none";
            this.activeMoles[i].hole.classList.remove("active");
        }
        this.activeMoles = [];
    }
}

window.addEventListener("load", function () {

    //Splash page canvas drawing for banner
    const c = document.getElementById("splash-canvas");
    const ctx = c.getContext("2d");

    const myImage = new Image();
    myImage.src = "images/mole.png";

    myImage.addEventListener("load", function () {
        // Sky background
        ctx.fillStyle = "#87CEEB";
        ctx.fillRect(0, 0, c.width, c.height);

        // Soil
        ctx.fillStyle = "#6aab5e";
        ctx.fillRect(0, 120, c.width, 70);

        // Grass top edge
        ctx.fillStyle = "#4a8c40";
        ctx.fillRect(0, 118, c.width, 8);

        // Three holes
        ctx.fillStyle = "#5c3d1e";
        ctx.beginPath();
        ctx.ellipse(60, 155, 35, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(160, 155, 35, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(260, 155, 35, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Mole/Bomb in hole
        ctx.drawImage(myImage, 110, 50, 100, 95);
    });

    //References to retrieve elements from DOM
    const start = document.getElementById("start-butn");
    const splashPage = document.getElementById("splash-page");
    const gameScreen = document.getElementById("game-screen");
    const helpBtn = document.getElementById("helpme");
    const helpText = document.getElementById("helpinfo");
    const gameOverModal = document.getElementById("game-over-modal");
    const finalScoreText = document.getElementById("final-score");
    const bestScoreText = document.getElementById("best-score");
    const playAgainBtn = document.getElementById("play-again");
    const levelModal = document.getElementById("level-modal");
    const levelTitle = document.getElementById("level-title");
    const levelDesc = document.getElementById("level-desc");
    const levelStartBtn = document.getElementById("level-start-btn");

    const holes = document.querySelectorAll(".hole");
    const popups = document.querySelectorAll(".popup");

    // Array of hole indices for random position picking
    let holeIndices = [];
    for (let i = 0; i < holes.length; i++) {
        holeIndices.push(i);
    }

    // Game instance
    let game = new Game();

    const scoreDisplay = document.querySelector("#score h1");
    const timeDisplay = document.querySelector("#time h1");
    const levelDisplay = document.querySelector("#level-info h1");

    // Displays help button on click
    helpBtn.addEventListener("click", function () {
        if (helpText.style.display === "block") {
            helpText.style.display = "none";
        } else {
            helpText.style.display = "block";
        }
    });

    document.addEventListener("click", function (e) {
        if (helpText.style.display === "block" && e.target !== helpBtn && !helpText.contains(e.target)) {
            helpText.style.display = "none";
        }
    });

    // Play again button
    playAgainBtn.addEventListener("click", function () {
        gameOverModal.style.display = "none";
        game = new Game();
        showLevelModal();
    });

    // Next level button
    levelStartBtn.addEventListener("click", function () {
        levelModal.style.display = "none";
        startLevel();
    });

    // Start button
    start.addEventListener("click", function () {
        splashPage.style.display = "none";
        gameScreen.style.display = "block";
        document.getElementById("header").style.display = "block";
        game = new Game();
        showLevelModal();
    });

    /**
    * Displays current level information based on level number. Changes level title
    * and description
    * 
    * @returns {void}
    */
    function showLevelModal() {
        let name = "";
        let desc = "";

        if (game.currentLevel === 1) {
            name = "Level 1";
            desc = "Easy";
        } else if (game.currentLevel === 2) {
            name = "Level 2";
            desc = "Medium";
        } else {
            name = "Level 3";
            desc = "Moles are fast. Good luck!";
        }

        levelTitle.textContent = name;
        levelDesc.textContent = desc;
        levelModal.style.display = "flex";
    }

    /**
    * Starts the current level
    * 
    * Reserts the baord, resets styling, hides initial popups, starts countdown,
    * starts popups, starts the time for the level to end
    * 
    * @returns {void}
    */
    function startLevel() {
        game.gameOver = false;
        game.activeMoles = [];

        scoreDisplay.textContent = "Points: " + game.score;
        scoreDisplay.style.color = "rgb(58, 92, 42)";
        timeDisplay.style.color = "rgb(58, 92, 42)";
        levelDisplay.textContent = "Level: " + game.currentLevel;

        for (let i = 0; i < popups.length; i++) {
            popups[i].style.display = "none";
        }
        for (let i = 0; i < holes.length; i++) {
            holes[i].classList.remove("active");
        }

        let timeLeft = 30;
        timeDisplay.textContent = "Time: 0:30";

        clearInterval(game.timerInterval);

        game.timerInterval = setInterval(function () {
            timeLeft = timeLeft - 1;
            let mins = Math.floor(timeLeft / 60);
            let secs = timeLeft % 60;
            timeDisplay.textContent = "Time: " + mins + ":" + (secs < 10 ? "0" : "") + secs;

            if (timeLeft <= 10) {
                timeDisplay.style.color = "#d63031";
            }

            if (timeLeft <= 0) {
                clearInterval(game.timerInterval);
            }
        }, 1000);

        showRandomPopup();

        setTimeout(function () {
            endLevel();
        }, 30000);
    }

    /**
    * Ends game
    * Clears timer, chnages game to the next level or ends game
    * 
    * @returns {void}
    */
    function endLevel() {
        game.gameOver = true;
        clearInterval(game.timerInterval);
        game.hideAllMoles();

        if (game.currentLevel < 3) {
            game.currentLevel = game.currentLevel + 1;
            showLevelModal();
        } else {
            showGameOver();
        }
    }

    /**
    * Displays game over screen
    * 
    * Updates best score in localStorage, saves current score, updates final scores
    * and displays game over text
    * 
    * @returns {void}
    */

    function showGameOver() {
        let prevBest = parseInt(localStorage.getItem("wackamole-best") || "0");
        let newBest = game.score;
        if (prevBest > newBest) {
            newBest = prevBest;
        }
        localStorage.setItem("wackamole-best", newBest);

        // Save score to history 
        let lastScore = localStorage.getItem("wackamole-last");
        if (lastScore !== null) {
            document.getElementById("last-score").textContent = "Last Score: " + lastScore;
        }
        localStorage.setItem("wackamole-last", game.score);


        finalScoreText.textContent = "Your Score: " + game.score;

        if (game.score > prevBest && game.score > 0) {
            bestScoreText.textContent = "New Best: " + newBest + "!";
            bestScoreText.className = "new-record";
        } else {
            bestScoreText.textContent = "Best Score: " + newBest;
            bestScoreText.className = "";
        }

        gameOverModal.style.display = "flex";
    }

    // Popup click handlers for all items in popups array
    for (let i = 0; i < popups.length; i++) {
        popups[i].addEventListener("click", function () {
            if (game.gameOver) {
                return;
            }

            let popup = this;
            let found = game.findMole(popup);

           if (found !== null && found.active) {
                found.active = false;
                game.removeMole(popup);

                if (found.type === "mole") {
                    game.score = game.score + 1;
                    flashScore("green");
                } else if (found.type === "bomb") {
                    game.score = game.score - 1;
                    flashScore("red");
                }

                scoreDisplay.textContent = "Points: " + game.score;
                found.hole.classList.remove("active");
                popup.style.display = "none";
            }
        });
    }

    /**
    * Flashes green or red if point is gained or lost
    *
    * @param {string} color - The flash color to use
    * @returns {void}
    */
    function flashScore(color) {
        clearTimeout(game.flashTimeout);
        if (color === "green") {
            scoreDisplay.style.color = "#00aa00";
        } else {
            scoreDisplay.style.color = "#d63031";
        }
        game.flashTimeout = setTimeout(function () {
            scoreDisplay.style.color = "rgb(58, 92, 42)";
        }, 800);
    }

    /**
    * Returns the random index of an inactive hole
    * @returns {number} The index of a random available hole, or -1 if all holes are active.
    */
    function getRandomHoleIndex() {
        let available = [];
        for (let i = 0; i < holeIndices.length; i++) {
            let idx = holeIndices[i];
            if (!holes[idx].classList.contains("active")) {
                available.push(idx);
            }
        }
        if (available.length === 0) {
            return -1;
        }
        return available[Math.floor(Math.random() * available.length)];
    }

    /** Shows a random popup in an available hole
     *
     * Chooses a random inactive hole, displays either a mole
     * or a bomb, adds it to the active moles list, hides it
     * after a random duration if it is not clicked, and
     * schedules the next popup to appear
     *
     * @returns {void}
     */
    function showRandomPopup() {
        if (game.gameOver) {
            return; //If game ends
        }

        let idx = getRandomHoleIndex();

        if (idx === -1) {
            setTimeout(showRandomPopup, 300);
            return;
        }

        let hole = holes[idx];
        let popup = hole.querySelector(".popup");
        let type = "";

        if (Math.random() < 0.25) {
            popup.src = "images/bomb.png";
            type = "bomb";
        } else {
            popup.src = "images/mole.png";
            type = "mole";
        }

        hole.classList.add("active");
        popup.style.display = "block";

        let mole = new Mole(popup, type, hole);
        game.addMole(mole);

        let settings = game.getLevelSettings(); //Retrives speed of current level
        let duration = Math.floor(Math.random() * (settings.duration - 400)) + 600;

        setTimeout(function () {
            if (game.gameOver) {
                return;
            }

            if (mole.active) {
                mole.active = false;
                game.removeMole(popup);
                hole.classList.remove("active");
                popup.style.display = "none";
            }
        }, duration);

        let delay = Math.floor(Math.random() * (settings.maxDelay - settings.minDelay)) + settings.minDelay;
        setTimeout(showRandomPopup, delay);
    }
});


