// =============================================================
// ==      وحدة محرك التقدم (المستويات، المتجر، القواعد)      ==
// =============================================================

import { fetchProgressionConfig, fetchGameRules } from './api.js';

// هذا الكائن سيحتفظ بكل الإعدادات التي تم جلبها من لوحة التحكم
let config = {
    levels: [],
    store: [],
    rules: {}
};

/**
 * دالة التهيئة، تقوم بجلب كل الإعدادات (التقدم والقواعد) من لوحة التحكم.
 */
export async function initializeProgression() {
    // جلب الإعدادات بالتوازي لزيادة سرعة التحميل
    const [progConfig, rulesConfig] = await Promise.all([
        fetchProgressionConfig(),
        fetchGameRules()
    ]);

    // التعامل مع إعدادات التقدم (المستويات والمتجر)
    if (progConfig) {
        config.levels = progConfig.levels || [];
        config.store = progConfig.store || [];
        // ترتيب المستويات تصاعدياً أمر حاسم لصحة العمليات الحسابية
        config.levels.sort((a, b) => a.level - b.level);
    } else {
        console.error("فشل فادح: لم يتم جلب إعدادات التقدم.");
    }

    // التعامل مع قواعد اللعبة
    if (rulesConfig) {
        config.rules = rulesConfig;
        console.log("تم جلب قواعد اللعبة بنجاح.");
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
 * @returns {Array} - مصفوفة عناصر المتجر.
 */
export function getStoreItems() {
    return config.store;
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
