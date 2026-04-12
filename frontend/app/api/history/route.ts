// app/api/history/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const historyDir = path.join(process.cwd(), 'public/data/history');
  
  try {
    if (!fs.existsSync(historyDir)) return NextResponse.json([]);
    
    const files = fs.readdirSync(historyDir)
      .filter(file => file.endsWith('.json'))
      .sort() // Sorts by timestamp (since your python script uses ISO/Y-M-D)
      .reverse(); // Newest first

    return NextResponse.json(files);
  } catch (error) {
    return NextResponse.json({ error: "Failed to read history" }, { status: 500 });
  }
}