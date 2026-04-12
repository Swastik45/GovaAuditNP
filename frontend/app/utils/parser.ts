// utils/parser.ts

export function parseAuditData(rawData: string) {
  try {
    // Attempt to parse the internal string as JSON
    // because the Python script now outputs a JSON-in-JSON format
    const parsed = JSON.parse(rawData);
    
    return {
      status: parsed.status || 'IN_PROGRESS',
      reason: parsed.reason || 'No details provided.',
      source: parsed.source && parsed.source !== '#' ? parsed.source : 'https://google.com'
    };
  } catch (e) {
    // Fallback for any old data still in the text format
    const statusMatch = rawData.match(/STATUS:\s*(\w+)/);
    const reasonMatch = rawData.match(/REASON:\s*(.*)/);
    const sourceMatch = rawData.match(/SOURCE:\s*(.*)/);

    return {
      status: statusMatch ? statusMatch[1].toUpperCase() : 'IN_PROGRESS',
      reason: reasonMatch ? reasonMatch[1] : 'Analyzing current 2026 data...',
      source: sourceMatch && sourceMatch[1] !== '#' ? sourceMatch[1].trim() : 'https://google.com'
    };
  }
}