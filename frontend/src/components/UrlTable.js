export function UrlTable(rows = []) {
  const body = rows
    .map(
      (row) => `
        <tr>
          <td>${row.shortCode ?? "-"}</td>
          <td>${row.originalUrl ?? "-"}</td>
          <td>${row.clicks ?? 0}</td>
        </tr>
      `
    )
    .join("");

  return `
    <table class="url-table">
      <thead>
        <tr>
          <th>Short Code</th>
          <th>Original URL</th>
          <th>Clicks</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  `;
}
