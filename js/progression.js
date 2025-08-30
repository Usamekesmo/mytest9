// =============================================================
// ==      وحدة محرك التقدم (المستويات، المتجر، القواعد)      ==
// ==      (النسخة النهائية الشاملة لكل الميزات)            ==
// =============================================================

import { fetchProgressionConfig, fetchGameRules } from './api.js';

// هذا الكائن سيحتفظ بكل الإعدادات التي تم جلبها من لوحة التحكم
let config = {
    levels: [],
    store: [],
    rules: {},
    questionRewards: [] // لإعدادات مكافآت الأسئلة
};

/**
 * دالة التهيئة، تقوم بجلب كل الإعدادات ومعالجتها في مكان واحد.
 */
export async function initializeProgression() {
    // جلب الإعدادات بالتوازي لزيادة سرعة التحميل
    const [progConfig, rulesConfig] = await Promise.all([
        fetchProgressionConfig(),
        fetchGameRules()
    ]);

    // التعامل مع إعدادات التقدم (المستويات، المتجر، مكافآت الأسئلة)
    if (progConfig) {
        config.levels = progConfig.levels || [];
        config.store = progConfig.store || [];
        config.questionRewards = progConfig.questionRewards || [];
        
        // ترتيب المستويات تصاعدياً أمر حاسم لصحة العمليات الحسابية
        config.levels.sort((a, b) => a.level - b.level);
        
        console.log("تم جلب إعدادات التقدم (المستويات، المتجر، مكافآت الأسئلة).");
    } else {
        console.error("فشل فادح: لم يتم جلب إعدادات التقدم.");
    }

    // معالجة قواعد اللعبة
    if (rulesConfig) {
        const rules = rulesConfig;

        // تحقق مما إذا كانت allowedPages موجودة وهي نص
        if (rules.allowedPages && typeof rules.allowedPages === 'string') {
            console.log("progression.js: تم العثور على allowedPages كنص، جاري تحويلها إلى مصفوفة...");
            
            rules.allowedPages = rules.allowedPages
                .split(',')
                .map(item => parseInt(item.trim(), 10))
                .filter(num => !isNaN(num));

            console.log("progression.js: allowedPages بعد التحويل:", rules.allowedPages);
        }

        config.rules = rules;
        console.log("تم جلب ومعالجة قواعد اللعبة بنجاح.");

    } else {
        console.error("فشل فادح: لم يتم جلب قواعد اللعبة.");
    }
}


// --- دوال مساعدة للوصول إلى الإعدادات ---

/**
 * @returns {object} - كائن قواعد اللعبة.
 */
export function getGameRules() {
    return config.rules;
}

/**
 * @returns {Array} - مصفوفة عناصر المتجر، مرتبة.
 */
export function getStoreItems() {
    if (config.store && Array.isArray(config.store)) {
        return [...config.store].sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return [];
}

// --- دوال حسابية للتقدم ---

/**
 * يحسب معلومات المستوى الحالي للاعب بناءً على نقاط خبرته.
 * @param {number} currentXp - نقاط الخبرة الحالية للاعب.
 * @returns {object} - كائن يحتوي على معلومات المستوى الحالي والتالي.
 */
export function getLevelInfo(currentXp) {
    if (!config.levels || config.levels.length === 0) {
        return { level: 1, title: 'لاعب جديد', progress: 0, nextLevelXp: 100, currentLevelXp: 0 };
    }

    let currentLevelInfo = config.levels[0];
    for (let i = config.levels.length - 1; i >= 0; i--) {
        if (currentXp >= config.levels[i].xpRequired) {
            currentLevelInfo = config.levels[i];
            break;
        }
    }

    const nextLevelIndex = config.levels.findIndex(l => l.level === currentLevelInfo.level + 1);
    const nextLevelInfo = nextLevelIndex !== -1 ? config.levels[nextLevelIndex] : null;

    const xpForCurrentLevel = currentLevelInfo.xpRequired;
    const xpForNextLevel = nextLevelInfo ? nextLevelInfo.xpRequired : currentXp;
    
    let progressPercentage = 100;
    if (nextLevelInfo && xpForNextLevel > xpForCurrentLevel) {
        progressPercentage = ((currentXp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;
    }

    return {
        level: currentLevelInfo.level,
        title: currentLevelInfo.title,
        progress: Math.min(100, progressPercentage),
        nextLevelXp: xpForNextLevel,
        currentLevelXp: xpForCurrentLevel
    };
}

/**
 * يتحقق مما إذا كان اللاعب قد ترقى لمستوى جديد بعد كسب نقاط خبرة.
 * @param {number} oldXp - نقاط الخبرة قبل الاختبار.
 * @param {number} newXp - نقاط الخبرة بعد الاختبار.
 * @returns {object|null} - معلومات المستوى الجديد إذا تمت الترقية، وإلا null.
 */
export function checkForLevelUp(oldXp, newXp) {
    const oldLevelInfo = getLevelInfo(oldXp);
    const newLevelInfo = getLevelInfo(newXp);

    if (newLevelInfo.level > oldLevelInfo.level) {
        const newLevelData = config.levels.find(l => l.level === newLevelInfo.level);
        return {
            ...newLevelInfo,
            reward: newLevelData ? newLevelData.diamondsReward : 0
        };
    }
    
    return null;
}

/**
 * يحسب الحد الأقصى لعدد الأسئلة التي يمكن للاعب اختيارها بناءً على مستواه.
 * @param {number} playerLevel - مستوى اللاعب الحالي.
 * @returns {number} - الحد الأقصى لعدد الأسئلة.
 */
export function getMaxQuestionsForLevel(playerLevel) {
    const baseQuestions = 5;
    let maxQuestions = baseQuestions;

    if (!config.questionRewards || config.questionRewards.length === 0) {
        return baseQuestions;
    }

    const sortedRewards = [...config.questionRewards].sort((a, b) => a.level - b.level);

    let cumulativeQuestions = 0;
    for (const reward of sortedRewards) {
        if (playerLevel >= reward.level) {
            if (reward.isCumulative) {
                cumulativeQuestions += reward.questionsToAdd;
            } else {
                cumulativeQuestions = reward.questionsToAdd;
            }
        }
    }
    
    // نستخدم Math.max للتأكد من أننا لا نعيد قيمة أقل من الأساس
    return Math.max(baseQuestions, baseQuestions + cumulativeQuestions);
}
