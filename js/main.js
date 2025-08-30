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
const themeToggleButton = document.getElementById('themeToggleButton'); 
let activeChallenges = [];

// --- 1. دالة التهيئة الرئيسية ---
async function initialize() {
    console.log("التطبيق قيد التشغيل...");
    applySavedTheme(); //  <-- إضافة هذا السطر هنا في البداية
    ui.toggleLoader(true);
    ui.toggleLoader(true);
    ui.initializeLockedOptions();
    
    // جلب كل الإعدادات والبيانات الأولية بالتوازي
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

    // تحميل بيانات اللاعب إذا لم يتم تحميلها أو إذا تغير الاسم
    if (!player.playerData.name || player.playerData.name !== userName) {
        ui.toggleLoader(true);
        const playerLoaded = await player.loadPlayer(userName);
        ui.toggleLoader(false);
        if (!playerLoaded) {
            alert("فشل تحميل بيانات اللاعب. يرجى المحاولة مرة أخرى.");
            return;
        }
    }
    
    // تحديث واجهة المستخدم ببيانات اللاعب
    const levelInfo = progression.getLevelInfo(player.playerData.xp);
    ui.updatePlayerDisplay(player.playerData, levelInfo);

    // تحديث قائمة الصفحات المتاحة
    const rules = progression.getGameRules();
    const allowedPages = rules.allowedPages || [];
    const purchasedPages = player.playerData.inventory
        .map(id => progression.getStoreItems().find(item => item.id === id))
        .filter(item => item && item.type === 'page')
        .map(item => parseInt(item.value, 10));
    ui.populatePageSelect(allowedPages, purchasedPages);

    // تحديث خيارات عدد الأسئلة
    const maxQuestions = progression.getMaxQuestionsForLevel(levelInfo.level);
    ui.updateQuestionsCountOptions(maxQuestions);

    // التحقق من اختيار صفحة قبل بدء الاختبار
    const selectedPage = ui.pageSelect.value;
    if (!selectedPage) {
        alert("يرجى اختيار صفحة لبدء الاختبار.");
        return;
    }

    // بدء الاختبار بالإعدادات المحددة
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
    if (!player.playerData.name) {
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
    // (منطق بدء التحدي يبقى كما هو)
    // ...
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
    /**
 * يقوم بتبديل السمة بين الفاتح والداكن وحفظ الاختيار.
 */
function toggleTheme() {
    const body = document.body;
    body.classList.toggle('theme-dark');

    // تحديث نص الزر ليعكس الحالة الجديدة
    if (body.classList.contains('theme-dark')) {
        themeToggleButton.textContent = '☀️';
        localStorage.setItem('theme', 'dark'); // حفظ الاختيار
    } else {
        themeToggleButton.textContent = '🌙';
        localStorage.setItem('theme', 'light'); // حفظ الاختيار
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
        // الوضع الفاتح هو الافتراضي، لا حاجة لإضافة فئة
        themeToggleButton.textContent = '🌙';
    }
}

}

// --- 4. تشغيل التطبيق ---
initialize();


