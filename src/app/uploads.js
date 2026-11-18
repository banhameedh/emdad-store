/* مكوّن رفع ملفات التصميم والمرفقات (Firebase Storage) مع بديل واتساب عند تعذّر الرفع */
import { esc, ic, P, WA, state, waLink, toast } from './core.js';
import { isConfigured, hasStorage } from '../lib/firebase.js';
import { checkFile, uploadFile } from '../lib/api.js';

export const filesOf = (id) => (state.uploads[id] || []).filter((f) => f.path);
const kb = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} م.ب` : `${Math.max(1, Math.round(n / 1024))} ك.ب`);
const canUpload = () => isConfigured && hasStorage;

export function uploadBox(id, label = 'إرفاق ملفات التصميم والمرفقات') {
  return `<div class="upbox" data-up="${esc(id)}">
    <b class="block text-[13px] font-extrabold mb-1.5">${esc(label)}</b>
    ${canUpload() ? `<label class="press flex items-center gap-3 bg-white border border-dashed border-deep/30 rounded-2xl p-3 cursor-pointer">
      <span class="w-10 h-10 rounded-[13px] bg-tint grid place-items-center flex-none">${ic(P.upload, 20)}</span>
      <span class="flex-1"><b class="block text-[13px]">اختر الملفات</b><span class="block text-[11px] text-muted">PDF · AI · EPS · PSD · SVG · JPG · PNG · ZIP — حتى 20 م.ب للملف، 10 ملفات</span></span>
      <input type="file" multiple class="sr-only" data-upinput="${esc(id)}" accept=".pdf,.ai,.eps,.psd,.svg,.jpg,.jpeg,.png,.webp,.tif,.tiff,.zip,.rar,.cdr,.dwg,.dxf">
    </label>` : ''}
    <ul class="grid gap-1.5 mt-2" data-uplist="${esc(id)}">${listHtml(id)}</ul>
    <a href="${esc(waLink('مرفقات طلب'))}" target="_blank" rel="noopener" class="mt-2 flex items-center gap-2 text-[11.5px] text-muted">${WA(15)}${canUpload() ? 'أو أرسل الملفات الكبيرة عبر واتساب مع رقم الطلب' : 'أرسل ملفات التصميم عبر واتساب مع رقم الطلب بعد الإرسال'}</a>
  </div>`;
}
function listHtml(id) {
  return (state.uploads[id] || []).map((f, i) => `<li class="flex items-center gap-2 bg-white hair rounded-xl px-2.5 py-2 text-[12px]">
    ${ic(P.doc, 16, f.error ? '#E5484D' : '#075A9F')}
    <span class="flex-1 min-w-0"><span class="block truncate" dir="ltr" style="text-align:right">${esc(f.name)}</span><span class="block text-[10.5px] ${f.error ? 'text-[#B4232A]' : 'text-muted'}">${f.error ? esc(f.error) : f.path ? `تم الرفع · ${kb(f.size)}` : `جارٍ الرفع… ${Math.round((f.p || 0) * 100)}%`}</span></span>
    ${f.path || f.error ? `<button type="button" class="w-7 h-7 grid place-items-center rounded-lg" data-act="unfile" data-up="${esc(id)}" data-i="${i}" aria-label="إزالة الملف">${ic(P.x, 12, '#6B8299', 2.4)}</button>` : ''}
  </li>`).join('');
}
const redraw = (id) => document.querySelectorAll(`[data-uplist="${CSS.escape(id)}"]`).forEach((ul) => { ul.innerHTML = listHtml(id); });

export function bindUploads(el) {
  el.querySelectorAll('[data-upinput]').forEach((inp) => inp.addEventListener('change', async () => {
    const id = inp.dataset.upinput; const arr = (state.uploads[id] ||= []);
    const files = [...inp.files]; inp.value = '';
    for (const file of files) {
      if (arr.filter((f) => !f.error).length >= 10) { toast('الحد الأقصى 10 ملفات', '', 'info'); break; }
      const item = { name: file.name, size: file.size, p: 0 }; arr.push(item);
      const err = checkFile(file);
      if (err) { item.error = err; redraw(id); continue; }
      redraw(id);
      try {
        Object.assign(item, await uploadFile(file, (p) => { item.p = p; redraw(id); }));
      } catch (e) {
        console.error('[emdad] upload', e);
        item.error = 'تعذّر الرفع — أرسل الملف عبر واتساب';
      }
      redraw(id);
    }
  }));
}
export const uploading = (id) => (state.uploads[id] || []).some((f) => !f.path && !f.error);
