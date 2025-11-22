import { db } from "./firebase.js";
import { $, $$, toast } from "./helpers.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export let currentCategoryId = null;
export let currentSubCategoryId = null;

export async function openSubCategories(categoryId) {
  currentCategoryId = categoryId;
  currentSubCategoryId = null;

  $("#sc-box").classList.remove("hidden");
  $("#items-box").classList.add("hidden");
  $("#grades-box").classList.add("hidden");

  $("#sc-category-label").textContent = categoryId;

  const listEl = $("#sc-list");
  listEl.innerHTML = "<tr><td colspan='5'>Yükleniyor…</td></tr>";

  const snap = await getDocs(
    collection(db, "topCategories", categoryId, "subCategories")
  );

  let rows = "";
  snap.forEach((d) => {
    const x = d.data();
    const types = Array.isArray(x.availableTypes)
      ? x.availableTypes.join(", ")
      : "";
    rows += `
<tr>
    <td>${x.id}</td>
    <td>${x.name}</td>
    <td class="small">
        <input type="number" data-sub-sort="${d.id}" value="${
      x.sort_order ?? ""
    }" style="width:60px">
        <button class="btn small" data-sub-save="${d.id}">Kaydet</button>
        <div>${types}</div>
    </td>
    <td>
        <button class="btn small" data-edit="${d.id}">Düzenle</button>
        <button class="btn small" data-items="${d.id}">Items</button>
    </td>
    <td><button class="btn warn small" data-del="${d.id}">Sil</button></td>
</tr>`;
  });

  listEl.innerHTML = rows || "<tr><td colspan='5'>Alt kategori yok.</td></tr>";

  // Düzenle
  listEl.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.onclick = async () => {
      const snap = await getDoc(
        doc(db, "topCategories", categoryId, "subCategories", btn.dataset.edit)
      );
      if (!snap.exists()) return;

      const x = snap.data();
      $("#sc-id").value = x.id;
      $("#sc-name").value = x.name;

      $$(".sc-type").forEach(
        (cb) => (cb.checked = x.availableTypes?.includes(cb.value))
      );
    };
  });

  // Items
  listEl.querySelectorAll("[data-items]").forEach((btn) => {
    btn.onclick = () => {
      currentSubCategoryId = btn.dataset.items;

      if (currentCategoryId === "grades") {
        import("./grades.js").then((m) => m.loadLessons());
        $("#grades-box").classList.remove("hidden");
        $("#items-box").classList.add("hidden");
        return;
      }

      $("#grades-box").classList.add("hidden");
      $("#items-box").classList.remove("hidden");

      import("./items.js").then((m) => m.loadItems());
    };
  });

  // Delete
  listEl.querySelectorAll("[data-del]").forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm("Silinsin mi?")) return;
      await deleteDoc(
        doc(db, "topCategories", categoryId, "subCategories", btn.dataset.del)
      );
      openSubCategories(categoryId);
    };
  });

  // Sort update
  listEl.querySelectorAll("[data-sub-save]").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.subSave;
      const val = Number(
        listEl.querySelector(`input[data-sub-sort="${id}"]`).value || 0
      );

      await updateDoc(
        doc(db, "topCategories", categoryId, "subCategories", id),
        { sort_order: val }
      );
      alert("Subcategory sort_order güncellendi!");
      openSubCategories(categoryId);
    };
  });
}

// Save subcategory
$("#sc-save").onclick = async () => {
  if (!currentCategoryId) return toast($("#sc-status"), "Kategori seç!", false);

  const id = $("#sc-id").value.trim();
  if (!id) return toast($("#sc-status"), "ID gerekli", false);

  const types = $$(".sc-type")
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);

  const payload = {
    id,
    name: $("#sc-name").value.trim(),
    availableTypes: types.length ? types : null,
  };

  await setDoc(
    doc(db, "topCategories", currentCategoryId, "subCategories", id),
    payload,
    { merge: true }
  );

  toast($("#sc-status"), "Kaydedildi");
  openSubCategories(currentCategoryId);
};
