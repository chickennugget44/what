export default function login() {
  const LOGINS = "./logins.json"; // ✅ points to logins.json
  const LOGGED_IN_CONTENT = "tetris.html";

  const loginForm = document.getElementById("login-form");
  const formMessage = document.getElementById("form-message");
  const userMessage = document.getElementById("user-message");
  const app = document.querySelector(".app");
  const logoutBtn = document.getElementById("logout-btn");
  const loggedInContentHome = document.getElementById("logged-in-content-home");
  const linkBtn = document.getElementById("link-btn"); // new button

  const retrievedLogin = JSON.parse(sessionStorage.getItem("usernamePassword"));
  const retrievedContent = JSON.parse(sessionStorage.getItem("extraContent"));

  let storedLogin = [];
  let loggedInContent = [];

  // Load login credentials
  async function logins() {
    try {
      const response = await fetch(LOGINS);
      if (response.ok) {
        storedLogin = await response.json();
      } else {
        formMessage.textContent = "Failed to fetch login data.";
      }
    } catch (e) {
      console.error("Error fetching logins.json:", e);
    }
  }

  // Load extra content (home page HTML)
  async function extraContent() {
    try {
      const response = await fetch(LOGGED_IN_CONTENT);
      if (response.ok) {
        loggedInContent = await response.json();
      } else {
        formMessage.textContent = "Failed to fetch extra content.";
      }
    } catch (e) {
      console.error("Error fetching content:", e);
    }
  }

  logins();
  extraContent();

  // Handle login form submission
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();

      let userName = document.getElementById("username").value;
      let passWord = document.getElementById("password").value;

      const matchedLogin = storedLogin.find(
        (login) => login.username === userName && login.password === passWord
      );

      if (matchedLogin) {
        // 🔒 Check ban status
        if (matchedLogin.banStatus === "true") {
          formMessage.textContent = `⚠️ Your account has been banned. Reason: ${matchedLogin.banReason || "No reason provided."}`;
          formMessage.classList.add("ban-message"); // styled red warning
          loginForm.reset();
          return;
        } else {
          formMessage.classList.remove("ban-message");
        }

        // ✅ proceed with normal login
        userMessage.textContent = `User: ${matchedLogin.username}`;
        populateContent(loggedInContentHome, loggedInContent, 0);

        loginForm.classList.add("hidden");
        app.classList.remove("hidden");

        sessionStorage.setItem("usernamePassword", JSON.stringify(matchedLogin));
        sessionStorage.setItem("extraContent", JSON.stringify(loggedInContent));
        formMessage.textContent =
          "You will be logged out after you close the browser window";
      } else {
        formMessage.textContent = "Invalid username or password.";
        formMessage.classList.remove("ban-message");
      }

      loginForm.reset();
    });
  }

  // Restore session if already logged in
  if (retrievedLogin) {
    userMessage.textContent = `User: ${retrievedLogin.username}`;
    populateContent(loggedInContentHome, retrievedContent, 0);

    loginForm.classList.add("hidden");
    app.classList.remove("hidden");
  }

  // Handle logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.clear();
      app.classList.add("hidden");
      loginForm.classList.remove("hidden");
      formMessage.textContent = "You have been logged out.";
      formMessage.classList.remove("ban-message");
    });
  }

  // 🔒 Sleep detection: refresh if computer slept > 2 minutes
  let lastCheck = Date.now();
  const SLEEP_THRESHOLD = 2 * 60 * 1000; // 2 minutes in ms

  setInterval(() => {
    const now = Date.now();
    const diff = now - lastCheck;
    lastCheck = now;

    if (diff > SLEEP_THRESHOLD) {
      localStorage.setItem("inactivityLogout", "true");
      sessionStorage.clear();
      location.reload();
    }
  }, 30000);

  // Show inactivity message if flagged
  if (localStorage.getItem("inactivityLogout") === "true") {
    formMessage.textContent = "You have been logged out due to inactivity.";
    formMessage.classList.remove("ban-message");
    localStorage.removeItem("inactivityLogout");
  }
}

// Helper: inject inline HTML or load external file
function populateContent(targetElement, contentData, contentIndex) {
  if (!targetElement || !contentData[contentIndex]) return;
  const entry = contentData[contentIndex];

  if (entry.content) {
    targetElement.innerHTML = entry.content;
  } else if (entry.contentFile) {
    fetch(entry.contentFile)
      .then(response => response.text())
      .then(html => {
        targetElement.innerHTML = html;
      })
      .catch(err => {
        console.error("Error loading content file:", err);
        targetElement.innerHTML = "<p>Failed to load content.</p>";
      });
  }
}

// Initialize
login();
