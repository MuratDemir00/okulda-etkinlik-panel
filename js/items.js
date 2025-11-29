// items.js
import { db } from "./firebase.js";
import { $, toast } from "./helpers.js";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  setDoc,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { currentCategoryId, currentSubCategoryId } from "./subCategories.js";

// -------------------------------------------------------------
// HELPER FUNCTIONS
// -------------------------------------------------------------
function slugify(str) {
  return (str || "")
    .toLowerCase()
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// okunabilir hale çevir (Guzel Davranislarimiz)
function toReadable(str) {
  if (!str) return "";
  return str.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function typeToReadable(type) {
  const map = {
    text: "Metin",
    image: "Görsel",
    audio: "Ses",
    video: "Video",
    pdf: "PDF",
    activity: "Etkinlik",
  };
  return map[type] || type;
}

// GLOBAL
window.currentLessonId = null;
window.currentTopicId = null;

// Koleksiyon referansı
function getItemsCollectionRef() {
  return collection(
    db,
    "topCategories",
    currentCategoryId,
    "subCategories",
    currentSubCategoryId,
    "items"
  );
}

// -------------------------------------------------------------
// INPUT FIELDS SHOW/HIDE
// -------------------------------------------------------------
function updateItemFieldVisibility() {
  const type = $("#it-type").value;

  document
    .querySelectorAll(".item-field")
    .forEach((el) => el.classList.add("hidden"));

  const target = document.querySelector(`.item-${type}`);
  if (target) target.classList.remove("hidden");
}

$("#it-type").addEventListener("change", () => {
  updateItemFieldVisibility();
  $("#it-text").value =
    $("#it-image").value =
    $("#it-video").value =
    $("#it-audio").value =
    $("#it-pdf").value =
      "";
});

// -------------------------------------------------------------
// ITEMS LOAD
// -------------------------------------------------------------
export async function loadItems() {
  if (!currentCategoryId || !currentSubCategoryId) return;

  updateItemFieldVisibility();

  const listEl = $("#it-list");
  listEl.innerHTML = "<tr><td colspan='5'>Yükleniyor…</td></tr>";

  const snap = await getDocs(getItemsCollectionRef());
  const arr = [];

  snap.forEach((d) => arr.push({ _docId: d.id, ...d.data() }));

  arr.sort((a, b) => (a.sort_order || 999999) - (b.sort_order || 999999));

  let html = "";
  arr.forEach((x) => {
    const docId = x._docId;
    const content =
      x.text || x.imageUrl || x.videoUrl || x.audioUrl || x.pdfUrl || "";

    html += `
<tr class="item-row" draggable="true" data-id="${docId}">
  <td>${x.id}</td>
  <td>${x.type}</td>
  <td>${x.title}</td>
  <td>
    <div>
      <input type="number" data-item-sort="${docId}" value="${
      x.sort_order || ""
    }" style="width:60px">
      <button class="btn small" data-item-save="${docId}">Kaydet</button>
    </div>
    <div class="small mono">${content.slice(0, 80)}…</div>
  </td>
  <td><button class="btn warn small" data-del="${docId}">Sil</button></td>
</tr>`;
  });

  listEl.innerHTML =
    html || "<tr><td colspan='5' class='muted'>Item yok.</td></tr>";

  // Silme
  listEl.querySelectorAll("[data-del]").forEach((btn) => {
    btn.onclick = async () => {
      await deleteDoc(doc(getItemsCollectionRef(), btn.dataset.del));
      loadItems();
    };
  });

  // Manuel sıralama
  listEl.querySelectorAll("[data-item-save]").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.itemSave;
      const newPos = Math.max(
        1,
        parseInt(
          listEl.querySelector(`input[data-item-sort="${id}"]`).value,
          10
        )
      );

      const snap = await getDocs(getItemsCollectionRef());
      const arr = [];

      snap.forEach((d) =>
        arr.push({
          id: d.id,
          sort_order: d.data().sort_order || 999999,
        })
      );

      arr.sort((a, b) => a.sort_order - b.sort_order);

      const from = arr.findIndex((x) => x.id === id);
      const to = Math.min(newPos - 1, arr.length - 1);

      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);

      const batch = writeBatch(db);
      arr.forEach((x, i) => {
        batch.update(doc(getItemsCollectionRef(), x.id), {
          sort_order: i + 1,
        });
      });

      await batch.commit();
      toast($("#it-status"), "Sıra güncellendi", true);
      loadItems();
    };
  });

  setupDragAndDrop(listEl);
}

