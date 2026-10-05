"use strict";

const DASH = "—";

function pick(obj, ...names) {
  if (!obj || typeof obj !== "object") return undefined;
  for (const name of names) {
    const value = obj[name];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function isNumeric(value) {
  return typeof value === "number" || (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value)));
}

function fmtNumber(value) {
  return isNumeric(value) ? Number(value).toLocaleString("en-US") : value;
}

function cell(value, { mono = false, format } = {}) {
  const td = document.createElement("td");
  if (mono) td.classList.add("mono");
  if (value === undefined || value === null || value === "") {
    td.textContent = DASH;
    td.classList.add("placeholder");
  } else {
    td.textContent = format ? format(value) : value;
  }
  return td;
}

async function loadData() {
  const response = await fetch("data.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`data.json fetch failed: ${response.status}`);
  return response.json();
}

function renderMeta(data) {
  const updated = pick(data, "telemetryUpdatedAt", "telemetry_updated_at", "updatedAt");
  const costRef = pick(data, "costEstimateReference", "cost_estimate_reference", "costRateSource", "cost_rate_source");
  for (const [id, value] of [["telemetry-updated", updated], ["cost-reference", costRef]]) {
    const element = document.getElementById(id);
    if (!element) continue;
    element.textContent = value || DASH;
    if (!value) element.classList.add("placeholder");
  }
}

function renderKeys(keys) {
  const tbody = document.querySelector("#key-table tbody");
  tbody.textContent = "";
  if (!keys.length) {
    const row = document.createElement("tr");
    row.className = "empty-row";
    const td = document.createElement("td");
    td.colSpan = 8;
    td.textContent = "No keys tracked yet.";
    row.appendChild(td);
    tbody.appendChild(row);
    return;
  }
  for (const key of keys) {
    const row = document.createElement("tr");
    const label = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = "key-badge";
    badge.textContent = pick(key, "label") || DASH;
    if (!pick(key, "label")) badge.classList.add("placeholder");
    label.appendChild(badge);
    row.appendChild(label);
    row.appendChild(cell(pick(key, "holder")));
    row.appendChild(cell(pick(key, "model")));
    row.appendChild(cell(pick(key, "budgetCap", "budget_cap")));
    row.appendChild(cell(pick(key, "activeWindow", "active_window")));
    row.appendChild(cell(pick(key, "expires"), { mono: true }));
    row.appendChild(cell(pick(key, "status")));
    row.appendChild(cell(pick(key, "lastToggled", "last_toggled"), { mono: true }));
    tbody.appendChild(row);
  }
}

const USAGE_COLS = 17;

function usageTimestamp(entry) {
  const date = pick(entry, "date");
  const start = pick(entry, "sessionStart", "session_start");
  const candidate = [date, start].filter(Boolean).join("T");
  const parsed = Date.parse(candidate);
  return Number.isNaN(parsed) ? -Infinity : parsed;
}

function renderUsage(entries) {
  const tbody = document.querySelector("#usage-table tbody");
  tbody.textContent = "";
  if (!entries.length) {
    const row = document.createElement("tr");
    row.className = "empty-row";
    const td = document.createElement("td");
    td.colSpan = USAGE_COLS;
    td.textContent = "No usage sessions logged yet.";
    row.appendChild(td);
    tbody.appendChild(row);
    return;
  }
  const newestFirst = [...entries].sort((a, b) => usageTimestamp(b) - usageTimestamp(a));
  for (const entry of newestFirst) {
    const row = document.createElement("tr");
    const mono = { mono: true };
    row.appendChild(cell(pick(entry, "date"), mono));
    row.appendChild(cell(pick(entry, "sessionStart", "session_start"), mono));
    row.appendChild(cell(pick(entry, "sessionEnd", "session_end"), mono));
    row.appendChild(cell(pick(entry, "totalTokensMillions", "total_tokens_millions"), { format: fmtNumber }));
    row.appendChild(cell(pick(entry, "tokensPerSecond", "tokens_per_second"), { format: fmtNumber }));
    row.appendChild(cell(pick(entry, "notes")));
    row.appendChild(cell(pick(entry, "promptTokens", "prompt_tokens"), { format: fmtNumber }));
    row.appendChild(cell(pick(entry, "completionTokens", "completion_tokens"), { format: fmtNumber }));
    row.appendChild(cell(pick(entry, "requestCount", "request_count", "requests"), { format: fmtNumber }));
    row.appendChild(cell(pick(entry, "errorCount", "error_count", "errors"), { format: fmtNumber }));
    row.appendChild(cell(pick(entry, "rateLimit429Count", "rate_limit_429_count", "rateLimit429"), { format: fmtNumber }));
    row.appendChild(cell(pick(entry, "server5xxCount", "server_5xx_count", "server5xx"), { format: fmtNumber }));
    row.appendChild(cell(pick(entry, "averageLatencyMs", "average_latency_ms", "avgLatencyMs"), { format: fmtNumber }));
    row.appendChild(cell(pick(entry, "estimatedCostSavedUsd", "estimated_cost_saved_usd"), {
      format: value => isNumeric(value) ? `$${Number(value).toFixed(4)}` : value,
    }));
    row.appendChild(cell(pick(entry, "costEstimateMethod", "cost_estimate_method")));
    row.appendChild(cell(pick(entry, "costRateSource", "cost_rate_source")));
    row.appendChild(cell(pick(entry, "bucketMinutes", "bucket_minutes"), { format: fmtNumber }));
    tbody.appendChild(row);
  }
}

function renderError(error) {
  for (const [selector, columns] of [["#key-table tbody", 8], ["#usage-table tbody", USAGE_COLS]]) {
    const tbody = document.querySelector(selector);
    tbody.textContent = "";
    const row = document.createElement("tr");
    row.className = "empty-row";
    const td = document.createElement("td");
    td.colSpan = columns;
    td.textContent = `Could not load data.json (${error.message}).`;
    row.appendChild(td);
    tbody.appendChild(row);
  }
}

loadData()
  .then(data => {
    renderMeta(data || {});
    renderKeys(Array.isArray(data && data.keys) ? data.keys : []);
    renderUsage(Array.isArray(data && data.usageLog) ? data.usageLog : []);
  })
  .catch(renderError);
