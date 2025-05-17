export const Home = () => {
  const home = document.createElement("div");
  home.classList.add("container", "home");

  const header = document.createElement("div");
  header.classList.add("header");

  const highScore = document.createElement("div");
  highScore.classList.add("high-score");
  const savedScore = (() => {
    try {
      const score = localStorage.getItem("highScore");
      return score !== null ? score : "N/A";
    } catch (e) {
      console.error("Failed to access high score:", e);
      return "N/A";
    }
  })();
  highScore.textContent = `🏆 HS: ${savedScore}`;
  header.appendChild(highScore);

  const userInfo = document.createElement("div");
  userInfo.classList.add("user-info");
  const username = (() => {
    try {
      return localStorage.getItem("username");
    } catch (e) {
      console.error("Failed to access username:", e);
      return null;
    }
  })();
  userInfo.textContent = username ? `👤 ${username}` : "👤 Set Username";
  userInfo.addEventListener("click", () => showUserPopup());
  header.appendChild(userInfo);

  const heading = document.createElement("h1");
  heading.innerHTML = `<span style="color:#ffcc00;">Emoji Hunt</span><br><small style="font-weight:normal;color:#666;">The Ultimate Memory Rush!</small>`;

  const button = document.createElement("button");
  button.id = "startBtn";
  button.textContent = "Start Game";
  button.addEventListener("click", () => {
    console.log("Clicked");
  });

  home.appendChild(header);
  home.appendChild(heading);
  home.appendChild(button);

  const hasUserData = (() => {
    try {
      return localStorage.getItem("username") && localStorage.getItem("level");
    } catch (e) {
      console.error("Failed to check user data:", e);
      return false;
    }
  })();

  if (!hasUserData) {
    setTimeout(() => {
      if (!document.querySelector(".popup-overlay")) {
        showWelcomePopup();
      }
    }, 500);
  }

  return home;
};

function showWelcomePopup() {
  const existingPopup = document.querySelector(".popup-overlay");
  if (existingPopup) {
    document.body.removeChild(existingPopup);
  }

  const popup = document.createElement("div");
  popup.classList.add("popup-overlay");
  popup.addEventListener("click", (e) => {
    if (e.target === popup) {
      document.body.removeChild(popup);
    }
  });

  const modal = document.createElement("div");
  modal.classList.add("popup-modal");

  const closeBtn = document.createElement("span");
  closeBtn.classList.add("close-btn");
  closeBtn.textContent = "×";
  closeBtn.addEventListener("click", () => {
    document.body.removeChild(popup);
  });

  const title = document.createElement("h2");
  title.textContent = "Welcome to Emoji Hunt!";

  const info = document.createElement("p");
  info.textContent =
    "Match emojis, test your memory, and climb the leaderboard! Let's start by setting your name and difficulty level.";

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.addEventListener("click", () => {
    document.body.removeChild(popup);
    showUserPopup();
  });

  modal.appendChild(closeBtn);
  modal.appendChild(title);
  modal.appendChild(info);
  modal.appendChild(nextBtn);
  popup.appendChild(modal);
  document.body.appendChild(popup);
}

function showUserPopup() {
  const existingPopup = document.querySelector(".popup-overlay");
  if (existingPopup) {
    document.body.removeChild(existingPopup);
  }

  const popup = document.createElement("div");
  popup.classList.add("popup-overlay");
  popup.addEventListener("click", (e) => {
    if (e.target === popup) {
      document.body.removeChild(popup);
    }
  });

  const modal = document.createElement("div");
  modal.classList.add("popup-modal");

  const closeBtn = document.createElement("span");
  closeBtn.classList.add("close-btn");
  closeBtn.textContent = "×";
  closeBtn.addEventListener("click", () => {
    document.body.removeChild(popup);
  });

  const title = document.createElement("h2");
  title.textContent = "Set Your Info";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Enter your name (3-12 chars)";
  input.value = (() => {
    try {
      return localStorage.getItem("username") || "";
    } catch (e) {
      console.error("Failed to access username:", e);
      return "";
    }
  })();

  const select = document.createElement("select");
  ["Easy", "Medium", "Hard"].forEach((level) => {
    const option = document.createElement("option");
    option.value = level.toLowerCase();
    option.textContent = level;
    try {
      if (localStorage.getItem("level") === level.toLowerCase()) {
        option.selected = true;
      }
    } catch (e) {
      console.error("Failed to access level:", e);
    }
    select.appendChild(option);
  });

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Save";
  saveBtn.addEventListener("click", () => {
    const name = input.value.trim();
    const level = select.value;
    if (name && name.length >= 3 && name.length <= 12) {
      try {
        localStorage.setItem("username", name);
        localStorage.setItem("level", level);
        const userInfoElement = document.querySelector(".user-info");
        if (userInfoElement) {
          userInfoElement.textContent = `👤 ${name}`;
        }
        document.body.removeChild(popup);
      } catch (e) {
        console.error("Failed to save settings:", e);
        alert("Failed to save settings. Please try again.");
      }
    } else {
      alert("Please enter a valid name (3-12 characters).");
    }
  });

  modal.appendChild(closeBtn);
  modal.appendChild(title);
  modal.appendChild(input);
  modal.appendChild(select);
  modal.appendChild(saveBtn);

  popup.appendChild(modal);
  document.body.appendChild(popup);
}
