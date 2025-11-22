// topics.js
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

export let currentLessonId = null;

export async function openTopics(lessonId) {
  currentLessonId = lessonId;
  if (!currentCategoryId || !currentSubCategoryId || !currentLessonId) return;

  $("#topics-box").classList.remove("hidden");
  $("#content-box").classList.add("hidden");
  $("#lesson-label").textContent = lessonId;

  loadTopics();
}

export async function loadTopics() {
  if (!currentCategoryId || !currentSubCategoryId || !currentLessonId) return;

  const listEl = $("#topic-list");
  listEl.innerHTML = "<tr><td colspan='4' class='muted'>Yükleniyor…</td></tr>";

  const snap = await getDocs(
    collection(
      db,
      "topCategories",
      currentCategoryId,
      "subCategories",
      currentSubCategoryId,
      "lessons",
      currentLessonId,
      "topics"
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
        <input type="number" data-topic-sort="${d.id}" value="${
      x.sort_order ?? ""
    }" style="width:60px">
        <button class="btn small" data-topic-save="${d.id}">Kaydet</button>
        <button class="btn small" data-content="${x.id}">İçerik</button>
    </td>
    <td><button class="btn warn small" data-del="${x.id}">Sil</button></td>
</tr>`;
  });

  listEl.innerHTML =
    rows || "<tr><td colspan='4' class='muted'>Konu yok.</td></tr>";

  // sort_order güncelle
  listEl.querySelectorAll("[data-topic-save]").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.topicSave;
      const input = listEl.querySelector(`input[data-topic-sort="${id}"]`);
      const val = Number(input.value || 0);

      await updateDoc(
        doc(
          db,
          "topCategories",
          currentCategoryId,
          "subCategories",
          currentSubCategoryId,
          "lessons",
          currentLessonId,
          "topics",
          id
        ),
        { sort_order: val }
      );

      alert("✅ Topic sort_order güncellendi!");
      loadTopics();
    };
  });

  // İçerik butonu
  listEl.querySelectorAll("[data-content]").forEach((btn) => {
    btn.onclick = () => {
      import("./content.js").then((m) =>
        m.openContent(currentLessonId, btn.dataset.content)
      );
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
          currentLessonId,
          "topics",
          btn.dataset.del
        )
      );
      loadTopics();
    };
  });
}

// Konu kaydet
$("#topic-save").onclick = async () => {
  if (!currentCategoryId || !currentSubCategoryId || !currentLessonId) {
    alert("Önce ders seç");
    return;
  }

  const id = $("#topic-id").value.trim();
  const name = $("#topic-name").value.trim();

  if (!id) {
    alert("Konu id gerekli");
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
      currentLessonId,
      "topics",
      id
    ),
    { id, name },
    { merge: true }
  );

  alert("✅ Konu kaydedildi!");
  $("#topic-id").value = "";
  $("#topic-name").value = "";
  loadTopics();
};
