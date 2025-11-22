// grades.js
import { db } from "./firebase.js";
import { $ } from "./helpers.js";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { currentCategoryId, currentSubCategoryId } from "./subCategories.js";
import { openTopics } from "./topics.js";

export async function loadLessons() {
  if (!currentCategoryId || !currentSubCategoryId) return;

  const listEl = $("#lesson-list");
  listEl.innerHTML = "<tr><td colspan='4' class='muted'>Yükleniyor…</td></tr>";

  // topics ve content panellerini gizle
  $("#topics-box").classList.add("hidden");
  $("#content-box").classList.add("hidden");

  const snap = await getDocs(
    collection(
      db,
      "topCategories",
      currentCategoryId,
      "subCategories",
      currentSubCategoryId,
      "lessons"
    )
  );

  let rows = "";
  snap.forEach((d) => {
    const x = d.data();
    rows += `
<tr>
    <td>${x.id}</td>
    <td>${x.name || ""}</td>
    <td>
        <input type="number" data-lesson-sort="${d.id}" value="${
      x.sort_order ?? ""
    }" style="width:60px">
        <button class="btn small" data-lesson-save="${d.id}">Kaydet</button>
        <button class="btn small" data-topics="${x.id}">Konular</button>
    </td>
    <td><button class="btn warn small" data-del="${x.id}">Sil</button></td>
</tr>`;
  });

  listEl.innerHTML =
    rows || "<tr><td colspan='4' class='muted'>Ders yok.</td></tr>";

  // sort_order güncelle
  listEl.querySelectorAll("[data-lesson-save]").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.lessonSave;
      const input = listEl.querySelector(`input[data-lesson-sort="${id}"]`);
      const val = Number(input.value || 0);

      await updateDoc(
        doc(
          db,
          "topCategories",
          currentCategoryId,
          "subCategories",
          currentSubCategoryId,
          "lessons",
          id
        ),
        { sort_order: val }
      );

      alert("✅ Ders sort_order güncellendi!");
      loadLessons();
    };
  });

  // Konular butonu
  listEl.querySelectorAll("[data-topics]").forEach((btn) => {
    btn.onclick = () => {
      openTopics(btn.dataset.topics);
    };
  });

  // Sil
  listEl.querySelectorAll("[data-del]").forEach((btn) => {
    btn.onclick = async () => {
      await deleteDoc(
        doc(
          db,
          "topCategories",
          currentCategoryId,
          "subCategories",
          currentSubCategoryId,
          "lessons",
          btn.dataset.del
        )
      );
      loadLessons();
    };
  });
}

// Ders kaydet
$("#lesson-save").onclick = async () => {
  const id = $("#lesson-id").value.trim();
  const name = $("#lesson-name").value.trim();

  if (!id) {
    alert("Ders id gerekli");
    return;
  }

  await setDoc(
    doc(
      db,
      "topCategories",
      currentCategoryId,
      "subCategories",
      currentSubCategoryId,
      "lessons",
      id
    ),
    { id, name },
    { merge: true }
  );

  alert("✅ Ders kaydedildi!");
  $("#lesson-id").value = "";
  $("#lesson-name").value = "";
  loadLessons();
};
