// =============================================================
// ==      وحدة منطق المتجر (معالجة عمليات الشراء)           ==
// ==      (محدثة لتتكامل مع نظام الإنجازات والتفعيل الفوري) ==
// =============================================================

import * as ui from './ui.js';
import * as player from './player.js';
import * as progression from './progression.js';
import * as achievements from './achievements.js'; // ▼▼▼ تم التعديل: استيراد وحدة الإنجازات ▼▼▼

/**
 * يعرض شاشة المتجر ويملأها بالبيانات الحالية.
 */
export function openStore() {
    // جلب بيانات المتجر من وحدة التقدم
    const storeItems = progression.getStoreItems();
    
    // عرض المتجر باستخدام دالة الواجهة، مع تمرير دالة الشراء كـ "callback"
    ui.displayStore(storeItems, player.playerData, handlePurchase);
    
    // إظهار شاشة المتجر
    ui.showScreen(ui.storeScreen);
}

/**
 * يتم استدعاء هذه الدالة عندما ينقر المستخدم على زر "شراء".
 * @param {string} itemId - معرف العنصر الذي يرغب المستخدم في شرائه.
 */
async function handlePurchase(itemId) {
    console.log(`طلب شراء للعنصر: ${itemId}`);
    
    // 1. البحث عن العنصر في بيانات المتجر للحصول على سعره وتفاصيله
    const item = progression.getStoreItems().find(i => i.id === itemId);
    if (!item) {
        alert("عفواً، هذا العنصر غير موجود.");
        return;
    }

    // 2. التحقق مرة أخرى من أن اللاعب يملك ما يكفي من الألماس
    if (player.playerData.diamonds < item.price) {
        alert("عفواً، لا تملك ما يكفي من الألماس لشراء هذا العنصر.");
        return;
    }

    // 3. التحقق من أن اللاعب لا يمتلك العنصر بالفعل
    if (player.playerData.inventory.includes(itemId)) {
        alert("أنت تمتلك هذا العنصر بالفعل!");
        return;
    }

    // --- عملية الشراء ---
    ui.toggleLoader(true); // إظهار مؤشر التحميل

    // 4. خصم السعر من ألماس اللاعب
    player.playerData.diamonds -= item.price;

    // 5. إضافة العنصر إلى ممتلكات اللاعب
    player.playerData.inventory.push(itemId);

    // ▼▼▼ تم التعديل: التحقق من إنجازات الشراء قبل الحفظ ▼▼▼
    achievements.checkAchievements('item_purchased', {
        itemId: itemId,
        itemPrice: item.price,
        itemType: item.type
    });
    
    // 6. حفظ بيانات اللاعب المحدثة في السحابة
    await player.savePlayer();

    // ▼▼▼ تم التعديل: تفعيل الميزة المشتراة فورًا بعد الحفظ ▼▼▼
    if (item.type === 'qari' && item.value) {
        ui.unlockQari(item.value);
    }
    // يمكنك إضافة المزيد من الشروط هنا مستقبلاً لأنواع أخرى من العناصر
    // else if (item.type === 'theme') { ui.unlockTheme(item.value); }

    ui.toggleLoader(false); // إخفاء مؤشر التحميل

    console.log(`تم شراء العنصر ${itemId} بنجاح!`);
    alert(`تهانينا! لقد اشتريت "${item.name}".`);

    // 7. إعادة بناء واجهة المتجر لتعكس التغييرات (تحديث عدد الألماس، تعطيل زر الشراء)
    openStore();
}
