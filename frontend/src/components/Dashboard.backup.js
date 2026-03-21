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
    background: ${type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#3b82f6"};
    color: white;
    padding: 14px 20px;
    border-radius: 8px;
    z-index: 9999;
    animation: slideIn 0.3s ease-out;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
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
      container.innerHTML = `<h2 style="color: red;">Error: ${err.message}</h2>`;
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
    container.innerHTML = '<div class="flex items-center justify-center h-screen"><h2 class="text-2xl text-white">Loading...</h2></div>';
    return;
  }

  const chartListHtml =
    chartDataList && chartDataList.length > 0
      ? `
    <div class="mt-12 mx-auto max-w-md bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h3 class="text-lg font-bold text-white mb-4">📊 Last 7 Days Clicks</h3>
      <div class="space-y-2">
        ${chartDataList
          .map(
            (d) =>
              `<div class="flex justify-between bg-slate-700/50 p-3 rounded-md text-white">
              <span class="font-semibold">${d.date}</span>
              <span class="text-green-400 font-bold">${d.clicks} clicks</span>
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
    <h2 class="text-3xl font-bold text-white mt-12 mb-6">🔗 Your URLs</h2>
    <div class="mx-auto max-w-6xl overflow-x-auto">
      <table class="w-full text-white">
        <thead class="bg-gradient-to-r from-green-600 to-green-700">
          <tr>
            <th class="px-6 py-3 text-left font-bold">Short URL</th>
            <th class="px-6 py-3 text-left font-bold">Original URL</th>
            <th class="px-6 py-3 text-center font-bold">Clicks</th>
            <th class="px-6 py-3 text-center font-bold">Action</th>
          </tr>
        </thead>
        <tbody>
          ${dashboardData.urls
            .sort((a, b) => b.clicks - a.clicks)
            .map(
              (url, index) => `
            <tr class="border-b border-slate-700 ${index % 2 === 0 ? 'bg-slate-800' : 'bg-slate-900'} hover:bg-slate-700/50 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <a href="http://localhost:5000/${url.shortCode}" target="_blank" rel="noreferrer" class="text-green-400 hover:text-green-300 font-mono font-bold">${url.shortCode}</a>
                  ${index === 0 && dashboardData.urls.length > 0 ? '<span class="bg-amber-500 text-black px-2 py-1 rounded text-xs font-bold">🏆 TOP</span>' : ""}
                  ${url.expiresAt && new Date(url.expiresAt) < new Date() ? '<span class="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">⏰ EXPIRED</span>' : ""}
                </div>
              </td>
              <td class="px-6 py-4 text-slate-300 text-sm">${url.originalUrl.substring(0, 50)}...</td>
              <td class="px-6 py-4 text-center font-bold text-green-400">${url.clicks}</td>
              <td class="px-6 py-4 text-center">
                <button class="px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-black font-bold rounded-lg hover:shadow-lg text-sm" onclick="navigator.clipboard.writeText('http://localhost:5000/${url.shortCode}'); showToast('Short URL copied! 📋')">
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
      <div class="mt-6 p-6 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-2xl border border-green-500">
        <h3 class="text-2xl font-bold text-white mb-4">✅ Short URL Created!</h3>
        <div class="space-y-3 mb-4">
          <p class="text-white"><strong>Short URL:</strong> <a href="${latestShortResult.shortUrl}" target="_blank" rel="noreferrer" class="text-amber-300 hover:text-amber-200 font-bold">${latestShortResult.shortUrl}</a></p>
          <p class="text-white"><strong>Short Code:</strong> <span class="font-mono text-amber-300">${latestShortResult.shortCode}</span></p>
          ${latestShortResult.expiresAt ? `<p class="text-white"><strong>Expiry:</strong> <span class="text-amber-300">${new Date(latestShortResult.expiresAt).toLocaleString()}</span></p>` : ""}
        </div>
        <div class="flex gap-3 flex-wrap mb-4">
          <button onclick="navigator.clipboard.writeText('${latestShortResult.shortUrl}'); showToast('Link copied! 📋')" class="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-black font-bold rounded-lg hover:shadow-lg">📋 Copy Link</button>
          <a href="${latestShortResult.shortUrl}" target="_blank" class="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">🔗 Open</a>
          ${latestShortResult.qrCode ? `<a href="${latestShortResult.qrCode}" download="qr-${latestShortResult.shortCode}.png" class="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700">⬇️ Download QR</a>` : ""}
        </div>
        ${latestShortResult.qrCode ? `<div class="bg-white p-3 rounded-lg w-fit mx-auto"><img src="${latestShortResult.qrCode}" alt="QR Code" class="w-40 h-40" /></div>` : ""}
      </div>
    `
    : "";

  container.innerHTML = `
    <style>
      .btn-hover:hover { box-shadow: 0 0 20px rgba(34, 197, 94, 0.3); }
    </style>
    <div class="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 p-8">
      <h1 class="text-5xl font-bold text-center text-white mb-2">📊 Dashboard</h1>
      <p class="text-center text-slate-400 mb-8">Manage your short URLs with advanced analytics</p>

      <div class="rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-xl max-w-2xl mx-auto mb-10 p-8">
        <h2 class="text-2xl font-bold text-white mb-6">🚀 Create Short URL</h2>
        <form id="shorten-form" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input id="original-url" type="url" placeholder="Original URL (required)" required class="w-full px-3 py-2 bg-slate-800 text-white border-2 border-slate-600 rounded-lg focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30" />
          <input id="custom-shortcode" type="text" placeholder="Custom short code (optional)" pattern="^[a-zA-Z0-9_-]{3,20}$" class="w-full px-3 py-2 bg-slate-800 text-white border-2 border-slate-600 rounded-lg focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30" />
          <input id="url-password" type="text" placeholder="Password (optional)" class="w-full px-3 py-2 bg-slate-800 text-white border-2 border-slate-600 rounded-lg focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30" />
          <input id="expires-at" type="datetime-local" class="w-full px-3 py-2 bg-slate-800 text-white border-2 border-slate-600 rounded-lg focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30" />
          <button id="shorten-btn" type="submit" class="md:col-span-2 text-lg py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-black font-bold rounded-lg hover:shadow-lg btn-hover">🚀 Generate Short URL + QR</button>
        </form>
        <div id="shorten-message" class="mt-4"></div>
        ${createResultHtml}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-10">
        <div class="p-6 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-green-500/30 shadow-lg hover:shadow-green-500/20 text-center">
          <h3 class="text-slate-300 text-lg font-semibold">Total URLs</h3>
          <h1 class="text-5xl font-bold text-green-400">${dashboardData.totalUrls || 0}</h1>
        </div>

        <div class="p-6 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-green-500/30 shadow-lg hover:shadow-green-500/20 text-center">
          <h3 class="text-slate-300 text-lg font-semibold">Total Clicks</h3>
          <h1 class="text-5xl font-bold text-green-400">${dashboardData.totalClicks || 0}</h1>
        </div>
      </div>

      <div class="rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-xl max-w-3xl mx-auto mb-10 p-8">
        <h2 class="text-2xl font-bold text-white mb-6">📊 7-Day Click Chart</h2>
        <canvas id="clicks-chart" class="w-full"></canvas>
      </div>

      ${chartListHtml}
      ${urlTableHtml}
    </div>
  `;

  renderBarChart();
  bindShortenForm();
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
      inputs.forEach((input) => (input.style.borderColor = "#334155"));

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
          backgroundColor: "linear-gradient(90deg, #22c55e, #16a34a)",
          borderColor: "#22c55e",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { labels: { color: "white" } },
      },
      scales: {
        x: { ticks: { color: "white" }, grid: { color: "#334155" } },
        y: { ticks: { color: "white" }, grid: { color: "#334155" } },
      },
    },
  });
}
