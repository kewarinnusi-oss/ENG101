const state = {
  currentQuestion: null,
  selectedAnswer: "",
  previousIds: [],
  answered: 0,
  correct: 0,
  streak: 0,
  questionNumber: 0,
  answerChecked: false,
  totalPoints: 0,
  maxPossiblePoints: 0,
  sessionSize: 10,
  sessionComplete: false,
  reviewItems: [],
  translatedWords: []
};

const skillLabels = {
  Mixed: "รวมทักษะ",
  Grammar: "ไวยากรณ์",
  Vocabulary: "คำศัพท์",
  Reading: "อ่านจับใจความ",
  Writing: "เขียน",
  "Use of English": "การใช้ภาษาอังกฤษ"
};

const elements = {
  levelSelect: document.querySelector("#levelSelect"),
  skillSelect: document.querySelector("#skillSelect"),
  todayFocus: document.querySelector("#todayFocus"),
  bankSize: document.querySelector("#bankSize"),
  newQuestionBtn: document.querySelector("#newQuestionBtn"),
  answerForm: document.querySelector("#answerForm"),
  checkAnswerBtn: document.querySelector("#checkAnswerBtn"),
  skipQuestionBtn: document.querySelector("#skipQuestionBtn"),
  choiceList: document.querySelector("#choiceList"),
  textAnswerWrap: document.querySelector("#textAnswerWrap"),
  textAnswer: document.querySelector("#textAnswer"),
  questionLevel: document.querySelector("#questionLevel"),
  questionSkill: document.querySelector("#questionSkill"),
  aiStatus: document.querySelector("#aiStatus"),
  pointBadge: document.querySelector("#pointBadge"),
  questionPrompt: document.querySelector("#questionPrompt"),
  questionTitle: document.querySelector("#questionTitle"),
  questionContext: document.querySelector("#questionContext"),
  resultBadge: document.querySelector("#resultBadge"),
  microLesson: document.querySelector("#microLesson"),
  benefit: document.querySelector("#benefit"),
  coachNote: document.querySelector("#coachNote"),
  translationNote: document.querySelector("#translationNote"),
  streak: document.querySelector("#streak"),
  accuracy: document.querySelector("#accuracy"),
  totalScore: document.querySelector("#totalScore"),
  questionCount: document.querySelector("#questionCount"),
  sessionProgress: document.querySelector("#sessionProgress"),
  sessionProgressFill: document.querySelector("#sessionProgressFill"),
  restartSessionBtn: document.querySelector("#restartSessionBtn"),
  summaryPanel: document.querySelector("#summaryPanel"),
  summaryTitle: document.querySelector("#summaryTitle"),
  summaryText: document.querySelector("#summaryText"),
  summaryScore: document.querySelector("#summaryScore"),
  summaryAccuracy: document.querySelector("#summaryAccuracy"),
  summaryWrong: document.querySelector("#summaryWrong"),
  reviewList: document.querySelector("#reviewList"),
  summaryRestartBtn: document.querySelector("#summaryRestartBtn")
};

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || data.error || "Request failed");
  }
  return data;
}

function setBusy(isBusy) {
  if (elements.newQuestionBtn) elements.newQuestionBtn.disabled = isBusy;
  if (elements.checkAnswerBtn) elements.checkAnswerBtn.disabled = isBusy;
  if (elements.skipQuestionBtn) {
    elements.skipQuestionBtn.disabled = isBusy;
    elements.skipQuestionBtn.classList.toggle("hidden", state.answerChecked || isBusy);
  }
  
  if (elements.checkAnswerBtn) {
    elements.checkAnswerBtn.textContent = isBusy
      ? "กำลังทำงาน..."
      : state.answerChecked
        ? state.answered >= state.sessionSize ? "ดูสรุปท้ายชุด" : "ข้อต่อไป"
        : "ตรวจคำตอบ";
  }
}

