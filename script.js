/*
 * FORMA — обычный JavaScript, без библиотек и установки пакетов.
 * Основные настройки сайта находятся в объекте STUDIO.
 * Telegram указывается БЕЗ @. Пустая строка оставляет форму в деморежиме.
 * Токен Telegram-бота сюда не вставляется: код сайта доступен посетителям.
 */
"use strict";

const STUDIO = {
  name: "FORMA",
  telegram: "",
  types: {
    landing: { title: "Лендинг", price: 5000, days: 7 },
    company: { title: "Сайт компании", price: 12000, days: 14 },
    catalog: { title: "Каталог", price: 18000, days: 21 }
  },
  extraPage: { price: 2000, days: 2 },
  extras: {
    copywriting: { title: "Помощь с текстами", price: 1500, days: 2 },
    graphics: { title: "Авторская графика", price: 2500, days: 3 }
  }
};

const PROJECTS = {
  line: {
    title: "Линия — архитектурное бюро",
    description: "Спокойная палитра, крупные заголовки и много воздуха. Концепция для бюро, которому важно показать свой подход к архитектуре.",
    features: ["Первый экран с главной идеей", "Галерея проектов и услуг", "Знакомство с командой и контакты"],
    type: "landing"
  },
  coffee: {
    title: "Крошка — пекарня и кофе",
    description: "Тёплая гамма и мягкая типографика. Меню, в котором легко найти любимый напиток и узнать, где находится пекарня.",
    features: ["Каталог меню по категориям", "Карточки напитков и выпечки", "Адрес, часы работы и связь с пекарней"],
    type: "catalog"
  },
  motion: {
    title: "MOTION — студия движения",
    description: "Сдержанный цвет и ритмичная графика. Концепция для небольшой студии, которая знакомит с направлениями занятий и преподавателями.",
    features: ["Направления занятий", "Информация о преподавателях", "Тарифы и переход к записи"],
    type: "company"
  }
};

const money = (value) => new Intl.NumberFormat("ru-RU").format(value) + " ₽";
const one = (selector) => document.querySelector(selector);
const all = (selector) => [...document.querySelectorAll(selector)];
const estimateForm = one("#estimate-form");
const briefForm = one("#brief-form");
const dialog = one("#project-dialog");
let activeProject = null;
let activeProjectButton = null;

// Чистая функция расчёта. Не зависит от интерфейса и не отправляет данные.
function calculateEstimate(type, requestedPages, selectedExtras) {
  const key = Object.hasOwn(STUDIO.types, type) ? type : "landing";
  const base = STUDIO.types[key];
  const pages = Math.min(5, Math.max(0, Math.trunc(Number(requestedPages) || 0)));
  const extras = [...new Set(selectedExtras)].filter((item) => Object.hasOwn(STUDIO.extras, item));
  let price = base.price + pages * STUDIO.extraPage.price;
  let days = base.days + pages * STUDIO.extraPage.days;
  const rows = [{ title: base.title, price: base.price }];
  if (pages) rows.push({ title: "Доп. страницы: " + pages, price: pages * STUDIO.extraPage.price });
  for (const key of extras) {
    price += STUDIO.extras[key].price;
    days += STUDIO.extras[key].days;
    rows.push({ title: STUDIO.extras[key].title, price: STUDIO.extras[key].price });
  }
  return { type: key, title: base.title, price, days, pages, extras, rows };
}

function currentEstimate() {
  return calculateEstimate(
    estimateForm.elements["site-type"].value,
    estimateForm.elements["extra-pages"].value,
    Object.keys(STUDIO.extras).filter((key) => estimateForm.elements[key].checked)
  );
}

function hideOldBrief() {
  one("#brief-result").hidden = true;
  one("#copy-status").textContent = "";
}

function updateEstimate() {
  const result = currentEstimate();
  one("#estimate-price").textContent = money(result.price);
  one("#brief-price").textContent = money(result.price);
  one("#estimate-type").textContent = result.title;
  one("#estimate-days").textContent = `${result.days}–${result.days + 4} рабочих дней`;
  one("#pages-count").textContent = String(result.pages);
  const breakdown = one("#estimate-breakdown");
  breakdown.replaceChildren();
  for (const row of result.rows) {
    const line = document.createElement("div");
    line.className = "breakdown-row";
    const title = document.createElement("span");
    title.textContent = row.title;
    const amount = document.createElement("span");
    amount.textContent = money(row.price);
    line.append(title, amount);
    breakdown.append(line);
  }
  hideOldBrief();
}

function chooseType(type) {
  if (!Object.hasOwn(STUDIO.types, type)) return;
  estimateForm.elements["site-type"].value = type;
  updateEstimate();
}

// Мобильное меню; закрывается по ссылке, Escape и клику снаружи.
const menuButton = one(".menu-toggle");
const navigation = one("#navigation");
function setMenu(open) {
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
  navigation.classList.toggle("is-open", open);
}
menuButton.addEventListener("click", () => setMenu(menuButton.getAttribute("aria-expanded") !== "true"));
navigation.addEventListener("click", (event) => { if (event.target.closest("a")) setMenu(false); });
document.addEventListener("click", (event) => { if (!event.target.closest(".header")) setMenu(false); });
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
    setMenu(false);
    menuButton.focus();
  }
});
window.addEventListener("resize", () => { if (window.innerWidth > 640) setMenu(false); });

