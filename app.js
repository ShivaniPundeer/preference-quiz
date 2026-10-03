let db = null;
let current = 0;
let answers = Array(20).fill(null);
let participantName = "";

const $ = (id) => document.getElementById(id);
const screens = ["welcome", "quiz", "submitting", "done"];

function showScreen(id) {
  screens.forEach(s => $(s).classList.toggle("hidden", s !== id));
  window.scrollTo({top: 0, behavior: "smooth"});
}

function setupDb() {
  const cfg = window.APP_CONFIG;
  if (!cfg || cfg.SUPABASE_URL.includes("PASTE_") || cfg.SUPABASE_ANON_KEY.includes("PASTE_")) return null;
  return window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
}

function renderQuestion() {
  const q = window.QUIZ_QUESTIONS[current];
  $("questionCount").textContent = `Question ${current + 1} of ${window.QUIZ_QUESTIONS.length}`;
  $("progressText").textContent = `${Math.round(((current + 1) / window.QUIZ_QUESTIONS.length) * 100)}%`;
  $("progressBar").style.width = `${((current + 1) / window.QUIZ_QUESTIONS.length) * 100}%`;
  $("questionCategory").textContent = q.category;
  $("questionText").textContent = q.question;

  const wrap = $("options");
  wrap.innerHTML = "";
  q.options.forEach((opt, i) => {
    const button = document.createElement("button");
    button.className = "option-card" + (answers[current] === i ? " selected" : "");
    button.type = "button";
    button.innerHTML = `
      <div class="option-image"><img src="${opt.image}" alt="" loading="lazy"></div>
      <div class="option-copy"><span class="letter">${String.fromCharCode(65+i)}</span><span>${escapeHtml(opt.text)}</span></div>
      <div class="check">✓</div>`;
    button.addEventListener("click", () => {
      answers[current] = i;
      renderQuestion();
    });
    wrap.appendChild(button);
  });

  $("backBtn").disabled = current === 0;
  $("nextBtn").disabled = answers[current] === null;
  $("nextBtn").textContent = current === window.QUIZ_QUESTIONS.length - 1 ? "Submit ❤️" : "Next →";
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

async function submitQuiz() {
  showScreen("submitting");
  if (!db) {
    alert("Database is not connected yet. Please add your Supabase details in config.js.");
    showScreen("quiz");
    return;
  }

  const answerRows = window.QUIZ_QUESTIONS.map((q, index) => ({
    question: q.question,
    category: q.category,
    selected: q.options[answers[index]].text,
    option_index: answers[index]
  }));

  const { error } = await db.from("responses").insert({
    name: participantName.trim(),
    answers: answerRows
  });

  if (error) {
    console.error(error);
    alert("Something went wrong while saving your answers. Please try again.");
    showScreen("quiz");
    return;
  }

  $("doneName").textContent = participantName.trim();
  showScreen("done");
}

$("startBtn").addEventListener("click", () => {
  const name = $("name").value.trim();
  if (!name) {
    $("nameError").textContent = "Please enter your name.";
    $("name").focus();
    return;
  }
  participantName = name;
  $("nameError").textContent = "";
  current = 0;
  answers = Array(window.QUIZ_QUESTIONS.length).fill(null);
  showScreen("quiz");
  renderQuestion();
});

$("nextBtn").addEventListener("click", () => {
  if (answers[current] === null) return;
  if (current < window.QUIZ_QUESTIONS.length - 1) {
    current++;
    renderQuestion();
  } else {
    submitQuiz();
  }
});

$("backBtn").addEventListener("click", () => {
  if (current > 0) {
    current--;
    renderQuestion();
  }
});

$("againBtn").addEventListener("click", () => {
  $("name").value = "";
  showScreen("welcome");
});

db = setupDb();
