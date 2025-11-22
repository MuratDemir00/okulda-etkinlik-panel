import { db } from "./firebase.js";
import { $, toast } from "./helpers.js";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

async function loadMovingTexts() {
  const listEl = $("#mt-list");
  listEl.innerHTML = "<tr><td colspan='3'>Yükleniyor…</td></tr>";

  const snap = await getDocs(collection(db, "movingTexts"));
  let rows = "";

  snap.forEach((d) => {
    const x = d.data();
    rows += `
        <tr>
            <td>${d.id}</td>
            <td contenteditable data-doc="${d.id}" class="mt-cell">${x.text}</td>
            <td>
                <button class="btn small" data-save="${d.id}">Kaydet</button>
                <button class="btn warn small" data-del="${d.id}">Sil</button>
            </td>
        </tr>`;
  });

  listEl.innerHTML = rows || "<tr><td colspan='3'>Kayıt yok.</td></tr>";

  listEl.querySelectorAll("[data-save]").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.save;
      const val = listEl
        .querySelector(`.mt-cell[data-doc="${id}"]`)
        .textContent.trim();
      await setDoc(doc(db, "movingTexts", id), { text: val }, { merge: true });
      toast($("#mt-status"), "Güncellendi");
    };
  });

  listEl.querySelectorAll("[data-del]").forEach((btn) => {
    btn.onclick = async () => {
      await deleteDoc(doc(db, "movingTexts", btn.dataset.del));
      loadMovingTexts();
    };
  });
}

$("#mt-add").onclick = async () => {
  const text = $("#mt-text").value.trim();
  if (!text) return toast($("#mt-status"), "Metin boş olamaz", false);

  await addDoc(collection(db, "movingTexts"), { text });
  $("#mt-text").value = "";
  toast($("#mt-status"), "Eklendi");
  loadMovingTexts();
};

loadMovingTexts();