all(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    all(".filter").forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    all(".project-card").forEach((card) => { card.hidden = filter !== "all" && card.dataset.category !== filter; });
  });
});

all(".project-open").forEach((button) => {
  button.addEventListener("click", () => {
    const project = PROJECTS[button.dataset.project];
    if (!project) return;
    activeProject = project;
    activeProjectButton = button;
    one("#dialog-title").textContent = project.title;
    one("#dialog-description").textContent = project.description;
    one("#dialog-preview").replaceChildren(button.querySelector(".project-image").cloneNode(true));
    const list = one("#dialog-features");
    list.replaceChildren();
    project.features.forEach((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      list.append(item);
    });
    dialog.showModal();
    document.body.classList.add("dialog-open");
    one(".dialog-close").focus();
  });
});
one(".dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});
dialog.addEventListener("close", () => {
  document.body.classList.remove("dialog-open");
  if (activeProjectButton) activeProjectButton.focus({ preventScroll: true });
});
one("#similar-project").addEventListener("click", () => {
  if (!activeProject) return;
  chooseType(activeProject.type);
  const message = one("#client-message");
  if (!message.value.trim()) {
    message.value = `Мне понравилась концепция «${activeProject.title}». Хочу обсудить похожий сайт для своего бизнеса.`;
    message.setCustomValidity("");
  }
  dialog.close();
  requestAnimationFrame(() => {
    one("#brief").scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    one("#client-name").focus({ preventScroll: true });
  });
});

estimateForm.addEventListener("input", updateEstimate);
estimateForm.addEventListener("submit", (event) => event.preventDefault());
all("[data-choose-type]").forEach((link) => link.addEventListener("click", () => chooseType(link.dataset.chooseType)));
all("[data-base-price]").forEach((node) => { node.textContent = money(STUDIO.types[node.dataset.basePrice].price); });
all("[data-extra-price]").forEach((node) => { node.textContent = "+" + money(STUDIO.extras[node.dataset.extraPrice].price); });

// Контакты включаются только после заполнения реального имени пользователя.
const telegramName = String(STUDIO.telegram).trim().replace(/^@/, "");
const telegramEnabled = /^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(telegramName);
if (telegramEnabled) {
  const contact = one("#studio-contact");
  contact.hidden = false;
  contact.href = "https://t.me/" + encodeURIComponent(telegramName);
  one("#contact-note").textContent = "Форма подготовит текст заявки. Затем скопируйте его и отправьте студии в Telegram. До этого данные остаются только на этой странице.";
  const telegramLink = one("#send-telegram");
  telegramLink.hidden = false;
  telegramLink.href = contact.href;
  one("#result-note").textContent = "Заявка ещё не отправлена. Скопируйте текст, откройте Telegram, вставьте его в диалог и отправьте.";
}

briefForm.addEventListener("input", hideOldBrief);
briefForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const fields = [one("#client-name"), one("#client-contact"), one("#client-message")];
  fields.forEach((field) => field.setCustomValidity(field.value.trim() ? "" : "Заполните это поле."));
  if (!briefForm.reportValidity()) return;
  const [name, contact, message] = fields.map((field) => field.value.trim());
  const result = currentEstimate();
  const text = [
    `Заявка на сайт · ${STUDIO.name}`,
    "",
    `Имя: ${name}`,
    `Контакт: ${contact}`,
    `Формат: ${result.title}`,
    `Дополнительных страниц: ${result.pages}`,
    `Дополнения: ${result.extras.length ? result.extras.map((key) => STUDIO.extras[key].title).join(", ") : "нет"}`,
    `Предварительная стоимость: ${money(result.price)}`,
    `Ориентир по срокам: ${result.days}–${result.days + 4} рабочих дней`,
    "",
    "О проекте:",
    message,
    "",
    "Итоговая цена и сроки согласовываются после обсуждения задачи."
  ].join("\n");
  one("#brief-text").value = text;
  one("#brief-result").hidden = false;
  one("#brief-result").scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
  one("#copy-brief").focus({ preventScroll: true });
});
all("#brief-form input, #brief-form textarea").forEach((field) => field.addEventListener("input", () => field.setCustomValidity("")));

one("#copy-brief").addEventListener("click", async () => {
  const field = one("#brief-text");
  try {
    if (!navigator.clipboard || !window.isSecureContext) throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText(field.value);
    one("#copy-status").textContent = "Скопировано. Теперь текст можно вставить в сообщение.";
  } catch {
    field.focus();
    field.select();
    field.setSelectionRange(0, field.value.length);
    one("#copy-status").textContent = "Текст выделен. Нажмите Ctrl+C (на Mac — ⌘C) или выберите «Копировать» в меню телефона.";
  }
});

one("#download-brief").addEventListener("click", () => {
  const blob = new Blob(["\uFEFF" + one("#brief-text").value], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "forma-brief.txt";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  one("#copy-status").textContent = "Файл заявки подготовлен для скачивания.";
});

one("#year").textContent = String(new Date().getFullYear());
one("#generate-brief").disabled = false;
updateEstimate();
