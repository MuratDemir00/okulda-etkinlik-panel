// topics.js
import { db } from "./firebase.js";
import { $, toast } from "./helpers.js";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { currentCategoryId, currentSubCategoryId } from "./subCategories.js";

// GLOBAL — items.js otomatik ID için kullanacak
window.currentLessonId = null;
window.currentTopicId = null;

export let currentLessonId = null;

function getTopicsRef() {
  return collection(
    db,
    "topCategories",
    currentCategoryId,
    "subCategories",
    currentSubCategoryId,
    "lessons",
    currentLessonId,
    "topics"
  );
}

// -----------------------------------------------------------------
// TOPICS PANELİ AÇILINCA LESSON ID'Yİ SET ET (GLOBAL)
// -----------------------------------------------------------------
export async function openTopics(lessonId) {
  currentLessonId = lessonId;
  window.currentLessonId = lessonId; // **items.js için gerekli**

  if (!currentCategoryId || !currentSubCategoryId || !currentLessonId) return;

  $("#topics-box").classList.remove("hidden");
  $("#content-box").classList.add("hidden");
  $("#lesson-label").textContent = lessonId;

  loadTopics();
}

// -----------------------------------------------------------------
// TOPICS YÜKLE
// -----------------------------------------------------------------
export async function loadTopics() {
  if (!currentCategoryId || !currentSubCategoryId || !currentLessonId) return;

  const listEl = $("#topic-list");
  listEl.innerHTML = "<tr><td colspan='4' class='muted'>Yükleniyor…</td></tr>";

  const snap = await getDocs(getTopicsRef());

  const topics = [];
  snap.forEach((d) => {
    const x = d.data();
    topics.push({
      _docId: d.id,
      ...x,
    });
  });

  topics.sort((a, b) => {
    const ao =
      typeof a.sort_order === "number" ? a.sort_order : Number.MAX_SAFE_INTEGER;
    const bo =
      typeof b.sort_order === "number" ? b.sort_order : Number.MAX_SAFE_INTEGER;
    return ao - bo;
  });

  let rows = "";
  topics.forEach((x) => {
    rows += `
<tr class="topic-row" draggable="true" data-id="${x._docId}">
    <td>${x.id}</td>
    <td>${x.name ?? ""}</td>
    <td>
        <button class="btn small" data-content="${x.id}">İçerik</button>
    </td>
    <td><button class="btn warn small" data-del="${x.id}">Sil</button></td>
</tr>`;
  });

  listEl.innerHTML =
    rows || "<tr><td colspan='4' class='muted'>Konu yok.</td></tr>";

  // -------------------------------------------------------------
  // İçerik butonu → content.js
  // -------------------------------------------------------------
  listEl.querySelectorAll("[data-content]").forEach((btn) => {
    btn.onclick = () => {
      // **GLOBAL TOPIC ID'Yİ SET ET → items.js otomatik ID kullanır**
      window.currentTopicId = btn.dataset.content;

      import("./content.js").then((m) =>
        m.openContent(currentLessonId, btn.dataset.content)
      );
    };
  });

  // -------------------------------------------------------------
  // Sil
  // -------------------------------------------------------------
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

  setupTopicDragAndDrop(listEl);
}

// -----------------------------------------------------------------
// DRAG & DROP SIRALAMA
// -----------------------------------------------------------------
function setupTopicDragAndDrop(listEl) {
  const rows = listEl.querySelectorAll("tr.topic-row");
  if (!rows.length) return;

  let dragSrc = null;

  rows.forEach((row) => {
    row.addEventListener("dragstart", (e) => {
      dragSrc = row;
      row.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });

    row.addEventListener("dragend", async () => {
      row.classList.remove("dragging");

      const arr = Array.from(listEl.querySelectorAll("tr.topic-row"));
      if (!arr.length) return;

      try {
        const batch = writeBatch(db);

        arr.forEach((r, index) => {
          const id = r.dataset.id;
          const ref = doc(
            db,
            "topCategories",
            currentCategoryId,
            "subCategories",
            currentSubCategoryId,
            "lessons",
            currentLessonId,
            "topics",
            id
          );
          batch.update(ref, { sort_order: index + 1 });
        });

        await batch.commit();
        toast($("#topic-status"), "Konu sırası kaydedildi", true);
        loadTopics();
      } catch (e) {
        console.error(e);
        toast($("#topic-status"), "Sıra kaydedilemedi", false);
      }

      dragSrc = null;
    });

    row.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (!dragSrc || dragSrc === row) return;

      const rect = row.getBoundingClientRect();
      const offset = e.clientY - rect.top;
      const parent = listEl;

      if (offset < rect.height / 2) parent.insertBefore(dragSrc, row);
      else parent.insertBefore(dragSrc, row.nextSibling);
    });
  });
}

// -----------------------------------------------------------------
// TOPIC KAYDET
// -----------------------------------------------------------------
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

  window.currentTopicId = id; // **items.js için kritik**

  // sort_order belirle
  const snap = await getDocs(getTopicsRef());
  let maxOrder = 0;

  snap.forEach((d) => {
    const so =
      typeof d.data().sort_order === "number" ? d.data().sort_order : 0;
    if (so > maxOrder) maxOrder = so;
  });

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
    { id, name, sort_order: maxOrder + 1 },
    { merge: true }
  );

  alert("✅ Konu kaydedildi!");
  $("#topic-id").value = "";
  $("#topic-name").value = "";

  loadTopics();
};
