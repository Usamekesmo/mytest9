// =============================================================
// ==      وحدة إدارة بيانات اللاعب (تحميل وحفظ)             ==
// ==      (محدثة لتشمل بيانات الإنجازات)                    ==
// =============================================================

import { fetchPlayer, savePlayer as savePlayerToApi } from './api.js';

// هذا هو "مصدر الحقيقة" لبيانات اللاعب داخل التطبيق
export let playerData = {
    name: '',
    xp: 0,
    diamonds: 0,
    inventory: [],
    // ▼▼▼ تم التعديل: إضافة حقول جديدة للإنجازات ▼▼▼
    achievements: [],
    totalQuizzesCompleted: 0,
    // ▲▲▲ نهاية التعديل ▲▲▲
    isNew: true,
    // هذا الكائن تتم إدارته محلياً فقط ولا يتم جلبه من الخادم
    dailyQuizzes: {
        count: 0,
        lastPlayedDate: '' // سيتم تحديثه عند تحميل اللاعب
    }
};

// دالة مساعدة للحصول على تاريخ اليوم بصيغة موحدة
function getTodayDateString() {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * يقوم بتحميل بيانات اللاعب من السحابة.
 * @param {string} userName - اسم اللاعب المدخل.
 * @returns {Promise<boolean>} - `true` عند النجاح، `false` عند الفشل.
 */
export async function loadPlayer(userName) {
    const fetchedData = await fetchPlayer(userName);

    if (fetchedData === 'error') {
        alert("خطأ في الاتصال بالخادم لجلب بياناتك. يرجى المحاولة مرة أخرى.");
        return false;
    }

    if (fetchedData) {
        // تم العثور على اللاعب
        // دمج البيانات المحملة مع البيانات الافتراضية
        // هذا الكود مرن بما يكفي ليشمل الحقول الجديدة تلقائيًا
        playerData = { ...playerData, ...fetchedData, isNew: false };
        
        // ضمان وجود القيم الافتراضية في حال لم تكن موجودة في البيانات القديمة
        if (!playerData.achievements) playerData.achievements = [];
        if (!playerData.totalQuizzesCompleted) playerData.totalQuizzesCompleted = 0;

        console.log(`مرحباً بعودتك: ${playerData.name}`);
        console.log("ممتلكاتك:", playerData.inventory);
        console.log("إنجازاتك:", playerData.achievements);

    } else {
        // لاعب جديد: إعادة تعيين كل شيء إلى الحالة الافتراضية
        playerData = {
            name: userName,
            xp: 0,
            diamonds: 0,
            inventory: [],
            achievements: [],
            totalQuizzesCompleted: 0,
            isNew: true,
            dailyQuizzes: { count: 0, lastPlayedDate: '' }
        };
        console.log(`مرحباً بك أيها اللاعب الجديد: ${userName}`);
    }

    // في كلتا الحالتين (لاعب جديد أو قديم)، نتحقق من العداد اليومي
    const today = getTodayDateString();
    if (playerData.dailyQuizzes.lastPlayedDate !== today) {
        // إذا كان اليوم مختلفًا، أعد تعيين العداد
        playerData.dailyQuizzes = { count: 0, lastPlayedDate: today };
        console.log("يوم جديد! تم إعادة تعيين عداد الاختبارات اليومية.");
    }
    
    return true;
}

/**
 * يحفظ بيانات اللاعب الحالية في السحابة.
 */
export async function savePlayer() {
    // لا نرسل كل بيانات اللاعب، فقط ما هو موجود في قاعدة البيانات
    // ▼▼▼ تم التعديل: إضافة الحقول الجديدة إلى الكائن الذي سيتم حفظه ▼▼▼
    const dataToSave = {
        name: playerData.name,
        xp: playerData.xp,
        diamonds: playerData.diamonds,
        inventory: playerData.inventory,
        achievements: playerData.achievements,
        totalQuizzesCompleted: playerData.totalQuizzesCompleted
    };
    
    await savePlayerToApi(dataToSave);
    console.log("تم إرسال طلب حفظ بيانات اللاعب (مع الإنجازات) إلى السحابة.");
}
