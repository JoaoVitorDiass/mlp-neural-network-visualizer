/**
 * One-Hot Encoding Oracle: Authoritative reference for categorical target encoding.
 * Given distinct classes, each label is mapped to a binary indicator vector of length K.
 */

export function getUniqueClasses(rows, targetColumn) {
  const classSet = new Set();
  for (const row of rows) {
    const val = row[targetColumn];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      classSet.add(String(val).trim());
    }
  }
  return Array.from(classSet).sort();
}

export function oneHotEncodeRows(rows, targetColumn, classList = null) {
  const classes = classList || getUniqueClasses(rows, targetColumn);
  return rows.map((row) => {
    const output = { ...row };
    const label = String(row[targetColumn]).trim();
    for (const c of classes) {
      output[c] = label === c ? 1.0 : 0.0;
    }
    return output;
  });
}
