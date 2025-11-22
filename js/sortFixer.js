// sortFixer.js
import { db } from "./firebase.js";
import { $ } from "./helpers.js";
import {
  collection,
  getDocs,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

$("#fix-sort-order").addEventListener("click", async () => {
  try {
    const statusEl = $("#sort-status");
    statusEl.textContent = "Sort order güncelleniyor...";

    // 1) TOP CATEGORIES
    const topSnap = await getDocs(collection(db, "topCategories"));
    let topIndex = 1;
    for (const d of topSnap.docs) {
      await updateDoc(d.ref, { sort_order: topIndex++ });
    }

    // 2) SUBCATEGORIES
    for (const top of topSnap.docs) {
      const subSnap = await getDocs(
        collection(db, "topCategories", top.id, "subCategories")
      );
      let subIndex = 1;
      for (const s of subSnap.docs) {
        await updateDoc(s.ref, { sort_order: subIndex++ });
      }
    }

    // 3) LESSONS (sadece grades altında)
    const gradeSubSnap = await getDocs(
      collection(db, "topCategories", "grades", "subCategories")
    );

    for (const sub of gradeSubSnap.docs) {
      const lessonSnap = await getDocs(
        collection(
          db,
          "topCategories",
          "grades",
          "subCategories",
          sub.id,
          "lessons"
        )
      );

      let lessonIndex = 1;
      for (const l of lessonSnap.docs) {
        await updateDoc(l.ref, { sort_order: lessonIndex++ });
      }
    }

    // 4) TOPICS (grades altındaki tüm ders/konu)
    for (const sub of gradeSubSnap.docs) {
      const lessonSnap = await getDocs(
        collection(
          db,
          "topCategories",
          "grades",
          "subCategories",
          sub.id,
          "lessons"
        )
      );

      for (const l of lessonSnap.docs) {
        const topicSnap = await getDocs(
          collection(
            db,
            "topCategories",
            "grades",
            "subCategories",
            sub.id,
            "lessons",
            l.id,
            "topics"
          )
        );

        let topicIndex = 1;
        for (const t of topicSnap.docs) {
          await updateDoc(t.ref, { sort_order: topicIndex++ });
        }
      }
    }

    statusEl.textContent = "🎉 Tüm sort_order alanları güncellendi!";
    alert("🎉 Sort order işlemi tamamlandı!");
  } catch (e) {
    console.error(e);
    $("#sort-status").textContent = "❌ Sort order sırasında hata oluştu";
  }
});
