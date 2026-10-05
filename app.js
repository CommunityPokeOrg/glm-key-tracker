"use strict";

const PLACEHOLDER = "to be set";
const DASH = "—";

// Return the first present, non-empty value among candidate field names.
// Tolerates both camelCase and snake_case data shapes.
function pick(obj, ...names) {
  if (!obj || typeof obj !== "object") return undefined;
  for (const name of names) {
    const v = obj[name];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

function isNumeric(v) {
  return typeof v === "number" || (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)));
}

function fmtNumber(v) {
  if (!isNumeric(v)) return v;
  return Number(v).toLocaleString("en-US");
}

function cell(value, { mono = false, missing = PLACEHOLDER, format } = {}) {
  const td = document.createElement("td");
  if (mono) td.classList.add("mono");
  if (value === undefined || value === null || value === "") {
    td.textContent = missing;
    td.classList.add("placeholder");
  } else {
    td.textContent = format ? format(value) : value;
  }
  return td;
}

async function loadData() {
  const res = await fetch("data.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`data.json fetch failed: ${res.status}`);
  return res.json();
}

function renderMeta(data) {
  const updated = pick(data, "telemetryUpdatedAt", "telemetry_updated_at", "updatedAt");
  const costRef = pick(data, "costEstimateReference", "cost_estimate_reference", "costRateSource", "cost_rate_source");
  const updatedEl = document.getElementById("telemetry-updated");
  const costEl = document.getElementById("cost-reference");
  if (updatedEl) {
    updatedEl.textContent = updated || DASH;
    if (!updated) updatedEl.classList.add("placeholder");
  }
  if (costEl) {
    costEl.textContent = costRef || DASH;
    if (!costRef) costEl.classList.add("placeholder");
  }
}

function renderKeys(keys) {
  const tbody = document.querySelector("#key-table tbody");
  tbody.textContent = "";
  if (!keys.length) {
    const tr = document.createElement("tr");
    tr.className = "empty-row";
    const td = document.createElement("td");
    td.colSpan = 8;
    td.textContent = "No keys tracked yet — add entries under keys[] in data.json.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  for (const k of keys) {
    const tr = document.createElement("tr");

    const label = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = "key-badge";
    badge.textContent = pick(k, "label") || PLACEHOLDER;
    label.appendChild(badge);
    tr.appendChild(label);

    tr.appendChild(cell(pick(k, "holder")));
    tr.appendChild(cell(pick(k, "model")));
    tr.appendChild(cell(pick(k, "budgetCap", "budget_cap")));
    tr.appendChild(cell(pick(k, "activeWindow", "active_window")));
    tr.appendChild(cell(pick(k, "expires"), { mono: true }));
    tr.appendChild(cell(pick(k, "status")));
    tr.appendChild(cell(pick(k, "lastToggled", "last_toggled")));
    tbody.appendChild(tr);
  }
}

const USAGE_COLS = 17;

function renderUsage(entries) {
  const tbody = document.querySelector("#usage-table tbody");
  tbody.textContent = "";
  if (!entries.length) {
    const tr = document.createElement("tr");
    tr.className = "empty-row";
    const td = document.createElement("td");
    td.colSpan = USAGE_COLS;
    td.textContent = "No sessions logged yet — vwh adds 15-minute aggregate rows in data.json.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  for (const e of entries) {
    const tr = document.createElement("tr");
    const m = { missing: DASH, mono: true };
    tr.appendChild(cell(pick(e, "date"), m));
    tr.appendChild(cell(pick(e, "sessionStart", "session_start"), m));
    tr.appendChild(cell(pick(e, "sessionEnd", "session_end"), m));
    tr.appendChild(cell(pick(e, "totalTokensMillions", "total_tokens_millions"), { ...m, format: fmtNumber }));
    tr.appendChild(cell(pick(e, "tokensPerSecond", "tokens_per_second"), { ...m, format: fmtNumber }));
    tr.appendChild(cell(pick(e, "notes"), { missing: DASH }));
    tr.appendChild(cell(pick(e, "promptTokens", "prompt_tokens"), { ...m, format: fmtNumber }));
    tr.appendChild(cell(pick(e, "completionTokens", "completion_tokens"), { ...m, format: fmtNumber }));
    tr.appendChild(cell(pick(e, "requestCount", "request_count", "requests"), { ...m, format: fmtNumber }));
    tr.appendChild(cell(pick(e, "errorCount", "error_count", "errors"), { ...m, format: fmtNumber }));
    tr.appendChild(cell(pick(e, "rateLimit429Count", "rate_limit_429_count", "rateLimit429"), { ...m, format: fmtNumber }));
    tr.appendChild(cell(pick(e, "server5xxCount", "server_5xx_count", "server5xx"), { ...m, format: fmtNumber }));
    tr.appendChild(cell(pick(e, "averageLatencyMs", "average_latency_ms", "avgLatencyMs"), { ...m, format: fmtNumber }));
    tr.appendChild(cell(pick(e, "estimatedCostSavedUsd", "estimated_cost_saved_usd"), {
      ...m,
      format: (v) => (isNumeric(v) ? `$${Number(v).toFixed(4)}` : v),
    }));
    tr.appendChild(cell(pick(e, "costEstimateMethod", "cost_estimate_method"), { missing: DASH }));
    tr.appendChild(cell(pick(e, "costRateSource", "cost_rate_source"), { missing: DASH }));
    tr.appendChild(cell(pick(e, "bucketMinutes", "bucket_minutes"), { ...m, format: fmtNumber }));
    tbody.appendChild(tr);
  }
}

function renderError(err) {
  for (const [sel, cols] of [["#key-table tbody", 8], ["#usage-table tbody", USAGE_COLS]]) {
    const tbody = document.querySelector(sel);
    tbody.textContent = "";
    const tr = document.createElement("tr");
    tr.className = "empty-row";
    const td = document.createElement("td");
    td.colSpan = cols;
    td.textContent = `Could not load data.json (${err.message}).`;
    tr.appendChild(td);
    tbody.appendChild(tr);
  }
}

loadData()
  .then((data) => {
    renderMeta(data || {});
    renderKeys(Array.isArray(data && data.keys) ? data.keys : []);
    renderUsage(Array.isArray(data && data.usageLog) ? data.usageLog : []);
  })
  .catch(renderError);
