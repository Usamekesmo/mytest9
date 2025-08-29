// =============================================================
// ==      الملف الرئيسي (نقطة انطلاق التطبيق والغراء)        ==
// =============================================================

import * as ui from './ui.js';
import { fetchPageData, fetchActiveChallenges } from './api.js';
import * as quiz from './quiz.js';
import * as player from './player.js';
import * as progression from './progression.js';
import * as store from './store.js';
import { surahMetadata } from './quran-metadata.js'; // يعتمد على الملف الثابت

let activeChallenges = []; // متغير عام لتخزين التحديات النشطة

// --- 1. دالة التهيئة الرئيسية ---
async function initialize() {
    console.log("التطبيق قيد التشغيل...");
    
    ui.initializeLockedOptions();

    // جلب كل الإعدادات والتحديات بالتوازي لزيادة السرعة
    [activeChallenges] = await Promise.all([
        fetchActiveChallenges(),
        quiz.initializeQuiz(),
        progression.initializeProgression()
    ]);
    
    const rules = progression.getGameRules();
    if (rules) {
        ui.applyGameRules(rules);
    }
    
    // عرض التحديات المتاحة وتمرير دالة البدء
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
                const surahInfo = surahMetadata[item.value];
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

// في ملف main.js

/**
 * دالة جديدة لبدء اختبار التحدي (تقبل الـ ID وتبحث عن التحدي).
 * @param {string} challengeId - معرف التحدي الذي تم النقر عليه.
 */
function startChallenge(challengeId) {
    // الخطوة 1: ابحث عن كائن التحدي الكامل باستخدام الـ ID
    const challenge = activeChallenges.find(c => c.challengeId === challengeId);

    // التحقق من العثور على التحدي
    if (!challenge) {
        alert("خطأ: لم يتم العثور على بيانات التحدي. حاول تحديث الصفحة.");
        return;
    }

    if (ui.userNameInput.disabled === false) {
        alert("الرجاء تسجيل الدخول أولاً للمشاركة في التحدي.");
        return;
    }

    // --- بداية الكود التشخيصي (الذي يجب أن يعمل الآن) ---
    console.log("===================================");
    console.log("بدء تشخيص التحدي...");
    console.log("بيانات التحدي التي تم العثور عليها:", challenge);
    console.log("نوع المحتوى (contentType):", challenge.contentType);
    console.log("قيمة المحتوى (allowedContent):", challenge.allowedContent);
    console.log("هل surahMetadata متاح؟", !!surahMetadata);
    // --- نهاية الكود التشخيصي ---

    let challengePages = [];
    const contentType = String(challenge.contentType).trim();
    const allowedContent = String(challenge.allowedContent).trim();

    switch (contentType) {
        case 'page':
            challengePages.push(allowedContent);
            break;
        case 'range':
            const [start, end] = allowedContent.split('-').map(Number);
            for (let i = start; i <= end; i++) {
                challengePages.push(String(i));
            }
            break;
        case 'surah':
            console.log(`البحث عن السورة رقم: "${allowedContent}" في surahMetadata.`);
            const surahInfo = surahMetadata[allowedContent];
            if (surahInfo) {
                console.log("تم العثور على معلومات السورة:", surahInfo);
                for (let i = surahInfo.startPage; i <= surahInfo.endPage; i++) {
                    challengePages.push(String(i));
                }
            } else {
                console.error(`خطأ: لم يتم العثور على معلومات للسورة رقم "${allowedContent}" في surahMetadata.`);
                console.log("مفاتيح العينة من surahMetadata:", Object.keys(surahMetadata).slice(0, 5));
            }
            break;
        default:
            console.error(`نوع المحتوى "${contentType}" غير معروف.`);
    }

    console.log("قائمة الصفحات النهائية التي تم إنشاؤها:", challengePages);
    console.log("===================================");

    if (challengePages.length === 0) {
        alert("حدث خطأ في تحديد صفحات التحدي.");
        return;
    }

    const randomPage = challengePages[Math.floor(Math.random() * challengePages.length)];
    console.log(`بدء التحدي "${challenge.challengeName}" من صفحة عشوائية: ${randomPage}`);
    
    startTestWithSettings(randomPage, challenge.questionsCount);
}

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

