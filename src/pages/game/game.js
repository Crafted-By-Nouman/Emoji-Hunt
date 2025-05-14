import { emojis } from "../../data/emojies.js";

export function Game() {
  const container = document.createElement("div");
  container.id = "game-page";
  container.classList.add("container", "page");
  container.style.display = "none";

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

export function setupGameLogic() {
  const gamePage = document.getElementById("game-page");
  const targetEmojiElement = document.getElementById("target-emoji");
  const emojiBox = document.getElementById("emoji-box");
  const timerElement = document.getElementById("timer");
  const timerBar = document.getElementById("timer-bar");
  const timeValueElement = timerElement.querySelector(".time-value");
  const levelNumberElement = document.getElementById("level-number");
  const scoreValueElement = document.getElementById("score-value");
  const hintDisplay = document.getElementById("hint-display");
  const pauseBtn = document.getElementById("pauseBtn");
  const hintBtn = document.getElementById("hintBtn");
  const confettiContainer = document.getElementById("confetti-container");
  const particlesContainer = document.getElementById("particles-container");
  const correctSound = document.getElementById("correct-sound");
  const wrongSound = document.getElementById("wrong-sound");
  const timeWarningSound = document.getElementById("time-warning-sound");
  const levelUpSound = document.getElementById("level-up-sound");
  const hintSound = document.getElementById("hint-sound");

  // Game state variables
  let timer;
  let startTime;
  let pausedTime;
  let targetEmoji;
  let level = 1;
  let score = 0;
  let isPaused = false;
  let wrongAttempts = 0;
  let hintUsed = false;
  let gameActive = false;
  let difficulty = localStorage.getItem("level") || "Medium";
  let comboMultiplier = 1;
  let comboTimeout;
  let lastCorrectTime = 0;

  // Game configuration constants
  const BASE_TIME_LIMIT = {
    Easy: 20,
    Medium: 14,
    Hard: 8,
  };
  const BASE_EMOJI_COUNT = 6; // Start with 6 emojis at level 1
  const EMOJI_INCREMENT_PER_LEVEL = 2; // Add 2 emojis each level
  const HINT_PENALTY_SECONDS = 3;
  const WRONG_ATTEMPT_PENALTY_SECONDS = 1;
  const MAX_LEVEL = 50;
  const MAX_EMOJIS = 36; // 6x6 grid max
  const COMBO_TIME_WINDOW = 3000; // 3 seconds for combo
  const COMBO_MAX_MULTIPLIER = 5;

  function startGame() {
    gameActive = true;
    resetCrosses();
    clearHint();
    startTimer();

    // Select target emoji that wasn't the previous target (if possible)
    let previousTarget = targetEmoji;
    let availableEmojis = emojis.filter((emoji) => emoji !== previousTarget);
    if (availableEmojis.length === 0) availableEmojis = [...emojis];
    targetEmoji =
      availableEmojis[Math.floor(Math.random() * availableEmojis.length)];
    targetEmojiElement.textContent = targetEmoji;

    // Calculate grid size based on emoji count
    const emojiCount = Math.min(
      BASE_EMOJI_COUNT + (level - 1) * EMOJI_INCREMENT_PER_LEVEL,
      MAX_EMOJIS
    );
    const gridSize = Math.ceil(Math.sqrt(emojiCount));
    emojiBox.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

    // Create emoji pool ensuring the target emoji is included
    const emojiPool = [targetEmoji];

    // Fill the rest with random unique emojis (excluding target)
    const availableRandomEmojis = emojis.filter(
      (emoji) => emoji !== targetEmoji
    );
    const randomEmojisNeeded = Math.min(
      emojiCount - 1,
      availableRandomEmojis.length
    );

    // Shuffle and take needed amount
    const shuffledRandom = shuffleArray([...availableRandomEmojis]).slice(
      0,
      randomEmojisNeeded
    );
    emojiPool.push(...shuffledRandom);

    // If we still don't have enough emojis (edge case with very small emoji set)
    while (emojiPool.length < emojiCount) {
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      if (!emojiPool.includes(randomEmoji)) {
        emojiPool.push(randomEmoji);
      }
    }

    emojiBox.innerHTML = "";
    const shuffledEmojis = shuffleArray(emojiPool);

    // Create emoji elements with smooth animations
    shuffledEmojis.forEach((emoji, index) => {
      const emojiSpan = document.createElement("span");
      emojiSpan.textContent = emoji;
      emojiSpan.classList.add("emoji");
      emojiSpan.dataset.index = index + 1;

      // Add animation delay for a cascading effect
      emojiSpan.style.animationDelay = `${index * 0.05}s`;

      emojiSpan.addEventListener("click", () => checkEmoji(emoji, emojiSpan));
      emojiSpan.addEventListener("mouseenter", () => {
        if (!isPaused && gameActive) {
          emojiSpan.style.transform = "scale(1.1)";
        }
      });
      emojiSpan.addEventListener("mouseleave", () => {
        emojiSpan.style.transform = "scale(1)";
      });
      emojiBox.appendChild(emojiSpan);
    });

    // Verify target emoji is in the grid (debug check)
    const targetInGrid = Array.from(emojiBox.children).some(
      (el) => el.textContent === targetEmoji
    );
    if (!targetInGrid) {
      console.error("Target emoji not found in grid! Regenerating...");
      setTimeout(startGame, 0);
      return;
    }

    // Reset game state
    wrongAttempts = 0;
    hintUsed = false;
    levelNumberElement.textContent = level;
    updateTimeLimit();
    timeValueElement.textContent = getTimeLimit();
    timerBar.style.width = "100%";
    timerBar.style.backgroundColor = "#4CAF50";

    // Focus the game container for keyboard events
    gamePage.focus();
  }

  function getTimeLimit() {
    // Get base time based on difficulty
    let baseTime = BASE_TIME_LIMIT[difficulty] || BASE_TIME_LIMIT.Medium;

    // Gradually decrease time as levels increase, but not below 5 seconds
    return Math.max(5, baseTime - Math.floor(level / 5));
  }

  function updateTimeLimit() {
    timeValueElement.textContent = getTimeLimit();
  }

  function startTimer() {
    if (timer) clearInterval(timer);
    startTime = Date.now();
    timer = setInterval(updateTimer, 100);
  }

  function updateTimer() {
    if (isPaused || !gameActive) return;

    const elapsedTime = (Date.now() - startTime) / 1000;
    const remainingTime = getTimeLimit() - elapsedTime;
    const percentage = (remainingTime / getTimeLimit()) * 100;

    if (remainingTime <= 0) {
      stopTimer();
      gameActive = false;
      showFailPage();
    } else {
      timeValueElement.textContent = Math.max(0, Math.floor(remainingTime));
      timerBar.style.width = `${percentage}%`;

      // Visual feedback for time running low
      if (remainingTime <= 5) {
        timerBar.style.backgroundColor = "#f44336";
        timerElement.classList.add("time-warning");
        if (Math.floor(remainingTime) === 5) {
          playSound(timeWarningSound);
        }
      } else if (remainingTime <= getTimeLimit() / 2) {
        timerBar.style.backgroundColor = "#ff9800";
        timerElement.classList.remove("time-warning");
      } else {
        timerBar.style.backgroundColor = "#4CAF50";
        timerElement.classList.remove("time-warning");
      }
    }
  }

  function stopTimer() {
    clearInterval(timer);
  }

  function playSound(audioElement, volume = 0.5) {
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

  function checkEmoji(selectedEmoji, emojiElement) {
    if (isPaused || !gameActive) return;

    if (selectedEmoji === targetEmoji) {
      gameActive = false;
      playSound(correctSound);
      stopTimer();

      // Check for combo
      const currentTime = Date.now();
      if (currentTime - lastCorrectTime < COMBO_TIME_WINDOW) {
        comboMultiplier = Math.min(comboMultiplier + 1, COMBO_MAX_MULTIPLIER);
      } else {
        comboMultiplier = 1;
      }
      lastCorrectTime = currentTime;

      // Clear any existing combo timeout
      if (comboTimeout) clearTimeout(comboTimeout);

      // Set timeout to reset combo
      comboTimeout = setTimeout(() => {
        comboMultiplier = 1;
      }, COMBO_TIME_WINDOW);

      // Visual feedback for correct answer
      emojiElement.classList.add("correct");
      emojiElement.style.transform = "scale(1.2)";
      createParticles(emojiElement.getBoundingClientRect());

      setTimeout(() => {
        emojiElement.style.transform = "scale(1)";
      }, 300);

      createConfetti();

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
      scoreValueElement.textContent = score;

      // Show level completion with slight delay
      setTimeout(() => {
        if (level < MAX_LEVEL) {
          level++;
          setTimeout(() => {
            showResult(scoreGained);
          }, 1500);
        } else {
          showGameComplete();
        }
      }, 1500);
    } else {
      // Wrong answer feedback
      playSound(wrongSound);
      wrongAttempts++;
      comboMultiplier = 1; // Reset combo on wrong answer

      // Visual feedback for wrong answer
      emojiElement.classList.add("wrong");
      emojiElement.style.transform = "scale(0.9)";
      setTimeout(() => {
        emojiElement.style.transform = "scale(1)";
        emojiElement.classList.remove("wrong");
      }, 300);

      // Update crosses
      const cross = document.getElementById(`cross${wrongAttempts}`);
      if (cross) {
        cross.style.opacity = "1";
        cross.style.transform = "scale(1.3)";
        setTimeout(() => {
          cross.style.transform = "scale(1)";
        }, 200);
      }

      // Time penalty for wrong attempts
      startTime -= WRONG_ATTEMPT_PENALTY_SECONDS * 1000;

      // Game over after 3 wrong attempts
      if (wrongAttempts === 3) {
        gameActive = false;
        stopTimer();
        setTimeout(showFailPage, 800);
      }
    }
  }

  function showHint() {
    if (hintUsed || !gameActive) return;

    const targetElement = Array.from(emojiBox.children).find(
      (el) => el.textContent === targetEmoji
    );

    if (targetElement) {
      hintUsed = true;
      playSound(hintSound, 0.3);

      // Apply hint penalty
      startTime -= HINT_PENALTY_SECONDS * 1000;

      // Flash the timer to indicate penalty
      timerElement.style.backgroundColor = "#ffeb3b";
      setTimeout(() => {
        timerElement.style.backgroundColor = "";
      }, 500);

      const position = targetElement.dataset.index;
      const gridSize = emojiBox.style.gridTemplateColumns.split(" ").length;
      const row = Math.ceil(position / gridSize);
      const col = position % gridSize || gridSize;

      hintDisplay.textContent = `Row ${row}, Column ${col}`;
      targetElement.classList.add("hint-highlight");

      setTimeout(() => {
        targetElement.classList.remove("hint-highlight");
      }, 2000);

      hintBtn.disabled = true;
      hintBtn.classList.add("used");
      hintBtn.textContent = "💡 Used";
    }
  }

  function clearHint() {
    hintDisplay.textContent = "";
    hintBtn.disabled = false;
    hintBtn.classList.remove("used");
    hintBtn.textContent = "💡 Hint";
  }

  function togglePause() {
    if (!gameActive) return;

    if (isPaused) {
      // Resume game
      startTime = Date.now() - pausedTime;
      timer = setInterval(updateTimer, 100);
      pauseBtn.textContent = "⏸ Pause";
      emojiBox.style.opacity = "1";
      hintBtn.disabled = hintUsed;
      gamePage.focus();
    } else {
      // Pause game
      clearInterval(timer);
      pausedTime = Date.now() - startTime;
      pauseBtn.textContent = "▶️ Resume";
      emojiBox.style.opacity = "0.5";
      hintBtn.disabled = true;
    }
    isPaused = !isPaused;
  }

  // Event listeners
  pauseBtn.addEventListener("click", togglePause);
  hintBtn.addEventListener("click", showHint);

  gamePage.addEventListener("keydown", (e) => {
    if (!gameActive) return;

    if (e.code === "Space") {
      e.preventDefault();
      togglePause();
    } else if (e.code === "KeyH" && !isPaused) {
      e.preventDefault();
      showHint();
    }
  });

  function showResult(scoreGained) {
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const event = new CustomEvent("gameResult", {
      detail: {
        success: true,
        level: level - 1,
        timeTaken: timeTaken,
        stars: calculateStars(timeTaken),
        score: score,
        scoreGained: scoreGained,
        combo: comboMultiplier,
        difficulty: difficulty,
      },
    });
    document.dispatchEvent(event);
  }

  function showGameComplete() {
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const event = new CustomEvent("gameComplete", {
      detail: {
        level: level,
        score: score,
        timeTaken: timeTaken,
        difficulty: difficulty,
        combo: comboMultiplier,
      },
    });
    document.dispatchEvent(event);
  }

  function calculateStars(timeTaken) {
    const timeLimit = getTimeLimit();
    if (timeTaken <= timeLimit * 0.33) return 3;
    if (timeTaken <= timeLimit * 0.66) return 2;
    return 1;
  }

  function showFailPage() {
    const event = new CustomEvent("gameResult", {
      detail: {
        success: false,
        level: level,
        score: score,
        difficulty: difficulty,
      },
    });
    document.dispatchEvent(event);
  }

  function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  function resetCrosses() {
    for (let i = 1; i <= 3; i++) {
      const cross = document.getElementById(`cross${i}`);
      if (cross) {
        cross.style.opacity = "0.3";
        cross.style.transform = "scale(1)";
      }
    }
  }

  function createConfetti() {
    confettiContainer.innerHTML = "";
    const colors = [
      "#ff0000",
      "#00ff00",
      "#0000ff",
      "#ffff00",
      "#ff00ff",
      "#00ffff",
    ];

    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement("div");
      confetti.className = "confetti";
      confetti.style.backgroundColor =
        colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.animationDelay = `${Math.random() * 0.5}s`;
      confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
      confettiContainer.appendChild(confetti);
    }

    setTimeout(() => {
      confettiContainer.innerHTML = "";
    }, 3000);
  }

  function createParticles(position) {
    particlesContainer.innerHTML = "";
    const particleCount = 30;
    const colors = [
      "#ff0000",
      "#ffff00",
      "#00ff00",
      "#00ffff",
      "#0000ff",
      "#ff00ff",
    ];

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";
      particle.style.backgroundColor =
        colors[Math.floor(Math.random() * colors.length)];
      particle.style.left = `${position.left + position.width / 2}px`;
      particle.style.top = `${position.top + position.height / 2}px`;

      // Random direction and animation
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 100;
      const duration = 0.5 + Math.random() * 0.5;

      particle.style.transform = `translate(${Math.cos(angle) * distance}px, ${
        Math.sin(angle) * distance
      }px)`;
      particle.style.opacity = "0";
      particle.style.transition = `all ${duration}s ease-out`;

      particlesContainer.appendChild(particle);

      // Trigger animation
      setTimeout(() => {
        particle.style.opacity = "1";
        particle.style.transform = `translate(${
          Math.cos(angle) * distance
        }px, ${Math.sin(angle) * distance}px) scale(0.5)`;
      }, 10);

      // Remove particle after animation
      setTimeout(() => {
        particle.remove();
      }, duration * 1000);
    }
  }

  return {
    startGame,
    getLevel: () => level,
    getScore: () => score,
    resetGame: () => {
      level = 1;
      score = 0;
      wrongAttempts = 0;
      gameActive = false;
      comboMultiplier = 1;
      clearInterval(timer);
      clearHint();
      resetCrosses();
      scoreValueElement.textContent = "0";
      levelNumberElement.textContent = "1";
    },
    cleanup: () => {
      clearInterval(timer);
      gamePage.removeEventListener("keydown");
      pauseBtn.removeEventListener("click");
      hintBtn.removeEventListener("click");
    },
  };
}
