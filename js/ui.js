// =============================================================
// ==      وحدة واجهة المستخدم (النسخة النهائية مع إصلاحات)    ==
// =============================================================

// --- 1. استيراد العناصر من DOM وتصديرها ---
export const startScreen = document.getElementById('start-screen');
export const quizScreen = document.getElementById('quiz-screen');
export const errorReviewScreen = document.getElementById('error-review-screen');
export const resultScreen = document.getElementById('result-screen');
export const storeScreen = document.getElementById('store-screen');
export const leaderboardScreen = document.getElementById('leaderboard-screen');

export const userNameInput = document.getElementById('userName');
export const pageSelect = document.getElementById('pageSelect');
export const qariSelect = document.getElementById('qariSelect');
export const questionsCountSelect = document.getElementById('questionsCount');

// ▼▼▼ تم تعديل هذا القسم ▼▼▼
export const startButton = document.getElementById('startButton');
export const startTestButton = document.getElementById('startTestButton'); // <-- إضافة جديدة
export const storeButton = document.getElementById('storeButton');
export const leaderboardButton = document.getElementById('leaderboardButton');
// ▲▲▲ نهاية التعديل ▲▲▲

export const reloadButton = document.getElementById('reloadButton');
export const closeStoreButton = document.getElementById('closeStoreButton');
export const closeLeaderboardButton = document.getElementById('closeLeaderboardButton');
export const showFinalResultButton = document.getElementById('show-final-result-button');

export const playerInfoDiv = document.getElementById('player-info');
export const loader = document.getElementById('loader');

// ▼▼▼ إضافة جديدة ▼▼▼
export const postLoginControls = document.getElementById('post-login-controls');
// ▲▲▲ نهاية الإضافة ▲▲▲

export const progressCounter = document.getElementById('progress-counter');
export const progressBar = document.getElementById('progress-bar');
export const questionArea = document.getElementById('question-area');
export const feedbackArea = document.getElementById('feedback-area');

export const errorListDiv = document.getElementById('error-list');

export const resultNameSpan = document.getElementById('resultName');
export const finalScoreSpan = document.getElementById('finalScore');
export const xpGainedSpan = document.getElementById('xpGained');
export const levelUpMessage = document.getElementById('level-up-message');
export const saveStatus = document.getElementById('save-status');

export const playerDiamondsDisplay = document.getElementById('player-diamonds-display');
export const storeItemsContainer = document.getElementById('store-items-container');

export const challengesContainer = document.getElementById('challenges-container');
export const challengesList = document.getElementById('challenges-list');

export const leaderboardList = document.getElementById('leaderboard-list');
export const achievementToast = document.getElementById('achievement-toast');
export const achievementToastName = document.getElementById('achievement-toast-name');
export const achievementToastReward = document.getElementById('achievement-toast-reward');


// --- (بقية دوال الملف تبقى كما هي بدون أي تغيير) ---
export function showScreen(screenToShow) { /* ... */ }
export function toggleLoader(show) { /* ... */ }
export function initializeLockedOptions() { /* ... */ }
export function updatePlayerDisplay(playerData, levelInfo) { /* ... */ }
export function populatePageSelect(allowedPages, purchasedPages) { /* ... */ }
export function updateQuestionsCountOptions(maxQuestions) { /* ... */ }
export function updateProgress(current, total, isEnd = false) { /* ... */ }
export function disableQuestionInteraction() { /* ... */ }
export function markAnswer(element, isCorrect) { /* ... */ }
export function showFeedback(isCorrect, correctAnswerText) { /* ... */ }
export function displayErrorReview(errorLog) { /* ... */ }
export function displayFinalResult(quizState, levelUpInfo) { /* ... */ }
export function updateSaveMessage(isSaved) { /* ... */ }
export function displayStore(storeItems, playerData, purchaseCallback) { /* ... */ }
export function displayChallenges(challenges, startChallengeCallback) { /* ... */ }
export function displayLeaderboard(leaderboardData) { /* ... */ }
export function showAchievementToast(achievement) { /* ... */ }
