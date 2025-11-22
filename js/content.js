// content.js
import { db } from "./firebase.js";
import { $, $$ } from "./helpers.js";
import {
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { currentCategoryId, currentSubCategoryId } from "./subCategories.js";

let currentLessonId = null;
let currentTopicId = null;
let currentContentCount = 0;

export async function openContent(lessonId, topicId) {
  currentLessonId = lessonId;
  currentTopicId = topicId;

  if (
    !currentCategoryId ||
    !currentSubCategoryId ||
    !currentLessonId ||
    !currentTopicId
  )
    return;

  $("#content-box").classList.remove("hidden");
  $("#topic-label").textContent = topicId;

  updateContentFieldVisibility();
  await loadContent();
}

async function loadContent() {
  if (
    !currentCategoryId ||
    !currentSubCategoryId ||
    !currentLessonId ||
    !currentTopicId
  )
    return;

  const type = $("#content-type").value;
  const ref = doc(
    db,
    "topCategories",
    currentCategoryId,
    "subCategories",
    currentSubCategoryId,
    "lessons",
    currentLessonId,
    "topics",
    currentTopicId
  );

  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : {};
  const listEl = $("#content-list");

  const arr = data.content?.[type] ?? [];
  currentContentCount = arr.length + 1;

  if (!arr.length) {
    listEl.innerHTML =
      "<tr><td colspan='5' class='muted'>İçerik yok.</td></tr>";
    autoFillNewContentFields();
    return;
  }

  let rows = "";
  arr.forEach((item) => {
    const content =
      item.text ??
      item.imageUrl ??
      item.audioUrl ??
      item.videoUrl ??
      item.pdfUrl ??
      "";

    rows += `
<tr>
    <td>${item.id}</td>
    <td>${item.title || ""}</td>
    <td>${item.type}</td>
    <td class="small mono">${content.slice(0, 60)}${
      content.length > 60 ? "…" : ""
    }</td>
    <td><button class="btn warn small" data-del-content="${
      item.id
    }">Sil</button></td>
</tr>`;
  });

  listEl.innerHTML = rows;

  // Sil butonları
  listEl.querySelectorAll("[data-del-content]").forEach((btn) => {
    btn.onclick = async () => {
      const snap2 = await getDoc(ref);
      const d = snap2.exists() ? snap2.data() : {};
      d.content = d.content || {};
      const itemsArr = d.content[type] || [];
      d.content[type] = itemsArr.filter((i) => i.id !== btn.dataset.delContent);

      await setDoc(ref, d, { merge: true });
      await loadContent();
    };
  });

  autoFillNewContentFields();
}

// içerik türü değişince
$("#content-type").addEventListener("change", async () => {
  updateContentFieldVisibility();
  clearIrrelevantFields($("#content-type").value);
  await loadContent();
});

// içerik kaydet
$("#content-save").onclick = async () => {
  if (
    !currentCategoryId ||
    !currentSubCategoryId ||
    !currentLessonId ||
    !currentTopicId
  ) {
    alert("Önce konu seç");
    return;
  }

  const id = $("#content-id").value.trim();
  const title = $("#content-title").value.trim();
  const type = $("#content-type").value;

  if (!id) return alert("İçerik ID gerekli");
  if (!title) return alert("Başlık gerekli");

  const item = {
    id,
    type,
    title,
    text: null,
    imageUrl: null,
    audioUrl: null,
    videoUrl: null,
    pdfUrl: null,
  };

  if (type === "text" || type === "activity")
    item.text = $("#content-text").value.trim() || null;
  if (type === "image")
    item.imageUrl = $("#content-image").value.trim() || null;
  if (type === "audio")
    item.audioUrl = $("#content-audio").value.trim() || null;
  if (type === "video")
    item.videoUrl = $("#content-video").value.trim() || null;
  if (type === "pdf") item.pdfUrl = $("#content-pdf").value.trim() || null;

  const ref = doc(
    db,
    "topCategories",
    currentCategoryId,
    "subCategories",
    currentSubCategoryId,
    "lessons",
    currentLessonId,
    "topics",
    currentTopicId
  );

  const snap = await getDoc(ref);
  const d = snap.exists()
    ? snap.data()
    : { id: currentTopicId, name: null, content: {} };

  d.content = d.content || {};
  d.content[type] = d.content[type] || [];
  d.content[type].push(item);

  await setDoc(ref, d, { merge: true });

  alert("✅ İçerik kaydedildi!");
  await loadContent();
};

// alan görünürlüğü
function updateContentFieldVisibility() {
  const t = $("#content-type").value;

  $$(".content-field").forEach((el) => el.classList.add("hidden"));

  if (t === "text" || t === "activity")
    $(".content-text")?.classList.remove("hidden");
  if (t === "image") $(".content-image")?.classList.remove("hidden");
  if (t === "audio") $(".content-audio")?.classList.remove("hidden");
  if (t === "video") $(".content-video")?.classList.remove("hidden");
  if (t === "pdf") $(".content-pdf")?.classList.remove("hidden");
}

function clearIrrelevantFields(keepType) {
  if (keepType !== "text" && keepType !== "activity")
    $("#content-text").value = "";
  if (keepType !== "image") $("#content-image").value = "";
  if (keepType !== "audio") $("#content-audio").value = "";
  if (keepType !== "video") $("#content-video").value = "";
  if (keepType !== "pdf") $("#content-pdf").value = "";
}

function autoFillNewContentFields() {
  if (!currentTopicId) return;

  const type = $("#content-type").value;

  $("#content-id").value = `${currentTopicId}_${type}_${currentContentCount}`;

  const topicName = $("#topic-label").textContent || currentTopicId;

  const typeNames = {
    text: "Metin",
    image: "Görsel",
    audio: "Ses",
    video: "Video",
    pdf: "PDF",
    activity: "Etkinlik",
  };

  $(
    "#content-title"
  ).value = `${topicName} ${typeNames[type]} ${currentContentCount}`;
}
