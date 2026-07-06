import { chromium } from "playwright-core";

const BASE = "http://localhost:3789";
const SHOT_DIR = process.env.SHOT_DIR ?? ".";
let failed = 0;
const check = (name, cond) => {
  console.log((cond ? "PASS" : "FAIL") + " — " + name);
  if (!cond) failed++;
};

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });

// 1) Project list shows the existing Niagara project
await page.goto(`${BASE}/projects`, { waitUntil: "networkidle" });
check("projects list loads", await page.locator("h1").first().textContent() === "Projects");
check("Niagara listed", await page.getByText("Niagara WTP Upgrade — Phase 2").count() > 0);

// 2) Create a second project through the form
await page.getByRole("button", { name: "+ New Project" }).click();
await page.fill("#proj-name", "Lakeshore Pumping Station — Rehabilitation");
await page.fill("#proj-gc", "Northgate Civil Inc.");
await page.fill("#proj-pm", "C. de Macedo");
await page.getByRole("button", { name: "Create project" }).click();
await page.waitForURL(/\/projects\/[0-9a-f-]{36}$/, { timeout: 15000 });
const lakeshoreUrl = page.url();
const lakeshoreId = lakeshoreUrl.split("/").pop();
check("redirected to new project dashboard", /\/projects\/[0-9a-f-]{36}$/.test(lakeshoreUrl));
await page.waitForSelector("text=No RFIs yet.");
check("new dashboard is empty (no RFIs)", await page.getByText("No RFIs yet.").count() === 1);
check("new dashboard header", (await page.locator("h1").first().textContent())?.includes("Lakeshore") === true);
await page.screenshot({ path: `${SHOT_DIR}/e2e-lakeshore-dashboard.png` });

// 3) Create an RFI in the new project — numbering must start at RFI-101
await page.getByRole("link", { name: "RFI Log" }).click();
await page.waitForURL(/\/rfis$/);
await page.getByRole("button", { name: "+ New RFI" }).click();
await page.fill("#rfi-description", "Confirm discharge header alignment — wet well");
await page.selectOption("#rfi-discipline", "Mechanical");
await page.fill("#rfi-assigned", "Mechanical Eng.");
const due = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
await page.fill("#rfi-due", due);
await page.getByRole("button", { name: "Create RFI" }).click();
await page.waitForSelector("text=RFI-101", { timeout: 15000 });
check("new project numbering starts at RFI-101", await page.getByText("RFI-101").count() > 0);
check("Niagara RFIs NOT visible in Lakeshore log", await page.getByText("RFI-118").count() === 0);
await page.screenshot({ path: `${SHOT_DIR}/e2e-lakeshore-rfis.png` });

// 4) Switch project via the sidebar selector while on the RFI Log
const niagaraId = await page.$eval(
  "#project-selector option",
  (_o, _x) => null,
).catch(() => null);
const options = await page.$$eval("#project-selector option", (opts) =>
  opts.map((o) => ({ value: o.value, label: o.textContent })),
);
const niagara = options.find((o) => o.label?.includes("Niagara"));
check("selector lists both projects", options.filter((o) => o.value).length === 2);
await page.selectOption("#project-selector", niagara.value);
await page.waitForURL(new RegExp(`/projects/${niagara.value}/rfis$`), { timeout: 15000 });
await page.waitForSelector("text=RFI-118");
check("switch keeps sub-route (lands on Niagara RFI Log)", page.url().endsWith(`/projects/${niagara.value}/rfis`));
check("Niagara log shows RFI-118", await page.getByText("RFI-118").count() > 0);
check("Lakeshore RFI-101 NOT visible in Niagara log", await page.getByText("RFI-101").count() === 0);
await page.screenshot({ path: `${SHOT_DIR}/e2e-niagara-rfis-after-switch.png` });

// 5) Niagara dashboard unchanged
await page.goto(`${BASE}/projects/${niagara.value}`, { waitUntil: "networkidle" });
check("Niagara dashboard intact (RFI-118 preview)", await page.getByText("RFI-118").count() > 0);
check("Niagara dashboard shows its name", (await page.locator("h1").first().textContent())?.includes("Niagara") === true);

// 6) Root now redirects to /projects (two projects exist)
await page.goto(BASE, { waitUntil: "networkidle" });
check("/ redirects to /projects with 2 projects", new URL(page.url()).pathname === "/projects");
await page.screenshot({ path: `${SHOT_DIR}/e2e-projects-list.png` });

// 7) CSV export isolation
const resp = await page.request.get(`${BASE}/projects/${lakeshoreId}/export/rfis`);
const csv = await resp.text();
check("Lakeshore CSV contains only RFI-101", csv.includes("RFI-101") && !csv.includes("RFI-118"));
const resp2 = await page.request.get(`${BASE}/projects/${niagara.value}/export/rfis`);
const csv2 = await resp2.text();
check("Niagara CSV has RFI-118 and no RFI-101", csv2.includes("RFI-118") && !csv2.includes("RFI-101"));

// 8) Legacy flat route now redirects (ambiguous → /projects)
await page.goto(`${BASE}/rfis`, { waitUntil: "networkidle" });
check("legacy /rfis redirects to /projects", new URL(page.url()).pathname === "/projects");

// 9) Bad project id → 404 page
const notFoundResp = await page.goto(`${BASE}/projects/not-a-real-id`, { waitUntil: "networkidle" });
check("invalid project id returns 404", notFoundResp.status() === 404);

await browser.close();
console.log(failed === 0 ? "ALL PASS" : `${failed} FAILURES`);
process.exit(failed === 0 ? 0 : 1);
