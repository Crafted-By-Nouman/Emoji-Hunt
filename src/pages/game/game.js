// Import emoji data from external file
import { emojis } from "../../data/emojies.js";

// Game page component - creates the HTML structure for the game
export function Game() {
  // Create main container for the game
  const container = document.createElement("div");
  container.id = "game-page";
  container.classList.add("container", "page");

  // Add all the HTML elements for the game interface
  container.innerHTML = `
    <div class="game-header">
      <h2>Find The: <span id="target-emoji" class="target-emoji"></span></h2>
      <div class="game-info">
        <button id="pauseBtn" class="pause-btn">⏸ Pause</button>
        <button id="hintBtn" class="hint-btn">💡 Hint</button>
        <div class="level-info">Level: <span id="level-number">1</span></div>
        <div class="score-info">Score: <span id="score-value">0</span></div>
        <div id="crosses">
          <span id="cross1" class="cross">❌</span>
          <span id="cross2" class="cross">❌</span>
          <span id="cross3" class="cross">❌</span>
        </div>
      </div>
    </div>
    <div id="emoji-box" class="emoji-grid"></div>
    <div id="timer-container" class="timer-container">
      <div id="timer-bar" class="timer-bar"></div>
      <div id="timer" class="timer">Time: <span class="time-value">20</span>s</div>
    </div>
    <div id="hint-display" class="hint-display"></div>
    <div id="confetti-container" class="confetti-container"></div>
    <div id="particles-container" class="particles-container"></div> 
    <audio id="correct-sound" src="correct.mp3" preload="auto"></audio>
    <audio id="wrong-sound" src="wrong.mp3" preload="auto"></audio>
    <audio id="time-warning-sound" src="time-warning.mp3" preload="auto"></audio>
    <audio id="level-up-sound" src="level-up.mp3" preload="auto"></audio>
    <audio id="hint-sound" src="hint.mp3" preload="auto"></audio>
  `;

  return container;
}

