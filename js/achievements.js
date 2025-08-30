// =============================================================
// ==      وحدة إدارة الإنجازات (المحرك الديناميكي)           ==
// =============================================================

import { fetchAchievementsConfig } from './api.js';
import * as player from './player.js';
import * as ui from './ui.js';

let allAchievements = [];

/**
 * دالة التهيئة، تقوم بجلب كل الإنجازات المتاحة من الخادم.
 */
export async function initializeAchievements() {
    allAchievements = await fetchAchievementsConfig();
    if (allAchievements && allAchievements.length > 0) {
        console.log(`تم تحميل ${allAchievements.length} إنجاز ديناميكي من الخادم.`);
    } else {
        console.log("لم يتم العثور على إعدادات للإنجازات أو فشل في جلبها.");
    }
}

/**
 * الدالة الرئيسية للتحقق من الإنجازات.
 * @param {string} eventType - نوع الحدث الذي وقع (مثل 'quiz_completed').
 * @param {object} eventData - بيانات إضافية متعلقة بالحدث.
 */
export function checkAchievements(eventType, eventData = {}) {
    // دمج بيانات اللاعب مع بيانات الحدث لتسهيل الوصول إليها
    const context = { ...player.playerData, ...eventData };

    // فلترة الإنجازات التي يجب التحقق منها بناءً على الحدث الحالي
    const relevantAchievements = allAchievements.filter(ach => ach.triggerEvent === eventType);

    const newAchievements = [];

    for (const achievement of relevantAchievements) {
        // تحقق مما إذا كان اللاعب يمتلك هذا الإنجاز بالفعل
        if (player.playerData.achievements.includes(achievement.id)) {
            continue;
        }

        // استدعاء المحرك المنطقي للتحقق من الشرط
        if (isConditionMet(achievement, context)) {
            newAchievements.push(achievement);
        }
    }

    if (newAchievements.length > 0) {
        grantAchievements(newAchievements);
    }
}

/**
 * المحرك المنطقي: يتحقق مما إذا كان شرط الإنجاز قد تحقق.
 * @param {object} achievement - كائن الإنجاز بتعريفاته.
 * @param {object} context - البيانات المتاحة للتحقق (بيانات اللاعب + بيانات الحدث).
 * @returns {boolean} - `true` إذا تحقق الشرط.
 */
function isConditionMet(achievement, context) {
    const { targetProperty, comparison, targetValue } = achievement;

    // الحصول على القيمة الفعلية من السياق
    // يدعم الخصائص المتداخلة مثل 'inventory.length'
    const actualValue = getProperty(context, targetProperty);

    // الحصول على القيمة المستهدفة (قد تكون خاصية أخرى من السياق)
    const expectedValueRaw = (typeof targetValue === 'string' && context.hasOwnProperty(targetValue))
        ? context[targetValue]
        : targetValue;
    
    // تحويل القيم لتكون من نفس النوع قبل المقارنة
    const finalActual = (typeof actualValue === 'boolean') ? actualValue : Number(actualValue);
    let finalExpected = (typeof expectedValueRaw === 'boolean') ? expectedValueRaw : Number(expectedValueRaw);

    // إذا فشل التحويل إلى رقم، نعتبرها كنصوص (للتعامل مع حالات مستقبلية)
    if (isNaN(finalActual) || isNaN(finalExpected)) {
        // مقارنة نصية بسيطة
        if (comparison === '===') return String(actualValue) === String(expectedValueRaw);
        if (comparison === '!==') return String(actualValue) !== String(expectedValueRaw);
        return false;
    }
    
    // إجراء المقارنة الرقمية
    switch (comparison) {
        case '===': return finalActual === finalExpected;
        case '>=': return finalActual >= finalExpected;
        case '<=': return finalActual <= finalExpected;
        case '>': return finalActual > finalExpected;
        case '<': return finalActual < finalExpected;
        case '!==': return finalActual !== finalExpected;
        default:
            console.error(`عامل مقارنة غير معروف: ${comparison} في الإنجاز ${achievement.id}`);
            return false;
    }
}

/**
 * دالة مساعدة للوصول إلى الخصائص المتداخلة بأمان.
 * مثال: getProperty({ a: { b: 5 } }, 'a.b') سيعيد 5.
 */
function getProperty(obj, path) {
    if (typeof path !== 'string') return undefined;
    return path.split('.').reduce((o, i) => (o === undefined || o === null ? undefined : o[i]), obj);
}


/**
 * تمنح اللاعب الإنجازات الجديدة وتضيف المكافآت.
 * @param {Array<object>} achievementsToGrant - مصفوفة الإنجازات التي تم تحقيقها.
 */
function grantAchievements(achievementsToGrant) {
    for (const achievement of achievementsToGrant) {
        console.log(`تهانينا! لقد حققت إنجاز: ${achievement.name}`);
        
        // 1. أضف الإنجاز إلى قائمة اللاعب
        player.playerData.achievements.push(achievement.id);

        // 2. أضف المكافآت
        player.playerData.xp += achievement.xpReward;
        player.playerData.diamonds += achievement.diamondsReward;

        // 3. أظهر تنبيهًا للمستخدم
        ui.showAchievementAlert(achievement);
    }
}