function updateProgress() {
  if (elements.streak) elements.streak.textContent = state.streak;
  const accuracy = state.answered ? Math.round((state.correct / state.answered) * 100) : 0;
  if (elements.accuracy) elements.accuracy.textContent = `${accuracy}%`;
  if (elements.totalScore) elements.totalScore.textContent = `${state.totalPoints}/${state.maxPossiblePoints}`;
  
  const currentQuestionNumber = Math.min(
    state.sessionSize,
    Math.max(state.answered + (state.answerChecked || state.sessionComplete ? 0 : 1), 0)
  );
  if (elements.questionCount) elements.questionCount.textContent = `${currentQuestionNumber}/${state.sessionSize}`;
  if (elements.sessionProgress) elements.sessionProgress.textContent = `${state.answered} / ${state.sessionSize} ข้อ`;
  if (elements.sessionProgressFill) elements.sessionProgressFill.style.width = `${Math.min(100, (state.answered / state.sessionSize) * 100)}%`;
}

function updateFocusText() {
  const level = elements.levelSelect.value;
  const skill = skillLabels[elements.skillSelect.value] || elements.skillSelect.value;
  if (elements.todayFocus) elements.todayFocus.textContent = `ฝึก ${level} แบบ${skill}`;
}

function renderClickableText(container, text) {
  container.textContent = "";
  const parts = String(text || "").split(/([A-Za-z][A-Za-z'-]*)/g);

  parts.forEach(part => {
    if (/^[A-Za-z][A-Za-z'-]*$/.test(part) && part.length > 2) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "word-chip";
      button.textContent = part;
      button.title = "กดเพื่อแปล";
      button.addEventListener("click", () => translateWord(part));
      container.append(button);
      return;
    }

    container.append(document.createTextNode(part));
  });
}

function renderVocabularyHints(question) {
  const skipWords = new Set([
    "the", "and", "that", "this", "with", "from", "your", "what", "when", "where",
    "which", "than", "then", "they", "them", "their", "there", "were", "will",
    "would", "could", "should", "because", "choose", "best", "answer"
  ]);
  const source = [
    question.title,
    question.prompt,
    question.context,
    ...(Array.isArray(question.options) ? question.options : [])
  ].join(" ");
  const words = Array.from(source.matchAll(/[A-Za-z][A-Za-z'-]*/g))
    .map(match => match[0])
    .filter(word => word.length > 3 && !skipWords.has(word.toLowerCase()));
  const uniqueWords = [...new Set(words.map(word => word.toLowerCase()))].slice(0, 8);

  elements.translationNote.textContent = "";
  elements.translationNote.append(document.createTextNode("คำศัพท์น่ารู้: "));

  if (!uniqueWords.length) {
    elements.translationNote.append(document.createTextNode("กดคำอังกฤษในโจทย์เพื่อดูคำแปล ความหมาย และตัวอย่าง."));
    return;
  }

  uniqueWords.forEach((word, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "word-chip";
    button.textContent = word;
    button.addEventListener("click", () => translateWord(word));
    elements.translationNote.append(button);
    if (index < uniqueWords.length - 1) {
      elements.translationNote.append(document.createTextNode(" · "));
    }
  });
}

async function translateWord(word) {
  elements.translationNote.textContent = `กำลังแปล "${word}"...`;
  try {
    const data = await postJson("/api/translate", { word });
    const item = data.translation;
    
    // Track translated words for the bottom panel
    if (!state.translatedWords.find(w => w.word === item.word)) {
      state.translatedWords.unshift(item);
      state.translatedWords = state.translatedWords.slice(0, 5);
      renderRecentVocab();
    }

    let text = `${item.word}: ${item.th}`;
    if (item.phonetics) text += ` [${item.phonetics}]`;
    if (item.note) text += ` — ${item.note}`;
    if (item.example) text += ` ตัวอย่าง: ${item.example}`;
    elements.translationNote.textContent = text;
  } catch (error) {
    elements.translationNote.textContent = `แปลคำนี้ไม่ได้ตอนนี้: ${error.message}`;
  }
}

function renderRecentVocab() {
  const container = document.querySelector("#recentVocabList");
  if (!container) return;
  container.innerHTML = "";
  if (state.translatedWords.length === 0) {
    container.innerHTML = "<p class='empty-text'>เริ่มกดคำศัพท์ในโจทย์เพื่อดูคำแปลได้เลย!</p>";
    return;
  }
  state.translatedWords.forEach(item => {
    const div = document.createElement("div");
    div.className = "vocab-card";
    div.innerHTML = `
      <strong>${item.word}</strong>
      <span>${item.th}</span>
      <small>${item.phonetics || ""}</small>
    `;
    container.append(div);
  });
}

function updatePointBadge(question) {
  const points = Number(question.points || 10);
  elements.pointBadge.textContent = question.isBonus
    ? `ข้อโบนัส ${points} คะแนน`
    : `เก็บคะแนน ${points} คะแนน`;
}

function renderQuestion(question, aiEnabled) {
  state.currentQuestion = question;
  state.selectedAnswer = "";
  state.answerChecked = false;
  state.sessionComplete = false;
  state.questionNumber += 1;
  elements.summaryPanel.classList.add("hidden");

  elements.questionLevel.textContent = question.level || elements.levelSelect.value;
  elements.questionSkill.textContent = skillLabels[question.skill] || question.skill || skillLabels[elements.skillSelect.value];
  elements.aiStatus.textContent = aiEnabled ? "โหมด AI" : "โหมดตัวอย่าง";
  updatePointBadge(question);
  elements.questionPrompt.textContent = question.prompt || "เลือกคำตอบที่ดีที่สุด";
  elements.questionTitle.textContent = question.title || "โจทย์ CEFR";
  renderClickableText(elements.questionContext, question.context || "");
  elements.microLesson.textContent = question.microLesson || "อ่านโจทย์ให้ครบ แล้วดูคำสำคัญก่อนตอบ.";
  elements.benefit.textContent = question.benefit || "ข้อนี้ช่วยฝึกทักษะที่ข้อสอบ CEFR ใช้วัดจริง.";
  elements.coachNote.textContent = question.aiCoach || question.cefrTarget || "ตอบแล้วจะได้คำแนะนำเฉพาะจุด.";
  renderVocabularyHints(question);
  elements.resultBadge.textContent = "พร้อม";
  elements.resultBadge.className = "result-badge neutral";
  elements.textAnswer.value = "";
  elements.textAnswer.disabled = false;
  elements.choiceList.innerHTML = "";

  if (question.type === "text") {
    elements.choiceList.classList.add("hidden");
    elements.textAnswerWrap.classList.remove("hidden");
    elements.textAnswer.focus();
    updateProgress();
    return;
  }

  elements.choiceList.classList.remove("hidden");
  elements.textAnswerWrap.classList.add("hidden");
  
  // Shuffle options client-side to be 100% sure
  const options = Array.isArray(question.options) ? [...question.options] : [];
  options.sort(() => Math.random() - 0.5);

  const labels = ["A", "B", "C", "D"];
  options.forEach((option, idx) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-option";
    button.innerHTML = `<span class="option-label">${labels[idx]}</span> ${option}`;
    button.setAttribute("role", "radio");
    button.setAttribute("aria-checked", "false");
    button.addEventListener("click", () => {
      if (state.answerChecked) return;
      state.selectedAnswer = option;
      document.querySelectorAll(".choice-option").forEach(item => {
        item.classList.remove("selected");
        item.setAttribute("aria-checked", "false");
      });
      button.classList.add("selected");
      button.setAttribute("aria-checked", "true");
    });
    elements.choiceList.append(button);
  });

  updateProgress();
}

async function loadQuestion() {
  if (state.sessionComplete) return;
  setBusy(true);
  updateFocusText();
  elements.questionTitle.textContent = "กำลังเตรียมโจทย์";
  elements.questionContext.textContent = "กำลังสร้างโจทย์ให้เหมาะกับระดับที่เลือก...";

  try {
    const data = await postJson("/api/lesson", {
      level: elements.levelSelect.value,
      skill: elements.skillSelect.value,
      previousIds: state.previousIds
    });
    if (data.bankSize) elements.bankSize.textContent = data.bankSize;
    renderQuestion(data.lesson, data.aiEnabled);
    if (data.lesson?.id) {
      state.previousIds.push(data.lesson.id);
      state.previousIds = state.previousIds.slice(-80);
    }
  } catch (error) {
    elements.questionTitle.textContent = "เกิดข้อผิดพลาด";
    elements.questionContext.textContent = "ไม่สามารถโหลดโจทย์ได้: " + error.message;
    elements.resultBadge.textContent = "ผิดพลาด";
    elements.resultBadge.className = "result-badge wrong";
    elements.coachNote.textContent = "ลองกดปุ่ม ↻ เพื่อลองใหม่อีกครั้งครับ";
  } finally {
    setBusy(false);
  }
}

async function checkAnswer(event) {
  event.preventDefault();
  if (!state.currentQuestion) return;

  if (state.answerChecked) {
    if (state.answered >= state.sessionSize) {
      await showSessionSummary();
      return;
    }
    await loadQuestion();
    return;
  }

  const userAnswer = state.currentQuestion.type === "text"
    ? elements.textAnswer.value
    : state.selectedAnswer;

  if (!userAnswer.trim()) {
    elements.resultBadge.textContent = "เลือกก่อน";
    elements.resultBadge.className = "result-badge wrong";
    elements.coachNote.textContent = "เลือกคำตอบหรือพิมพ์คำตอบก่อน แล้วค่อยตรวจครับ.";
    return;
  }

  setBusy(true);
  try {
    const data = await postJson("/api/check", {
      question: state.currentQuestion,
      userAnswer
    });
    const result = data.result;
    state.answered += 1;
    state.maxPossiblePoints += Number(result.maxPoints || state.currentQuestion.points || 10);
    state.totalPoints += Number(result.earnedPoints || 0);

    if (result.correct) {
      state.correct += 1;
      state.streak += 1;
    } else {
      state.streak = 0;
      state.reviewItems.push({
        title: state.currentQuestion.title,
        level: state.currentQuestion.level,
        skill: state.currentQuestion.skill,
        context: state.currentQuestion.context,
        userAnswer,
        correctAnswer: state.currentQuestion.answer,
        explanation: result.explanation || state.currentQuestion.microLesson
      });
    }

    elements.resultBadge.textContent = result.correct ? "ถูกต้อง" : "ทบทวน";
    elements.resultBadge.className = result.correct ? "result-badge correct" : "result-badge wrong";
    elements.microLesson.textContent = result.explanation || state.currentQuestion.microLesson;
    elements.benefit.textContent = result.benefit || state.currentQuestion.benefit;
    elements.coachNote.textContent = [result.feedback, result.improvement].filter(Boolean).join(" ");
    state.answerChecked = true;
    elements.textAnswer.disabled = true;
    document.querySelectorAll(".choice-option").forEach(item => {
      item.disabled = true;
    });
    updateProgress();
  } catch (error) {
    elements.resultBadge.textContent = "ผิดพลาด";
    elements.resultBadge.className = "result-badge wrong";
    elements.coachNote.textContent = error.message;
  } finally {
    setBusy(false);
  }
}

async function skipQuestion() {
  if (state.answerChecked || state.sessionComplete || !state.currentQuestion) return;
  state.answered += 1;
  state.streak = 0;
  state.maxPossiblePoints += Number(state.currentQuestion.points || 10);
  state.reviewItems.push({
    title: state.currentQuestion.title,
    level: state.currentQuestion.level,
    skill: state.currentQuestion.skill,
    context: state.currentQuestion.context,
    userAnswer: "(คุณข้ามโจทย์นี้)",
    correctAnswer: state.currentQuestion.answer,
    explanation: "ข้อนี้คุณเลือกข้าม คำตอบที่ถูกคือ: " + state.currentQuestion.answer
  });
  
  if (state.answered >= state.sessionSize) {
    await showSessionSummary();
  } else {
    await loadQuestion();
  }
}

async function showSessionSummary() {
  state.sessionComplete = true;
  elements.summaryPanel.classList.remove("hidden");
  elements.summaryTitle.textContent = "ผลการฝึกชุดนี้";
  elements.summaryText.textContent = "กำลังสรุปจุดที่ควรทบทวน...";
  const accuracy = state.answered ? Math.round((state.correct / state.answered) * 100) : 0;

  elements.summaryScore.textContent = `${state.totalPoints}/${state.maxPossiblePoints}`;
  elements.summaryAccuracy.textContent = `${accuracy}%`;
  elements.summaryWrong.textContent = state.reviewItems.length;
  renderReviewList();

  try {
    const data = await postJson("/api/session-summary", {
      level: elements.levelSelect.value,
      skill: elements.skillSelect.value,
      answered: state.answered,
      correct: state.correct,
      totalPoints: state.totalPoints,
      maxPossiblePoints: state.maxPossiblePoints,
      reviewItems: state.reviewItems
    });
    elements.summaryText.textContent = data.summary.message;
  } catch {
    elements.summaryText.textContent = makeLocalSummaryText(accuracy);
  }

  elements.summaryPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  updateProgress();
}

function makeLocalSummaryText(accuracy) {
  if (accuracy >= 85) {
    return "ดีมาก ชุดนี้ค่อนข้างแม่นแล้ว รอบถัดไปลองขยับระดับให้ยากขึ้นหรือเลือก Reading/Writing เพื่อฝึกโจทย์ยาวขึ้น.";
  }
  if (accuracy >= 60) {
    return "อยู่ในทางที่ดี ให้ทบทวนข้อที่พลาด โดยดูคำสำคัญในโจทย์และจำรูปประโยคที่เฉลยอธิบาย.";
  }
  return "ยังต้องเสริมพื้นฐานอีกนิด แนะนำเริ่มจาก A2-B1 Grammar และ Vocabulary แล้วทำซ้ำจนความแม่นยำเกิน 70%.";
}

function renderReviewList() {
  elements.reviewList.innerHTML = "";

  if (!state.reviewItems.length) {
    const empty = document.createElement("p");
    empty.className = "empty-review";
    empty.textContent = "ชุดนี้ไม่มีข้อผิดเลย เก่งมาก ลองทำชุดใหม่หรือเพิ่มระดับความยากได้.";
    elements.reviewList.append(empty);
    return;
  }

  state.reviewItems.forEach((item, index) => {
    const article = document.createElement("article");
    article.className = "review-item";
    article.innerHTML = `
      <strong>ข้อ ${index + 1}: ${escapeHtml(item.title || "CEFR practice")}</strong>
      <p>${escapeHtml(item.context || "")}</p>
      <p><span>คุณตอบ:</span> ${escapeHtml(item.userAnswer || "-")}</p>
      <p><span>คำตอบที่ถูก:</span> ${escapeHtml(item.correctAnswer || "-")}</p>
      <p><span>เหตุผล:</span> ${escapeHtml(item.explanation || "อ่านเฉลยและจำ pattern นี้ไว้ใช้กับข้อถัดไป.")}</p>
    `;
    elements.reviewList.append(article);
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function restartSession() {
  state.currentQuestion = null;
  state.selectedAnswer = "";
  state.previousIds = [];
  state.answered = 0;
  state.correct = 0;
  state.streak = 0;
  state.questionNumber = 0;
  state.answerChecked = false;
  state.totalPoints = 0;
  state.maxPossiblePoints = 0;
  state.sessionComplete = false;
  state.reviewItems = [];
  if (elements.sessionSizeSelect) {
    state.sessionSize = parseInt(elements.sessionSizeSelect.value) || 10;
  }
  elements.summaryPanel.classList.add("hidden");
  updateProgress();
  await loadQuestion();
}

elements.newQuestionBtn.addEventListener("click", loadQuestion);
if (elements.sessionSizeSelect) elements.sessionSizeSelect.addEventListener("change", restartSession);
if (elements.skipQuestionBtn) elements.skipQuestionBtn.addEventListener("click", skipQuestion);
elements.levelSelect.addEventListener("change", restartSession);
elements.skillSelect.addEventListener("change", restartSession);
elements.answerForm.addEventListener("submit", checkAnswer);
elements.restartSessionBtn.addEventListener("click", restartSession);
elements.summaryRestartBtn.addEventListener("click", restartSession);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js").catch(() => {});
}

updateProgress();
loadQuestion();
renderRecentVocab();
