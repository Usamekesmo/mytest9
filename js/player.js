// =============================================================
// ==      وحدة إدارة بيانات اللاعب (تحميل وحفظ)             ==
// ==      (النسخة النهائية الشاملة لكل الميزات)            ==
// =============================================================

import { fetchPlayer, savePlayer as savePlayerToApi } from './api.js';
import * as achievements from './achievements.js';

// هذا هو "مصدر الحقيقة" لبيانات اللاعب داخل التطبيق
export let playerData = {
    name: '',
    xp: 0,
    diamonds: 0,
    inventory: [],
    achievements: [], // لتخزين الإنجازات المكتسبة
    totalQuizzesCompleted: 0, // لتتبع عدد الاختبارات
    isNew: true,
    // هذا الكائن تتم إدارته محلياً فقط ولا يتم جلبه من الخادم مباشرة بهذه الطريقة
    dailyQuizzes: {
        count: 0,
        lastPlayedDate: ''
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
        // لاعب موجود: قم بدمج بياناته مع الحالة الافتراضية
        playerData = {
            ...playerData, // للحفاظ على بنية dailyQuizzes
            ...fetchedData,
            isNew: false
        };
        console.log(`مرحباً بعودتك: ${playerData.name}`);
        console.log("ممتلكاتك:", playerData.inventory);
        console.log("إنجازاتك:", playerData.achievements);
        
        // تحقق من الإنجازات عند تسجيل الدخول (مثل إنجازات المستويات)
        achievements.checkAchievements('login');

    } else {
        // لاعب جديد
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
    // `isNew` و `dailyQuizzes` تتم إدارتهما محليًا فقط
    const dataToSave = {
        name: playerData.name,
        xp: playerData.xp,
        diamonds: playerData.diamonds,
        inventory: playerData.inventory,
        achievements: playerData.achievements,
        totalQuizzesCompleted: playerData.totalQuizzesCompleted
    };
    
    await savePlayerToApi(dataToSave);
    console.log("تم إرسال طلب حفظ بيانات اللاعب إلى السحابة.");
}
