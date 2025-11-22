import { db } from "./firebase.js";
import { $, toast } from "./helpers.js";
import {
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

async function loadAds() {
  const ref = doc(db, "app_settings", "ads");
  const snap = await getDoc(ref);
  const d = snap.exists() ? snap.data() : {};

  $("#as-banner").checked = !!d.bannerEnabled;
  $("#as-interstitial").checked = !!d.interstitialEnabled;
  $("#as-every").value = d.showEveryX ?? 3;
  $("#as-testb").checked = !!d.useTestBannerIds;
  $("#as-testi").checked = !!d.useTestInterstitialIds;
}

$("#as-save").onclick = async () => {
  const payload = {
    bannerEnabled: $("#as-banner").checked,
    interstitialEnabled: $("#as-interstitial").checked,
    showEveryX: Number($("#as-every").value || 3),
    useTestBannerIds: $("#as-testb").checked,
    useTestInterstitialIds: $("#as-testi").checked,
  };

  await setDoc(doc(db, "app_settings", "ads"), payload, { merge: true });
  toast($("#as-status"), "Kaydedildi");
};

loadAds();
