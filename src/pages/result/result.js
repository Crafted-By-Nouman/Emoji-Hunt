const resultText = localStorage.getItem("result");
document.getElementById("result").innerText = resultText;

document.getElementById("playAgain").addEventListener("click", () => {
  window.location.href = "../game/game.html";
});
