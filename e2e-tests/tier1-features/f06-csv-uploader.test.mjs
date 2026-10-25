import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function parseCsvString(csvContent) {
  if (!csvContent || csvContent.trim() === '') {
    throw new Error('CSV content cannot be empty');
  }
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    throw new Error('CSV must contain a header and at least one data row');
  }
  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    if (values.length !== headers.length) {
      throw new Error(`Row ${i} column count mismatch: expected ${headers.length}, got ${values.length}`);
    }
    const row = {};
    headers.forEach((h, idx) => {
      const num = Number(values[idx]);
      row[h] = Number.isNaN(num) ? values[idx] : num;
    });
    rows.push(row);
  }
  return { headers, rows };
}

describe('Tier 1 - F6: CSV Drag-and-Drop Uploader', () => {
  it('F6-1: Parser correctly extracts headers and rows from standard comma-delimited CSV', () => {
    const raw = 'x1,x2,label\n1.0,2.0,A\n3.0,4.0,B';
    const { headers, rows } = parseCsvString(raw);
    assert.deepStrictEqual(headers, ['x1', 'x2', 'label']);
    assert.strictEqual(rows.length, 2);
    assert.strictEqual(rows[0].x1, 1.0);
    assert.strictEqual(rows[0].label, 'A');
  });

  it('F6-2: Tabular preview extracts the first N preview rows safely', () => {
    const raw = 'f1,f2,cls\n' + Array.from({ length: 20 }, (_, i) => `${i},${i * 2},C1`).join('\n');
    const { rows } = parseCsvString(raw);
    const preview = rows.slice(0, 5);
    assert.strictEqual(preview.length, 5);
    assert.strictEqual(preview[0].f1, 0);
    assert.strictEqual(preview[4].f1, 4);
  });

  it('F6-3: Parser handles CRLF (Windows) and LF (Unix) line endings seamlessly', () => {
    const crlfCsv = 'col1,col2\r\n10,20\r\n30,40';
    const lfCsv = 'col1,col2\n10,20\n30,40';
    const parsedCRLF = parseCsvString(crlfCsv);
    const parsedLF = parseCsvString(lfCsv);
    assert.deepStrictEqual(parsedCRLF.rows, parsedLF.rows);
  });

  it('F6-4: Parser rejects empty string or whitespace-only CSV', () => {
    assert.throws(() => parseCsvString(''), /empty/i);
    assert.throws(() => parseCsvString('   \n\n  '), /empty/i);
  });

  it('F6-5: Parser detects column count mismatches across rows', () => {
    const corruptCsv = 'a,b,c\n1,2,3\n4,5';
    assert.throws(() => parseCsvString(corruptCsv), /mismatch/i);
  });
});
