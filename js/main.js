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
    ui.showFinalResultButton.addEventListener('click', () => {
        const quizState = quiz.getCurrentState();
        const oldXp = player.playerData.xp - quizState.xpEarned;
        const levelUpInfo = progression.checkForLevelUp(oldXp, player.playerData.xp);
        ui.displayFinalResult(quizState, levelUpInfo);
    });
}

// --- 3. دوال التحكم الرئيسية ---

/**
 * ▼▼▼ النسخة النهائية والمعدلة لحل مشكلة الصفحات المشتراة ▼▼▼
 */
async function onStartButtonClick() {
    console.clear();
    console.log("========================================");
    console.log("===== بدء عملية التحقق من تقييد الصفحات =====");
    console.log("========================================");

    const userName = ui.userNameInput.value.trim();
    if (!userName) {
        alert("يرجى إدخال اسمك للمتابعة.");
        return;
    }

    // تحميل بيانات اللاعب أولاً
    ui.toggleLoader(true);
    const playerLoaded = await player.loadPlayer(userName);
    ui.toggleLoader(false);

    if (!playerLoaded) {
        alert("فشل تحميل بيانات اللاعب. يرجى المحاولة مرة أخرى.");
        return;
    }
    
    const levelInfo = progression.getLevelInfo(player.playerData.xp);
    ui.updatePlayerDisplay(player.playerData, levelInfo);

    console.log("1. اسم المستخدم:", userName);

    const pageNumber = parseInt(ui.pageNumberInput.value, 10);
    if (!pageNumber || isNaN(pageNumber)) {
        alert("يرجى إدخال رقم صفحة صحيح.");
        return;
    }
    console.log("2. رقم الصفحة المدخل:", pageNumber);

    // --- الجزء الأهم: فحص القواعد ودمج ممتلكات اللاعب ---
    const rules = progression.getGameRules();
    
    console.log("3. فحص كائن 'rules' الذي تم جلبه من progression.js:");
    if (!rules) {
        console.error("خطأ فادح: كائن 'rules' نفسه فارغ أو null. لن تعمل أي قيود.");
        alert("خطأ: لم يتم تحميل قواعد اللعبة.");
        return;
    }
    console.log("   -> محتوى الكائن 'rules':", JSON.parse(JSON.stringify(rules)));

    console.log("4. بدء منطق التحقق من الصفحة...");

    // 4.1. جلب الصفحات المسموح بها من القواعد العامة
    const baseAllowedPages = (rules.allowedPages && Array.isArray(rules.allowedPages)) ? rules.allowedPages : [];
    console.log("   -> الصفحات المسموحة من الخادم:", baseAllowedPages);

    // 4.2. استخراج الصفحات التي يمتلكها اللاعب من ممتلكاته
    const ownedPages = player.playerData.inventory
        .filter(itemId => itemId.startsWith('page_')) // فلترة الممتلكات لتشمل الصفحات فقط
        .map(itemId => parseInt(itemId.split('_')[1], 10)) // استخراج رقم الصفحة
        .filter(num => !isNaN(num)); // التأكد من أن الناتج رقم صحيح
    console.log("   -> الصفحات المملوكة للاعب:", ownedPages);

    // 4.3. دمج القائمتين في قائمة نهائية واحدة بدون تكرار
    const finalAllowedPages = [...new Set([...baseAllowedPages, ...ownedPages])];
    console.log("   -> القائمة النهائية للصفحات المسموحة:", finalAllowedPages);

    // 4.4. التحقق من الصفحة المدخلة مقابل القائمة النهائية
    // يتم التحقق فقط إذا كانت هناك أي قيود على الإطلاق (إذا كانت المصفوفة النهائية تحتوي على عناصر)
    if (finalAllowedPages.length > 0) {
        if (!finalAllowedPages.includes(pageNumber)) {
            console.log(`   -> التحقق: الرقم ${pageNumber} غير موجود في القائمة النهائية. سيتم حظر الصفحة.`);
            const availablePagesMessage = `الصفحات المتاحة لك هي: ${finalAllowedPages.sort((a, b) => a - b).join(', ')}`;
            alert(`عفواً، الاختبار على الصفحة ${pageNumber} غير متاح حالياً. ${availablePagesMessage}`);
            return;
        } else {
            console.log(`   -> التحقق: الرقم ${pageNumber} موجود في القائمة النهائية. سيتم السماح بالصفحة.`);
        }
    } else {
        console.warn("   -> لا توجد أي قيود على الصفحات. سيتم السماح بكل الصفحات.");
    }

    console.log("5. نهاية عملية التحقق. إذا وصلت إلى هنا، فهذا يعني أنه تم السماح بالصفحة.");
    
    // إذا نجح كل شيء، ابدأ الاختبار
    console.log("6. بدء الاختبار الفعلي...");
    startTestWithSettings({
        pageNumber: pageNumber,
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
        alert(`عفواً، هناك خطأ في إعدادات هذا التحدي. المحتوى المحدد ('${contentValue}') غير صالح لنوع التحدي ('${contentType}').`);
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
    ui.toggleLoader(true);
    const pageAyahs = await fetchPageData(settings.pageNumber);
    ui.toggleLoader(false);
    if (pageAyahs) {
        quiz.start({
            pageAyahs: pageAyahs,
            selectedQari: settings.qari,
            totalQuestions: settings.questionsCount,
            userName: settings.userName,
            pageNumber: settings.pageNumber
        });
    }
}

// --- 4. تشغيل التطبيق ---
initialize();
