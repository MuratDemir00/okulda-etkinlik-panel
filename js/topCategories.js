import {
  db,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
} from "../../js/firebase.js";
import { $, $$, toast, createEl, loadHTML } from "../../js/helpers.js";
import { loadSubCategories } from "./subCategories.js";

// ===============================
// 🔥 TOP CATEGORIES YÜKLE
// ===============================
export async function loadTopCategoriesSection(container) {
  // HTML içine yükle
  const html = await loadHTML("sections/topCategories/topCategories.html");
  container.innerHTML = html;

  loadTopCategories(); // tabloyu yükle
  initEvents(); // event listener’ları bağla
}

// ===============================
// 🔥 Etkinlikler
// ===============================
function initEvents() {
  $("#tc-save").onclick = saveTopCategory;
  $("#fix-sort-order").onclick = fixSortOrder;
}

// ===============================
// 🔥 Kategori Kaydet
// ===============================
async function saveTopCategory() {
  const id = $("#tc-id").value.trim();
  if (!id) return toast($("#tc-status"), "id gerekli", false);

  const payload = {
    id,
    name: $("#tc-name").value.trim() || null,
    imageUrl: $("#tc-image").value.trim() || null,
    sort_order: $("#tc-sort").value ? Number($("#tc-sort").value) : null,
    type: $("#tc-type").value.trim() || null,
  };

  await setDoc(doc(db, "topCategories", id), payload, { merge: true });

  toast($("#tc-status"), "Kaydedildi");
  alert("✅ Kategori kaydedildi!");
  loadTopCategories();
}

// ===============================
// 🔥 Kategori Listesi
// ===============================
async function loadTopCategories() {
  const listEl = $("#tc-list");
  listEl.innerHTML = `<tr><td colspan="6" class="muted">Yükleniyor…</td></tr>`;

  const qSnap = await getDocs(
    query(collection(db, "topCategories"), orderBy("sort_order", "asc"))
  );

  let rows = "";
  qSnap.forEach((d) => {
    const x = d.data();
    rows += `
            <tr>
                <td class="mono">${x.id}</td>
                <td>${x.name}</td>
                <td><a href="${
                  x.imageUrl
                }" target="_blank" class="muted small">${(
      x.imageUrl || ""
    ).slice(0, 40)}…</a></td>

                <td class="small">
                    <input data-top-sort="${d.id}" value="${
      x.sort_order ?? ""
    }" type="number" style="width:60px">
                    <button class="btn small" data-top-save="${
                      d.id
                    }">Kaydet</button>
                    <div class="muted small">${x.type ?? ""}</div>
                </td>

                <td><button class="btn small" data-open="${
                  d.id
                }">Alt Kategori</button></td>
                <td><button class="btn warn small" data-del="${
                  d.id
                }">Sil</button></td>
            </tr>
        `;
  });

  listEl.innerHTML = rows;

  // eventler
  listEl
    .querySelectorAll("button[data-del]")
    .forEach((b) => (b.onclick = () => deleteCategory(b.dataset.del)));

  listEl
    .querySelectorAll("button[data-open]")
    .forEach(
      (b) => (b.onclick = () => loadSubCategories($("#sc-box"), b.dataset.open))
    );

  listEl
    .querySelectorAll("button[data-top-save]")
    .forEach((btn) => (btn.onclick = () => updateTopSort(btn.dataset.topSave)));
}

// ===============================
// 🔥 Silme
// ===============================
async function deleteCategory(id) {
  if (!confirm("Kategoriyi silmek alt koleksiyonları silmez. Emin misin?"))
    return;

  await deleteDoc(doc(db, "topCategories", id));
  loadTopCategories();
}

// ===============================
// 🔥 sort_order güncelle
// ===============================
async function updateTopSort(id) {
  const input = $(`input[data-top-sort="${id}"]`);
  const val = Number(input.value || 0);

  await updateDoc(doc(db, "topCategories", id), {
    sort_order: val,
  });

  alert("✅ Sort Order güncellendi!");
  loadTopCategories();
}

// ===============================
// 🔥 Tüm sistemde sort_order düzelt
// ===============================
async function fixSortOrder() {
  $("#sort-status").textContent = "Düzenleniyor…";

  const snap = await getDocs(collection(db, "topCategories"));
  let i = 1;

  for (const d of snap.docs) {
    await updateDoc(d.ref, { sort_order: i++ });
  }

  $("#sort-status").textContent = "Tamamlandı!";
  alert("🎉 Sort order düzeltildi!");

  loadTopCategories();
}
