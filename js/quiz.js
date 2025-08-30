// =============================================================
// ==      وحدة إدارة ومنطق الاختبار (المايسترو)             ==
// ==      (محدثة لتتكامل مع نظام الإنجازات)                  ==
// =============================================================

import * as ui from './ui.js';
import { saveResult } from './api.js';
import { fetchQuestionsConfig } from './api.js';
import { allQuestionGenerators } from './questions.js';
import * as player from './player.js';
import * as progression from './progression.js';
import * as achievements from './achievements.js'; // ▼▼▼ تم التعديل: استيراد وحدة الإنجازات ▼▼▼

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
    xpEarned: 0,
    isChallenge: false // تمت إضافة هذه الخاصية لتتبع التحديات
};

let activeQuestionFunctions = [];
const shuffleArray = array => [...array].sort(() => 0.5 - Math.random());

export async function initializeQuiz() {
    console.log("جاري تهيئة وحدة الاختبار وجلب إعدادات الأسئلة...");
    const config = await fetchQuestionsConfig();
    
    if (config && config.length > 0) {
        activeQuestionFunctions = config
            .map(q => allQuestionGenerators[q.id])
            .filter(f => typeof f === 'function');
        console.log(`تم تفعيل ${activeQuestionFunctions.length} نوع من الأسئلة.`);
    } else {
        console.warn("فشل جلب إعدادات الأسئلة، سيتم استخدام كل الأسئلة المتاحة محلياً.");
        activeQuestionFunctions = Object.values(allQuestionGenerators);
    }

    if (activeQuestionFunctions.length === 0) {
        alert("خطأ فادح: لا توجد أي أسئلة مفعّلة! يرجى مراجعة لوحة التحكم.");
    }
}

export function start(settings) {
    // إعادة تعيين الحالة مع الإعدادات الجديدة
    state = {
        ...state, // يحتفظ بالقيم الافتراضية مثل errorLog: []
        ...settings,
        score: 0,
        currentQuestionIndex: 0,
        errorLog: [],
        xpEarned: 0
    };
    
    ui.showScreen(ui.quizScreen);
    displayNextQuestion();
}

function displayNextQuestion() {
    if (state.currentQuestionIndex >= state.totalQuestions) {
        endQuiz();
        return;
    }

    state.currentQuestionIndex++;
    ui.updateProgress(state.currentQuestionIndex, state.totalQuestions);
    ui.feedbackArea.classList.add('hidden');

    if (activeQuestionFunctions.length === 0) {
        alert("لا يمكن عرض السؤال لعدم وجود أسئلة مفعّلة.");
        return;
    }
    
    const randomGenerator = shuffleArray(activeQuestionFunctions)[0];
    const question = randomGenerator(state.pageAyahs, state.selectedQari, handleResult);

    if (question) {
        ui.questionArea.innerHTML = question.questionHTML;
        question.setupListeners(ui.questionArea);
    } else {
        console.warn(`فشل مولد الأسئلة ${randomGenerator.name} في إنشاء سؤال. يتم المحاولة مرة أخرى.`);
        displayNextQuestion();
    }
}

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

async function endQuiz() {
    ui.updateProgress(state.totalQuestions, state.totalQuestions, true);
    const rules = progression.getGameRules();

    // ▼▼▼ تم التعديل: زيادة عداد الاختبارات والتحقق من الإنجازات ▼▼▼
    player.playerData.totalQuizzesCompleted++;

    achievements.checkAchievements('quiz_completed', {
        score: state.score,
        totalQuestions: state.totalQuestions,
        isChallenge: state.isChallenge,
        pageNumber: state.pageNumber
    });
    // ▲▲▲ نهاية التعديل ▲▲▲

    if (state.score === state.totalQuestions) {
        state.xpEarned += rules.xpBonusAllCorrect || 0;
        player.playerData.diamonds += rules.diamondsBonusAllCorrect || 0;
        console.log("مكافأة الأداء المثالي: تم إضافة نقاط وألماس.");
    }

    player.playerData.dailyQuizzes.count++;
    if (player.playerData.dailyQuizzes.count === rules.dailyQuizzesGoal) {
        state.xpEarned += rules.dailyQuizzesBonusXp || 0;
        console.log("مكافأة الهدف اليومي: تم إضافة نقاط خبرة إضافية.");
    }
    
    const oldXp = player.playerData.xp;
    player.playerData.xp += state.xpEarned;

    const levelUpInfo = progression.checkForLevelUp(oldXp, player.playerData.xp);
    if (levelUpInfo) {
        player.playerData.diamonds += levelUpInfo.reward;
    }

    if (state.errorLog.length > 0) {
        ui.displayErrorReview(state.errorLog);
    } else {
        ui.displayFinalResult(state, levelUpInfo);
    }

    await player.savePlayer();
    await saveResult(state);
    ui.updateSaveMessage(true);
}

/**
 * دالة مساعدة جديدة لتصدير حالة الاختبار الحالية.
 * @returns {object} - كائن حالة الاختبار.
 */
export function getCurrentState() {
    return state;
}
