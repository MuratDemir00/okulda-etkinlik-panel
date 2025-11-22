import { $$ } from "./helpers.js";

$$(".tab").forEach((t) => {
  t.addEventListener("click", () => {
    $$(".tab").forEach((x) => x.classList.remove("active"));
    t.classList.add("active");

    const id = t.dataset.tab;
    document
      .querySelectorAll("main section")
      .forEach((sec) => sec.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
  });
});
