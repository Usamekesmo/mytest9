// =============================================================
// ==   وحدة الاتصالات الخارجية (API - Application Programming Interface)   ==
// ==   (النسخة النهائية الشاملة لكل الميزات)                   ==
// =============================================================

import { SCRIPT_URL, QURAN_API_BASE_URL } from './config.js';

// --- دوال جلب البيانات (GET Requests) ---

/**
 * دالة مساعدة لتقليل التكرار في طلبات GET.
 * @param {string} action - اسم الإجراء المطلوب من الواجهة الخلفية.
 * @param {string} errorMsg - رسالة الخطأ المخصصة.
 * @returns {Promise<any>} - البيانات المطلوبة أو null عند الفشل.
 */
async function fetchFromApi(action, errorMsg) {
    const url = `${SCRIPT_URL}?action=${action}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`فشل استجابة الشبكة لـ ${action}.`);
        const data = await response.json();
        if (data.result === 'success') {
            // إرجاع البيانات الرئيسية مباشرة
            return data[Object.keys(data).find(k => k !== 'result')];
        }
        throw new Error(data.message || `خطأ غير معروف من الخادم لـ ${action}.`);
    } catch (error) {
        console.error(errorMsg, error);
        return null;
    }
}

export async function fetchPlayer(userName) {
    const url = `${SCRIPT_URL}?action=getPlayer&userName=${encodeURIComponent(userName)}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('فشل استجابة الشبكة.');
        const data = await response.json();
        if (data.result === 'success') return data.player;
        if (data.result === 'notFound') return null;
        throw new Error(data.message || 'خطأ غير معروف من الخادم.');
    } catch (error) {
        console.error("Error fetching player data:", error);
        return 'error'; // إرجاع 'error' للتمييز بين "لم يتم العثور عليه" و "خطأ في الشبكة"
    }
}

export async function fetchQuestionsConfig() {
    return fetchFromApi('getQuestionsConfig', 'فشل في جلب إعدادات الأسئلة.');
}

export async function fetchProgressionConfig() {
    return fetchFromApi('getProgressionConfig', 'فشل في جلب إعدادات التقدم.');
}

export async function fetchGameRules() {
    return fetchFromApi('getGameRules', 'فشل في جلب قواعد اللعبة.');
}

export async function fetchActiveChallenges() {
    const challenges = await fetchFromApi('getActiveChallenges', 'فشل في جلب التحديات.');
    return challenges || []; // إرجاع مصفوفة فارغة دائمًا في حالة الفشل
}

export async function fetchAchievementsConfig() {
    const achievements = await fetchFromApi('getAchievementsConfig', 'فشل في جلب إعدادات الإنجازات.');
    return achievements || [];
}

export async function fetchLeaderboard() {
    const leaderboard = await fetchFromApi('getLeaderboard', 'فشل في جلب لوحة الصدارة.');
    return leaderboard || [];
}

export async function fetchPageData(pageNumber) {
    try {
        const [pageResponse, linesResponse] = await Promise.all([
            fetch(`${QURAN_API_BASE_URL}/page/${pageNumber}/quran-uthmani`),
            fetch(`${QURAN_API_BASE_URL}/page/${pageNumber}/quran-uthmani-lines`)
        ]);

        if (!pageResponse.ok || !linesResponse.ok) {
            throw new Error(`فشل جلب بيانات الصفحة ${pageNumber} من خادم القرآن.`);
        }

        const pageData = await pageResponse.json();
        const linesData = await linesResponse.json();

        if (pageData.code === 200 && linesData.code === 200 && pageData.data.ayahs.length > 0) {
            return pageData.data.ayahs.map(ayah => {
                const lineInfo = linesData.data.ayahs.find(la => la.number === ayah.number);
                return { ...ayah, line: lineInfo ? lineInfo.line : null };
            });
        } else {
            console.warn(`بيانات الصفحة ${pageNumber} فارغة أو غير صالحة.`);
            return null;
        }
    } catch (error) {
        console.error("Error fetching page data:", error);
        alert('لا يمكن الوصول إلى خادم القرآن. تحقق من اتصالك بالإنترنت.');
        return null;
    }
}

// --- دوال إرسال البيانات (POST Requests) ---

/**
 * دالة مساعدة لتقليل التكرار في طلبات POST.
 * @param {string} action - اسم الإجراء المطلوب.
 * @param {object} payload - البيانات المراد إرسالها.
 * @param {string} errorMsg - رسالة الخطأ المخصصة.
 */
async function postToApi(action, payload, errorMsg) {
    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, payload })
        });
    } catch (error) {
        console.error(errorMsg, error);
        // يمكن إضافة منطق لإعادة المحاولة هنا في المستقبل
    }
}

export async function savePlayer(playerData) {
    await postToApi('updatePlayer', playerData, 'Error saving player data:');
}

export async function saveResult(resultData) {
    await postToApi('saveResult', resultData, 'Error saving result:');
}
