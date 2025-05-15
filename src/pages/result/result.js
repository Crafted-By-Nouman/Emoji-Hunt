import { highScoreQuotes, retryQuotes } from "../../data/quotes.js";

export const Result = (score, level, homeBtnClick, restartBtnClick) => {
  // Validate and convert parameters
  score = Number(score) || 0;
  level = Number(level) || 1;

  const user = localStorage.getItem("username") || "Guest";
  const difficulty = localStorage.getItem("level") || "Medium";
  const highScore = parseInt(localStorage.getItem("highScore") || "0");
  const isNewHighScore = score > highScore;
  const getRandomQuote = (quotes) => {
    const index = Math.floor(Math.random() * quotes.length);
    return quotes[index];
  };

  if (isNewHighScore) {
    localStorage.setItem("highScore", score);
  }

  const result = document.createElement("div");
  result.classList.add("container", "result");

  // Header section matching home page
  const header = document.createElement("div");
  header.classList.add("header");

  const highScoreDisplay = document.createElement("div");
  highScoreDisplay.classList.add("high-score");
  highScoreDisplay.textContent = `🏆 HS: ${Math.max(score, highScore)}`;
  header.appendChild(highScoreDisplay);

  const userInfo = document.createElement("div");
  userInfo.classList.add("user-info");
  userInfo.textContent = `👤 ${user}`;
  header.appendChild(userInfo);

  result.appendChild(header);

  // Main result card
  const resultCard = document.createElement("div");
  resultCard.classList.add("result-card");
  if (isNewHighScore) resultCard.classList.add("new-high-score");

  // Header with animation
  const cardHeader = document.createElement("div");
  cardHeader.classList.add("result-header");

  const title = document.createElement("h2");
  title.textContent = isNewHighScore ? "New High Score! 🎉" : "Game Over!";
  title.classList.add("result-title");

  const subTitle = document.createElement("h3");
  subTitle.textContent = isNewHighScore
    ? getRandomQuote(highScoreQuotes)
    : getRandomQuote(retryQuotes);
  subTitle.classList.add("result-subtitle");

  cardHeader.appendChild(title);
  cardHeader.appendChild(subTitle);
  resultCard.appendChild(cardHeader);

  // Score display with visual feedback
  const scoreDisplay = document.createElement("div");
  scoreDisplay.classList.add("score-display");

  const scoreValue = document.createElement("div");
  scoreValue.textContent = score;
  scoreValue.classList.add("score-value");
  if (isNewHighScore) scoreValue.classList.add("highlight");

  scoreDisplay.appendChild(scoreValue);
  resultCard.appendChild(scoreDisplay);

  // Stats container
  const statsContainer = document.createElement("div");
  statsContainer.classList.add("stats-container");

  const difficultyInfo = createStatItem(
    "🎯 Difficulty",
    difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
  );
  const levelInfo = createStatItem("📊 Level", level);

  statsContainer.appendChild(difficultyInfo);
  statsContainer.appendChild(levelInfo);
  resultCard.appendChild(statsContainer);

  // Buttons container
  const buttonsContainer = document.createElement("div");
  buttonsContainer.classList.add("buttons-container");

  const restartBtn = document.createElement("button");
  restartBtn.textContent = "Play Again";
  restartBtn.classList.add("action-btn", "restart-btn");
  restartBtn.addEventListener("click", restartBtnClick);

  const homeBtn = document.createElement("button");
  homeBtn.textContent = "Home";
  homeBtn.classList.add("action-btn", "home-btn");
  homeBtn.addEventListener("click", homeBtnClick);

  buttonsContainer.appendChild(restartBtn);
  buttonsContainer.appendChild(homeBtn);
  resultCard.appendChild(buttonsContainer);

  result.appendChild(resultCard);
  return result;
};

// Helper function to create stat items
const createStatItem = (label, value, extraClass = "") => {
  const item = document.createElement("div");
  item.classList.add("stat-item");
  if (extraClass.trim() !== "") {
    item.classList.add(extraClass);
  }

  const labelEl = document.createElement("span");
  labelEl.textContent = label;
  labelEl.classList.add("stat-label");

  const valueEl = document.createElement("span");
  valueEl.textContent = value;
  valueEl.classList.add("stat-value");

  item.appendChild(labelEl);
  item.appendChild(valueEl);
  return item;
};
