import {
  MONTHLY_OUTBREAK_SCHEDULE,
  CropCategory,
  ThreatSeverity,
  MonthlyOutbreakData,
  getCropThreatLevel,
  getCropThreatScore,
} from "./seasonal-data";

export type OutbreakPrintMode = "full" | "chart-only" | "table-only";

export interface OutbreakPrintOptions {
  season?: "all" | "Wet Season" | "Dry Season";
  crop?: CropCategory;
  threat?: "all" | ThreatSeverity;
  mode?: OutbreakPrintMode;
}

function escapeHtml(val: string): string {
  if (!val) return "";
  return val
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Generates standalone vector SVG markup for the 12-month outbreak trend & bar chart,
 * styled with inline attributes for high-resolution printing.
 */
export function generatePrintableChartSvg(
  crop: CropCategory = "All Crops",
  season: "all" | "Wet Season" | "Dry Season" = "all",
  threat: "all" | ThreatSeverity = "all"
): string {
  const svgWidth = 860;
  const svgHeight = 255;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 32;
  const paddingBottom = 42;
  const chartWidth = svgWidth - paddingLeft - paddingRight; // 795
  const chartHeight = svgHeight - paddingTop - paddingBottom; // 181
  const colWidth = chartWidth / 12; // 66.25

  const points = MONTHLY_OUTBREAK_SCHEDULE.map((m, idx) => {
    const score = getCropThreatScore(m, crop);
    const x = paddingLeft + idx * colWidth + colWidth / 2;
    const y = paddingTop + chartHeight - (score / 10) * chartHeight;
    return { x, y, score, month: m };
  });

  const polylineStr = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  // Grid lines (0, 2.5, 5, 7.5, 10)
  const gridLines = [0, 2.5, 5, 7.5, 10]
    .map((score) => {
      const y = paddingTop + chartHeight - (score / 10) * chartHeight;
      const isBaseline = score === 0;
      return `
        <line x1="${paddingLeft}" y1="${y.toFixed(1)}" x2="${svgWidth - paddingRight}" y2="${y.toFixed(1)}" stroke="#cbd5e1" stroke-width="${isBaseline ? "1.5" : "1"}" stroke-dasharray="${isBaseline ? "none" : "3 3"}" />
        <text x="${paddingLeft - 8}" y="${(y + 3.5).toFixed(1)}" text-anchor="end" font-size="9.5" fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-weight="600">${score.toFixed(1)}</text>
      `;
    })
    .join("");

  // Season shading rectangles & labels
  // Dry 1: Jan-Apr (months 1-4)
  const dry1Width = colWidth * 4;
  // Wet: May-Oct (months 5-10)
  const wetWidth = colWidth * 6;
  const wetX = paddingLeft + dry1Width;
  // Dry 2: Nov-Dec (months 11-12)
  const dry2Width = colWidth * 2;
  const dry2X = wetX + wetWidth;

  // Month bars
  const bars = MONTHLY_OUTBREAK_SCHEDULE.map((m, idx) => {
    const score = getCropThreatScore(m, crop);
    const severity = getCropThreatLevel(m, crop);
    const sMatch = season === "all" || m.season === season;
    const tMatch = threat === "all" || severity === threat;
    const isIncluded = sMatch && tMatch;

    const barWidth = colWidth * 0.52;
    const x = paddingLeft + idx * colWidth + (colWidth - barWidth) / 2;
    const barHeight = Math.max(4, (score / 10) * chartHeight);
    const y = paddingTop + chartHeight - barHeight;

    const fillColor =
      severity === "critical"
        ? "#ef4444"
        : severity === "high"
        ? "#f97316"
        : severity === "moderate"
        ? "#eab308"
        : "#10b981";

    const strokeColor =
      severity === "critical"
        ? "#b91c1c"
        : severity === "high"
        ? "#c2410c"
        : severity === "moderate"
        ? "#a16207"
        : "#047857";

    const opacity = isIncluded ? "1" : "0.20";
    const textColor = isIncluded ? strokeColor : "#94a3b8";

    const cx = paddingLeft + idx * colWidth + colWidth / 2;
    const cy = paddingTop + chartHeight - (score / 10) * chartHeight;

    return `
      <g opacity="${opacity}">
        <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${barHeight.toFixed(1)}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${isIncluded ? "1.2" : "0.5"}" rx="3" />
        <text x="${(x + barWidth / 2).toFixed(1)}" y="${(y - 5).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="bold" fill="${textColor}" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif">${score.toFixed(1)}</text>
        <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="3.5" fill="#ffffff" stroke="#7c3aed" stroke-width="2.5" />
        <text x="${cx.toFixed(1)}" y="${(paddingTop + chartHeight + 16).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="bold" fill="${isIncluded ? "#0f172a" : "#94a3b8"}" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif">${m.shortName}</text>
        <text x="${cx.toFixed(1)}" y="${(paddingTop + chartHeight + 30).toFixed(1)}" text-anchor="middle" font-size="10">${m.season === "Wet Season" ? "🌧️" : "☀️"}</text>
      </g>
    `;
  }).join("");

  return `
    <svg viewBox="0 0 ${svgWidth} ${svgHeight}" width="100%" height="auto" style="max-width: 100%; display: block;" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="printTrendGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#7c3aed" stop-opacity="0.30" />
          <stop offset="100%" stop-color="#7c3aed" stop-opacity="0.02" />
        </linearGradient>
      </defs>

      <!-- Season Shading Backgrounds -->
      <rect x="${paddingLeft}" y="${paddingTop}" width="${dry1Width.toFixed(1)}" height="${chartHeight}" fill="#fef3c7" fill-opacity="0.4" />
      <rect x="${wetX.toFixed(1)}" y="${paddingTop}" width="${wetWidth.toFixed(1)}" height="${chartHeight}" fill="#dbeafe" fill-opacity="0.45" />
      <rect x="${dry2X.toFixed(1)}" y="${paddingTop}" width="${dry2Width.toFixed(1)}" height="${chartHeight}" fill="#fef3c7" fill-opacity="0.4" />

      <!-- Season Labels at top of chart -->
      <text x="${(paddingLeft + dry1Width / 2).toFixed(1)}" y="${(paddingTop + 14).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="bold" fill="#b45309" letter-spacing="0.5" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif">DRY SEASON (AMIHAN)</text>
      <text x="${(wetX + wetWidth / 2).toFixed(1)}" y="${(paddingTop + 14).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="bold" fill="#1d4ed8" letter-spacing="0.5" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif">WET SEASON (HABAGAT &bull; PEAK OUTBREAK RISK)</text>
      <text x="${(dry2X + dry2Width / 2).toFixed(1)}" y="${(paddingTop + 14).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="bold" fill="#b45309" letter-spacing="0.5" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif">DRY SEASON</text>

      <!-- Grid lines -->
      ${gridLines}

      <!-- Trend Area Fill -->
      <polygon points="${points[0].x.toFixed(1)},${paddingTop + chartHeight} ${polylineStr} ${points[points.length - 1].x.toFixed(1)},${paddingTop + chartHeight}" fill="url(#printTrendGradient)" />

      <!-- Trend Polyline -->
      <polyline points="${polylineStr}" fill="none" stroke="#7c3aed" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

      <!-- Bars and Nodes -->
      ${bars}
    </svg>
  `;
}

export function printSeasonalOutbreakReport(options: OutbreakPrintOptions = {}): void {
  if (typeof window === "undefined") return;

  const season = options.season || "all";
  const crop = options.crop || "All Crops";
  const threat = options.threat || "all";
  const mode: OutbreakPrintMode = options.mode || "full";

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

  // Calculate summary metrics
  const displayMonths = months.length > 0 ? months : MONTHLY_OUTBREAK_SCHEDULE;
  const scores = displayMonths.map((m) => getCropThreatScore(m, crop));
  const avgScore = (scores.reduce((a, b) => a + b, 0) / (scores.length || 1)).toFixed(1);

  let peakMonth = displayMonths[0];
  let maxScore = -1;
  for (const m of displayMonths) {
    const sc = getCropThreatScore(m, crop);
    if (sc > maxScore) {
      maxScore = sc;
      peakMonth = m;
    }
  }

  // Detailed rows for tabular section
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
        <td style="font-weight: bold; white-space: nowrap; font-size: 11px; color: #0f172a;">
          ${escapeHtml(m.monthName)}
          <div style="font-size: 9.5px; font-weight: normal; color: #64748b; margin-top: 2px;">
            ${escapeHtml(m.climateSummary.split(".")[0])}.
          </div>
        </td>
        <td>
          <span class="badge ${m.season === "Wet Season" ? "badge-wet" : "badge-dry"}">
            ${escapeHtml(m.season)}
          </span>
        </td>
        <td style="white-space: nowrap;">
          <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; background: ${riskBg}; color: ${riskColor};">
            ${riskLvl} (${riskScore}/10)
          </span>
        </td>
        <td style="font-weight: 600; color: #1e293b; font-size: 11px;">
          ${escapeHtml(m.highlightOutbreaks.join(", "))}
        </td>
        <td style="font-size: 10.5px; line-height: 1.35;">
          ${cropBreakdownHtml}
        </td>
      </tr>
    `;
  }).join("") : `
    <tr>
      <td colspan="5" style="text-align: center; padding: 28px; color: #64748b;">
        No outbreak data found matching the selected filter criteria (${season}, ${crop}, ${threat}).
      </td>
    </tr>
  `;

  // Generate SVG Chart Markup
  const svgChartHtml = generatePrintableChartSvg(crop, season, threat);

  // Month target cards for infographic / chart-only mode
  const monthTargetCardsHtml = months.slice(0, 6).map((m) => {
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

    let targetAction = "";
    if (crop !== "All Crops" && m.cropThreats[crop as "Rice" | "Corn" | "Sugarcane" | "Vegetables"]) {
      targetAction = m.cropThreats[crop as "Rice" | "Corn" | "Sugarcane" | "Vegetables"].managementTips[0] || "";
    } else {
      targetAction = m.cropThreats.Rice.managementTips[0] || m.cropThreats.Sugarcane.managementTips[0] || "";
    }

    return `
      <div class="month-card">
        <div class="month-card-header">
          <span style="font-weight: 700; color: #0f172a;">${escapeHtml(m.monthName)}</span>
          <span class="badge ${m.season === "Wet Season" ? "badge-wet" : "badge-dry"}">${escapeHtml(m.season)}</span>
          <span class="badge-threat" style="background: ${riskBg}; color: ${riskColor};">${riskLvl} (${riskScore}/10)</span>
        </div>
        <div class="month-card-targets">
          <strong>Key Outbreaks:</strong> ${escapeHtml(m.highlightOutbreaks.slice(0, 3).join(", "))}
        </div>
        <div class="month-card-action">
          <strong>Action:</strong> ${escapeHtml(targetAction)}
        </div>
      </div>
    `;
  }).join("");

  const chartSectionHtml = `
    <div class="chart-box">
      <div class="chart-header">
        <div>
          <span style="color: #6b21a8; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Visual Outbreak Intensity &amp; Threat Curve</span>
          <span style="color: #64748b; font-weight: normal; margin-left: 6px;">&bull; Historical surveillance profile across Negros Occidental</span>
        </div>
        <div style="font-size: 10px; color: #475569;">
          Focus: <strong>${escapeHtml(crop)}</strong> &bull; Filter: <strong>${escapeHtml(season === "all" ? "12 Months" : season)}</strong>
        </div>
      </div>

      <div style="background: #ffffff; border-radius: 6px; padding: 4px;">
        ${svgChartHtml}
      </div>

      <div class="legend-bar">
        <div class="legend-item"><span class="legend-dot" style="background: #ef4444;"></span><strong>Critical Threat</strong> (8.0–10.0)</div>
        <div class="legend-item"><span class="legend-dot" style="background: #f97316;"></span><strong>High Threat</strong> (6.0–7.9)</div>
        <div class="legend-item"><span class="legend-dot" style="background: #eab308;"></span><strong>Moderate Threat</strong> (4.0–5.9)</div>
        <div class="legend-item"><span class="legend-dot" style="background: #10b981;"></span><strong>Low Threat</strong> (1.0–3.9)</div>
        <div class="legend-item"><span style="font-size: 11px;">🌧️</span><strong>Wet Season</strong> (May–Oct Habagat)</div>
        <div class="legend-item"><span style="font-size: 11px;">☀️</span><strong>Dry Season</strong> (Nov–Apr Amihan)</div>
      </div>
    </div>
  `;

  const kpiGridHtml = `
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-title">Monitored Crop</div>
        <div class="kpi-val">${escapeHtml(cropBadgeText)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Active Season Window</div>
        <div class="kpi-val">${escapeHtml(season === "all" ? "All 12 Months" : season)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Peak Outbreak Month</div>
        <div class="kpi-val" style="color: #b91c1c;">${peakMonth.monthName} (${maxScore.toFixed(1)}/10 &bull; ${getCropThreatLevel(peakMonth, crop).toUpperCase()})</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Average Threat Intensity</div>
        <div class="kpi-val">${avgScore} / 10</div>
      </div>
    </div>
  `;

  // Determine which sections to render based on mode
  let bodyContent = "";

  if (mode === "chart-only") {
    bodyContent = `
      ${kpiGridHtml}
      ${chartSectionHtml}

      <div style="margin-top: 10px;">
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #1e293b; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
          <span>Target Outbreak Advisories for Filtered Surveillance Period (${months.length} Month${months.length === 1 ? "" : "s"})</span>
          <span style="font-size: 10px; font-weight: normal; color: #64748b;">Top active vectors &amp; proactive field mitigations</span>
        </div>
        <div class="month-targets-grid">
          ${monthTargetCardsHtml}
        </div>
      </div>

      <div class="notes-box">
        <strong>Field Action Notice:</strong> Use this visual outbreak intensity curve to align barangay pesticide prepositioning, community seed bed monitoring, and pest-scouting frequencies prior to identified high-risk transition weeks.
      </div>
    `;
  } else if (mode === "table-only") {
    bodyContent = `
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
    `;
  } else {
    // Mode === "full" (Graph + Data Table)
    bodyContent = `
      ${kpiGridHtml}
      ${chartSectionHtml}

      <div class="notes-box">
        <strong>Executive Field Notice:</strong> This official seasonal calendar outlines predictable vector and disease cycles across Negros Occidental. Extension agriculturists and Barangay Farmer Associations (BFAs) should utilize this schedule to time proactive chemical/organic distribution, synchronized seed-soaking, and flood/drought cultural mitigations prior to peak infestation windows.
      </div>

      <div style="margin-top: 14px; margin-bottom: 4px; font-size: 11.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.3px;">
        Detailed Monthly Outbreak Surveillance &amp; Mitigation Schedule
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
    `;
  }

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Negros Occidental Seasonal Outbreak Visualizer (${season} - ${crop})</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #0f172a;
        padding: 22px;
        line-height: 1.35;
        background: #ffffff;
      }
      .header {
        border-bottom: 3px solid #16a34a;
        padding-bottom: 10px;
        margin-bottom: 12px;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
      }
      h1 {
        font-size: 18px;
        margin: 0 0 3px;
        color: #0f172a;
        font-weight: 800;
        letter-spacing: -0.2px;
      }
      .subtitle {
        color: #475569;
        font-size: 11px;
        margin: 0;
      }
      .meta {
        font-size: 10px;
        color: #475569;
        text-align: right;
        line-height: 1.3;
      }
      .filter-chips {
        display: flex;
        gap: 6px;
        margin: 10px 0;
        flex-wrap: wrap;
      }
      .filter-chip {
        display: inline-block;
        padding: 3px 8px;
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        border-radius: 5px;
        font-size: 10.5px;
        color: #334155;
      }
      .filter-chip strong {
        color: #0f172a;
      }
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        margin-bottom: 10px;
      }
      .kpi-card {
        background: #f8fafc;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        padding: 6px 9px;
      }
      .kpi-title {
        font-size: 9px;
        text-transform: uppercase;
        color: #64748b;
        font-weight: 700;
        letter-spacing: 0.3px;
      }
      .kpi-val {
        font-size: 12.5px;
        font-weight: 800;
        color: #0f172a;
        margin-top: 1px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .chart-box {
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        padding: 8px 10px;
        margin-bottom: 10px;
      }
      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
        font-size: 10.5px;
        font-weight: 700;
        color: #334155;
      }
      .legend-bar {
        display: flex;
        gap: 12px;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        padding: 5px 8px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 5px;
        margin-top: 5px;
        font-size: 9.5px;
        color: #475569;
      }
      .legend-item {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .legend-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
      }
      .month-targets-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin: 8px 0;
      }
      .month-card {
        background: #f8fafc;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        padding: 6px 8px;
        font-size: 9.5px;
      }
      .month-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 4px;
        margin-bottom: 3px;
        font-weight: 700;
        font-size: 10px;
      }
      .badge-threat {
        font-size: 8.5px;
        font-weight: 800;
        padding: 1px 4px;
        border-radius: 3px;
        text-transform: uppercase;
      }
      .month-card-targets {
        color: #1e293b;
        margin-bottom: 2px;
        line-height: 1.25;
      }
      .month-card-action {
        color: #475569;
        font-size: 9px;
        line-height: 1.2;
      }
      table {
        border-collapse: collapse;
        width: 100%;
        font-size: 10.5px;
        margin-top: 8px;
      }
      th, td {
        border: 1px solid #cbd5e1;
        padding: 6px 8px;
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
        padding: 2px 5px;
        border-radius: 3px;
        font-size: 9.5px;
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
        border-left: 3px solid #16a34a;
        padding: 7px 10px;
        margin: 10px 0;
        font-size: 10px;
        color: #334155;
      }
      .signature-row {
        margin-top: 18px;
        display: flex;
        justify-content: space-between;
        font-size: 9.5px;
        color: #475569;
        padding-top: 10px;
        border-top: 1px dashed #cbd5e1;
      }
      @media print {
        body {
          padding: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        @page {
          size: A4 landscape;
          margin: 8mm 10mm;
        }
        .chart-box, .kpi-grid, tr, .signature-row {
          break-inside: avoid;
          page-break-inside: avoid;
        }
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
        <div><strong>Print Mode:</strong> ${mode === "chart-only" ? "Visual Infographic &amp; Chart" : mode === "table-only" ? "Tabular Data Report" : "Complete Report (Graph &amp; Data)"}</div>
      </div>
    </div>

    <div class="filter-chips">
      <div class="filter-chip">Season: <strong>${escapeHtml(season === "all" ? "All Seasons (12 Months)" : season)}</strong></div>
      <div class="filter-chip">Crop Filter: <strong>${escapeHtml(cropBadgeText)}</strong></div>
      ${threat !== "all" ? `<div class="filter-chip">Threat: <strong>${escapeHtml(threatBadgeText)}</strong></div>` : ""}
      <div class="filter-chip">Matching Months: <strong>${months.length} Month${months.length === 1 ? "" : "s"}</strong></div>
    </div>

    ${bodyContent}

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

  const printWin = window.open("", "_blank", "width=1200,height=900");
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
  }, 400);
}
