export const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>WebOnOne</title>
  <style>
    html, body {
      margin: 0;
      min-height: 100%;
      font-family: "Segoe UI", system-ui, sans-serif;
      background: #0f172a;
      color: #f8fafc;
    }
    body {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    main {
      max-width: 28rem;
      padding: 2rem;
      text-align: center;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0 0 0.75rem;
    }
    p {
      margin: 0;
      color: #cbd5e1;
      line-height: 1.5;
    }
    button {
      margin-top: 1.5rem;
      background: #385be8;
      color: #fff;
      border: 0;
      border-radius: 0.5rem;
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      cursor: pointer;
    }
    button:hover {
      background: #2f4fd4;
    }
  </style>
</head>
<body>
  <main>
    <h1>Can't reach WebOnOne</h1>
    <p>Check your internet connection, then try again. The desktop app needs to be online.</p>
    <button type="button" id="retry">Retry</button>
  </main>
  <script>
    document.getElementById('retry').addEventListener('click', function () {
      if (window.webononeDesktop && window.webononeDesktop.retry) {
        window.webononeDesktop.retry()
      }
    })
  </script>
</body>
</html>
`

export function getOfflineDataUrl(): string {
  return `data:text/html;charset=utf-8,${encodeURIComponent(OFFLINE_HTML)}`
}
