// items.js
import { db } from "./firebase.js";
import { $, toast } from "./helpers.js";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { currentCategoryId, currentSubCategoryId } from "./subCategories.js";

export async function loadItems() {
  if (!currentCategoryId || !currentSubCategoryId) return;

  const listEl = $("#it-list");
  listEl.innerHTML = "<tr><td colspan='5' class='muted'>Yükleniyor…</td></tr>";

  const path = collection(
    db,
    "topCategories",
    currentCategoryId,
    "subCategories",
    currentSubCategoryId,
    "items"
  );

  const snap = await getDocs(path);

  let rows = "";
  snap.forEach((d) => {
    const x = d.data();
    let content =
      x.type === "text"
        ? x.text ?? ""
        : x.type === "image"
        ? x.imageUrl ?? ""
        : x.type === "video"
        ? x.videoUrl ?? ""
        : x.type === "audio"
        ? x.audioUrl ?? ""
        : x.type === "pdf"
        ? x.pdfUrl ?? ""
        : "";

    rows += `
<tr>
    <td class="mono small">${x.id ?? d.id}</td>
    <td>${x.type ?? ""}</td>
    <td>${x.title ?? ""}</td>
    <td>
        <input type="number" data-item-sort="${d.id}" value="${
      x.sort_order ?? ""
    }" style="width:60px">
        <button class="btn small" data-item-save="${d.id}">Kaydet</button>
        <div class="small mono">${(content || "")
          .toString()
          .slice(0, 80)}…</div>
    </td>
    <td><button class="btn warn small" data-del="${d.id}">Sil</button></td>
</tr>`;
  });

  listEl.innerHTML =
    rows || "<tr><td colspan='5' class='muted'>Item yok.</td></tr>";

  // sort_order güncelleme
  listEl.querySelectorAll("[data-item-save]").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.itemSave;
      const input = listEl.querySelector(`input[data-item-sort="${id}"]`);
      const val = Number(input.value || 0);

      await updateDoc(
        doc(
          db,
          "topCategories",
          currentCategoryId,
          "subCategories",
          currentSubCategoryId,
          "items",
          id
        ),
        { sort_order: val }
      );

      alert("✅ Item sort_order güncellendi!");
      loadItems();
    };
  });

  // sil
  listEl.querySelectorAll("[data-del]").forEach((btn) => {
    btn.onclick = async () => {
      const ref = doc(
        db,
        "topCategories",
        currentCategoryId,
        "subCategories",
        currentSubCategoryId,
        "items",
        btn.dataset.del
      );
      await deleteDoc(ref);
      loadItems();
    };
  });
}

// Item kaydet / güncelle
$("#it-save").onclick = async () => {
  if (
    !["funny_texts", "special_days"].includes(currentCategoryId) ||
    !currentSubCategoryId
  ) {
    toast(
      $("#it-status"),
      "Önce geçerli bir kategori → subCategory seç",
      false
    );
    return;
  }

  const id = $("#it-id").value.trim();
  const type = $("#it-type").value;

  if (!id) {
    toast($("#it-status"), "id gerekli", false);
    return;
  }

  const payload = {
    id,
    type,
    title: $("#it-title").value.trim() || null,
    text: type === "text" ? $("#it-text").value.trim() || null : null,
    imageUrl: type === "image" ? $("#it-image").value.trim() || null : null,
    videoUrl: type === "video" ? $("#it-video").value.trim() || null : null,
    audioUrl: type === "audio" ? $("#it-audio").value.trim() || null : null,
    pdfUrl: type === "pdf" ? $("#it-pdf").value.trim() || null : null,
  };

  const ref = doc(
    db,
    "topCategories",
    currentCategoryId,
    "subCategories",
    currentSubCategoryId,
    "items",
    id
  );

  await setDoc(ref, payload, { merge: true });

  toast($("#it-status"), "Item kaydedildi");

  // temizle
  $("#it-id").value = "";
  $("#it-title").value = "";
  $("#it-text").value = "";
  $("#it-image").value = "";
  $("#it-video").value = "";
  $("#it-audio").value = "";
  $("#it-pdf").value = "";

  loadItems();
};
