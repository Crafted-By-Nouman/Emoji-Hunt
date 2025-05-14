import { Game, setupGameLogic } from "../pages/game/game.js";
import { Home } from "../pages/home/home.js";

function initGame() {
  const body = document.body;
  const main = document.createElement("div");
  main.classList.add("main-wrapper");
  body.appendChild(main);

  const homePage = Home();
  main.appendChild(homePage);

  const startButton = homePage.querySelector("#startBtn");
  startButton.addEventListener("click", () => {
    main.classList.add("loading");

    main.innerHTML = "";

    const gameElement = Game();
    main.appendChild(gameElement);
    const gamePage = document.getElementById("game-page");
    gamePage.style.display = "flex";

    const gameLogic = setupGameLogic();

    document.addEventListener("gameResult", (e) => {
      const { success, level, timeTaken, stars } = e.detail;

      if (success) {
        alert(
          `Level ${level} completed in ${timeTaken} seconds! You earned ${stars} star${
            stars > 1 ? "s" : ""
          }!`
        );

        setTimeout(() => {
          gameLogic.startGame();
        }, 1500);
      } else {
        const playAgain = confirm(
          `Game Over! You reached level ${level}. Play again?`
        );
        if (playAgain) {
          gameLogic.resetGame();
          gameLogic.startGame();
        }
      }
    });

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
