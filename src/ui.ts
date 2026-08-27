export const HTML_UI = ({ isReadOnly }: { isReadOnly: boolean }) => `<!DOCTYPE html>
<html>
<head>
  <title>Worker Publisher</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>&#x1F680;</text></svg>">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Space Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #fef7ed;
      color: #1a1a1a;
      line-height: 1.6;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    h1 {
      font-size: 3rem;
      font-weight: 900;
      color: #1a1a1a;
      text-shadow: 4px 4px 0px #fb923c;
      margin-bottom: 2rem;
      text-transform: uppercase;
      letter-spacing: -0.02em;
    }
    .form-group { margin-bottom: 1.5rem; }
    label {
      display: block;
      font-weight: 700;
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
      color: #1a1a1a;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    input, textarea {
      width: 100%;
      padding: 1rem;
      border: 4px solid #1a1a1a;
      background: white;
      font-family: "JetBrains Mono", "Fira Code", monospace;
      font-size: 1rem;
      box-shadow: 8px 8px 0px #fb923c;
      transition: all 0.1s ease;
    }
    input:focus, textarea:focus {
      outline: none;
      transform: translate(-2px, -2px);
      box-shadow: 12px 12px 0px #fb923c;
    }
    textarea { height: 300px; resize: vertical; }
    button {
      background: #fb923c;
      color: #1a1a1a;
      border: 4px solid #1a1a1a;
      padding: 1rem 2rem;
      font-weight: 900;
      font-size: 1.1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      cursor: pointer;
      box-shadow: 8px 8px 0px #1a1a1a;
      transition: all 0.1s ease;
      font-family: inherit;
    }
    button:hover {
      transform: translate(-2px, -2px);
      box-shadow: 12px 12px 0px #1a1a1a;
    }
    button:active {
      transform: translate(2px, 2px);
      box-shadow: 4px 4px 0px #1a1a1a;
    }
    button:disabled {
      background: #9ca3af;
      color: #6b7280;
      cursor: not-allowed;
      box-shadow: 4px 4px 0px #6b7280;
    }
    button:disabled:hover { transform: none; box-shadow: 4px 4px 0px #6b7280; }
    .result {
      margin-top: 2rem;
      padding: 1.5rem;
      border: 4px solid #1a1a1a;
      background: white;
      box-shadow: 8px 8px 0px #fb923c;
      font-weight: 600;
    }
    .result.success {
      background: #dcfce7;
      border-color: #166534;
      box-shadow: 8px 8px 0px #22c55e;
    }
    .result.error {
      background: #fef2f2;
      border-color: #dc2626;
      box-shadow: 8px 8px 0px #ef4444;
    }
    .hint { margin-bottom: 1.5rem; font-weight: 600; color: #374151; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Worker Publisher</h1>
    <p class="hint">Name a tenant Worker, paste ES module code, deploy, then visit /{name}.</p>
    <form id="deployForm">
      <div class="form-group">
        <label for="scriptName">Script Name</label>
        <input type="text" id="scriptName" placeholder="my-worker" required pattern="[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?" title="lowercase letters, numbers, and hyphens">
      </div>
      <div class="form-group">
        <label for="code">Worker Code</label>
        <textarea id="code">export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const workerName = url.pathname.split('/')[1] || 'Your Worker';

    const html = '<!DOCTYPE html>' +
      '<html><head><meta charset="UTF-8">' +
      '<title>' + workerName + ' Deployed!</title>' +
      '<style>* { margin: 0; padding: 0; box-sizing: border-box; }' +
      'body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #fef7ed; color: #1a1a1a; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }' +
      '.container { text-align: center; max-width: 600px; }' +
      'h1 { font-size: 3rem; font-weight: 900; text-shadow: 6px 6px 0px #fb923c; margin-bottom: 2rem; }' +
      '.deployed-badge { background: #fb923c; border: 4px solid #1a1a1a; padding: 1.5rem 3rem; font-weight: 900; box-shadow: 12px 12px 0px #1a1a1a; display: inline-block; margin-bottom: 2rem; }' +
      '.deploy-more-btn { background: #22c55e; color: #1a1a1a; border: 4px solid #1a1a1a; padding: 1rem 2rem; font-weight: 900; text-decoration: none; display: inline-block; box-shadow: 8px 8px 0px #1a1a1a; }' +
      '</style></head><body><div class="container">' +
      '<h1>' + workerName.toUpperCase() + '</h1>' +
      '<div class="deployed-badge">IS NOW DEPLOYED!</div>' +
      '<p>Your tenant Worker is live.</p>' +
      '<a href="/" class="deploy-more-btn">DEPLOY MORE!</a>' +
      '</div></body></html>';

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
};</textarea>
      </div>
      <button type="submit"${isReadOnly ? " disabled" : ""}>Deploy Worker</button>
    </form>
    ${isReadOnly ? '<div class="result error">Deployment is disabled in read-only mode</div>' : ""}
    <div id="result"></div>
  </div>
  <script>
    document.getElementById('deployForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const scriptName = document.getElementById('scriptName').value;
      const code = document.getElementById('code').value;
      const resultDiv = document.getElementById('result');
      resultDiv.innerHTML = '<div style="font-weight: 900; text-transform: uppercase;">Deploying...</div>';
      try {
        const response = await fetch('/deploy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scriptName, code })
        });
        const result = await response.json();
        if (response.ok) {
          resultDiv.innerHTML = '<div class="result success">Successfully deployed worker "' + result.script + '"! Redirecting...</div>';
          setTimeout(() => { window.location.href = '/' + result.script; }, 1500);
        } else {
          resultDiv.innerHTML = '<div class="result error">Error: ' + result.error + '</div>';
        }
      } catch (error) {
        resultDiv.innerHTML = '<div class="result error">Error: ' + error.message + '</div>';
      }
    });
  </script>
</body>
</html>`;