// -------------------------------------------------------------
// DRAG & DROP
// -------------------------------------------------------------
function setupDragAndDrop(listEl) {
  let dragSrc = null;

  listEl.querySelectorAll("tr.item-row").forEach((row) => {
    row.addEventListener("dragstart", () => {
      dragSrc = row;
      row.classList.add("dragging");
    });

    row.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (!dragSrc || dragSrc === row) return;
      const rect = row.getBoundingClientRect();
      const offset = e.clientY - rect.top;
      if (offset < rect.height / 2) listEl.insertBefore(dragSrc, row);
      else listEl.insertBefore(dragSrc, row.nextSibling);
    });

    row.addEventListener("dragend", async () => {
      row.classList.remove("dragging");
      const rows = [...listEl.querySelectorAll("tr.item-row")];

      const batch = writeBatch(db);
      rows.forEach((r, index) => {
        batch.update(doc(getItemsCollectionRef(), r.dataset.id), {
          sort_order: index + 1,
        });
      });

      await batch.commit();
      toast($("#it-status"), "Sürükle-bırak kaydedildi", true);
      loadItems();
    });
  });
}

// -------------------------------------------------------------
// CREATE ITEM
// -------------------------------------------------------------
// -------------------------------------------------------------
// CREATE ITEM (AUTO TITLE + USER OVERRIDE)
// -------------------------------------------------------------
$("#it-save").onclick = async () => {
  if (
    !["funny_texts", "special_days"].includes(currentCategoryId) &&
    currentCategoryId !== "grades"
  ) {
    toast($("#it-status"), "Geçerli kategori seç", false);
    return;
  }

  const type = $("#it-type").value;

  // nextOrder hesapla
  let nextOrder = 1;
  const snap = await getDocs(getItemsCollectionRef());
  snap.forEach((d) => {
    const so = d.data().sort_order || 0;
    if (so >= nextOrder) nextOrder = so + 1;
  });

  // ID üret
  let id = "";

  if (currentCategoryId === "grades") {
    const gradeNumber = currentSubCategoryId.replace(/[^0-9]/g, "") || "0";

    id = [
      `g${gradeNumber}`,
      slugify(window.currentLessonId),
      slugify(window.currentTopicId),
      slugify(type),
      nextOrder,
    ].join("_");
  } else {
    id = `${slugify(currentSubCategoryId)}_${nextOrder}`;
  }

  // -------------------------------------------------------------
  // AUTO TITLE + USER OVERRIDE
  // -------------------------------------------------------------
  let autoTitle = "";
  let userTitle = $("#it-title").value.trim();

  if (currentCategoryId === "grades") {
    autoTitle = `${toReadable(window.currentTopicId)} ${typeToReadable(
      type
    )} ${nextOrder}`;
  } else {
    autoTitle = `${toReadable(currentSubCategoryId)} ${nextOrder}`;
  }

  // Kullanıcı kendi başlık yazdıysa onu kullan, boşsa otomatik yaz
  const finalTitle = userTitle || autoTitle;

  // -------------------------------------------------------------
  // SAVE PAYLOAD
  // -------------------------------------------------------------
  const payload = {
    id,
    type,
    title: finalTitle,
    text: type === "text" ? $("#it-text").value.trim() : null,
    imageUrl: type === "image" ? $("#it-image").value.trim() : null,
    videoUrl: type === "video" ? $("#it-video").value.trim() : null,
    audioUrl: type === "audio" ? $("#it-audio").value.trim() : null,
    pdfUrl: type === "pdf" ? $("#it-pdf").value.trim() : null,
    sort_order: nextOrder,
  };

  await setDoc(doc(getItemsCollectionRef(), id), payload);

  toast($("#it-status"), "Item kaydedildi", true);

  $("#it-title").value = ""; // kullanıcı girdiği başlık temizlenir
  $("#it-text").value =
    $("#it-image").value =
    $("#it-video").value =
    $("#it-audio").value =
    $("#it-pdf").value =
      "";

  loadItems();
};
