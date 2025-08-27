// =============================================================
// ==      وحدة إدارة ومنطق الاختبار (المايسترو)             ==
// =============================================================

import * as ui from './ui.js';
import { saveResult, fetchQuestionsConfig } from './api.js';
import { allQuestionGenerators } from './questions.js';
import * as player from './player.js';
import * as progression from './progression.js';

// --- حالة الاختبار (State) ---
let state = {
    pageAyahs: [],
    currentQuestionIndex: 0,
    score: 0,
    totalQuestions: 10,
    selectedQari: 'ar.alafasy',
    errorLog: [],
    userName: '',
    pageNumber: 0,
    xpEarned: 0
};

// مصفوفات لتخزين دوال الأسئلة
let allQuestionFunctions = []; // سيحتوي على كل الأسئلة المتاحة في الكود
let defaultActiveFunctions = []; // الأسئلة المفعلة افتراضياً من لوحة التحكم

const shuffleArray = array => [...array].sort(() => 0.5 - Math.random());

/**
 * دالة تهيئة وحدة الاختبار.
 * تقوم بجلب إعدادات الأسئلة من لوحة التحكم وتجهيز قائمة الأسئلة المفعّلة افتراضياً.
 */
export async function initializeQuiz() {
    console.log("جاري تهيئة وحدة الاختبار وجلب إعدادات الأسئلة...");
    const config = await fetchQuestionsConfig();
    
    // تعبئة قائمة بكل دوال الأسئلة الممكنة من الكود
    allQuestionFunctions = Object.values(allQuestionGenerators);

    if (config && config.length > 0) {
        // بناء مصفوفة الدوال المفعّلة افتراضياً بناءً على الإعدادات المجلوبة
        defaultActiveFunctions = config
            .map(q => allQuestionGenerators[q.id])
            .filter(f => typeof f === 'function'); // filter لإزالة أي دوال غير موجودة
        console.log(`تم تفعيل ${defaultActiveFunctions.length} نوع من الأسئلة افتراضياً.`);
    } else {
        // في حالة الفشل، استخدم كل الأسئلة المتاحة محلياً كخطة بديلة
        console.warn("فشل جلب إعدادات الأسئلة، سيتم استخدام كل الأسئلة المتاحة محلياً كإعداد افتراضي.");
        defaultActiveFunctions = allQuestionFunctions;
    }

    if (defaultActiveFunctions.length === 0) {
        alert("خطأ فادح: لا توجد أي أسئلة مفعّلة افتراضياً! يرجى مراجعة لوحة التحكم.");
    }
}

/**
 * يبدأ اختبارًا جديدًا بالإعدادات المحددة.
 * @param {object} settings - كائن يحتوي على إعدادات الاختبار.
 */
export function start(settings) {
    // إعادة تعيين حالة الاختبار مع الإعدادات الجديدة
    state = {
        ...state,
        ...settings,
        score: 0,
        currentQuestionIndex: 0,
        errorLog: [],
        xpEarned: 0
    };
    
    ui.showScreen(ui.quizScreen);
    displayNextQuestion();
}

/**
 * يعرض السؤال التالي أو ينهي الاختبار إذا اكتملت الأسئلة.
 */
function displayNextQuestion() {
    if (state.currentQuestionIndex >= state.totalQuestions) {
        endQuiz();
        return;
    }

    state.currentQuestionIndex++;
    ui.updateProgress(state.currentQuestionIndex, state.totalQuestions);
    ui.feedbackArea.classList.add('hidden');

    // --- منطق اختيار السؤال بناءً على المشتريات ---
    const allStoreItems = progression.getStoreItems();
    const playerInventory = player.playerData.inventory;

    // تحديد أسماء دوال الأسئلة التي اشتراها اللاعب
    const purchasedQuestionFuncNames = allStoreItems
        .filter(item => playerInventory.includes(item.id) && item.type === 'question')
        .map(item => item.value);

    // تحويل أسماء الدوال إلى دوال فعلية
    const purchasedQuestionFuncs = Object.keys(allQuestionGenerators)
        .filter(key => purchasedQuestionFuncNames.includes(key))
        .map(key => allQuestionGenerators[key]);

    // دمج الأسئلة الافتراضية مع المشتراة (باستخدام Set لإزالة التكرار)
    const availableFunctions = [...new Set([...defaultActiveFunctions, ...purchasedQuestionFuncs])];

    if (availableFunctions.length === 0) {
        alert("لا يمكن عرض السؤال لعدم وجود أسئلة مفعّلة لك.");
        ui.showScreen(ui.startScreen); // العودة للشاشة الرئيسية
        return;
    }
    
    // اختيار دالة سؤال عشوائية من القائمة المتاحة
    const randomGenerator = shuffleArray(availableFunctions)[0];
    const question = randomGenerator(state.pageAyahs, state.selectedQari, handleResult);

    if (question) {
        ui.questionArea.innerHTML = question.questionHTML;
        question.setupListeners(ui.questionArea);
    } else {
        console.warn(`فشل مولد الأسئلة ${randomGenerator.name} في إنشاء سؤال. يتم المحاولة مرة أخرى.`);
        displayNextQuestion(); // حاول مرة أخرى بسؤال مختلف
    }
}

