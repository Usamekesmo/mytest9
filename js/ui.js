// =============================================================
// ==      وحدة واجهة المستخدم (كل ما يراه المستخدم)         ==
// ==      (النسخة النهائية الشاملة لكل الميزات)            ==
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

export const startButton = document.getElementById('startButton');
export const storeButton = document.getElementById('storeButton');
export const leaderboardButton = document.getElementById('leaderboardButton');
export const reloadButton = document.getElementById('reloadButton');
export const closeStoreButton = document.getElementById('closeStoreButton');
export const closeLeaderboardButton = document.getElementById('closeLeaderboardButton');
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

export const leaderboardList = document.getElementById('leaderboard-list');
export const achievementToast = document.getElementById('achievement-toast');
export const achievementToastName = document.getElementById('achievement-toast-name');
export const achievementToastReward = document.getElementById('achievement-toast-reward');


// --- 2. دوال التحكم العامة في الواجهة ---

export function showScreen(screenToShow) {
    [startScreen, quizScreen, errorReviewScreen, resultScreen, storeScreen, leaderboardScreen].forEach(s => s.classList.add('hidden'));
    screenToShow.classList.remove('hidden');
}

export function toggleLoader(show) {
    loader.classList.toggle('hidden', !show);
}

export function initializeLockedOptions() {
    qariSelect.querySelectorAll('option[data-locked="true"]').forEach(option => {
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

export function populatePageSelect(allowedPages, purchasedPages) {
    pageSelect.innerHTML = '<option value="">-- اختر صفحة --</option>'; // إعادة تعيين
    
    const allAvailablePages = [...new Set([...allowedPages, ...purchasedPages])].sort((a, b) => a - b);

    if (allAvailablePages.length === 0) {
        pageSelect.innerHTML = '<option value="">لا توجد صفحات متاحة حاليًا</option>';
        return;
    }

    allAvailablePages.forEach(page => {
        const option = document.createElement('option');
        option.value = page;
        option.textContent = `الصفحة ${page}`;
        if (purchasedPages.includes(page) && !allowedPages.includes(page)) {
            option.textContent += " (تم شراؤها)";
        }
        pageSelect.appendChild(option);
    });
}

export function updateQuestionsCountOptions(maxQuestions) {
    questionsCountSelect.innerHTML = '';
    for (let i = 5; i <= maxQuestions; i += 5) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${i} ${i === 5 ? 'أسئلة' : 'سؤالاً'}`;
        questionsCountSelect.appendChild(option);
    }
    // تحديد الخيار الأخير كافتراضي
    if (questionsCountSelect.options.length > 0) {
        questionsCountSelect.value = questionsCountSelect.options[questionsCountSelect.options.length - 1].value;
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
        feedbackArea.innerHTML = `إجابة خاطئة.   
 الإجابة الصحيحة هي: <strong>${correctAnswerText}</strong>`;
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


// --- 5. دوال واجهة المتجر والتحديات والميزات الجديدة ---

export function displayStore(storeItems, playerData, purchaseCallback) {
    playerDiamondsDisplay.innerHTML = `${playerData.diamonds} 💎 | ${playerData.xp} XP`;
    storeItemsContainer.innerHTML = '';

    storeItems.forEach(item => {
        const isOwned = playerData.inventory.includes(item.id);
        const itemDiv = document.createElement('div');
        itemDiv.className = `store-item ${isOwned ? 'owned-item' : ''}`;
        
        let priceDisplay = '';
        let buttonText = 'شراء';
        let isDisabled = isOwned;

        if (item.type === 'xp_exchange') {
            priceDisplay = `التكلفة: ${item.price} XP`;
            buttonText = 'استبدال';
            if (playerData.xp < item.price) {
                isDisabled = true;
            }
        } else {
            priceDisplay = `السعر: ${item.price} 💎`;
            if (playerData.diamonds < item.price) {
                isDisabled = true;
            }
        }

        if (isOwned) {
            buttonText = 'تم الشراء';
        }

        itemDiv.innerHTML = `
            <h4>${item.name}</h4>
            <p>${item.description}</p>
            <p class="item-price">${priceDisplay}</p>
            <button class="buy-button" data-item-id="${item.id}" ${isDisabled ? 'disabled' : ''}>
                ${buttonText}
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

export function displayLeaderboard(leaderboardData) {
    leaderboardList.innerHTML = '';
    if (!leaderboardData || leaderboardData.length === 0) {
        leaderboardList.innerHTML = '<p>لا توجد بيانات لعرضها حاليًا.</p>';
        return;
    }

    leaderboardData.forEach((player, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        item.innerHTML = `
            <span class="leaderboard-rank">${index + 1}</span>
            <span class="leaderboard-name">${player.name}</span>
            <span class="leaderboard-xp">${player.xp} XP</span>
        `;
        leaderboardList.appendChild(item);
    });
}

export function showAchievementToast(achievement) {
    achievementToastName.textContent = achievement.name;
    achievementToastReward.textContent = `+${achievement.xpReward} XP, +${achievement.diamondsReward} 💎`;
    
    achievementToast.classList.remove('hidden');
    achievementToast.classList.add('show');

    setTimeout(() => {
        achievementToast.classList.remove('show');
        // يمكن إضافة 'hidden' بعد انتهاء حركة الخروج إذا لزم الأمر
    }, 4000);
}
