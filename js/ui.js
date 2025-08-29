// =============================================================
// ==      وحدة واجهة المستخدم (كل ما يراه المستخدم)         ==
// =============================================================

// --- 1. استيراد العناصر من DOM ---
export const startScreen = document.getElementById('start-screen');
export const quizScreen = document.getElementById('quiz-screen');
export const resultScreen = document.getElementById('result-screen');
export const errorReviewScreen = document.getElementById('error-review-screen');
export const storeScreen = document.getElementById('store-screen');

export const userNameInput = document.getElementById('userName');
export const pageNumberInput = document.getElementById('pageNumber');
export const qariSelect = document.getElementById('qariSelect');
export const questionsCountSelect = document.getElementById('questionsCount');

export const startButton = document.getElementById('startButton');
export const storeButton = document.getElementById('storeButton');
export const closeStoreButton = document.getElementById('closeStoreButton');
export const reloadButton = document.getElementById('reloadButton');
export const showFinalResultButton = document.getElementById('show-final-result-button');

export const loader = document.getElementById('loader');
export const questionArea = document.getElementById('question-area');
export const feedbackArea = document.getElementById('feedback-area');
export const progressCounter = document.getElementById('progress-counter');
export const progressBar = document.getElementById('progress-bar');
export const errorList = document.getElementById('error-list');
export const playerInfoDiv = document.getElementById('player-info');
export const storeItemsContainer = document.getElementById('store-items-container');
export const playerDiamondsDisplay = document.getElementById('player-diamonds-display');

// إضافة: عناصر واجهة التحديات
export const challengesContainer = document.getElementById('challenges-container');
export const challengesList = document.getElementById('challenges-list');


// --- 2. دوال التحكم العامة في الواجهة ---

export function showScreen(screenToShow) {
    [startScreen, quizScreen, resultScreen, errorReviewScreen, storeScreen].forEach(screen => {
        screen.classList.add('hidden');
    });
    screenToShow.classList.remove('hidden');
}

export function toggleLoader(show) {
    loader.classList.toggle('hidden', !show);
    startButton.disabled = show;
}

export function updatePlayerDisplay(playerData, levelInfo) {
    playerInfoDiv.innerHTML = `
        <p>مرحباً <strong>${playerData.name}</strong></p>
        <p>المستوى: ${levelInfo.level} (${levelInfo.title}) | الألماس: ${playerData.diamonds} 💎</p>
        <div class="progress-container" style="background:#e0e0e0; border-radius:5px; padding:2px;">
            <div class="progress-bar" style="width:${levelInfo.progress}%; height:8px; background:#00796b; border-radius:5px;"></div>
        </div>
    `;
    playerInfoDiv.classList.remove('hidden');
}

export function applyGameRules(rules) {
    pageNumberInput.placeholder = `أدخل صفحة: ${rules.allowedPages || '1-604'}`;
    questionsCountSelect.value = rules.questionsCount || 5;
}

