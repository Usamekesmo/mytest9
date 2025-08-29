// =============================================================
// ==   وحدة الاتصالات الخارجية (API - Application Programming Interface)   ==
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

/**
 * (الدالة الجديدة) يجلب البيانات الوصفية لكل سور القرآن (رقم السورة، الصفحات).
 * @returns {Promise<object|null>} - كائن يحتوي على بيانات السور.
 */
export async function fetchQuranMetadata() {
    const url = `${QURAN_API_BASE_URL}/meta`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('فشل جلب بيانات القرآن الوصفية.');
        const data = await response.json();
        if (data.code === 200) {
            const surahs = data.data.surahs.references;
            const pages = data.data.pages.references;
            
            const metadata = {};
            surahs.forEach(surah => {
                const startPage = pages.find(p => p.surah === surah.number && p.ayah === 1)?.page;
                
                const nextSurah = surahs.find(s => s.number === surah.number + 1);
                let endPage;
                if (nextSurah) {
                    const nextSurahStartPage = pages.find(p => p.surah === nextSurah.number && p.ayah === 1)?.page;
                    endPage = nextSurahStartPage - 1;
                } else {
                    endPage = 604;
                }

                if (startPage && endPage) {
                    metadata[surah.number] = {
                        name: surah.name,
                        startPage: startPage,
                        endPage: endPage
                    };
                }
            });
            return metadata;
        }
        return null;
    } catch (error) {
        console.error("Error fetching Quran metadata:", error);
        alert("لا يمكن جلب بيانات السور الأساسية. قد لا تعمل بعض الميزات.");
        return null;
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
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'updatePlayer', payload: playerData })
        });
    } catch (error) {
        console.error("Error saving player data:", error);
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
