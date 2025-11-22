import { db } from "./firebase.js";
import { $, toast } from "./helpers.js";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export let currentCategoryId = null;

async function loadTopCategories() {
  const listEl = $("#tc-list");
  listEl.innerHTML = "<tr><td colspan='6'>Yükleniyor…</td></tr>";

  const qSnap = await getDocs(
    query(collection(db, "topCategories"), orderBy("sort_order", "asc"))
  );

  let rows = "";
  qSnap.forEach((d) => {
    const x = d.data();
    rows += `
<tr>
    <td>${x.id}</td>
    <td>${x.name}</td>
    <td class="small">
        <a href="${x.imageUrl}" target="_blank">${(x.imageUrl || "").slice(
      0,
      40
    )}…</a>
    </td>
    <td class="small">
        <input type="number" data-top-sort="${d.id}" value="${
      x.sort_order ?? ""
    }" style="width:60px">
        <button class="btn small" data-top-save="${d.id}">Kaydet</button>
        <div>${x.type || ""}</div>
    </td>
    <td><button class="btn small" data-open="${
      d.id
    }">Alt Kategori Aç</button></td>
    <td><button class="btn warn small" data-del="${d.id}">Sil</button></td>
</tr>`;
  });

  listEl.innerHTML = rows || "<tr><td colspan='6'>Kategori yok.</td></tr>";

  // Alt kategori aç
  listEl.querySelectorAll("[data-open]").forEach((btn) => {
    btn.onclick = () => {
      import("./subCategories.js").then((m) =>
        m.openSubCategories(btn.dataset.open)
      );
    };
  });

  // Sil
  listEl.querySelectorAll("[data-del]").forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm("Silinsin mi?")) return;
      await deleteDoc(doc(db, "topCategories", btn.dataset.del));
      loadTopCategories();
    };
  });

  // Sort update
  listEl.querySelectorAll("[data-top-save]").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.topSave;
      const val = Number(
        listEl.querySelector(`input[data-top-sort="${id}"]`).value || 0
      );

      await updateDoc(doc(db, "topCategories", id), { sort_order: val });
      alert("Sort order güncellendi!");
      loadTopCategories();
    };
  });
}

$("#tc-save").onclick = async () => {
  const id = $("#tc-id").value.trim();
  if (!id) return toast($("#tc-status"), "ID gerekli", false);

  const payload = {
    id,
    name: $("#tc-name").value.trim(),
    imageUrl: $("#tc-image").value.trim(),
    sort_order: $("#tc-sort").value ? Number($("#tc-sort").value) : null,
    type: $("#tc-type").value.trim() || null,
  };

  await setDoc(doc(db, "topCategories", id), payload, { merge: true });
  toast($("#tc-status"), "Kaydedildi");
  loadTopCategories();
};

loadTopCategories();
