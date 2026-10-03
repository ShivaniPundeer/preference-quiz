let db = null;
let allResponses = [];

const $ = (id) => document.getElementById(id);

function setupDb() {
  const cfg = window.APP_CONFIG;
  if (!cfg || cfg.SUPABASE_URL.includes("PASTE_") || cfg.SUPABASE_ANON_KEY.includes("PASTE_")) return null;
  return window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium", timeStyle: "short"
  }).format(new Date(date));
}

async function loadResponses() {
  $("responseList").innerHTML = `<div class="loading">Loading responses…</div>`;
  const { data, error } = await db.from("responses")
    .select("id,name,answers,submitted_at")
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error(error);
    $("responseList").innerHTML = `<div class="empty">Could not load responses. Check your RLS/admin setup.</div>`;
    return;
  }
  allResponses = data || [];
  renderResponses();
}

function renderResponses() {
  const query = $("search").value.trim().toLowerCase();
  const filtered = allResponses.filter(r => r.name.toLowerCase().includes(query));
  $("totalCount").textContent = allResponses.length;
  $("latestDate").textContent = allResponses.length ? formatDate(allResponses[0].submitted_at) : "—";

  if (!filtered.length) {
    $("responseList").innerHTML = "";
    $("emptyState").classList.remove("hidden");
    return;
  }
  $("emptyState").classList.add("hidden");
  $("responseList").innerHTML = filtered.map(r => `
    <div class="response-row">
      <div class="avatar">${escapeHtml(r.name.charAt(0).toUpperCase())}</div>
      <div class="response-meta">
        <strong>${escapeHtml(r.name)}</strong>
        <span>${formatDate(r.submitted_at)}</span>
      </div>
      <button class="view-btn" data-id="${r.id}">View answers</button>
    </div>`).join("");

  document.querySelectorAll(".view-btn").forEach(btn => {
    btn.addEventListener("click", () => openResponse(btn.dataset.id));
  });
}

function openResponse(id) {
  const row = allResponses.find(r => String(r.id) === String(id));
  if (!row) return;
  $("modalName").textContent = row.name;
  $("modalDate").textContent = `Submitted ${formatDate(row.submitted_at)}`;
  $("answerDetails").innerHTML = row.answers.map((a, i) => `
    <div class="answer-item">
      <span class="answer-number">${i + 1}</span>
      <div><small>${escapeHtml(a.category || "")}</small><strong>${escapeHtml(a.question)}</strong><p>${escapeHtml(a.selected)}</p></div>
    </div>`).join("");
  $("modal").classList.remove("hidden");
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

async function init() {
  db = setupDb();
  if (!db) {
    $("loginError").textContent = "Add your Supabase URL and anon key to config.js first.";
    return;
  }

  const { data: { session } } = await db.auth.getSession();
  if (session) {
    await showDashboard();
  }
}

async function showDashboard() {
  $("adminLogin").classList.add("hidden");
  $("dashboard").classList.remove("hidden");
  await loadResponses();
}

$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("loginError").textContent = "";
  const email = $("email").value.trim();
  const password = $("password").value;

  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) {
    $("loginError").textContent = "Invalid login or this account is not an admin.";
    return;
  }

  // RLS is the real authorization layer; this only controls the UI.
  const { data: adminRow, error: adminError } = await db
    .from("admin_users").select("user_id").eq("user_id", data.user.id).maybeSingle();

  if (adminError || !adminRow) {
    await db.auth.signOut();
    $("loginError").textContent = "This account is not authorized as an admin.";
    return;
  }
  await showDashboard();
});

$("logoutBtn").addEventListener("click", async () => {
  await db.auth.signOut();
  $("dashboard").classList.add("hidden");
  $("adminLogin").classList.remove("hidden");
});

$("refreshBtn").addEventListener("click", loadResponses);
$("search").addEventListener("input", renderResponses);
$("closeModal").addEventListener("click", () => $("modal").classList.add("hidden"));
$("modal").addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-backdrop")) $("modal").classList.add("hidden");
});

init();
