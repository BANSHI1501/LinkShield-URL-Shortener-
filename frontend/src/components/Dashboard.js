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
    container.innerHTML = "<h2>Loading...</h2>";
    return;
  }

  const chartListHtml =
    chartDataList && chartDataList.length > 0
      ? `
    <div style="margin-top: 40px; text-align: left; max-width: 400px; margin-left: auto; margin-right: auto;">
      <h3>Last 7 Days Clicks</h3>
      ${chartDataList
        .map(
          (d, i) =>
            `<p style="padding: 8px; background: #f3f4f6; margin-bottom: 8px; border-radius: 4px;">
            ${d.date} → ${d.clicks}
          </p>`
        )
        .join("")}
    </div>
  `
      : "";

  const urlTableHtml =
    dashboardData.urls && dashboardData.urls.length > 0
      ? `
    <h2 style="margin-top: 40px;">🔗 Your URLs</h2>
    <table style="margin: 20px auto; border-collapse: collapse; width: 80%; color: white;">
      <thead>
        <tr>
          <th style="border: 1px solid gray; padding: 10px;">Short URL</th>
          <th style="border: 1px solid gray; padding: 10px;">Original URL</th>
          <th style="border: 1px solid gray; padding: 10px;">Clicks</th>
          <th style="border: 1px solid gray; padding: 10px;">Action</th>
        </tr>
      </thead>
      <tbody>
        ${dashboardData.urls
          .sort((a, b) => b.clicks - a.clicks)
          .map(
            (url, index) => `
          <tr style="background: ${index % 2 === 0 ? "#1f2937" : "#111827"};">
            <td style="border: 1px solid gray; padding: 10px;">
              <a href="http://localhost:5000/${url.shortCode}" target="_blank" rel="noreferrer">${url.shortCode}</a>
              ${index === 0 && dashboardData.urls.length > 0 ? ' <span style="background: #f59e0b; color: black; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 700; margin-left: 4px;">🏆 TOP</span>' : ""}
              ${url.expiresAt && new Date(url.expiresAt) < new Date() ? ` <span style="background: #ef4444; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-left: 4px;">⏰ EXPIRED</span>` : ""}
            </td>
            <td style="border: 1px solid gray; padding: 10px;">${url.originalUrl.substring(0, 40)}...</td>
            <td style="border: 1px solid gray; padding: 10px; text-align: center;">${url.clicks}</td>
            <td style="border: 1px solid gray; padding: 10px;">
              <button
                style="padding: 6px 10px; cursor: pointer; background: linear-gradient(90deg, #22c55e, #16a34a); color: black; border: 0; border-radius: 4px; font-weight: 600;"
                onclick="navigator.clipboard.writeText('http://localhost:5000/${url.shortCode}'); showToast('Short URL copied! 📋')"
              >
                Copy
              </button>
            </td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `
      : "";

  const createResultHtml = latestShortResult
    ? `
      <div style="margin-top: 16px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 10px; padding: 16px; box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);">
        <h3 style="margin: 0 0 12px 0; color: white;">✅ Short URL Created!</h3>
        <p style="margin: 6px 0;"><strong>Short URL:</strong> <a href="${latestShortResult.shortUrl}" target="_blank" rel="noreferrer" style="color: #fbbf24;">${latestShortResult.shortUrl}</a></p>
        <p style="margin: 6px 0;"><strong>Short Code:</strong> ${latestShortResult.shortCode}</p>
        ${latestShortResult.expiresAt ? `<p style="margin: 6px 0;"><strong>Expiry:</strong> ${new Date(latestShortResult.expiresAt).toLocaleString()}</p>` : ""}
        <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
          <button onclick="navigator.clipboard.writeText('${latestShortResult.shortUrl}'); showToast('Link copied! 📋')" style="padding: 8px 12px; background: #fbbf24; color: black; border: 0; border-radius: 6px; cursor: pointer; font-weight: 600;">📋 Copy Link</button>
          <a href="${latestShortResult.shortUrl}" target="_blank" style="padding: 8px 12px; background: #3b82f6; color: white; border: 0; border-radius: 6px; cursor: pointer; font-weight: 600; text-decoration: none; display: inline-block;">🔗 Open</a>
          ${latestShortResult.qrCode ? `<a href="${latestShortResult.qrCode}" download="qr-${latestShortResult.shortCode}.png" style="padding: 8px 12px; background: #8b5cf6; color: white; border: 0; border-radius: 6px; cursor: pointer; font-weight: 600; text-decoration: none; display: inline-block;">⬇️ Download QR</a>` : ""}
        </div>
        ${latestShortResult.qrCode ? `<img src="${latestShortResult.qrCode}" alt="QR Code" style="margin-top: 12px; width: 140px; height: 140px; background: white; padding: 8px; border-radius: 8px;" />` : ""}
      </div>
    `
    : "";

  container.innerHTML = `
    <div style="padding: 30px; text-align: center;">
      <h1>📊 Dashboard</h1>

      <div style="max-width: 720px; margin: 20px auto; text-align: left; background: #0f172a; color: white; border-radius: 12px; padding: 18px; box-shadow: 0 0 20px rgba(34, 197, 94, 0.1);">
        <h2 style="margin-top: 0;">🚀 Create Short URL</h2>
        <form id="shorten-form" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <input id="original-url" type="url" placeholder="Original URL (required)" required style="padding: 10px; border-radius: 6px; border: 2px solid #334155; transition: border 0.2s; background: #1f2937; color: white;" />
          <input id="custom-shortcode" type="text" placeholder="Custom short code (optional)" pattern="^[a-zA-Z0-9_-]{3,20}$" style="padding: 10px; border-radius: 6px; border: 2px solid #334155; transition: border 0.2s; background: #1f2937; color: white;" />
          <input id="url-password" type="text" placeholder="Password (optional)" style="padding: 10px; border-radius: 6px; border: 2px solid #334155; transition: border 0.2s; background: #1f2937; color: white;" />
          <input id="expires-at" type="datetime-local" style="padding: 10px; border-radius: 6px; border: 2px solid #334155; transition: border 0.2s; background: #1f2937; color: white;" />
          <button id="shorten-btn" type="submit" style="grid-column: span 2; padding: 12px; border: 0; border-radius: 6px; cursor: pointer; background: linear-gradient(90deg, #22c55e, #16a34a); color: #052e16; font-weight: 700; transition: all 0.3s; box-shadow: 0 0 20px rgba(34,197,94,0.2);">🚀 Generate Short URL + QR</button>
        </form>
        <style>
          #original-url:focus, #custom-shortcode:focus, #url-password:focus, #expires-at:focus {
            border-color: #22c55e !important;
            outline: none;
            box-shadow: 0 0 10px rgba(34, 197, 94, 0.3);
          }
        </style>
        <div id="shorten-message" style="margin-top: 10px;"></div>
        ${createResultHtml}
      </div>

      <div style="display: flex; justify-content: center; gap: 20px; margin-top: 30px;">
        
        <div style="
          background: linear-gradient(135deg, #1f2937, #111827);
          padding: 20px;
          border-radius: 10px;
          width: 200px;
          color: white;
          box-shadow: 0 0 15px rgba(34,197,94,0.1);
          border: 1px solid #22c55e;
        ">
          <h3>Total URLs</h3>
          <h1>${dashboardData.totalUrls || 0}</h1>
        </div>

        <div style="
          background: linear-gradient(135deg, #1f2937, #111827);
          padding: 20px;
          border-radius: 10px;
          width: 200px;
          color: white;
          box-shadow: 0 0 15px rgba(34,197,94,0.1);
          border: 1px solid #22c55e;
        ">
          <h3>Total Clicks</h3>
          <h1>${dashboardData.totalClicks || 0}</h1>
        </div>

      </div>

      <div style="width: 600px; margin: 40px auto; background: #111827; border-radius: 12px; padding: 20px; box-shadow: 0 0 15px rgba(34,197,94,0.1);">
        <h2>📊 Clicks Graph</h2>
        <canvas id="clicks-chart"></canvas>
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
