import {
  MONTHLY_OUTBREAK_SCHEDULE,
  CropCategory,
  ThreatSeverity,
  MonthlyOutbreakData,
  getCropThreatLevel,
  getCropThreatScore,
} from "./seasonal-data";

export interface OutbreakPrintOptions {
  season?: "all" | "Wet Season" | "Dry Season";
  crop?: CropCategory;
  threat?: "all" | ThreatSeverity;
}

function escapeHtml(val: string): string {
  if (!val) return "";
  return val
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function printSeasonalOutbreakReport(options: OutbreakPrintOptions = {}): void {
  if (typeof window === "undefined") return;

  const season = options.season || "all";
  const crop = options.crop || "All Crops";
  const threat = options.threat || "all";

  // Filter months based on season and threat
  let months: MonthlyOutbreakData[] = MONTHLY_OUTBREAK_SCHEDULE;

  if (season !== "all") {
    months = months.filter((m) => m.season === season);
  }

  if (threat !== "all") {
    months = months.filter((m) => getCropThreatLevel(m, crop) === threat);
  }

  // Titles and descriptions
  let seasonHeading = "All Seasons (Full Annual Calendar)";
  let seasonSubtitle = "12-Month Surveillance Guide (Wet Season &amp; Dry Season)";
  if (season === "Wet Season") {
    seasonHeading = "Wet Season Surveillance Report (May – October)";
    seasonSubtitle = "Southwest Monsoon (Habagat) Focus: Flooding, Fungal Blights, Apple Snails &amp; Stem Borers";
  } else if (season === "Dry Season") {
    seasonHeading = "Dry Season Surveillance Report (November – April)";
    seasonSubtitle = "Northeast Monsoon (Amihan) Focus: Armyworms, Planthoppers, Sugarcane Borers &amp; Aphid Vectors";
  }

  const cropBadgeText = crop === "All Crops" ? "All Major Crops (Rice, Corn, Sugarcane, Vegetables)" : crop;
  const threatBadgeText = threat === "all" ? "All Threat Levels" : `${threat.toUpperCase()} Threat Only`;

  const rowsHtml = months.length > 0 ? months.map((m) => {
    const riskLvl = getCropThreatLevel(m, crop);
    const riskScore = getCropThreatScore(m, crop);

    const riskColor =
      riskLvl === "critical"
        ? "#dc2626"
        : riskLvl === "high"
        ? "#ea580c"
        : riskLvl === "moderate"
        ? "#ca8a04"
        : "#16a34a";

    const riskBg =
      riskLvl === "critical"
        ? "#fee2e2"
        : riskLvl === "high"
        ? "#ffedd5"
        : riskLvl === "moderate"
        ? "#fef9c3"
        : "#dcfce7";

    // Crop breakdown details
    const cropEntries = [
      { name: "Rice", pests: m.cropThreats.Rice.pests, tips: m.cropThreats.Rice.managementTips },
      { name: "Corn", pests: m.cropThreats.Corn.pests, tips: m.cropThreats.Corn.managementTips },
      { name: "Sugarcane", pests: m.cropThreats.Sugarcane.pests, tips: m.cropThreats.Sugarcane.managementTips },
      { name: "Vegetables", pests: m.cropThreats.Vegetables.pests, tips: m.cropThreats.Vegetables.managementTips },
    ];

    let cropBreakdownHtml = "";
    if (crop === "All Crops") {
      cropBreakdownHtml = cropEntries
        .map(
          (c) =>
            `<div style="margin-bottom: 4px;"><strong>${c.name}:</strong> ${escapeHtml(
              c.pests.map((p) => p.name).join(", ")
            )}</div>`
        )
        .join("");
    } else {
      const selectedThreat = m.cropThreats[crop as "Rice" | "Corn" | "Sugarcane" | "Vegetables"];
      if (selectedThreat) {
        cropBreakdownHtml = `
          <div style="background: #f8fafc; padding: 6px 8px; border-radius: 4px; border-left: 3px solid #16a34a; margin-bottom: 4px;">
            <div style="font-weight: bold; color: #166534; font-size: 11px;">${crop} (Stage: ${escapeHtml(selectedThreat.stage)})</div>
            <div style="margin: 2px 0;"><strong>Active Pests:</strong> ${escapeHtml(selectedThreat.pests.map((p) => `${p.name} [${p.risk}]`).join(", "))}</div>
            <div style="color: #475569; font-size: 10px;"><strong>Action:</strong> ${escapeHtml(selectedThreat.managementTips[0] || "")}</div>
          </div>
          <div style="font-size: 10px; color: #64748b;">
            Other crops: ${cropEntries.filter((c) => c.name !== crop).map((c) => `${c.name}: ${c.pests.map((p) => p.name).join(", ")}`).join(" | ")}
          </div>
        `;
      }
    }

    return `
      <tr>
        <td style="font-weight: bold; white-space: nowrap; font-size: 12px; color: #0f172a;">
          ${escapeHtml(m.monthName)}
          <div style="font-size: 10px; font-weight: normal; color: #64748b; margin-top: 2px;">
            ${escapeHtml(m.climateSummary.split(".")[0])}.
          </div>
        </td>
        <td>
          <span class="badge ${m.season === "Wet Season" ? "badge-wet" : "badge-dry"}">
            ${escapeHtml(m.season)}
          </span>
        </td>
        <td style="white-space: nowrap;">
          <span style="display: inline-block; padding: 3px 7px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; background: ${riskBg}; color: ${riskColor};">
            ${riskLvl} (${riskScore}/10)
          </span>
        </td>
        <td style="font-weight: 600; color: #1e293b; font-size: 11px;">
          ${escapeHtml(m.highlightOutbreaks.join(", "))}
        </td>
        <td style="font-size: 11px; line-height: 1.35;">
          ${cropBreakdownHtml}
        </td>
      </tr>
    `;
  }).join("") : `
    <tr>
      <td colspan="5" style="text-align: center; padding: 32px; color: #64748b;">
        No outbreak data found matching the selected filter criteria (${season}, ${crop}, ${threat}).
      </td>
    </tr>
  `;

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Negros Occidental Seasonal Outbreak Report (${season})</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #0f172a;
        padding: 28px;
        line-height: 1.4;
        background: #ffffff;
      }
      .header {
        border-bottom: 3px solid #16a34a;
        padding-bottom: 12px;
        margin-bottom: 18px;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
      }
      h1 {
        font-size: 20px;
        margin: 0 0 4px;
        color: #0f172a;
        font-weight: 800;
      }
      .subtitle {
        color: #475569;
        font-size: 12px;
        margin: 0;
      }
      .meta {
        font-size: 11px;
        color: #475569;
        text-align: right;
      }
      .filter-chips {
        display: flex;
        gap: 8px;
        margin: 14px 0;
        flex-wrap: wrap;
      }
      .filter-chip {
        display: inline-block;
        padding: 4px 10px;
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        font-size: 11px;
        color: #334155;
      }
      .filter-chip strong {
        color: #0f172a;
      }
      table {
        border-collapse: collapse;
        width: 100%;
        font-size: 11px;
        margin-top: 12px;
      }
      th, td {
        border: 1px solid #cbd5e1;
        padding: 8px 10px;
        text-align: left;
        vertical-align: top;
      }
      th {
        background: #f8fafc;
        font-weight: bold;
        color: #334155;
      }
      .badge {
        display: inline-block;
        padding: 3px 7px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: bold;
        white-space: nowrap;
      }
      .badge-wet {
        background: #dbeafe;
        color: #1e40af;
        border: 1px solid #bfdbfe;
      }
      .badge-dry {
        background: #fef3c7;
        color: #92400e;
        border: 1px solid #fde68a;
      }
      .notes-box {
        background: #f8fafc;
        border-left: 4px solid #16a34a;
        padding: 12px 14px;
        margin: 18px 0;
        font-size: 11px;
        color: #334155;
      }
      .signature-row {
        margin-top: 32px;
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: #475569;
        padding-top: 16px;
        border-top: 1px dashed #cbd5e1;
      }
      @media print {
        body { padding: 0; }
        @page { size: A4 landscape; margin: 12mm; }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <h1>AgriCare &bull; Seasonal Pest &amp; Disease Outbreak Surveillance Report</h1>
        <p class="subtitle">${seasonSubtitle}</p>
      </div>
      <div class="meta">
        <div><strong>Province:</strong> Negros Occidental (Region VI)</div>
        <div><strong>Generated:</strong> ${new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</div>
      </div>
    </div>

    <div class="filter-chips">
      <div class="filter-chip">Season: <strong>${escapeHtml(season === "all" ? "All Seasons (12 Months)" : season)}</strong></div>
      <div class="filter-chip">Crop Filter: <strong>${escapeHtml(cropBadgeText)}</strong></div>
      ${threat !== "all" ? `<div class="filter-chip">Threat: <strong>${escapeHtml(threatBadgeText)}</strong></div>` : ""}
      <div class="filter-chip">Matching Months: <strong>${months.length} Month${months.length === 1 ? "" : "s"}</strong></div>
    </div>

    <div class="notes-box">
      <strong>Executive Field Notice:</strong> This official seasonal calendar outlines predictable vector and disease cycles across Negros Occidental. Extension agriculturists and Barangay Farmer Associations (BFAs) should utilize this schedule to time proactive chemical/organic distribution, synchronized seed-soaking, and flood/drought cultural mitigations prior to peak infestation windows.
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 14%;">Month &amp; Weather</th>
          <th style="width: 10%;">Season</th>
          <th style="width: 12%;">Surveillance Level</th>
          <th style="width: 26%;">Key Seasonal Outbreak Targets</th>
          <th style="width: 38%;">Crop Breakdown &amp; Recommended Mitigations</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="signature-row">
      <div>
        <strong>Prepared by:</strong> Office of the Provincial / Municipal Agriculturist &bull; AgriCare Negros Occidental
      </div>
      <div>
        <strong>Document Status:</strong> Official Extension Advisory Guide &bull; Confidential Field Distribution
      </div>
    </div>
  </body>
</html>`;

  const printWin = window.open("", "_blank", "width=1150,height=850");
  if (!printWin) {
    alert("Please allow popups to print the outbreak report.");
    return;
  }
  printWin.document.open();
  printWin.document.write(html);
  printWin.document.close();
  printWin.focus();
  setTimeout(() => {
    try {
      printWin.print();
    } catch (e) {
      console.warn("Print trigger error:", e);
    }
  }, 350);
}
