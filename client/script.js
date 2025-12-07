const serverURL = "http://localhost:5000";

async function signup() {
  const fullname = document.getElementById("fullname").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch(`${serverURL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullname, email, password })
  });
  const msg = await res.text();
  alert(msg);
  if (res.ok) window.location.href = "login.html";
}

async function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const res = await fetch(`${serverURL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const msg = await res.text();
  alert(msg);
  if (res.ok) window.location.href = "index.html";
}

function logout() {
  alert("Logged out successfully!");
  window.location.href = "login.html";
}
