// =============================================================
// ==      وحدة واجهة المستخدم (كل ما يراه المستخدم)         ==
// =============================================================

// --- 1. استيراد العناصر من DOM وتصديرها ---
export const startScreen = document.getElementById('start-screen');
export const quizScreen = document.getElementById('quiz-screen');
export const errorReviewScreen = document.getElementById('error-review-screen');
export const resultScreen = document.getElementById('result-screen');
export const storeScreen = document.getElementById('store-screen');

export const userNameInput = document.getElementById('userName');
export const pageNumberInput = document.getElementById('pageNumber');
export const qariSelect = document.getElementById('qariSelect');
export const questionsCountSelect = document.getElementById('questionsCount');

export const startButton = document.getElementById('startButton');
export const storeButton = document.getElementById('storeButton');
export const reloadButton = document.getElementById('reloadButton');
export const closeStoreButton = document.getElementById('closeStoreButton');
export const showFinalResultButton = document.getElementById('show-final-result-button');

export const playerInfoDiv = document.getElementById('player-info');
export const loader = document.getElementById('loader');

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


// --- 2. دوال التحكم العامة في الواجهة ---

export function showScreen(screenToShow) {
    [startScreen, quizScreen, errorReviewScreen, resultScreen, storeScreen].forEach(s => s.classList.add('hidden'));
    screenToShow.classList.remove('hidden');
}

export function toggleLoader(show) {
    loader.classList.toggle('hidden', !show);
}

export function initializeLockedOptions() {
    const lockedOptions = qariSelect.querySelectorAll('option[data-locked="true"]');
    
    lockedOptions.forEach(option => {
        option.disabled = true;
        option.style.color = '#999';
    });
}

export function updatePlayerDisplay(playerData, levelInfo) {
    if (playerData.isNew) {
        playerInfoDiv.innerHTML = `<p>مرحباً بك يا <strong>${playerData.name}</strong>!</p>`;
    } else {
        playerInfoDiv.innerHTML = `
            <p>مرحباً بعودتك يا <strong>${playerData.name}</strong>!</p>
            <p>المستوى: ${levelInfo.level} (${levelInfo.title}) | الخبرة: ${playerData.xp} | الألماس: ${playerData.diamonds} 💎</p>
        `;
    }
    playerInfoDiv.classList.remove('hidden');
}

export function applyGameRules(rules) {
    if (rules.questionsPerQuiz) {
        questionsCountSelect.value = rules.questionsPerQuiz;
    }
}


// --- 3. دوال واجهة الاختبار ---

export function updateProgress(current, total, isEnd = false) {
    progressCounter.textContent = isEnd ? `اكتمل الاختبار!` : `السؤال ${current} من ${total}`;
    const percentage = (current / total) * 100;
    progressBar.style.width = `${percentage}%`;
}

export function disableQuestionInteraction() {
    questionArea.querySelectorAll('button, .choice-box, .number-box, .option-div').forEach(el => {
        el.style.pointerEvents = 'none';
    });
}

export function markAnswer(element, isCorrect) {
    if (element) {
        element.classList.add(isCorrect ? 'correct-answer' : 'wrong-answer');
    }
}

export function showFeedback(isCorrect, correctAnswerText) {
    feedbackArea.classList.remove('hidden', 'correct-answer', 'wrong-answer');
    if (isCorrect) {
        feedbackArea.textContent = 'إجابة صحيحة! أحسنت.';
        feedbackArea.classList.add('correct-answer');
    } else {
        feedbackArea.innerHTML = `إجابة خاطئة. <br> الإجابة الصحيحة هي: <strong>${correctAnswerText}</strong>`;
        feedbackArea.classList.add('wrong-answer');
    }
}


// --- 4. دوال شاشات النتائج ومراجعة الأخطاء ---

export function displayErrorReview(errorLog) {
    errorListDiv.innerHTML = errorLog.map(error => `
        <div class="error-review-item">
            <h4>السؤال الذي أخطأت فيه:</h4>
            ${error.questionHTML}
            <hr>
            <p><strong>الإجابة الصحيحة كانت:</strong> <span class="correct-text">${error.correctAnswer}</span></p>
        </div>
    `).join('');
    showScreen(errorReviewScreen);
}

export function displayFinalResult(quizState, levelUpInfo) {
    resultNameSpan.textContent = quizState.userName;
    finalScoreSpan.textContent = `${quizState.score} / ${quizState.totalQuestions}`;
    xpGainedSpan.textContent = quizState.xpEarned;

    if (levelUpInfo) {
        levelUpMessage.innerHTML = `🎉 تهانينا! لقد ارتقيت إلى المستوى ${levelUpInfo.level} (${levelUpInfo.title}) وكسبت ${levelUpInfo.reward} ألماسة!`;
        levelUpMessage.classList.remove('hidden');
    } else {
        levelUpMessage.classList.add('hidden');
    }
    
    updateSaveMessage(false);
    showScreen(resultScreen);
}

export function updateSaveMessage(isSaved) {
    if (isSaved) {
        saveStatus.textContent = 'تم حفظ تقدمك بنجاح!';
        saveStatus.style.color = '#004d40';
    } else {
        saveStatus.textContent = 'جاري حفظ تقدمك...';
        saveStatus.style.color = '#555';
    }
}


// --- 5. دوال واجهة المتجر والتحديات ---

export function displayStore(storeItems, playerData, purchaseCallback) {
    playerDiamondsDisplay.innerHTML = `${playerData.diamonds} 💎`;
    storeItemsContainer.innerHTML = '';

    storeItems.forEach(item => {
        const isOwned = playerData.inventory.includes(item.id);
        const itemDiv = document.createElement('div');
        itemDiv.className = `store-item ${isOwned ? 'owned-item' : ''}`;
        itemDiv.innerHTML = `
            <h4>${item.name}</h4>
            <p>${item.description}</p>
            <p class="item-price">السعر: ${item.price} 💎</p>
            <button class="buy-button" data-item-id="${item.id}" ${isOwned ? 'disabled' : ''}>
                ${isOwned ? 'تم الشراء' : 'شراء'}
            </button>
        `;
        
        if (!isOwned) {
            itemDiv.querySelector('.buy-button').addEventListener('click', (e) => {
                purchaseCallback(e.target.dataset.itemId);
            });
        }
        
        storeItemsContainer.appendChild(itemDiv);
    });
}

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
        challengeDiv.querySelector('button').addEventListener('click', () => startChallengeCallback(challenge.challengeId));
        challengesList.appendChild(challengeDiv);
    });

    challengesContainer.classList.remove('hidden');
}