// Main game logic setup
export function setupGameLogic() {
  // Get all the HTML elements we need to work with
  const gamePage = document.getElementById("game-page");
  const targetEmojiElement = document.getElementById("target-emoji");
  const emojiBox = document.getElementById("emoji-box");
  const timerElement = document.getElementById("timer");
  const timerBar = document.getElementById("timer-bar");
  const timeValueElement = timerElement
    ? timerElement.querySelector(".time-value")
    : null;
  const levelNumberElement = document.getElementById("level-number");
  const scoreValueElement = document.getElementById("score-value");
  const hintDisplay = document.getElementById("hint-display");
  const pauseBtn = document.getElementById("pauseBtn");
  const hintBtn = document.getElementById("hintBtn");

  // Get all the sound effects
  const correctSound = document.getElementById("correct-sound");
  const wrongSound = document.getElementById("wrong-sound");
  const timeWarningSound = document.getElementById("time-warning-sound");
  const levelUpSound = document.getElementById("level-up-sound");
  const hintSound = document.getElementById("hint-sound");

  // Check for critical elements
  if (
    !gamePage ||
    !targetEmojiElement ||
    !emojiBox ||
    !timerElement ||
    !timerBar ||
    !timeValueElement
  ) {
    console.error("Critical game elements not found");
    return {
      startGame: () => {},
      resetGame: () => {},
      cleanup: () => {},
    };
  }

  // Game variables to keep track of the game state
  let timer; // For the countdown timer
  let startTime; // When the level started
  let pausedTime; // When the game was paused
  let targetEmoji; // The emoji the player needs to find
  let level = 1; // Current level
  let score = 0; // Player's score
  let isPaused = false; // Is the game paused?
  let wrongAttempts = 0; // How many wrong guesses
  let hintUsed = false; // Did the player use a hint?
  let gameActive = false; // Is the game currently running?
  let difficulty = localStorage.getItem("level") || "Medium"; // Game difficulty
  let comboMultiplier = 1; // Combo bonus multiplier
  let comboTimeout; // Timer for combo bonus
  let lastCorrectTime = 0; // When the last correct answer was

  // Game settings - these numbers control how the game works
  const BASE_TIME_LIMIT = { Easy: 20, Medium: 14, Hard: 8 }; // Time per level
  const BASE_EMOJI_COUNT = 6; // Starting number of emojis
  const EMOJI_INCREMENT_PER_LEVEL = 2; // How many more emojis each level
  const HINT_PENALTY_SECONDS = 3; // Time lost when using hint
  const WRONG_ATTEMPT_PENALTY_SECONDS = 1; // Time lost for wrong guess
  const MAX_LEVEL = 50; // Maximum level
  const MAX_EMOJIS = 36; // Maximum emojis on screen
  const COMBO_TIME_WINDOW = 3000; // Time for combos (3 seconds)
  const COMBO_MAX_MULTIPLIER = 5; // Maximum combo bonus

  // Start a new game or level
  function startGame() {
    gameActive = true;
    resetCrosses();
    clearHint();
    startTimer();

    // Pick a new target emoji (different from last time)
    let previousTarget = targetEmoji;
    let availableEmojis = emojis.filter((emoji) => emoji !== previousTarget);
    if (availableEmojis.length === 0) availableEmojis = [...emojis];
    targetEmoji =
      availableEmojis[Math.floor(Math.random() * availableEmojis.length)];
    targetEmojiElement.textContent = targetEmoji;

    // Calculate how many emojis to show based on level
    const emojiCount = Math.min(
      BASE_EMOJI_COUNT + (level - 1) * EMOJI_INCREMENT_PER_LEVEL,
      MAX_EMOJIS
    );
    const gridSize = Math.ceil(Math.sqrt(emojiCount));
    emojiBox.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

    // Create the emojis to show - always include the target
    const emojiPool = [targetEmoji];
    const availableRandomEmojis = emojis.filter(
      (emoji) => emoji !== targetEmoji
    );
    const randomEmojisNeeded = Math.min(
      emojiCount - 1,
      availableRandomEmojis.length
    );
    const shuffledRandom = shuffleArray([...availableRandomEmojis]).slice(
      0,
      randomEmojisNeeded
    );
    emojiPool.push(...shuffledRandom);

    // If we still need more emojis, add random ones
    while (emojiPool.length < emojiCount) {
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      if (!emojiPool.includes(randomEmoji)) emojiPool.push(randomEmoji);
    }

    // Clear the emoji grid and add new emojis
    emojiBox.innerHTML = "";
    const shuffledEmojis = shuffleArray(emojiPool);

    // Create each emoji element
    shuffledEmojis.forEach((emoji, index) => {
      const emojiSpan = document.createElement("span");
      emojiSpan.textContent = emoji;
      emojiSpan.classList.add("emoji");
      emojiSpan.dataset.index = index + 1;
      emojiSpan.style.animationDelay = `${index * 0.05}s`;

      // What happens when you click an emoji
      emojiSpan.addEventListener("click", () => checkEmoji(emoji, emojiSpan));

      // Make emoji grow when hovered
      emojiSpan.addEventListener("mouseenter", () => {
        if (!isPaused && gameActive) emojiSpan.style.transform = "scale(1.1)";
      });
      emojiSpan.addEventListener("mouseleave", () => {
        emojiSpan.style.transform = "scale(1)";
      });

      emojiBox.appendChild(emojiSpan);
    });

    // Reset game state for new level
    wrongAttempts = 0;
    hintUsed = false;
    levelNumberElement.textContent = level;
    updateTimeLimit();
    timeValueElement.textContent = getTimeLimit();
    timerBar.style.width = "100%";
    timerBar.style.backgroundColor = "#4CAF50";
    if (gamePage) gamePage.focus();
  }

  // Calculate how much time the player has for this level
  function getTimeLimit() {
    let baseTime = BASE_TIME_LIMIT[difficulty] || BASE_TIME_LIMIT.Medium;
    return Math.max(5, baseTime - Math.floor(level / 5));
  }

  // Update the displayed time limit
  function updateTimeLimit() {
    if (timeValueElement) {
      timeValueElement.textContent = getTimeLimit();
    }
  }

  // Start the countdown timer
  function startTimer() {
    stopTimer(); // Clear any existing timer
    startTime = Date.now();
    timer = setInterval(updateTimer, 0);
  }

  // Update the timer display every 100ms
  function updateTimer() {
    if (
      isPaused ||
      !gameActive ||
      !timerElement ||
      !timerBar ||
      !timeValueElement
    )
      return;

    const elapsedTime = (Date.now() - startTime) / 1000;
    const remainingTime = getTimeLimit() - elapsedTime;
    const percentage = (remainingTime / getTimeLimit()) * 100;

    if (remainingTime <= 0) {
      // Time's up!
      stopTimer();
      gameActive = false;
      handleGameOver(false);
    } else {
      // Update the timer display
      timeValueElement.textContent = Math.max(0, Math.floor(remainingTime));
      timerBar.style.width = `${percentage}%`;

      // Change color when time is running low
      if (remainingTime <= 5) {
        timerBar.style.backgroundColor = "#f44336";
        timerElement.classList.add("time-warning");
        if (Math.floor(remainingTime) === 5) playSound(timeWarningSound);
      } else if (remainingTime <= getTimeLimit() / 2) {
        timerBar.style.backgroundColor = "#ff9800";
        timerElement.classList.remove("time-warning");
      } else {
        timerBar.style.backgroundColor = "#4CAF50";
        timerElement.classList.remove("time-warning");
      }
    }
  }

  // Stop the timer
  function stopTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  // Play a sound effect
  function playSound(audioElement, volume = 0.5) {
    if (!audioElement) {
      console.warn("Audio element not found");
      return;
    }
    try {
      audioElement.volume = volume;
      audioElement.currentTime = 0;
      audioElement
        .play()
        .catch((e) => console.warn("Audio play prevented:", e));
    } catch (e) {
      console.warn("Sound error:", e);
    }
  }

  // Check if the clicked emoji is the correct one
  function checkEmoji(selectedEmoji, emojiElement) {
    if (isPaused || !gameActive) return;

    if (selectedEmoji === targetEmoji) {
      // Correct answer!
      gameActive = false;
      playSound(correctSound);
      stopTimer();

      // Combo system - bonus for quick consecutive correct answers
      const currentTime = Date.now();
      if (currentTime - lastCorrectTime < COMBO_TIME_WINDOW) {
        comboMultiplier = Math.min(comboMultiplier + 1, COMBO_MAX_MULTIPLIER);
      } else {
        comboMultiplier = 1;
      }
      lastCorrectTime = currentTime;

      if (comboTimeout) clearTimeout(comboTimeout);
      comboTimeout = setTimeout(() => {
        comboMultiplier = 1;
      }, COMBO_TIME_WINDOW);

      // Visual effects for correct answer
      emojiElement.classList.add("correct");
      emojiElement.style.transform = "scale(1.2)";
      setTimeout(() => {
        emojiElement.style.transform = "scale(1)";
      }, 0);

      // Calculate score
      const timeLeft = getTimeLimit() - (Date.now() - startTime) / 1000;
      const timeBonus = Math.max(0, Math.floor(timeLeft * 10));
      const levelBonus = level * 5;
      const hintBonus = hintUsed ? 0 : 20;
      const wrongAttemptPenalty = wrongAttempts * 5;
      const comboBonus = (comboMultiplier - 1) * 15;
      const scoreGained =
        (50 +
          timeBonus +
          levelBonus +
          hintBonus -
          wrongAttemptPenalty +
          comboBonus) *
        comboMultiplier;

      score += Math.max(10, scoreGained);
      if (scoreValueElement) scoreValueElement.textContent = score;

      // Go to next level or end game if max level reached
      setTimeout(() => {
        if (level < MAX_LEVEL) {
          level++;
          handleLevelComplete(scoreGained);
        } else {
          handleGameComplete();
        }
      }, 0);
    } else {
      // Wrong answer
      playSound(wrongSound);
      wrongAttempts++;
      comboMultiplier = 1;

      // Visual feedback for wrong answer
      emojiElement.classList.add("wrong");
      emojiElement.style.transform = "scale(0.9)";
      setTimeout(() => {
        emojiElement.style.transform = "scale(1)";
        emojiElement.classList.remove("wrong");
      }, 0);

      // Update the X marks for wrong attempts
      const cross = document.getElementById(`cross${wrongAttempts}`);
      if (cross) {
        cross.style.opacity = "1";
        cross.style.transform = "scale(1.3)";
        setTimeout(() => {
          cross.style.transform = "scale(1)";
        }, 0);
      }

      // Penalize time for wrong answer
      startTime -= WRONG_ATTEMPT_PENALTY_SECONDS * 1000;

      // Game over after 3 wrong attempts
      if (wrongAttempts === 3) {
        gameActive = false;
        stopTimer();
        setTimeout(() => handleGameOver(false), 0);
      }
    }
  }

  // Show a hint to help the player
  function showHint() {
    if (hintUsed || !gameActive || !emojiBox) return;

    const targetElement = Array.from(emojiBox.children).find(
      (el) => el.textContent === targetEmoji
    );

    if (targetElement) {
      hintUsed = true;
      playSound(hintSound, 0.3);

      // Penalize time for using hint
      startTime -= HINT_PENALTY_SECONDS * 1000;

      // Flash the timer to show penalty
      if (timerElement) {
        timerElement.style.backgroundColor = "#ffeb3b";
        setTimeout(() => {
          timerElement.style.backgroundColor = "";
        }, 0);
      }

      // Calculate the position hint (row and column)
      const position = targetElement.dataset.index;
      const gridSize = emojiBox.style.gridTemplateColumns.split(" ").length;
      const row = Math.ceil(position / gridSize);
      const col = position % gridSize || gridSize;

      // Show the hint
      if (hintDisplay) hintDisplay.textContent = `Row ${row}, Column ${col}`;
      targetElement.classList.add("hint-highlight");

      setTimeout(() => {
        targetElement.classList.remove("hint-highlight");
      }, 2000);

      // Disable hint button after use
      if (hintBtn) {
        hintBtn.disabled = true;
        hintBtn.classList.add("used");
        hintBtn.textContent = "💡 Used";
      }
    }
  }

  // Clear the hint display
  function clearHint() {
    if (hintDisplay) hintDisplay.textContent = "";
    if (hintBtn) {
      hintBtn.disabled = false;
      hintBtn.classList.remove("used");
      hintBtn.textContent = "💡 Hint";
    }
  }

  // Pause or resume the game
  function togglePause() {
    if (!gameActive) return;

    if (isPaused) {
      // Resume game
      startTime = Date.now() - pausedTime;
      timer = setInterval(updateTimer, 0);
      if (pauseBtn) pauseBtn.textContent = "⏸ Pause";
      if (emojiBox) emojiBox.style.opacity = "1";
      if (hintBtn) hintBtn.disabled = hintUsed;
      if (gamePage) gamePage.focus();
    } else {
      // Pause game
      stopTimer();
      pausedTime = Date.now() - startTime;
      if (pauseBtn) pauseBtn.textContent = "▶️ Resume";
      if (emojiBox) emojiBox.style.opacity = "0.5";
      if (hintBtn) hintBtn.disabled = true;
    }
    isPaused = !isPaused;
  }

  // Handle level completion
  function handleLevelComplete(scoreGained) {
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const stars = calculateStars(timeTaken);

    const event = new CustomEvent("gameEvent", {
      detail: {
        type: "levelComplete",
        level: level - 1,
        timeTaken: timeTaken,
        stars: stars,
        score: score,
        scoreGained: scoreGained,
        combo: comboMultiplier,
        difficulty: difficulty,
      },
    });
    document.dispatchEvent(event);

    setTimeout(() => {
      startGame();
    }, 0);
  }

  // Handle game completion (when max level reached)
  function handleGameComplete() {
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const event = new CustomEvent("gameEvent", {
      detail: {
        type: "gameComplete",
        level: level,
        score: score,
        timeTaken: timeTaken,
        difficulty: difficulty,
        combo: comboMultiplier,
      },
    });
    document.dispatchEvent(event);
  }

  // Handle game over (failure)
  function handleGameOver() {
    const event = new CustomEvent("gameEvent", {
      detail: {
        type: "gameOver",
        level: level,
        score: score,
        difficulty: difficulty,
      },
    });
    document.dispatchEvent(event);
  }

  // Calculate stars based on performance (1-3 stars)
  function calculateStars(timeTaken) {
    const timeLimit = getTimeLimit();
    if (timeTaken <= timeLimit * 0.33) return 3;
    if (timeTaken <= timeLimit * 0.66) return 2;
    return 1;
  }

  // Shuffle an array (mix up the order)
  function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  // Reset the X marks for wrong attempts
  function resetCrosses() {
    for (let i = 1; i <= 3; i++) {
      const cross = document.getElementById(`cross${i}`);
      if (cross) {
        cross.style.opacity = "0.3";
        cross.style.transform = "scale(1)";
      }
    }
  }

  // Keyboard controls handler
  function keydownHandler(e) {
    if (!gameActive) return;

    if (e.code === "Space") {
      e.preventDefault();
      togglePause();
    } else if (e.code === "KeyH" && !isPaused) {
      e.preventDefault();
      showHint();
    }
  }

  // Set up button click events
  if (pauseBtn) pauseBtn.addEventListener("click", togglePause);
  if (hintBtn) hintBtn.addEventListener("click", showHint);
  if (gamePage) gamePage.addEventListener("keydown", keydownHandler);

  // Return functions that can be used from outside
  return {
    startGame,
    resetGame: () => {
      level = 1;
      score = 0;
      wrongAttempts = 0;
      gameActive = false;
      comboMultiplier = 1;
      stopTimer();
      if (comboTimeout) clearTimeout(comboTimeout);
      clearHint();
      resetCrosses();
      if (scoreValueElement) scoreValueElement.textContent = "0";
      if (levelNumberElement) levelNumberElement.textContent = "1";
    },
    cleanup: () => {
      stopTimer();
      if (comboTimeout) clearTimeout(comboTimeout);
      if (gamePage) gamePage.removeEventListener("keydown", keydownHandler);
      if (pauseBtn) pauseBtn.removeEventListener("click", togglePause);
      if (hintBtn) hintBtn.removeEventListener("click", showHint);
    },
  };
}
