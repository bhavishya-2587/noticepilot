function escapePdfText(text: string): string {
  return text.replace(/([\\()])/g, "\\$1");
}

function buildPdf(objects: readonly string[]): Uint8Array {
  const header = "%PDF-1.4\n";
  const objectBodies = objects.map(
    (body, index) => `${index + 1} 0 obj\n${body}\nendobj\n`,
  );
  const offsets: number[] = [];
  let position = header.length;

  for (const objectBody of objectBodies) {
    offsets.push(position);
    position += objectBody.length;
  }

  const xrefOffset = position;
  const xref = [
    "xref",
    `0 ${objects.length + 1}`,
    "0000000000 65535 f ",
    ...offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n `),
    "trailer",
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    "startxref",
    String(xrefOffset),
    "%%EOF",
    "",
  ].join("\n");

  return new TextEncoder().encode(header + objectBodies.join("") + xref);
}

/** Creates a tiny, standards-compliant text PDF without external tooling. */
export function createTextPdf(pageTexts: readonly string[]): Uint8Array {
  const pageObjectNumbers = pageTexts.map((_, index) => 3 + index * 2);
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(" ")}] /Count ${pageTexts.length} >>`,
  ];

  for (let index = 0; index < pageTexts.length; index += 1) {
    const pageNumber = 3 + index * 2;
    const content = `BT /F1 18 Tf 72 720 Td (${escapePdfText(pageTexts[index] ?? "")}) Tj ET`;

    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${pageObjectNumbers.length * 2 + 3} 0 R >> >> /Contents ${pageNumber + 1} 0 R >>`,
      `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    );
  }

  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  return buildPdf(objects);
}

/** A page without text drawing commands, used to exercise the empty result. */
export function createTextlessPdf(): Uint8Array {
  return buildPdf([
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>",
  ]);
}
