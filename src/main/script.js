import { Game, setupGameLogic } from "../pages/game/game.js";
import { Home } from "../pages/home/home.js";
import { Result } from "../pages/result/result.js";

function initGame() {
  const body = document.body;
  const main = document.createElement("div");
  main.classList.add("main-wrapper");
  main.id = "main";
  body.appendChild(main);

  const homePage = Home();
  main.appendChild(homePage);

  const startButton = homePage.querySelector("#startBtn");
  startButton.addEventListener("click", () => {
    main.classList.add("loading");
    main.innerHTML = "";

    const gameElement = Game();
    main.appendChild(gameElement);

    const gameLogic = setupGameLogic();

    let gameEventListener;
    document.addEventListener(
      "gameEvent",
      (gameEventListener = (e) => {
        const { type, level, score, difficulty } = e.detail;

        switch (type) {
          case "levelComplete":
            // Handle level completion if needed
            break;

          case "gameComplete":
            const playAgain = confirm(
              `Congratulations! You completed all ${level} levels with a score of ${score} on ${difficulty} difficulty. Play again?`
            );
            document.removeEventListener("gameEvent", gameEventListener);
            if (playAgain) {
              gameLogic.resetGame();
              gameLogic.startGame();
            } else {
              main.innerHTML = "";
              const home = Home();
              main.appendChild(home);
              const startBtn = home.querySelector("#startBtn");
              if (startBtn) {
                startBtn.addEventListener("click", () => {
                  main.innerHTML = "";
                  const gameElement = Game();
                  main.appendChild(gameElement);
                  const newLogic = setupGameLogic();
                  newLogic.startGame();
                });
              }
            }
            break;

          case "gameOver":
            document.removeEventListener("gameEvent", gameEventListener);
            main.innerHTML = "";
            main.appendChild(
              Result(
                score,
                level,
                () => {
                  main.innerHTML = "";
                  const home = Home();
                  main.appendChild(home);
                  const startBtn = home.querySelector("#startBtn");
                  if (startBtn) {
                    startBtn.addEventListener("click", () => {
                      main.innerHTML = "";
                      const gameElement = Game();
                      main.appendChild(gameElement);
                      const newLogic = setupGameLogic();
                      newLogic.resetGame();
                      newLogic.startGame();
                    });
                  }
                },
                () => {
                  main.innerHTML = "";
                  const gameElement = Game();
                  main.appendChild(gameElement);
                  const newLogic = setupGameLogic();
                  newLogic.resetGame();
                  newLogic.startGame();
                }
              )
            );
            break;
        }
      })
    );

    setTimeout(() => {
      main.classList.remove("loading");
      gameLogic.startGame();
    }, 500);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGame);
} else {
  initGame();
}
