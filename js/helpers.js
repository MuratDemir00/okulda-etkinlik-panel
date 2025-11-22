export const $ = (sel) => document.querySelector(sel);
export const $$ = (sel) => Array.from(document.querySelectorAll(sel));

export function toast(el, msg, ok = true) {
  el.textContent = msg;
  el.className = "help " + (ok ? "success" : "danger");
  setTimeout(() => {
    el.textContent = "";
    el.className = "help";
  }, 2000);
}
