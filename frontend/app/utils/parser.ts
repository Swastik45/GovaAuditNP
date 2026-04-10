// app/utils/parser.ts

export const parseAuditData = (rawText: string) => {
  const findField = (key: string) => {
    // Look for the key and capture everything until the end of the line
    const regex = new RegExp(`${key}\\s*(.*)`, 'i');
    const match = rawText.match(regex);
    return match ? match[1].trim() : null;
  };

  // 1. Extract Status
  let status = "PENDING";
  if (rawText.includes("STATUS: DONE")) status = "DONE";
  else if (rawText.includes("STATUS: OVERDUE")) status = "OVERDUE";
  else if (rawText.includes("STATUS: IN_PROGRESS")) status = "IN_PROGRESS";

  // 2. Extract Source (Find the first URL)
  const sourceMatch = rawText.match(/https?:\/\/[^\s]+(?=\n|$)/);
  const source = sourceMatch ? sourceMatch[0] : "#";

  // 3. Extract Reason (Search for REASON: or take first bit of text)
  const reason = findField("REASON:") || rawText.split('\n')[0].substring(0, 150) + "...";

  return { 
    status, 
    reason: reason.replace(/\*\*/g, ''), // Clean out markdown bolding
    source 
  };
};