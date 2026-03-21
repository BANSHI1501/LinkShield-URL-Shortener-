import {
  Chart as ChartJS,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
ChartJS.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YmQ4OGYzYTI3NmU3NzViYWU0MDI5MiIsImlhdCI6MTc3NDAzMTQ4MywiZXhwIjoxNzc0MTE3ODgzfQ.M91qNOE8EeFXLbmL74uMXyN-GSagOo2el5jxj2UYm40";

let dashboardData = null;
let chartDataList = null;
let chartInstance = null;
let latestShortResult = null;

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${ type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#3b82f6"};
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    z-index: 9999;
    animation: slideIn 0.3s ease-out;
    box-shadow: 0 8px 20px rgba(0,0,0,0.4);
    font-weight: 600;
    font-size: 14px;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

if (!document.querySelector("style[data-toasts]")) {
  const style = document.createElement("style");
  style.setAttribute("data-toasts", "true");
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(400px); opacity: 0; }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    * { transition: all 0.2s ease; }
  `;
  document.head.appendChild(style);
}

export async function initDashboard() {
  try {
    const res1 = await fetch("http://localhost:5000/analytics", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    dashboardData = await res1.json();

    const res2 = await fetch("http://localhost:5000/analytics/last7days", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    chartDataList = await res2.json();

    renderDashboard();
  } catch (err) {
    console.error("Error loading dashboard:", err);
    const container = document.getElementById("dashboard-container");
    if (container) {
      container.innerHTML = `<h2 style="color: red;">Error: ${ err.message}</h2>`;
    }
  }
}

function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function renderDashboard() {
  const container = document.getElementById("dashboard-container");
  if (!container) return;

  if (!dashboardData) {
    container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);"><span style="font-size: 28px; color: #22c55e; font-weight: bold;">⏳ Loading...</span></div>';
    return;
  }

  const chartListHtml =
    chartDataList && chartDataList.length > 0
      ? `
    <div style="margin-top: 80px; text-align: center;">
      <h3 style="font-size: 28px; font-weight: 700; color: white; margin-bottom: 30px;">📊 Last 7 Days Analytics</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 12px; max-width: 900px; margin: 0 auto;">
        ${ chartDataList
          .map(
            (d) =>
              `<div style="padding: 20px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3); border: 1px solid #22c55e; cursor: pointer;" 
                  onmouseover="this.style.transform='translateY(-6px)'; this.style.boxShadow='0 12px 30px rgba(16, 185, 129, 0.5)'"
                  onmouseout="this.style.transform='none'; this.style.boxShadow='0 8px 20px rgba(16, 185, 129, 0.3)'">
                <p style="color: #f3f4f6; font-size: 12px; margin: 0 0 8px 0; font-weight: 700; letter-spacing: 0.5px;">${d.date}</p>
                <p style="color: #fbbf24; font-size: 26px; font-weight: 800; margin: 0;">${d.clicks}</p>
              </div>`
          )
          .join("")}
      </div>
    </div>
  `
      : "";

  const urlTableHtml =
    dashboardData.urls && dashboardData.urls.length > 0
      ? `
    <h2 style="font-size: 32px; font-weight: 700; color: white; text-align: center; margin-top: 80px; margin-bottom: 40px;">🔗 Your URLs</h2>
    <div style="max-width: 1200px; margin: 0 auto; overflow-x: auto; padding: 0 20px;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: linear-gradient(90deg, #22c55e, #10b981);">
            <th style="padding: 16px; text-align: left; color: #052e16; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Short Code</th>
            <th style="padding: 16px; text-align: left; color: #052e16; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Original URL</th>
            <th style="padding: 16px; text-align: center; color: #052e16; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Clicks</th>
            <th style="padding: 16px; text-align: center; color: #052e16; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Action</th>
          </tr>
        </thead>
        <tbody>
          ${ dashboardData.urls
            .sort((a, b) => b.clicks - a.clicks)
            .map(
              (url, index) => `
            <tr style="background: ${ index % 2 === 0 ? 'linear-gradient(90deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.6))' : 'rgba(15, 23, 42, 0.4)'}; border-bottom: 1px solid rgba(34, 197, 94, 0.15); padding: 0;" 
                onmouseover="this.style.background='linear-gradient(90deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.08))'; this.children[0].style.color='#4ade80'"
                onmouseout="this.style.background='${ index % 2 === 0 ? 'linear-gradient(90deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.6))' : 'rgba(15, 23, 42, 0.4)'}'; this.children[0].style.color='#22c55e'">
              <td style="padding: 16px; color: #22c55e; font-weight: 700; font-family: monospace; font-size: 13px;">
                <div style="display: flex; gap: 10px; align-items: center;">
                  <a href="http://localhost:5000/${url.shortCode}" target="_blank" rel="noreferrer" style="color: inherit; text-decoration: none;">${url.shortCode}</a>
                  ${ index === 0 && dashboardData.urls.length > 0 ? '<span style="background: linear-gradient(135deg, #f59e0b, #f97316); color: black; padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 700;">🏆 TOP</span>' : ""}
                  ${ url.expiresAt && new Date(url.expiresAt) < new Date() ? '<span style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 700;">⏰ EXPIRED</span>' : ""}
                </div>
              </td>
              <td style="padding: 16px; color: #cbd5e1; font-size: 13px;">${url.originalUrl.substring(0, 60)}...</td>
              <td style="padding: 16px; text-align: center; color: #4ade80; font-weight: 700; font-size: 14px;">${url.clicks}</td>
              <td style="padding: 16px; text-align: center;">
                <button style="padding: 8px 14px; background: linear-gradient(135deg, #22c55e, #16a34a); color: #052e16; border: 0; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);"
                  onmouseover="this.style.boxShadow='0 8px 20px rgba(34, 197, 94, 0.4)'; this.style.transform='translateY(-2px)'"
                  onmouseout="this.style.boxShadow='0 4px 12px rgba(34, 197, 94, 0.2)'; this.style.transform='none'"
                  onclick="navigator.clipboard.writeText('http://localhost:5000/${url.shortCode}'); showToast('URL copied! 📋', 'success')">
                  📋 Copy
                </button>
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `
      : "";

  const createResultHtml = latestShortResult
    ? `
      <div style="margin-top: 30px; padding: 24px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 16px; box-shadow: 0 20px 50px rgba(16, 185, 129, 0.3); border: 1px solid #22c55e;">
        <h3 style="margin: 0 0 16px 0; color: white; font-size: 20px; font-weight: 700;">✅ Short URL Created Successfully!</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
          <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; border-left: 3px solid #fbbf24;">
            <p style="color: rgba(255,255,255,0.8); font-size: 11px; margin: 0 0 6px 0; text-transform: uppercase;">Short URL</p>
            <a href="${latestShortResult.shortUrl}" target="_blank" rel="noreferrer" style="color: #fbbf24; text-decoration: none; font-size: 13px; font-weight: 700; word-break: break-all;">${latestShortResult.shortUrl}</a>
          </div>
          <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; border-left: 3px solid #60a5fa;">
            <p style="color: rgba(255,255,255,0.8); font-size: 11px; margin: 0 0 6px 0; text-transform: uppercase;">Short Code</p>
            <p style="color: #60a5fa; font-family: monospace; font-size: 13px; font-weight: 700; margin: 0;">${latestShortResult.shortCode}</p>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px;">
          <button onclick="navigator.clipboard.writeText('${latestShortResult.shortUrl}'); showToast('Link copied! 📋', 'success')" style="padding: 10px; background: #fbbf24; color: #052e16; border: 0; border-radius: 8px; cursor: pointer; font-weight: 700; transition: all 0.3s; box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);" onmouseover="this.style.boxShadow='0 8px 20px rgba(251, 191, 36, 0.5)'" onmouseout="this.style.boxShadow='0 4px 12px rgba(251, 191, 36, 0.3)'">📋 Copy Link</button>
          <a href="${latestShortResult.shortUrl}" target="_blank" style="padding: 10px; background: #3b82f6; color: white; border: 0; border-radius: 8px; cursor: pointer; font-weight: 700; text-decoration: none; text-align: center; transition: all 0.3s; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);" onmouseover="this.style.boxShadow='0 8px 20px rgba(59, 130, 246, 0.5)'" onmouseout="this.style.boxShadow='0 4px 12px rgba(59, 130, 246, 0.3)'">🔗 Open</a>
          ${ latestShortResult.qrCode ? `<a href="${latestShortResult.qrCode}" download="qr-${latestShortResult.shortCode}.png" style="padding: 10px; background: #8b5cf6; color: white; border: 0; border-radius: 8px; cursor: pointer; font-weight: 700; text-decoration: none; text-align: center; transition: all 0.3s; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);" onmouseover="this.style.boxShadow='0 8px 20px rgba(139, 92, 246, 0.5)'" onmouseout="this.style.boxShadow='0 4px 12px rgba(139, 92, 246, 0.3)'">⬇️ QR</a>` : ""}
        </div>
        ${ latestShortResult.qrCode ? `
          <div style="display: flex; justify-content: center; margin-top: 20px;">
            <div style="background: white; padding: 12px; border-radius: 12px; box-shadow: 0 8px 20px rgba(0,0,0,0.3);">
              <img src="${latestShortResult.qrCode}" alt="QR Code" style="width: 160px; height: 160px; display: block;" />
            </div>
          </div>
        ` : ""}
      </div>
    `
    : "";

  container.innerHTML = `
    <div style="min-height: 100vh; background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%); padding: 40px 20px; position: relative;">
      <div style="position: fixed; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle at 20% 50%, rgba(34, 197, 94, 0.08), transparent 50%); pointer-events: none; z-index: 0;"></div>
      
      <div style="position: relative; z-index: 1; max-width: 1400px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 50px;">
          <h1 style="font-size: 48px; font-weight: 800; background: linear-gradient(135deg, #22c55e, #10b981); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin: 0 0 12px 0;">📊 Dashboard</h1>
          <p style="color: #94a3b8; font-size: 16px; margin: 0;">Master your URL shortening with incredible analytics</p>
        </div>

        <div style="max-width: 900px; margin: 0 auto 60px auto; padding: 32px; background: linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.8)); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 20px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5); backdrop-filter: blur(10px);">
          <h2 style="font-size: 24px; font-weight: 700; color: white; margin: 0 0 24px 0;">🚀 Create Short URL</h2>
          <form id="shorten-form" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
            <input id="original-url" type="url" placeholder="Original URL (required)" required 
              style="padding: 12px 16px; background: rgba(15, 23, 42, 0.6); border: 2px solid rgba(34, 197, 94, 0.3); color: white; border-radius: 10px; font-size: 14px; outline: none;" 
              onfocus="this.style.borderColor='#22c55e'; this.style.boxShadow='0 0 15px rgba(34, 197, 94, 0.4)'"
              onblur="this.style.borderColor='rgba(34, 197, 94, 0.3)'; this.style.boxShadow='none'" />
            <input id="custom-shortcode" type="text" placeholder="Custom code (optional)" pattern="^[a-zA-Z0-9_-]{3,20}$"
              style="padding: 12px 16px; background: rgba(15, 23, 42, 0.6); border: 2px solid rgba(34, 197, 94, 0.3); color: white; border-radius: 10px; font-size: 14px; outline: none;"
              onfocus="this.style.borderColor='#22c55e'; this.style.boxShadow='0 0 15px rgba(34, 197, 94, 0.4)'"
              onblur="this.style.borderColor='rgba(34, 197, 94, 0.3)'; this.style.boxShadow='none'" />
            <input id="url-password" type="text" placeholder="Password (optional)"
              style="padding: 12px 16px; background: rgba(15, 23, 42, 0.6); border: 2px solid rgba(34, 197, 94, 0.3); color: white; border-radius: 10px; font-size: 14px; outline: none;"
              onfocus="this.style.borderColor='#22c55e'; this.style.boxShadow='0 0 15px rgba(34, 197, 94, 0.4)'"
              onblur="this.style.borderColor='rgba(34, 197, 94, 0.3)'; this.style.boxShadow='none'" />
            <input id="expires-at" type="datetime-local"
              style="padding: 12px 16px; background: rgba(15, 23, 42, 0.6); border: 2px solid rgba(34, 197, 94, 0.3); color: white; border-radius: 10px; font-size: 14px; outline: none;"
              onfocus="this.style.borderColor='#22c55e'; this.style.boxShadow='0 0 15px rgba(34, 197, 94, 0.4)'"
              onblur="this.style.borderColor='rgba(34, 197, 94, 0.3)'; this.style.boxShadow='none'" />
            <button id="shorten-btn" type="submit"
              style="grid-column: 1 / -1; padding: 14px 24px; background: linear-gradient(135deg, #22c55e, #10b981); color: #052e16; border: 0; border-radius: 10px; font-weight: 700; font-size: 15px; cursor: pointer; box-shadow: 0 8px 20px rgba(34, 197, 94, 0.3); text-transform: uppercase; letter-spacing: 0.5px;"
              onmouseover="this.style.boxShadow='0 12px 30px rgba(34, 197, 94, 0.5)'; this.style.transform='translateY(-2px)'"
              onmouseout="this.style.boxShadow='0 8px 20px rgba(34, 197, 94, 0.3)'; this.style.transform='none'">
              🚀 Generate Short URL + QR
            </button>
          </form>
          <div id="shorten-message" style="margin-top: 16px;"></div>
          ${ createResultHtml}
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 24px; margin-bottom: 80px;">
          <div style="padding: 32px; background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.05)); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 16px; box-shadow: 0 8px 20px rgba(34, 197, 94, 0.2); cursor: pointer;"
            onmouseover="this.style.transform='translateY(-8px)'; this.style.boxShadow='0 16px 40px rgba(34, 197, 94, 0.4)'"
            onmouseout="this.style.transform='none'; this.style.boxShadow='0 8px 20px rgba(34, 197, 94, 0.2)'">
            <p style="color: #94a3b8; font-size: 13px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Total URLs Created</p>
            <h3 style="color: #22c55e; font-size: 42px; font-weight: 800; margin: 0; line-height: 1;">${ dashboardData.totalUrls || 0}</h3>
            <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #22c55e, transparent); margin-top: 12px;"></div>
          </div>

          <div style="padding: 32px; background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05)); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 16px; box-shadow: 0 8px 20px rgba(59, 130, 246, 0.2); cursor: pointer;"
            onmouseover="this.style.transform='translateY(-8px)'; this.style.boxShadow='0 16px 40px rgba(59, 130, 246, 0.4)'"
            onmouseout="this.style.transform='none'; this.style.boxShadow='0 8px 20px rgba(59, 130, 246, 0.2)'">
            <p style="color: #94a3b8; font-size: 13px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Total Clicks Tracked</p>
            <h3 style="color: #3b82f6; font-size: 42px; font-weight: 800; margin: 0; line-height: 1;">${ dashboardData.totalClicks || 0}</h3>
            <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #3b82f6, transparent); margin-top: 12px;"></div>
          </div>
        </div>

        <div style="max-width: 900px; margin: 0 auto 80px auto; padding: 32px; background: linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.8)); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 20px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);">
          <h2 style="font-size: 22px; font-weight: 700; color: white; margin: 0 0 24px 0;">📈 7-Day Performance Chart</h2>
          <canvas id="clicks-chart" style="width: 100%;"></canvas>
        </div>

        ${ chartListHtml}
        ${ urlTableHtml}

        <footer style="margin-top: 100px; padding: 40px 20px; border-top: 1px solid rgba(34, 197, 94, 0.2); text-align: center;">
          <p style="color: #94a3b8; font-size: 14px; margin: 0; letter-spacing: 0.5px;">
            © Banshi Prasad 26 | LinkShield URL Shortener - All rights reserved
          </p>
          <p style="color: #64748b; font-size: 12px; margin: 8px 0 0 0;">
            Built with 💚 for amazing URL management
          </p>
        </footer>
      </div>
    </div>
  `;

  renderBarChart();
  bindShortenForm();
}

function renderBarChart() {
  if (!chartDataList || chartDataList.length === 0) return;

  const canvas = document.getElementById("clicks-chart");
  if (!canvas) return;

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new ChartJS(canvas, {
    type: "bar",
    data: {
      labels: chartDataList.map((d) => d.date),
      datasets: [
        {
          label: "Clicks",
          data: chartDataList.map((d) => d.clicks),
          backgroundColor: "linear-gradient(135deg, #22c55e, #10b981)",
          borderColor: "#22c55e",
          borderWidth: 2,
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { labels: { color: "white", font: { size: 13, weight: "bold" } } },
      },
      scales: {
        x: { 
          ticks: { color: "#cbd5e1", font: { size: 12 } }, 
          grid: { color: "rgba(34, 197, 94, 0.1)" } 
        },
        y: { 
          ticks: { color: "#cbd5e1", font: { size: 12 } }, 
          grid: { color: "rgba(34, 197, 94, 0.1)" } 
        },
      },
    },
  });
}

function bindShortenForm() {
  const form = document.getElementById("shorten-form");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = document.getElementById("shorten-message");
    const submitButton = document.getElementById("shorten-btn");

    const originalUrl = document.getElementById("original-url")?.value?.trim();
    const customShortCode = document.getElementById("custom-shortcode")?.value?.trim();
    const password = document.getElementById("url-password")?.value?.trim();
    const expiresAtRaw = document.getElementById("expires-at")?.value;

    if (!originalUrl) {
      if (message) {
        message.style.color = "#ef4444";
        message.textContent = "❌ Original URL is required";
      }
      const urlInput = document.getElementById("original-url");
      if (urlInput) urlInput.style.borderColor = "#ef4444";
      showToast("Original URL is required", "error");
      return;
    }

    if (!validateUrl(originalUrl)) {
      if (message) {
        message.style.color = "#f87171";
        message.textContent = "❌ Please enter a valid URL (must start with http:// or https://)";
      }
      const urlInput = document.getElementById("original-url");
      if (urlInput) urlInput.style.borderColor = "#ef4444";
      showToast("Invalid URL format", "error");
      return;
    }

    if (customShortCode && !/^[a-zA-Z0-9_-]{3,20}$/.test(customShortCode)) {
      if (message) {
        message.style.color = "#f87171";
        message.textContent = "❌ Custom code must be 3-20 chars (letters, numbers, _, -)";
      }
      const codeInput = document.getElementById("custom-shortcode");
      if (codeInput) codeInput.style.borderColor = "#ef4444";
      showToast("Invalid custom code format", "error");
      return;
    }

    if (expiresAtRaw) {
      const expireDate = new Date(expiresAtRaw);
      if (expireDate <= new Date()) {
        if (message) {
          message.style.color = "#f87171";
          message.textContent = "❌ Expiry date must be in the future";
        }
        const expiryInput = document.getElementById("expires-at");
        if (expiryInput) expiryInput.style.borderColor = "#ef4444";
        showToast("Expiry date must be in the future", "error");
        return;
      }
    }

    const payload = { originalUrl };
    if (customShortCode) payload.customShortCode = customShortCode;
    if (password) payload.password = password;
    if (expiresAtRaw) payload.expiresAt = new Date(expiresAtRaw).toISOString();

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "⏳ Generating...";
      }
      if (message) {
        message.style.color = "#93c5fd";
        message.textContent = "⏳ Creating short URL...";
      }

      const res = await fetch("http://localhost:5000/shorten", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create short URL");
      }

      latestShortResult = data;
      if (message) {
        message.style.color = "#4ade80";
        message.textContent = "✅ Short URL created successfully!";
      }
      showToast("🎉 Short URL created with QR code!", "success");
      form.reset();
      const inputs = form.querySelectorAll("input");
      inputs.forEach((input) => (input.style.borderColor = "rgba(34, 197, 94, 0.3)"));

      await initDashboard();
    } catch (error) {
      if (message) {
        message.style.color = "#f87171";
        message.textContent = "❌ " + error.message;
      }
      showToast(error.message, "error");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "🚀 Generate Short URL + QR";
      }
    }
  });
}