/**
 * يتعامل مع إجابة المستخدم.
 * @param {boolean} isCorrect - هل الإجابة صحيحة؟
 * @param {string} correctAnswerText - نص الإجابة الصحيحة.
 * @param {HTMLElement} clickedElement - العنصر الذي تم النقر عليه.
 */
function handleResult(isCorrect, correctAnswerText, clickedElement) {
    ui.disableQuestionInteraction();
    const rules = progression.getGameRules();

    if (isCorrect) {
        state.score++;
        state.xpEarned += rules.xpPerCorrectAnswer || 0;
        ui.markAnswer(clickedElement, true);
    } else {
        state.errorLog.push({
            questionHTML: ui.questionArea.innerHTML,
            correctAnswer: correctAnswerText
        });
        ui.markAnswer(clickedElement, false);
    }

    ui.showFeedback(isCorrect, correctAnswerText);
    setTimeout(displayNextQuestion, 3000);
}

/**
 * ينهي الاختبار، يحسب النتائج، يحفظ البيانات، ويعرض الشاشة النهائية.
 */
async function endQuiz() {
    ui.updateProgress(state.totalQuestions, state.totalQuestions, true);
    const rules = progression.getGameRules();

    // مكافأة الأداء المثالي
    if (state.score === state.totalQuestions) {
        state.xpEarned += rules.xpBonusAllCorrect || 0;
        player.playerData.diamonds += rules.diamondsBonusAllCorrect || 0;
        console.log("مكافأة الأداء المثالي: تم إضافة نقاط وألماس.");
    }

    // مكافأة إنجاز الاختبارات اليومية
    player.playerData.dailyQuizzes.count++;
    if (player.playerData.dailyQuizzes.count === rules.dailyQuizzesGoal) {
        state.xpEarned += rules.dailyQuizzesBonusXp || 0;
        console.log("مكافأة الهدف اليومي: تم إضافة نقاط خبرة إضافية.");
    }
    
    // تحديث بيانات اللاعب الإجمالية
    const oldXp = player.playerData.xp;
    player.playerData.xp += state.xpEarned;

    // التحقق من وجود ترقية في المستوى
    const levelUpInfo = progression.checkForLevelUp(oldXp, player.playerData.xp);
    if (levelUpInfo) {
        player.playerData.diamonds += levelUpInfo.reward;
    }

    // عرض شاشة مراجعة الأخطاء أو النتيجة النهائية
    if (state.errorLog.length > 0) {
        ui.displayErrorReview(state.errorLog);
    } else {
        ui.displayFinalResult(state, levelUpInfo);
    }

    // حفظ كل شيء في السحابة
    ui.updateSaveMessage(false); // جاري الحفظ...
    await player.savePlayer();
    await saveResult(state);
    ui.updateSaveMessage(true); // تم الحفظ بنجاح
}

// ربط الزر في شاشة مراجعة الأخطاء لعرض النتيجة النهائية
ui.showFinalResultButton.addEventListener('click', () => {
    const oldXp = player.playerData.xp - state.xpEarned;
    const levelUpInfo = progression.checkForLevelUp(oldXp, player.playerData.xp);
    ui.displayFinalResult(state, levelUpInfo);
});
