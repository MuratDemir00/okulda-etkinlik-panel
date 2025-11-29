// grades.js
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
import { openTopics } from "./topics.js";

export function getLessonsRef() {
  return collection(
    db,
    "topCategories",
    currentCategoryId,
    "subCategories",
    currentSubCategoryId,
    "lessons"
  );
}

export async function loadLessons() {
  if (!currentCategoryId || !currentSubCategoryId) return;

  const listEl = $("#lesson-list");
  listEl.innerHTML = "<tr><td colspan='4'>Yükleniyor…</td></tr>";

  $("#topics-box").classList.add("hidden");
  $("#content-box").classList.add("hidden");

  const snap = await getDocs(getLessonsRef());
  const lessons = [];

  snap.forEach((d) => {
    const x = d.data();
    lessons.push({
      _docId: d.id,
      ...x,
    });
  });

  lessons.sort((a, b) => {
    const ao = typeof a.sort_order === "number" ? a.sort_order : 999999;
    const bo = typeof b.sort_order === "number" ? b.sort_order : 999999;
    return ao - bo;
  });

  let rows = "";

  lessons.forEach((x) => {
    rows += `
<tr class="lesson-row" draggable="true" data-id="${x._docId}">
  <td>${x.id}</td>
  <td>${x.name || ""}</td>
  <td>
    <button class="btn small" data-open-topics="${x._docId}">Konular</button>
  </td>
  <td>
    <button class="btn warn small" data-del="${x._docId}">Sil</button>
  </td>
</tr>`;
  });

  listEl.innerHTML =
    rows || "<tr><td colspan='4' class='muted'>Ders yok.</td></tr>";

  // Konular Aç
  listEl.querySelectorAll("[data-open-topics]").forEach((btn) => {
    btn.onclick = () => openTopics(btn.dataset.openTopics);
  });

  // Silme
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

  setupDragAndDrop(listEl);
}

// ------------------------
//   🔥 DRAG & DROP
// ------------------------
function setupDragAndDrop(listEl) {
  const rows = listEl.querySelectorAll("tr.lesson-row");
  if (!rows.length) return;

  let dragSrc = null;

  rows.forEach((row) => {
    row.addEventListener("dragstart", (e) => {
      dragSrc = row;
      row.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });

    row.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (!dragSrc || dragSrc === row) return;

      const rect = row.getBoundingClientRect();
      const offset = e.clientY - rect.top;

      if (offset < rect.height / 2) {
        row.parentNode.insertBefore(dragSrc, row);
      } else {
        row.parentNode.insertBefore(dragSrc, row.nextSibling);
      }
    });

    row.addEventListener("dragend", async () => {
      row.classList.remove("dragging");

      const ordered = Array.from(listEl.querySelectorAll("tr.lesson-row"));
      if (!ordered.length) return;

      try {
        const batch = writeBatch(db);

        ordered.forEach((r, index) => {
          const ref = doc(
            db,
            "topCategories",
            currentCategoryId,
            "subCategories",
            currentSubCategoryId,
            "lessons",
            r.dataset.id
          );
          batch.update(ref, { sort_order: index + 1 });
        });

        await batch.commit();
        toast($("#lesson-status"), "Sıralama kaydedildi", true);
        loadLessons();
      } catch (err) {
        console.error("SORT ERROR =", err);
        toast($("#lesson-status"), "Kaydedilemedi!", false);
      }

      dragSrc = null;
    });
  });
}

// ------------------------
//   🔥 DERS KAYDET
// ------------------------
$("#lesson-save").onclick = async () => {
  const id = $("#lesson-id").value.trim();
  const name = $("#lesson-name").value.trim();

  if (!id) {
    toast($("#lesson-status"), "Ders id gerekli", false);
    return;
  }

  const snap = await getDocs(getLessonsRef());
  let maxOrder = 0;
  snap.forEach((d) => {
    const so = d.data().sort_order;
    if (typeof so === "number" && so > maxOrder) maxOrder = so;
  });

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
    {
      id,
      name,
      sort_order: maxOrder + 1,
    },
    { merge: true }
  );

  toast($("#lesson-status"), "Ders kaydedildi", true);

  $("#lesson-id").value = "";
  $("#lesson-name").value = "";

  loadLessons();
};
