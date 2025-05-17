import { Game, setupGameLogic } from "../pages/game/game.js";
import { Home } from "../pages/home/home.js";
import { Result } from "../pages/result/result.js";

function initGame() {
  const body = document.body;
  const main = document.createElement("div");
  main.classList.add("main-wrapper");
  main.id = "main";
  body.appendChild(main);

  let gameEventListener = null;
  let gameLogic = null;

  function cleanupGame() {
    if (gameEventListener) {
      document.removeEventListener("gameEvent", gameEventListener);
      gameEventListener = null;
    }
    if (gameLogic) {
      gameLogic = null;
    }
  }

  function initializeHome() {
    main.innerHTML = "";
    const homePage = Home();
    main.appendChild(homePage);

    const startButton = homePage.querySelector("#startBtn");
    if (startButton) {
      startButton.addEventListener("click", startGame, { once: true });
    }
  }

  function startGame() {
    cleanupGame();
    main.classList.add("loading");
    main.innerHTML = "";

    try {
      const gameElement = Game();
      main.appendChild(gameElement);

      gameLogic = setupGameLogic();

      gameEventListener = (e) => {
        const { type, level, score, difficulty } = e.detail;

        switch (type) {
          case "levelComplete":
            // Handle level completion if needed
            break;

          case "gameComplete":
            {
              const playAgain = confirm(
                `Congratulations! You completed all ${level} levels with a score of ${score} on ${difficulty} difficulty. Play again?`
              );
              cleanupGame();
              if (playAgain) {
                gameLogic.resetGame();
                gameLogic.startGame();
              } else {
                initializeHome();
              }
            }
            break;

          case "gameOver":
            cleanupGame();
            main.innerHTML = "";
            main.appendChild(
              Result(
                score,
                level,
                () => {
                  initializeHome();
                },
                () => {
                  main.innerHTML = "";
                  const gameElement = Game();
                  main.appendChild(gameElement);
                  gameLogic = setupGameLogic();
                  gameLogic.resetGame();
                  gameLogic.startGame();
                }
              )
            );
            break;
        }
      };

      document.addEventListener("gameEvent", gameEventListener);

      setTimeout(() => {
        main.classList.remove("loading");
        gameLogic.startGame();
      }, 500);
    } catch (error) {
      console.error("Game initialization failed:", error);
      main.classList.remove("loading");
      initializeHome();
    }
  }

  initializeHome();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGame);
} else {
  initGame();
}
