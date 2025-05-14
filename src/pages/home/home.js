export const Home = () => {
  const home = document.createElement("div");
  home.classList.add("container", "home");

  const header = document.createElement("div");
  header.classList.add("header");

  // High Score
  const highScore = document.createElement("div");
  highScore.classList.add("high-score");
  const savedScore = localStorage.getItem("highScore") || 0;
  highScore.textContent = `🏆 HS: ${savedScore}`;
  header.appendChild(highScore);

  // User Info
  const userInfo = document.createElement("div");
  userInfo.classList.add("user-info");
  const username = localStorage.getItem("username");
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

  if (!localStorage.getItem("username") || !localStorage.getItem("level")) {
    showUserPopup();
  }

  return home;
};

function showUserPopup() {
  const popup = document.createElement("div");
  popup.classList.add("popup-overlay");

  const modal = document.createElement("div");
  modal.classList.add("popup-modal");

  const closeBtn = document.createElement("span");
  closeBtn.classList.add("close-btn");
  closeBtn.textContent = "×";
  closeBtn.addEventListener("click", () => {
    document.body.removeChild(popup);
  });

  const title = document.createElement("h2");
  title.textContent = "Welcome Player!";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Enter your name";
  input.value = localStorage.getItem("username") || "";

  const select = document.createElement("select");
  ["Easy", "Medium", "Hard"].forEach((level) => {
    const option = document.createElement("option");
    option.value = level.toLowerCase();
    option.textContent = level;
    if (localStorage.getItem("level") === level.toLowerCase()) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Save";
  saveBtn.addEventListener("click", () => {
    const name = input.value.trim();
    const level = select.value;
    if (name) {
      localStorage.setItem("username", name);
      localStorage.setItem("level", level);
      document.querySelector(".user-info").textContent = `👤 ${name}`;
      document.body.removeChild(popup);
    } else {
      alert("Please enter a name.");
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
