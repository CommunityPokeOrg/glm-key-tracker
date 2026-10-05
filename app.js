"use strict";

const PLACEHOLDER = "to be set";

function cell(value, { mono = false } = {}) {
  const td = document.createElement("td");
  if (mono) td.classList.add("mono");
  if (value === undefined || value === null || value === "") {
    td.textContent = PLACEHOLDER;
    td.classList.add("placeholder");
  } else {
    td.textContent = value;
  }
  return td;
}

async function loadData() {
  const res = await fetch("data.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`data.json fetch failed: ${res.status}`);
  return res.json();
}

function renderKeys(keys) {
  const tbody = document.querySelector("#key-table tbody");
  tbody.textContent = "";
  for (const k of keys) {
    const tr = document.createElement("tr");

    const label = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = "key-badge";
    badge.textContent = k.label || PLACEHOLDER;
    label.appendChild(badge);
    tr.appendChild(label);

    tr.appendChild(cell(k.holder));
    tr.appendChild(cell(k.model));
    tr.appendChild(cell(k.budgetCap));
    tr.appendChild(cell(k.activeWindow));
    tr.appendChild(cell(k.expires, { mono: true }));
    tr.appendChild(cell(k.status));
    tr.appendChild(cell(k.lastToggled));
    tbody.appendChild(tr);
  }
}

function renderUsage(entries) {
  const tbody = document.querySelector("#usage-table tbody");
  tbody.textContent = "";
  if (!entries.length) {
    const tr = document.createElement("tr");
    tr.className = "empty-row";
    const td = document.createElement("td");
    td.colSpan = 6;
    td.textContent = "No sessions logged yet — vwh adds rows in data.json.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  for (const e of entries) {
    const tr = document.createElement("tr");
    tr.appendChild(cell(e.date, { mono: true }));
    tr.appendChild(cell(e.sessionStart, { mono: true }));
    tr.appendChild(cell(e.sessionEnd, { mono: true }));
    tr.appendChild(cell(e.totalTokensMillions, { mono: true }));
    tr.appendChild(cell(e.tokensPerSecond, { mono: true }));
    tr.appendChild(cell(e.notes));
    tbody.appendChild(tr);
  }
}

function renderError(err) {
  for (const sel of ["#key-table tbody", "#usage-table tbody"]) {
    const tbody = document.querySelector(sel);
    tbody.textContent = "";
    const tr = document.createElement("tr");
    tr.className = "empty-row";
    const td = document.createElement("td");
    td.colSpan = 8;
    td.textContent = `Could not load data.json (${err.message}).`;
    tr.appendChild(td);
    tbody.appendChild(tr);
  }
}

loadData()
  .then((data) => {
    renderKeys(data.keys || []);
    renderUsage(data.usageLog || []);
  })
  .catch(renderError);
