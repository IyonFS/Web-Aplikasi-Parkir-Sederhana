export function openPrintWindow({ title, body, styles = "" }) {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return false;

  const doc = printWindow.document;
  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      :root {
        color-scheme: light;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        font-family: "Segoe UI", Arial, sans-serif;
        background: #f4f6f8;
        color: #101828;
      }
      .print-shell {
        padding: 24px;
      }
      @media print {
        body {
          background: #fff;
        }
        .print-shell {
          padding: 0;
        }
      }
      ${styles}
    </style>
  </head>
  <body>
    <div class="print-shell">${body}</div>
  </body>
</html>`);
  doc.close();

  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);

  return true;
}

