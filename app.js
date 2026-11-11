// SPL Auction Manager - starter login and auction selector.
// The browser uses only the Supabase publishable key. Never put a secret/service_role key here.
const SUPABASE_URL = "https://vwsodzsimnrvigrxeusr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_nV6AWGiuN2asXdZFjSIYBg_4BNp7DdD";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const loginForm = document.getElementById("login-form");
const message = document.getElementById("message");
const picker = document.getElementById("auction-picker");
const selectionMessage = document.getElementById("selection-message");
const loginButton = document.getElementById("login-button");

function showSignedIn() {
  loginForm.classList.add("hidden");
  picker.classList.remove("hidden");
  message.textContent = "";
}

async function checkAdmin() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) return;
  const { data, error } = await db.rpc("is_spl_admin");
  if (error || data !== true) {
    await db.auth.signOut();
    message.textContent = "This account is not authorized as an SPL administrator.";
    return;
  }
  showSignedIn();
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";
  loginButton.disabled = true;
  loginButton.textContent = "Signing in...";
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) {
    message.textContent = error.message;
  } else {
    await checkAdmin();
  }
  loginButton.disabled = false;
  loginButton.textContent = "Sign in";
});

document.querySelectorAll(".auction-choice").forEach((button) => {
  button.addEventListener("click", () => {
    const auction = button.dataset.auction;
    sessionStorage.setItem("spl_selected_auction", auction);
    selectionMessage.textContent =
      `${auction === "football" ? "Football" : "Cricket"} Auction selected. The auction dashboard will be added in the next version.`;
  });
});

document.getElementById("logout-button").addEventListener("click", async () => {
  await db.auth.signOut();
  picker.classList.add("hidden");
  loginForm.classList.remove("hidden");
  selectionMessage.textContent = "";
});

checkAdmin();
