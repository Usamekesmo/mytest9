// =============================================================
// ==      الملف الرئيسي (نقطة انطلاق التطبيق والغراء)        ==
// ==      (النسخة النهائية الشاملة لكل الميزات)            ==
// =============================================================

import * as ui from './ui.js';
import { fetchPageData, fetchActiveChallenges, fetchLeaderboard } from './api.js';
import * as quiz from './quiz.js';
import * as player from './player.js';
import * as progression from './progression.js';
import * as store from './store.js';
import * as achievements from './achievements.js';
import { surahMetadata } from './quran-metadata.js';

let activeChallenges = [];
const themeToggleButton = document.getElementById('themeToggleButton');

// --- دوال نظام السمات (Themes) ---
/**
 * يقوم بتبديل السمة بين الفاتح والداكن وحفظ الاختيار.
 */
function toggleTheme() {
    const body = document.body;
    body.classList.toggle('theme-dark');

    if (body.classList.contains('theme-dark')) {
        themeToggleButton.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    } else {
        themeToggleButton.textContent = '🌙';
        localStorage.setItem('theme', 'light');
    }
}

/**
 * يقوم بتطبيق السمة المحفوظة عند بدء تشغيل التطبيق.
 */
function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('theme-dark');
        themeToggleButton.textContent = '☀️';
    } else {
        themeToggleButton.textContent = '🌙';
    }
}


// --- 1. دالة التهيئة الرئيسية ---
async function initialize() {
    console.log("التطبيق قيد التشغيل...");
    applySavedTheme();
    ui.toggleLoader(true);
    ui.initializeLockedOptions();
    
    [activeChallenges] = await Promise.all([
        fetchActiveChallenges(),
        quiz.initializeQuiz(),
        progression.initializeProgression(),
        achievements.initializeAchievements()
    ]);
    
    const rules = progression.getGameRules();
    if (rules) {
        ui.displayChallenges(activeChallenges, startChallenge);
    }
    
    console.log("تم جلب جميع الإعدادات. التطبيق جاهز.");
    setupEventListeners();
    ui.toggleLoader(false);
    ui.showScreen(ui.startScreen);
}

// --- 2. ربط الأحداث (Event Listeners) ---
function setupEventListeners() {
    ui.startButton.addEventListener('click', onStartButtonClick);
    ui.reloadButton.addEventListener('click', () => location.reload());
    
    ui.storeButton.addEventListener('click', onStoreButtonClick);
    ui.closeStoreButton.addEventListener('click', () => ui.showScreen(ui.startScreen));
    
    ui.leaderboardButton.addEventListener('click', onLeaderboardButtonClick);
    ui.closeLeaderboardButton.addEventListener('click', () => ui.showScreen(ui.startScreen));

    ui.showFinalResultButton.addEventListener('click', () => {
        const quizState = quiz.getCurrentState();
        const oldXp = player.playerData.xp - quizState.xpEarned;
        const levelUpInfo = progression.checkForLevelUp(oldXp, player.playerData.xp);
        ui.displayFinalResult(quizState, levelUpInfo);
    });

    themeToggleButton.addEventListener('click', toggleTheme);
}

// --- 3. دوال التحكم الرئيسية ---

async function onStartButtonClick() {
    const userName = ui.userNameInput.value.trim();
    if (!userName) {
        alert("يرجى إدخال اسمك للمتابعة.");
        return;
    }

    if (!player.playerData.name || player.playerData.name !== userName) {
        ui.toggleLoader(true);
        const playerLoaded = await player.loadPlayer(userName);
        ui.toggleLoader(false);
        if (!playerLoaded) {
            alert("فشل تحميل بيانات اللاعب. يرجى المحاولة مرة أخرى.");
            return;
        }
    }
    
    const levelInfo = progression.getLevelInfo(player.playerData.xp);
    ui.updatePlayerDisplay(player.playerData, levelInfo);

    const rules = progression.getGameRules();
    const allowedPages = rules.allowedPages || [];
    const purchasedPages = player.playerData.inventory
        .map(id => progression.getStoreItems().find(item => item.id === id))
        .filter(item => item && item.type === 'page')
        .map(item => parseInt(item.value, 10));
    ui.populatePageSelect(allowedPages, purchasedPages);

    const maxQuestions = progression.getMaxQuestionsForLevel(levelInfo.level);
    ui.updateQuestionsCountOptions(maxQuestions);

    const selectedPage = ui.pageSelect.value;
    if (!selectedPage) {
        alert("يرجى اختيار صفحة لبدء الاختبار.");
        return;
    }

    startTestWithSettings({
        pageNumber: parseInt(selectedPage, 10),
        qari: ui.qariSelect.value,
        questionsCount: parseInt(ui.questionsCountSelect.value, 10),
        userName: userName
    });
}

