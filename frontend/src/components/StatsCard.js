export function StatsCard({ title = "", value = 0 } = {}) {
  return `
    <article class="stats-card">
      <h3>${title}</h3>
      <p>${value}</p>
    </article>
  `;
}
