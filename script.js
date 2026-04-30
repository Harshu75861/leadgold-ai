const form = document.querySelector("#leadForm");
const nicheInput = document.querySelector("#niche");
const locationInput = document.querySelector("#location");
const resultsBody = document.querySelector("#resultsBody");
const downloadButton = document.querySelector("#downloadCsv");
const statusBar = document.querySelector("#statusBar");
const statusText = document.querySelector("#statusText");

let currentLeads = [];

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const niche = nicheInput.value.trim();
  const location = locationInput.value.trim();

  if (!niche || !location) return;

  setLoading(true);
  renderEmptyState("Generating premium leads...");

  try {
    const response = await fetch("/api/generate-leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ niche, location }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Unable to generate leads.");
    }

    currentLeads = payload.leads || [];
    renderLeads(currentLeads);
    statusText.textContent = payload.usedAI
      ? "AI outreach messages generated."
      : "Demo leads loaded. Add OPENAI_API_KEY for live AI copy.";
  } catch (error) {
    currentLeads = [];
    renderEmptyState(error.message);
    statusText.textContent = "Something went wrong. Please try again.";
  } finally {
    setLoading(false, 1800);
  }
});

downloadButton.addEventListener("click", () => {
  if (!currentLeads.length) return;

  const headers = ["Name", "Email", "Website", "Message", "Sales Pitch"];
  const rows = currentLeads.map((lead) => [
    lead.name,
    lead.email,
    lead.website,
    lead.message,
    lead.salesPitch,
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "leadgold-ai-leads.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});

function setLoading(isLoading, delay = 0) {
  const submitButton = form.querySelector("button");
  submitButton.disabled = isLoading;

  if (isLoading) {
    statusBar.hidden = false;
    statusText.textContent = "Crafting premium leads...";
    return;
  }

  window.setTimeout(() => {
    statusBar.hidden = true;
  }, delay);
}

function renderLeads(leads) {
  downloadButton.disabled = !leads.length;

  if (!leads.length) {
    renderEmptyState("No leads generated yet.");
    return;
  }

  resultsBody.innerHTML = leads
    .map(
      (lead) => `
        <tr>
          <td>${escapeHtml(lead.name)}</td>
          <td><a href="mailto:${escapeAttribute(lead.email)}">${escapeHtml(lead.email)}</a></td>
          <td><a href="${escapeAttribute(normalizeUrl(lead.website))}" target="_blank" rel="noreferrer">${escapeHtml(lead.website)}</a></td>
          <td>
            <strong>Message:</strong> ${escapeHtml(lead.message)}
            <br />
            <strong>Pitch:</strong> ${escapeHtml(lead.salesPitch)}
          </td>
        </tr>
      `
    )
    .join("");
}

function renderEmptyState(message) {
  downloadButton.disabled = true;
  resultsBody.innerHTML = `
    <tr class="empty-row">
      <td colspan="4">${escapeHtml(message)}</td>
    </tr>
  `;
}

function escapeCsvValue(value = "") {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function normalizeUrl(value = "") {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value = "") {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
