// =============================================================
// ==      الملف الرئيسي (نقطة انطلاق التطبيق والغراء)        ==
// ==      (محدث ليربط كل الميزات الجديدة معًا)               ==
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

// --- 1. دالة التهيئة الرئيسية ---
async function initialize() {
    console.log("التطبيق قيد التشغيل...");
    ui.initializeLockedOptions();
    
    // جلب كل الإعدادات بالتوازي لزيادة سرعة التحميل
    [activeChallenges] = await Promise.all([
        fetchActiveChallenges(),
        quiz.initializeQuiz(),
        progression.initializeProgression(),
        achievements.initializeAchievements()
    ]);

    const rules = progression.getGameRules();
    if (rules) {
        ui.applyGameRules(rules);
    }
    ui.displayChallenges(activeChallenges, startChallenge);
    console.log("تم جلب جميع الإعدادات وتطبيق القواعد. التطبيق جاهز.");
    setupEventListeners();
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
}

// --- 3. دوال التحكم الرئيسية ---

async function onStartButtonClick() {
    const userName = ui.userNameInput.value.trim();
    if (!userName) {
        alert("يرجى إدخال اسمك للمتابعة.");
        return;
    }

    // إذا لم يتم تحميل اللاعب بعد، أو تم تغيير الاسم، قم بالتحميل
    if (!player.playerData.name || player.playerData.name !== userName) {
        ui.toggleLoader(true);
        const playerLoaded = await player.loadPlayer(userName);
        ui.toggleLoader(false);

        if (!playerLoaded) {
            alert("فشل تحميل بيانات اللاعب. يرجى المحاولة مرة أخرى.");
            return;
        }
        
        const levelInfo = progression.getLevelInfo(player.playerData.xp);
        ui.updatePlayerDisplay(player.playerData, levelInfo);

        // حساب وتعبئة الصفحات المتاحة بعد تحميل اللاعب
        const rules = progression.getGameRules();
        const baseAllowedPages = (rules.allowedPages && Array.isArray(rules.allowedPages)) ? rules.allowedPages : [];
        const ownedPages = player.playerData.inventory
            .filter(itemId => itemId.startsWith('page_'))
            .map(itemId => parseInt(itemId.split('_')[1], 10))
            .filter(num => !isNaN(num));
        const finalAllowedPages = [...new Set([...baseAllowedPages, ...ownedPages])];
        ui.populateAvailablePages(finalAllowedPages);
    }

    // قراءة القيمة من القائمة المنسدلة
    const pageNumber = parseInt(ui.pageSelect.value, 10); 
    if (!pageNumber || isNaN(pageNumber)) {
        alert("يرجى اختيار صفحة من القائمة للمتابعة.");
        return;
    }

    // بدء الاختبار مباشرة لأن القائمة لا تحتوي إلا على صفحات مسموح بها
    startTestWithSettings({
        pageNumber: pageNumber,
        qari: ui.qariSelect.value,
        questionsCount: parseInt(ui.questionsCountSelect.value, 10),
        userName: player.playerData.name,
        isChallenge: false
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
    ui.toggleLoader(true);
    ui.showScreen(ui.leaderboardScreen);
    const topPlayers = await fetchLeaderboard();
    ui.displayLeaderboard(topPlayers);
    ui.toggleLoader(false);
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
        return;
    }

    const questionsCount = parseInt(challenge.questionsCount, 10);
    if (!questionsCount || isNaN(questionsCount)) {
        alert(`عفواً، هناك خطأ في إعدادات التحدي (عدد الأسئلة غير صالح).`);
        return;
    }

    console.log(`بدء التحدي: ${challenge.challengeName}. تم تحديد الصفحة: ${pageNumber}.`);
    startTestWithSettings({
        pageNumber,
        qari: ui.qariSelect.value,
        questionsCount,
        userName: player.playerData.name,
        isChallenge: true // تمرير علامة التحدي
    });
}

// ▼▼▼ تم تعديل هذه الدالة بالكامل ▼▼▼
async function startTestWithSettings(settings) {
    ui.toggleLoader(true);
    const pageAyahs = await fetchPageData(settings.pageNumber);
    ui.toggleLoader(false);

    // التحقق ليس فقط من وجود المصفوفة، بل ومن أنها تحتوي على عناصر
    if (pageAyahs && pageAyahs.length > 0) {
        // تمرير الآيات مباشرة إلى دالة البدء
        quiz.start({ ...settings, pageAyahs: pageAyahs });
    } else {
        // إذا فشل جلب البيانات، أبلغ المستخدم ولا تبدأ الاختبار
        alert(`عفواً، لم نتمكن من جلب بيانات الصفحة ${settings.pageNumber}. قد تكون الصفحة غير موجودة أو هناك مشكلة في الشبكة. يرجى المحاولة مرة أخرى.`);
        console.error("فشل بدء الاختبار لأن بيانات الصفحة فارغة.");
    }
}

// --- 4. تشغيل التطبيق ---
initialize();
