// =============================================================
// ==      الملف الرئيسي (نقطة انطلاق التطبيق والغراء)        ==
// =============================================================

// تعديل 1: استيراد دالة fetchQuranMetadata الجديدة
import * as ui from './ui.js';
import { fetchPageData, fetchActiveChallenges, fetchQuranMetadata } from './api.js';
import * as quiz from './quiz.js';
import * as player from './player.js';
import * as progression from './progression.js';
import * as store from './store.js';
// تعديل 2: حذف استيراد الملف الثابت، لم نعد بحاجة إليه
// import { surahMetadata } from './quran-metadata.js'; 

let activeChallenges = [];
// تعديل 3: إضافة متغير عام جديد لتخزين بيانات السور التي سيتم جلبها
let quranMetadata = {}; 

// --- 1. دالة التهيئة الرئيسية ---


   // في ملف main.js

async function initialize() {
    console.log("التطبيق قيد التشغيل...");
    
    ui.initializeLockedOptions();

    // عرض التحديات أولاً وهي في حالة "غير مفعلة"
    const challengesPromise = fetchActiveChallenges();
    challengesPromise.then(challenges => {
        activeChallenges = challenges;
        ui.displayChallenges(activeChallenges, startChallenge);
    });

    // جلب بقية البيانات بالتوازي
    [quranMetadata] = await Promise.all([
        fetchQuranMetadata(),
        quiz.initializeQuiz(),
        progression.initializeProgression()
    ]);

    if (!quranMetadata) {
        console.error("فشل فادح: لم يتم تحميل بيانات السور. الميزات المتعلقة بالسور لن تعمل.");
        quranMetadata = {};
    }
    
    const rules = progression.getGameRules();
    if (rules) {
        ui.applyGameRules(rules);
    }
    
    // تعديل: تفعيل أزرار التحديات بعد اكتمال كل عمليات التحميل
    console.log("كل البيانات تم تحميلها. تفعيل أزرار التحديات...");
    const challengeButtons = document.querySelectorAll('.challenge-item button');
    challengeButtons.forEach(button => {
        button.disabled = false;
        button.textContent = "ابدأ التحدي";
    });
    
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
}

/**
 * يتم تشغيلها عند النقر على زر "المتجر".
 */
function onStoreButtonClick() {
    if (ui.userNameInput.disabled === false) {
        alert("الرجاء إدخال اسمك وتسجيل الدخول أولاً لزيارة المتجر.");
        return;
    }
    store.openStore();
}

// --- 3. منطق بدء الاختبار وتسجيل الدخول ---
async function onStartButtonClick() {
    const userName = ui.userNameInput.value.trim();
    if (!userName) {
        alert('الرجاء إدخال اسمك أولاً.');
        return;
    }

    // --- الحالة الأولى: تسجيل الدخول ---
    if (ui.userNameInput.disabled === false) {
        ui.toggleLoader(true);
        const playerLoaded = await player.loadPlayer(userName);
        ui.toggleLoader(false);

        if (!playerLoaded) return;

        const allStoreItems = progression.getStoreItems();
        ui.applyInventoryEffects(player.playerData.inventory, allStoreItems);

        const levelInfo = progression.getLevelInfo(player.playerData.xp);
        ui.updatePlayerDisplay(player.playerData, levelInfo);
        ui.userNameInput.disabled = true;
        ui.startButton.textContent = "ابدأ الاختبار";
        alert(`مرحباً بك ${userName}! تم تحميل تقدمك. الآن اختر صفحة وابدأ الاختبار أو شارك في تحدٍ.`);
        return;
    }

    // --- الحالة الثانية: بدء الاختبار العادي ---
    const pageNumberInput = ui.pageNumberInput.value;
    const rules = progression.getGameRules();
    const allStoreItems = progression.getStoreItems();
    const playerInventory = player.playerData.inventory;

    let allowedPages = new Set(String(rules.allowedPages || '').split(',').map(p => p.trim()));
    const purchasedItems = allStoreItems.filter(item => playerInventory.includes(item.id));

    purchasedItems.forEach(item => {
        switch (item.type) {
            case 'page':
                allowedPages.add(String(item.value));
                break;
            case 'range':
                const [start, end] = String(item.value).split('-').map(Number);
                for (let i = start; i <= end; i++) {
                    allowedPages.add(String(i));
                }
                break;
            case 'surah':
                // تعديل 5: الكود هنا سيستخدم الآن المتغير العام الديناميكي `quranMetadata`
                const surahInfo = quranMetadata[item.value];
                if (surahInfo) {
                    for (let i = surahInfo.startPage; i <= surahInfo.endPage; i++) {
                        allowedPages.add(String(i));
                    }
                }
                break;
        }
    });
    
    const finalAllowedPages = Array.from(allowedPages).filter(p => p);

    if (!pageNumberInput || !finalAllowedPages.includes(pageNumberInput)) {
        alert(`الرجاء إدخال رقم صفحة مسموح به فقط. الصفحات المتاحة لك تشمل: ${finalAllowedPages.slice(0, 10).join(', ')}...`);
        return;
    }

    const purchasedQuestionCounts = purchasedItems
        .filter(item => item.type === 'q_count')
        .map(item => parseInt(item.value, 10));
    
    const questionsCount = purchasedQuestionCounts.length > 0 
        ? Math.max(...purchasedQuestionCounts) 
        : (rules.questionsCount || 5);

    startTestWithSettings(pageNumberInput, questionsCount);
}

/**
 * دالة جديدة لبدء اختبار التحدي.
 */
function startChallenge(challenge) {
    if (ui.userNameInput.disabled === false) {
        alert("الرجاء تسجيل الدخول أولاً للمشاركة في التحدي.");
        return;
    }

    let challengePages = [];
    switch (challenge.contentType) {
        case 'page':
            challengePages.push(challenge.allowedContent);
            break;
        case 'range':
            const [start, end] = String(challenge.allowedContent).split('-').map(Number);
            for (let i = start; i <= end; i++) challengePages.push(String(i));
            break;
        case 'surah':
            // تعديل 6: الكود هنا أيضاً سيستخدم المتغير العام الديناميكي `quranMetadata`
            const surahInfo = quranMetadata[challenge.allowedContent];
            if (surahInfo) {
                for (let i = surahInfo.startPage; i <= surahInfo.endPage; i++) challengePages.push(String(i));
            }
            break;
    }

    if (challengePages.length === 0) {
        alert("حدث خطأ في تحديد صفحات التحدي.");
        return;
    }

    const randomPage = challengePages[Math.floor(Math.random() * challengePages.length)];
    console.log(`بدء التحدي "${challenge.challengeName}" من صفحة عشوائية: ${randomPage}`);
    
    startTestWithSettings(randomPage, challenge.questionsCount);
}

/**
 * دالة مساعدة لبدء الاختبار بإعدادات محددة.
 */
async function startTestWithSettings(pageNumber, questionsCount) {
    ui.toggleLoader(true);
    const ayahs = await fetchPageData(pageNumber);
    ui.toggleLoader(false);

    if (ayahs) {
        quiz.start({
            pageAyahs: ayahs,
            totalQuestions: questionsCount,
            selectedQari: ui.qariSelect.value,
            userName: player.playerData.name,
            pageNumber: pageNumber
        });
    }
}

// --- 4. تشغيل التطبيق ---
initialize();

