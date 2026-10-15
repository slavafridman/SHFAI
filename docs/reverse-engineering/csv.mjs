import fs from 'node:fs';

export function readCsv(file) {
  const text = fs.readFileSync(file, 'utf8');
  const rows = [];
  let row = [], value = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"' && quoted && text[i + 1] === '"') { value += '"'; i++; }
    else if (c === '"') quoted = !quoted;
    else if (!quoted && (c === ',' || c === '\n')) {
      row.push(value.replace(/\r$/, '')); value = '';
      if (c === '\n') { if (row.some(cell => cell.length)) rows.push(row); row = []; }
    } else value += c;
  }
  if (value || row.length) { row.push(value.replace(/\r$/, '')); rows.push(row); }
  if (quoted) throw new Error(`Unclosed CSV quote in ${file}`);
  if (!rows.length) return [];
  const [header, ...data] = rows;
  if (data.some(row => row.length !== header.length)) throw new Error(`Invalid CSV width in ${file}`);
  return data.map(row => Object.fromEntries(header.map((name, i) => [name, row[i] ?? ''])));
}