// إضافة: دالة جديدة لعرض التحديات
// في ملف ui.js

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
            
            <!-- تعديل: إضافة خاصية disabled للزر -->
            <button data-challenge-id="${challenge.challengeId}" disabled>انتظر...</button>
        `;
        challengeDiv.querySelector('button').addEventListener('click', () => startChallengeCallback(challenge));
        challengesList.appendChild(challengeDiv);
    });

    challengesContainer.classList.remove('hidden');
}



// --- 3. دوال خاصة بالاختبار ---

export function updateProgress(current, total, isEnd = false) {
    progressCounter.textContent = `السؤال ${current} من ${total}`;
    progressBar.style.width = `${(current / total) * 100}%`;
    if (isEnd) {
        progressCounter.textContent = `اكتمل الاختبار!`;
    }
}

export function showFeedback(isCorrect, correctAnswerText) {
    feedbackArea.classList.remove('hidden');
    feedbackArea.textContent = isCorrect ? 'إجابة صحيحة! أحسنت.' : `إجابة خاطئة. الصحيح هو: ${correctAnswerText}`;
    feedbackArea.style.backgroundColor = isCorrect ? '#d4edda' : '#f8d7da';
    feedbackArea.style.color = isCorrect ? '#155724' : '#721c24';
}

export function markAnswer(clickedElement, isCorrect) {
    if (!clickedElement) return;
    const correctClass = 'correct-answer';
    const wrongClass = 'wrong-answer';
    
    clickedElement.classList.add(isCorrect ? correctClass : wrongClass);
    
    if (!isCorrect) {
        // هذا الجزء يمكن تحسينه ليعمل بشكل أفضل مع كل أنواع الأسئلة
        // لكنه يظل كافياً للحالة العامة
    }
}

export function disableQuestionInteraction() {
    questionArea.querySelectorAll('button, .choice-box, .option-div, .number-box').forEach(el => {
        el.style.pointerEvents = 'none';
    });
}


// --- 4. دوال خاصة بالنتائج ومراجعة الأخطاء ---

export function displayErrorReview(errors) {
    errorList.innerHTML = '';
    errors.forEach(error => {
        const item = document.createElement('div');
        item.className = 'error-review-item';
        item.innerHTML = `<h4>سؤال خاطئ</h4>
                          <div>${error.questionHTML.replace(/<button.*<\/button>/g, '')}</div>
                          <p>الإجابة الصحيحة: <span class="correct-text">${error.correctAnswer}</span></p>`;
        item.querySelectorAll('.choice-box, .option-div, .number-box').forEach(el => {
            el.style.pointerEvents = 'none';
        });
        errorList.appendChild(item);
    });
    showScreen(errorReviewScreen);
}

export function displayFinalResult(quizState, levelUpInfo) {
    document.getElementById('resultName').textContent = quizState.userName;
    document.getElementById('finalScore').textContent = `${quizState.score} من ${quizState.totalQuestions}`;
    document.getElementById('xpGained').textContent = quizState.xpEarned;

    const levelUpMessage = document.getElementById('level-up-message');
    if (levelUpInfo) {
        levelUpMessage.textContent = `🎉 ترقية! لقد وصلت إلى المستوى ${levelUpInfo.level} (${levelUpInfo.title}) وكسبت ${levelUpInfo.reward} ألماسة!`;
        levelUpMessage.classList.remove('hidden');
    } else {
        levelUpMessage.classList.add('hidden');
    }
    
    showScreen(resultScreen);
}

export function updateSaveMessage(isSuccess) {
    const statusEl = document.getElementById('save-status');
    if (isSuccess) {
        statusEl.textContent = 'تم حفظ تقدمك بنجاح في السحابة.';
        statusEl.style.color = '#155724';
    } else {
        statusEl.textContent = 'فشل حفظ التقدم. سيتم المحاولة لاحقاً.';
        statusEl.style.color = '#721c24';
    }
}


// --- 5. دوال خاصة بالمتجر وتأثيراته ---

export function displayStore(storeItems, playerData, purchaseCallback) {
    playerDiamondsDisplay.innerHTML = `${playerData.diamonds} 💎`;
    storeItemsContainer.innerHTML = '';

    if (!storeItems || storeItems.length === 0) {
        storeItemsContainer.innerHTML = '<p>المتجر فارغ حاليًا. عد لاحقًا!</p>';
        return;
    }

    storeItems.forEach(item => {
        const hasItem = playerData.inventory.includes(item.id);
        const canAfford = playerData.diamonds >= item.price;

        const itemDiv = document.createElement('div');
        itemDiv.className = 'store-item';
        if (hasItem) itemDiv.classList.add('owned-item');

        itemDiv.innerHTML = `
            <h4>${item.name}</h4>
            <p>${item.description}</p>
            <div class="item-price">السعر: ${item.price} 💎</div>
            <button class="buy-button" data-item-id="${item.id}" ${hasItem || !canAfford ? 'disabled' : ''}>
                ${hasItem ? 'تم الشراء' : (canAfford ? 'شراء' : 'لا يوجد ألماس كافٍ')}
            </button>
        `;

        if (!hasItem && canAfford) {
            const buyButton = itemDiv.querySelector('.buy-button');
            buyButton.addEventListener('click', () => purchaseCallback(item.id));
        }
        storeItemsContainer.appendChild(itemDiv);
    });
}

// تعديل: تحديث دالة تطبيق تأثيرات الممتلكات لتكون أكثر شمولية
export function applyInventoryEffects(inventory, storeItems) {
    console.log("تطبيق تأثيرات الممتلكات:", inventory);
    
    document.body.className = ''; // يزيل كل كلاسات الثيمات السابقة
    qariSelect.querySelectorAll('option[data-locked="true"]').forEach(opt => {
        opt.hidden = true;
    });

    const ownedItems = storeItems.filter(item => inventory.includes(item.id));

    ownedItems.forEach(item => {
        switch (item.type) {
            case 'theme':
                document.body.classList.add(item.value);
                console.log(`تم تطبيق الثيم: ${item.value}`);
                break;
            
            case 'qari':
                const qariOption = qariSelect.querySelector(`option[value="${item.value}"]`);
                if (qariOption) {
                    qariOption.hidden = false;
                    qariOption.textContent = qariOption.textContent.replace(/\(.*\)/, '(متاح)');
                }
                break;
            
            // الأنواع الأخرى مثل 'page', 'question', 'q_count' يتم التعامل معها في منطق بدء الاختبار
            // لذا لا نحتاج لعمل شيء هنا
        }
    });
}

export function initializeLockedOptions() {
    qariSelect.querySelectorAll('option[data-locked="true"]').forEach(opt => {
        opt.hidden = true;
    });
    // مثال:
    const husaryOption = qariSelect.querySelector('option[value="ar.husary"]');
    if (husaryOption) {
        husaryOption.dataset.locked = "true";
        husaryOption.hidden = true;
    }
}

