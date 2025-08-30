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
 * ▼▼▼ النسخة التشخيصية النهائية (مصححة من خطأ illegal return statement) ▼▼▼
 */
async function onStartButtonClick() {
    console.clear(); // مسح الكونسول لبداية نظيفة
    console.log("========================================");
    console.log("===== بدء عملية التحقق من تقييد الصفحات =====");
    console.log("========================================");

    const userName = ui.userNameInput.value.trim();
    if (!userName) {
        alert("يرجى إدخال اسمك للمتابعة.");
        return; // هذا return قانوني لأنه داخل شرط
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
    if (!pageNumber) {
        console.log("يرجى إدخال رقم صفحة.");
        return; // هذا return قانوني
    }
    console.log("2. رقم الصفحة المدخل:", pageNumber);

    // --- الجزء الأهم: فحص كائن القواعد بالتفصيل ---
    const rules = progression.getGameRules();
    
    console.log("3. فحص كائن 'rules' الذي تم جلبه من progression.js:");
    if (!rules) {
        console.error("خطأ فادح: كائن 'rules' نفسه فارغ أو null. لن تعمل أي قيود.");
        alert("خطأ: لم يتم تحميل قواعد اللعبة.");
        return; // هذا return قانوني
    }
    
    // طباعة الكائن بالكامل لنرى كل خصائصه
    console.log("   -> محتوى الكائن 'rules':", JSON.parse(JSON.stringify(rules)));

    // --- فحص خاصية 'allowedPages' بالتحديد ---
    console.log("4. فحص خاصية 'allowedPages' (بحرف P كبير):");
    const allowedPagesValue = rules.allowedPages; // الوصول إلى الخاصية بالاسم الصحيح
    
    if (allowedPagesValue === undefined) {
        console.error("   -> النتيجة: الخاصية 'allowedPages' غير موجودة (undefined) في كائن القواعد. هل اسم العمود صحيح في Google Sheet؟");
    } else {
        console.log("   -> القيمة الأولية لـ 'allowedPages':", allowedPagesValue);
        console.log("   -> نوع البيانات الأولي:", typeof allowedPagesValue);
    }

    // --- الآن، نبدأ منطق التحقق الفعلي ---
    console.log("5. بدء منطق التحقق من الصفحة...");
    
    // الشرط الذي يجب أن يعمل
    if (allowedPagesValue && Array.isArray(allowedPagesValue) && allowedPagesValue.length > 0) {
        
        console.log("   -> الشرط تحقق: 'allowedPages' هي مصفوفة وغير فارغة.");
        console.log("   -> محتوى المصفوفة:", allowedPagesValue);
        
        if (!allowedPagesValue.includes(pageNumber)) {
            console.log(`   -> التحقق: الرقم ${pageNumber} غير موجود في المصفوفة. سيتم حظر الصفحة.`);
            alert(`عفواً، الاختبار على الصفحة ${pageNumber} غير متاح حالياً. يرجى اختيار صفحة من الصفحات المسموح بها.`);
            return; // هذا return قانوني
        } else {
            console.log(`   -> التحقق: الرقم ${pageNumber} موجود في المصفوفة. سيتم السماح بالصفحة.`);
        }

    } else {
        console.warn("   -> الشرط فشل: تم تخطي كتلة التحقق. لهذا السبب يُسمح بكل الصفحات.");
        console.warn("      - هل 'allowedPages' موجودة؟", allowedPagesValue !== undefined);
        console.warn("      - هل هي مصفوفة؟", Array.isArray(allowedPagesValue));
        if (Array.isArray(allowedPagesValue)) {
            console.warn("      - هل هي فارغة؟", allowedPagesValue.length === 0);
        }
    }

    console.log("6. نهاية عملية التحقق. إذا وصلت إلى هنا، فهذا يعني أنه تم السماح بالصفحة.");
    
    // إذا نجح كل شيء، ابدأ الاختبار
    console.log("7. بدء الاختبار الفعلي...");
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