function onStoreButtonClick() {
    if (!player.playerData.name) {
        alert("يرجى تسجيل الدخول أولاً لزيارة المتجر.");
        return;
    }
    store.openStore();
}

async function onLeaderboardButtonClick() {
    if (!player.playerDatalogin) {
        alert("يرجى تسجيل الدخول أولاً لعرض لوحة الصدارة.");
        return;
    }
    ui.toggleLoader(true);
    const leaderboardData = await fetchLeaderboard();
    ui.toggleLoader(false);
    if (leaderboardData) {
        ui.displayLeaderboard(leaderboardData);
        ui.showScreen(ui.leaderboardScreen);
    } else {
        alert("تعذر تحميل لوحة الصدارة. يرجى المحاولة مرة أخرى.");
    }
}

async function startChallenge(challengeId) {
    const userName = ui.userNameInput.value.trim();
    if (!userName) {
        alert("يرجى إدخال اسمك أولاً لبدء التحدي.");
        ui.userNameInput.focus();
        return;
    }
    if (!player.playerData.name || player.playerData.name !== userName) {
        alert("جاري تسجيل الدخول... يرجى الضغط على زر التحدي مرة أخرى بعد التحميل.");
        await onStartButtonClick();
        if (!player.playerData.name) return;
    }

    const challenge = activeChallenges.find(c => c.challengeId === challengeId);
    if (!challenge) {
        alert("عفواً، حدث خطأ ولم يتم العثور على هذا التحدي.");
        return;
    }

    let pageNumber;
    const contentType = challenge.contentType;
    const contentValue = challenge.allowedContent;

    if (contentType === 'page') {
        pageNumber = parseInt(contentValue, 10);
    } else if (contentType === 'surah') {
        const surahData = surahMetadata[contentValue];
        if (surahData) {
            pageNumber = Math.floor(Math.random() * (surahData.endPage - surahData.startPage + 1)) + surahData.startPage;
        }
    }

    if (!pageNumber || isNaN(pageNumber)) {
        alert(`عفواً، هناك خطأ في إعدادات هذا التحدي.`);
        console.error("فشل في تحديد رقم الصفحة للتحدي:", challenge);
        return;
    }

    const qari = ui.qariSelect.value;
    const questionsCount = parseInt(challenge.questionsCount, 10);
    if (!questionsCount || isNaN(questionsCount)) {
        alert(`عفواً، هناك خطأ في إعدادات التحدي (عدد الأسئلة غير صالح).`);
        return;
    }

    console.log(`بدء التحدي: ${challenge.challengeName}. تم تحديد الصفحة: ${pageNumber}.`);
    startTestWithSettings({
        pageNumber,
        qari,
        questionsCount,
        userName,
        isChallenge: true
    });
}

async function startTestWithSettings(settings) {
    if (!settings.pageNumber || isNaN(settings.pageNumber)) {
        alert("رقم الصفحة غير صالح. يرجى تحديد صفحة من القائمة.");
        return;
    }
    ui.toggleLoader(true);
    const pageAyahs = await fetchPageData(settings.pageNumber);
    ui.toggleLoader(false);
    if (pageAyahs && pageAyahs.length > 0) {
        quiz.start({
            pageAyahs: pageAyahs,
            selectedQari: settings.qari,
            totalQuestions: settings.questionsCount,
            userName: settings.userName,
            pageNumber: settings.pageNumber
        });
    } else {
        alert(`تعذر تحميل بيانات الصفحة ${settings.pageNumber}. قد تكون الصفحة غير موجودة أو هناك مشكلة في الشبكة.`);
    }
}

// --- 4. تشغيل التطبيق ---
initialize();
