// =============================================================
// ==      الملف الرئيسي (نقطة انطلاق التطبيق والغراء)        ==
// =============================================================

import * as ui from './ui.js';
import { fetchPageData, fetchActiveChallenges } from './api.js';
import * as quiz from './quiz.js';
import * as player from './player.js';
import * as progression from './progression.js';
import * as store from './store.js';
import { surahMetadata } from './quran-metadata.js';

let activeChallenges = [];

// --- 1. دالة التهيئة الرئيسية ---
async function initialize() {
    console.log("التطبيق قيد التشغيل...");
    
    ui.initializeLockedOptions();

    [activeChallenges] = await Promise.all([
        fetchActiveChallenges(),
        quiz.initializeQuiz(),
        progression.initializeProgression()
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

    // ▼▼▼ هذا هو المكان الصحيح والآمن لإضافة ربط الحدث ▼▼▼
    ui.showFinalResultButton.addEventListener('click', () => {
        // هذا الكود تم نقله من ملف quiz.js
        const quizState = quiz.getCurrentState(); // سنحتاج لإضافة دالة مساعدة في quiz.js
        const oldXp = player.playerData.xp - quizState.xpEarned;
        const levelUpInfo = progression.checkForLevelUp(oldXp, player.playerData.xp);
        ui.displayFinalResult(quizState, levelUpInfo);
    });
}

// ... (بقية الملف يبقى كما هو) ...
// ... onStoreButtonClick, onStartButtonClick, startChallenge, startTestWithSettings ...

// --- 4. تشغيل التطبيق ---
initialize();
