// =============================================================
// ==      وحدة واجهة المستخدم (كل ما يراه المستخدم)         ==
// =============================================================

// --- 1. استيراد العناصر من DOM ---
export const startScreen = document.getElementById('start-screen');
export const quizScreen = document.getElementById('quiz-screen');
// ... (بقية العناصر تبقى كما هي) ...
export const challengesContainer = document.getElementById('challenges-container');
export const challengesList = document.getElementById('challenges-list');

// --- 2. دوال التحكم العامة في الواجهة ---
export function showScreen(screenToShow) { /* ... الكود الحالي ... */ }
export function toggleLoader(show) { /* ... الكود الحالي ... */ }
export function updatePlayerDisplay(playerData, levelInfo) { /* ... الكود الحالي ... */ }
export function applyGameRules(rules) { /* ... الكود الحالي ... */ }

export function displayChallenges(challenges, startChallengeCallback) {
    if (!challenges || challenges.length === 0) {
        challengesContainer.classList.add('hidden');
        return;
    }

    challengesList.innerHTML = '';
    challenges.forEach(challenge => {
        const challengeDiv = document.createElement('div');
        challengeDiv.className = 'challenge-item';
        challengeDiv.innerHTML = `
            <h4>${challenge.challengeName}</h4>
            <p>متاح حتى: ${new Date(challenge.endDate).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}</p>
            <button data-challenge-id="${challenge.challengeId}">ابدأ التحدي</button>
        `;
        // تمرير الـ ID فقط للدالة
        challengeDiv.querySelector('button').addEventListener('click', () => startChallengeCallback(challenge.challengeId));
        challengesList.appendChild(challengeDiv);
    });

    challengesContainer.classList.remove('hidden');
}

// --- بقية الملف يبقى كما هو ---
export function updateProgress(current, total, isEnd = false) { /* ... الكود الحالي ... */ }
export function showFeedback(isCorrect, correctAnswerText) { /* ... الكود الحالي ... */ }
// ... (إلخ)
