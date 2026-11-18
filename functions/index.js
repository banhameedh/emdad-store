/*
 * Cloud Functions لمتجر الإمدادات — التحقق من الأسعار والإجماليات من جهة الخادم.
 * ⚠️ تتطلب خطة Blaze. لا تُنشر إلا بعد موافقة الإدارة:  npm run deploy:functions
 *
 * عند إنشاء أي طلب شراء: يُعاد حساب سعر كل بند من بيانات المنتجات والعروض الحالية في Firestore
 * (Admin SDK — لا يستطيع العميل التلاعب بها)، ويُكتب الحقل verification على الطلب:
 *   { ok, subtotal, total, issues[], checkedAt }
 * وتظهر النتيجة للمشرف في لوحة التحكم بجانب الطلب.
 */
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import { normProduct, applyPromos, verifyLines } from './pricing.js';

// يجب أن تطابق المنطقة موقع قاعدة Firestore (مثال: me-central2 للدمام)
setGlobalOptions({ region: process.env.FUNCTIONS_REGION || 'me-central2', maxInstances: 5 });
initializeApp();
const db = getFirestore();

export const verifyOrder = onDocumentCreated('orders/{id}', async (event) => {
  const order = event.data?.data(); if (!order) return;
  const [ps, prs, st] = await Promise.all([
    db.collection('products').where('active', '==', true).get(),
    db.collection('promotions').where('active', '==', true).get(),
    db.doc('settings/store').get(),
  ]);
  const settings = { vatRate: 15, pricesIncludeVat: true, ...(st.exists ? st.data() : {}), delivery: order.delivery };
  const products = applyPromos(ps.docs.map((d) => normProduct({ id: d.id, ...d.data() })), prs.docs.map((d) => ({ id: d.id, ...d.data() })));
  const v = verifyLines(order.items, products, settings);
  const clientTotal = Number(order.totals?.total) || 0;
  if (Math.abs(v.total - clientTotal) > 0.01) v.issues.push(`الإجمالي المرسل ${clientTotal} يختلف عن المحسوب ${v.total}`);
  await event.data.ref.update({ verification: { ok: v.issues.length === 0, subtotal: v.subtotal, total: v.total, issues: v.issues, checkedAt: FieldValue.serverTimestamp() } });
});
