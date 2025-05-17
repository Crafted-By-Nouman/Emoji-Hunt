// Import emoji data from external file
import { emojis } from "../../data/emojies.js";
import { Home } from "../home/home.js";

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
        <button id="pauseBtn" class="pause-btn" aria-label="Pause game">⏸</button>
        <button id="hintBtn" class="hint-btn" aria-label="Get hint">💡</button>
        <div class="level-info">Level: <span id="level-number">1</span></div>
        <div class="score-info">Score: <span id="score-value">0</span></div>
        <div id="crosses">
          <span id="cross1" class="cross" aria-hidden="true">❌</span>
          <span id="cross2" class="cross" aria-hidden="true">❌</span>
          <span id="cross3" class="cross" aria-hidden="true">❌</span>
        </div>
      </div>
    </div>
    <div id="emoji-box" class="emoji-grid" role="grid"></div>
    <div id="timer-container" class="timer-container">
      <div id="timer-bar" class="timer-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100"></div>
      <div id="timer" class="timer">Time: <span class="time-value">20</span>s</div>
    </div>
    <div id="hint-display" class="hint-display" aria-live="polite"></div>
    <div id="confetti-container" class="confetti-container" aria-hidden="true"></div>
    <div id="particles-container" class="particles-container" aria-hidden="true"></div> 
    <audio id="correct-sound" src="correct.mp3" preload="auto"></audio>
    <audio id="wrong-sound" src="wrong.mp3" preload="auto"></audio>
    <audio id="time-warning-sound" src="time-warning.mp3" preload="auto"></audio>
    <audio id="level-up-sound" src="level-up.mp3" preload="auto"></audio>
    <audio id="hint-sound" src="hint.mp3" preload="auto"></audio>
  `;

  // Create and add the pause modal to the body
  const popup = document.createElement("div");
  popup.id = "pause-modal";
  popup.classList.add("popup-overlay");
  popup.style.display = "none";
  popup.innerHTML = `
    <div class="popup-modal" role="dialog" aria-labelledby="pause-modal-title">
      <span class="close-btn" aria-label="Close modal">&times;</span>
      <h2 id="pause-modal-title">Game Paused</h2>
      <div class="modal-buttons">
        <button id="resume-btn" class="action-btn" aria-label="Resume game">▶️ Resume</button>
        <button id="restart-btn" class="action-btn" aria-label="Restart game">🔄 Restart</button> 
        <button id="exit-btn" class="action-btn" aria-label="Exit game">🚪 Exit</button>
      </div>
    </div>
  `;
  document.body.appendChild(popup);

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
  const timeValueElement = timerElement?.querySelector(".time-value");
  const levelNumberElement = document.getElementById("level-number");
  const scoreValueElement = document.getElementById("score-value");
  const hintDisplay = document.getElementById("hint-display");
  const pauseBtn = document.getElementById("pauseBtn");
  const hintBtn = document.getElementById("hintBtn");
  const pauseModal = document.getElementById("pause-modal");
  const resumeBtn = document.getElementById("resume-btn");
  const restartBtn = document.getElementById("restart-btn");
  const exitBtn = document.getElementById("exit-btn");
  const closeBtn = pauseModal?.querySelector(".close-btn");

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
  let timer = null;
  let startTime = 0;
  let pausedTime = 0;
  let targetEmoji = "";
  let level = 1;
  let score = 0;
  let isPaused = false;
  let wrongAttempts = 0;
  let hintUsed = false;
  let gameActive = false;
  let difficulty = ["Easy", "Medium", "Hard"].includes(
    localStorage.getItem("level")
  )
    ? localStorage.getItem("level")
    : "Medium";
  let comboMultiplier = 1;
  let comboTimeout = null;
  let lastCorrectTime = 0;
  let lastUpdateTime = 0;
  let audioElementsInitialized = false;

  // Game settings
  const BASE_TIME_LIMIT = { Easy: 20, Medium: 15, Hard: 10 };
  const BASE_EMOJI_COUNT = 6;
  const EMOJI_INCREMENT_PER_LEVEL = 2;
  const HINT_PENALTY_SECONDS = 3;
  const WRONG_ATTEMPT_PENALTY_SECONDS = 1;
  const MAX_LEVEL = 50;
  const MAX_EMOJIS = 36;
  const COMBO_TIME_WINDOW = 3000;
  const COMBO_MAX_MULTIPLIER = 5;

  // Initialize audio elements
  function initAudioElements() {
    if (audioElementsInitialized) return;

    const audioElements = [
      correctSound,
      wrongSound,
      timeWarningSound,
      levelUpSound,
      hintSound,
    ];
    audioElements.forEach((audio) => {
      if (audio) {
        try {
          audio.load().catch((e) => console.warn("Audio preload failed:", e));
          audio.volume = 0.5;
        } catch (e) {
          console.warn("Audio initialization error:", e);
        }
      }
    });
    audioElementsInitialized = true;
  }

  // Start a new game or level
  function startGame() {
    initAudioElements();
    gameActive = true;
    clearHint();
    startTimer();

    // Pick a new target emoji
    let previousTarget = targetEmoji;
    let availableEmojis = emojis.filter((emoji) => emoji !== previousTarget);
    if (availableEmojis.length === 0) availableEmojis = [...emojis];
    targetEmoji =
      availableEmojis[Math.floor(Math.random() * availableEmojis.length)];
    targetEmojiElement.textContent = targetEmoji;

    // Calculate how many emojis to show
    const emojiCount = Math.min(
      BASE_EMOJI_COUNT + (level - 1) * EMOJI_INCREMENT_PER_LEVEL,
      MAX_EMOJIS
    );
    const gridSize = Math.ceil(Math.sqrt(emojiCount));
    emojiBox.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

    // Create the emojis to show
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

    // Add random emojis if needed (with safeguard against infinite loops)
    let attempts = 0;
    const maxAttempts = 100;
    while (emojiPool.length < emojiCount && attempts < maxAttempts) {
      attempts++;
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      if (!emojiPool.includes(randomEmoji)) {
        emojiPool.push(randomEmoji);
      }
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
      emojiSpan.setAttribute("role", "gridcell");
      emojiSpan.setAttribute("aria-label", `Emoji ${index + 1}`);

      emojiSpan.addEventListener("click", () => checkEmoji(emoji, emojiSpan));
      emojiSpan.addEventListener(
        "touchstart",
        () => checkEmoji(emoji, emojiSpan),
        { passive: true }
      );

      emojiSpan.addEventListener("mouseenter", () => {
        if (!isPaused && gameActive) emojiSpan.style.transform = "scale(1.1)";
      });
      emojiSpan.addEventListener("mouseleave", () => {
        emojiSpan.style.transform = "scale(1)";
      });

      emojiBox.appendChild(emojiSpan);
    });

    // Reset game state for new level
    hintUsed = false;
    levelNumberElement.textContent = level;
    updateTimeLimit();
    timeValueElement.textContent = getTimeLimit();
    timerBar.style.width = "100%";
    timerBar.setAttribute("aria-valuenow", "100");
    timerBar.style.backgroundColor = "#4CAF50";
    gamePage.focus();
  }

  // Calculate time limit with validation
  function getTimeLimit() {
    const baseTime = BASE_TIME_LIMIT[difficulty] || BASE_TIME_LIMIT.Medium;
    const calculatedTime = baseTime - Math.floor(level / 5);
    return Math.max(5, calculatedTime);
  }

  // Update the displayed time limit
  function updateTimeLimit() {
    const timeLimit = getTimeLimit();
    timeValueElement.textContent = timeLimit;
    timerBar.setAttribute("aria-valuemax", timeLimit.toString());
  }

  // Start the countdown timer
  function startTimer() {
    stopTimer();
    startTime = Date.now();
    lastUpdateTime = startTime;
    timer = requestAnimationFrame(updateTimer);
  }

  // Update the timer display
  function updateTimer(timestamp) {
    if (isPaused || !gameActive) return;

    const currentTime = Date.now();
    const elapsedTime = (currentTime - startTime) / 1000;
    const remainingTime = Math.max(0, getTimeLimit() - elapsedTime);
    const percentage = (remainingTime / getTimeLimit()) * 100;

    if (remainingTime <= 0) {
      stopTimer();
      gameActive = false;
      handleGameOver(false);
      return;
    }

    if (currentTime - lastUpdateTime >= 100) {
      const displayTime = Math.floor(remainingTime);
      timeValueElement.textContent = displayTime;
      timerBar.style.width = `${percentage}%`;
      timerBar.setAttribute("aria-valuenow", percentage.toFixed(0));

      if (remainingTime <= 5) {
        timerBar.style.backgroundColor = "#f44336";
        timerElement.classList.add("time-warning");
        if (displayTime === 5) playSound(timeWarningSound);
      } else if (remainingTime <= getTimeLimit() / 2) {
        timerBar.style.backgroundColor = "#ff9800";
        timerElement.classList.remove("time-warning");
      } else {
        timerBar.style.backgroundColor = "#4CAF50";
        timerElement.classList.remove("time-warning");
      }

      lastUpdateTime = currentTime;
    }

    timer = requestAnimationFrame(updateTimer);
  }

  // Stop the timer
  function stopTimer() {
    if (timer) {
      cancelAnimationFrame(timer);
      timer = null;
    }
  }

  // Play a sound effect with error handling
  function playSound(audioElement, volume = 0.5) {
    if (!audioElement) return;

    try {
      audioElement.volume = Math.min(1, Math.max(0, volume));
      audioElement.currentTime = 0;
      audioElement
        .play()
        .catch((e) => console.debug("Audio play prevented:", e));
    } catch (e) {
      console.debug("Sound error:", e);
    }
  }

  // Check if the clicked emoji is correct
  function checkEmoji(selectedEmoji, emojiElement) {
    if (isPaused || !gameActive) return;

    if (selectedEmoji === targetEmoji) {
      gameActive = false;
      playSound(correctSound);
      stopTimer();

      // Combo system
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

      // Visual feedback
      emojiElement.classList.add("correct");
      emojiElement.style.transform = "scale(1.2)";
      setTimeout(() => {
        emojiElement.style.transform = "scale(1)";
      }, 200);

      // Calculate score
      const timeLeft = getTimeLimit() - (Date.now() - startTime) / 1000;
      const timeBonus = Math.max(0, Math.floor(timeLeft * 10));
      const levelBonus = level * 5;
      const hintBonus = hintUsed ? 0 : 20;
      const wrongAttemptPenalty = wrongAttempts * 5;
      const comboBonus = (comboMultiplier - 1) * 15;
      const scoreGained = Math.max(
        10,
        (50 +
          timeBonus +
          levelBonus +
          hintBonus -
          wrongAttemptPenalty +
          comboBonus) *
          comboMultiplier
      );

      score += scoreGained;
      scoreValueElement.textContent = score;

      // Next level or game complete
      setTimeout(() => {
        if (level < MAX_LEVEL) {
          level++;
          handleLevelComplete(scoreGained);
        } else {
          handleGameComplete();
        }
      }, 1000);
    } else {
      // Wrong answer handling
      playSound(wrongSound);
      wrongAttempts++;
      comboMultiplier = 1;

      emojiElement.classList.add("wrong");
      emojiElement.style.transform = "scale(0.9)";
      setTimeout(() => {
        emojiElement.style.transform = "scale(1)";
        emojiElement.classList.remove("wrong");
      }, 200);

      // Update wrong attempt indicators
      for (let i = 1; i <= 3; i++) {
        const cross = document.getElementById(`cross${i}`);
        if (cross) {
          cross.style.opacity = i <= wrongAttempts ? "1" : "0.3";
          if (i === wrongAttempts) {
            cross.style.transform = "scale(1.3)";
            setTimeout(() => {
              cross.style.transform = "scale(1)";
            }, 200);
          }
        }
      }

      // Time penalty
      startTime -= WRONG_ATTEMPT_PENALTY_SECONDS * 1000;

      if (wrongAttempts >= 3) {
        gameActive = false;
        stopTimer();
        setTimeout(() => handleGameOver(false), 500);
      }
    }
  }

  // Show a hint
  function showHint() {
    if (hintUsed || !gameActive || !emojiBox) return;

    const targetElement = Array.from(emojiBox.children).find(
      (el) => el.textContent === targetEmoji
    );

    if (targetElement) {
      hintUsed = true;
      playSound(hintSound, 0.3);

      // Time penalty for hint
      startTime -= HINT_PENALTY_SECONDS * 1000;

      // Visual feedback
      timerElement.style.backgroundColor = "#ffeb3b";
      setTimeout(() => {
        timerElement.style.backgroundColor = "";
      }, 500);

      // Calculate position hint
      const position = targetElement.dataset.index;
      const gridSize = emojiBox.style.gridTemplateColumns.split(" ").length;
      const row = Math.ceil(position / gridSize);
      const col = position % gridSize || gridSize;

      hintDisplay.textContent = `Row ${row}, Column ${col}`;
      hintBtn.disabled = true;
      hintBtn.classList.add("used");
      hintBtn.textContent = "💡 Used";
    }
  }

  // Clear hint display
  function clearHint() {
    hintDisplay.textContent = "";
    hintBtn.disabled = false;
    hintBtn.classList.remove("used");
    hintBtn.textContent = "💡 Hint";
  }

  // Show pause modal
  function showPauseModal() {
    if (!pauseModal) return;

    pauseModal.style.display = "flex";
    document.body.style.overflow = "hidden";
    resumeBtn.focus();
  }

  // Hide pause modal
  function hidePauseModal() {
    if (!pauseModal) return;

    pauseModal.style.display = "none";
    document.body.style.overflow = "";
    pauseBtn.focus();
  }

  // Pause or resume game
  function togglePause() {
    if (!gameActive) return;

    if (isPaused) {
      // Resume game
      startTime = Date.now() - pausedTime;
      lastUpdateTime = Date.now();
      timer = requestAnimationFrame(updateTimer);
      pauseBtn.textContent = "⏸ Pause";
      emojiBox.style.opacity = "1";
      hintBtn.disabled = hintUsed;
      gamePage.focus();
      hidePauseModal();
    } else {
      // Pause game
      stopTimer();
      pausedTime = Date.now() - startTime;
      pauseBtn.textContent = "▶️ Resume";
      emojiBox.style.opacity = "0.5";
      hintBtn.disabled = true;
      showPauseModal();
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
    }, 300);
  }

  // Handle game completion
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

  // Handle game over
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

  // Calculate stars based on performance
  function calculateStars(timeTaken) {
    const timeLimit = getTimeLimit();
    if (timeTaken <= timeLimit * 0.33) return 3;
    if (timeTaken <= timeLimit * 0.66) return 2;
    return 1;
  }

  // Shuffle array
  function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  // Reset wrong attempt indicators
  function resetCrosses() {
    for (let i = 1; i <= 3; i++) {
      const cross = document.getElementById(`cross${i}`);
      if (cross) {
        cross.style.opacity = "0.3";
        cross.style.transform = "scale(1)";
      }
    }
  }

  // Reset game state
  function resetGame() {
    level = 1;
    score = 0;
    wrongAttempts = 0;
    gameActive = false;
    comboMultiplier = 1;
    stopTimer();
    if (comboTimeout) clearTimeout(comboTimeout);
    clearHint();
    resetCrosses();
    scoreValueElement.textContent = "0";
    levelNumberElement.textContent = "1";
    hidePauseModal();
  }

  // Keyboard controls
  function keydownHandler(e) {
    if (!gameActive) return;

    if (e.code === "Space") {
      e.preventDefault();
      togglePause();
    } else if (e.code === "KeyH" && !isPaused) {
      e.preventDefault();
      showHint();
    } else if (e.code === "Escape" && isPaused) {
      e.preventDefault();
      togglePause();
    }
  }

  // Event listeners
  function addEventListeners() {
    pauseBtn.addEventListener("click", togglePause);
    hintBtn.addEventListener("click", showHint);
    gamePage.addEventListener("keydown", keydownHandler);
    gamePage.addEventListener("touchstart", () => {}, { passive: true });

    if (resumeBtn) resumeBtn.addEventListener("click", togglePause);
    if (restartBtn)
      restartBtn.addEventListener("click", () => {
        resetGame();
        startGame();
        hidePauseModal();
        togglePause();
      });
    if (exitBtn)
      exitBtn.addEventListener("click", () => {
        hidePauseModal();
        handleGameOver();
      });
    if (closeBtn) closeBtn.addEventListener("click", togglePause);
  }

  // Remove event listeners
  function removeEventListeners() {
    pauseBtn.removeEventListener("click", togglePause);
    hintBtn.removeEventListener("click", showHint);
    gamePage.removeEventListener("keydown", keydownHandler);
    gamePage.removeEventListener("touchstart", () => {});

    if (resumeBtn) resumeBtn.removeEventListener("click", togglePause);
    if (restartBtn) restartBtn.removeEventListener("click", restartGame);
    if (exitBtn) exitBtn.removeEventListener("click", exitGame);
    if (closeBtn) closeBtn.removeEventListener("click", togglePause);
  }

  // Helper functions for event listeners
  function restartGame() {
    resetGame();
    startGame();
    hidePauseModal();
    togglePause();
  }

  function exitGame() {
    hidePauseModal();
    handleGameOver();
  }

  // Initialize
  addEventListeners();

  return {
    startGame,
    resetGame,
    cleanup: () => {
      removeEventListeners();
      stopTimer();
      if (comboTimeout) clearTimeout(comboTimeout);
      if (pauseModal && pauseModal.parentNode) {
        document.body.removeChild(pauseModal);
      }
    },
  };
}
