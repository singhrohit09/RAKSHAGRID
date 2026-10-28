/**
 * Safely converts an array of objects to a CSV string and triggers a browser download.
 * Properly escapes fields containing commas, double quotes, and newlines.
 */
export function exportToCSV<T extends Record<string, unknown>>(
  filename: string,
  rows: T[],
  columnHeaders?: { key: keyof T; label: string }[]
): void {
  if (!rows || rows.length === 0) {
    throw new Error('No records available for export.');
  }

  const headers = columnHeaders 
    ? columnHeaders 
    : Object.keys(rows[0]).map(key => ({ key: key as keyof T, label: key }));

  const headerRow = headers.map(h => escapeCSVValue(h.label)).join(',');

  const dataRows = rows.map(row => {
    return headers.map(h => {
      const val = row[h.key];
      return escapeCSVValue(val);
    }).join(',');
  });

  const csvContent = [headerRow, ...dataRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escapes an individual value for CSV conformity (RFC 4180).
 */
export function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }

  let stringValue: string;
  if (typeof value === 'object') {
    stringValue = JSON.stringify(value);
  } else {
    stringValue = String(value);
  }

  // If value contains quotes, commas, or newlines, quote it and escape internal quotes
  if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('\r')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return `"${stringValue}"`;
}

/**
 * Exports data as a JSON file and triggers download.
 */
export function exportToJSON(filename: string, data: unknown): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.json') ? filename : `${filename}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
