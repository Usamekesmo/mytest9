// =============================================================
// ==   وحدة الاتصالات الخارجية (API - Application Programming Interface)   ==
// ==   (محدثة لتشمل دوال الإنجازات ولوحة الصدارة)             ==
// =============================================================

import { SCRIPT_URL, QURAN_API_BASE_URL } from './config.js';

// --- دوال جلب البيانات (GET Requests) ---

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
        return 'error';
    }
}

export async function fetchQuestionsConfig() {
    const url = `${SCRIPT_URL}?action=getQuestionsConfig`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('فشل في جلب إعدادات الأسئلة.');
        const data = await response.json();
        return (data.result === 'success') ? data.questions : null;
    } catch (error) {
        console.error("Error fetching questions config:", error);
        return null;
    }
}

export async function fetchProgressionConfig() {
    const url = `${SCRIPT_URL}?action=getProgressionConfig`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('فشل في جلب إعدادات التقدم.');
        const data = await response.json();
        return (data.result === 'success') ? data.config : null;
    } catch (error) {
        console.error("Error fetching progression config:", error);
        return null;
    }
}

export async function fetchGameRules() {
    const url = `${SCRIPT_URL}?action=getGameRules`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('فشل في جلب قواعد اللعبة.');
        const data = await response.json();
        return (data.result === 'success') ? data.rules : null;
    } catch (error) {
        console.error("Error fetching game rules:", error);
        return null;
    }
}

export async function fetchActiveChallenges() {
    const url = `${SCRIPT_URL}?action=getActiveChallenges`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('فشل في جلب التحديات.');
        const data = await response.json();
        return (data.result === 'success') ? data.challenges : [];
    } catch (error) {
        console.error("Error fetching challenges:", error);
        return [];
    }
}

// ▼▼▼ دالة جديدة: جلب إعدادات الإنجازات ▼▼▼
export async function fetchAchievementsConfig() {
    const url = `${SCRIPT_URL}?action=getAchievementsConfig`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('فشل في جلب إعدادات الإنجازات.');
        const data = await response.json();
        return (data.result === 'success') ? data.achievements : [];
    } catch (error) {
        console.error("Error fetching achievements config:", error);
        return [];
    }
}

// ▼▼▼ دالة جديدة: جلب بيانات لوحة الصدارة ▼▼▼
export async function fetchLeaderboard() {
    const url = `${SCRIPT_URL}?action=getLeaderboard`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('فشل في جلب بيانات لوحة الصدارة.');
        const data = await response.json();
        return (data.result === 'success') ? data.leaderboard : [];
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        return [];
    }
}


export async function fetchPageData(pageNumber) {
    try {
        const [pageResponse, linesResponse] = await Promise.all([
            fetch(`${QURAN_API_BASE_URL}/page/${pageNumber}/quran-uthmani`),
            fetch(`${QURAN_API_BASE_URL}/page/${pageNumber}/quran-uthmani-lines`)
        ]);
        const pageData = await pageResponse.json();
        const linesData = await linesResponse.json();

        if (pageData.code === 200 && linesData.code === 200 && pageData.data.ayahs.length > 0) {
            return pageData.data.ayahs.map(ayah => {
                const lineInfo = linesData.data.ayahs.find(la => la.number === ayah.number);
                return { ...ayah, line: lineInfo ? lineInfo.line : null };
            });
        } else {
            alert('هذه الصفحة لا تحتوي على آيات، أو حدث خطأ في جلب بياناتها.');
            return null;
        }
    } catch (error) {
        console.error("Error fetching page data:", error);
        alert('لا يمكن الوصول إلى خادم القرآن. تحقق من اتصالك بالإنترنت.');
        return null;
    }
}

// --- دوال إرسال البيانات (POST Requests) ---

export async function savePlayer(playerData) {
    try {
        // إرسال طلب POST إلى Google Script
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'cors', // مهم للسماح بالطلبات عبر المصادر
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'updatePlayer', payload: playerData })
        });
        // يمكنك إضافة معالجة للرد هنا إذا أردت
        const result = await response.json();
        console.log("Server response from savePlayer:", result);
    } catch (error) {
        console.error("Error saving player data:", error);
        // يمكنك إظهار رسالة للمستخدم هنا بأن الحفظ فشل
    }
}

export async function saveResult(resultData) {
    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'saveResult', payload: resultData })
        });
    } catch (error) {
        console.error("Error saving result:", error);
    }
}
