import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { extractTextFromBuffer } from '@/lib/parser';
import { analyzeResume } from '@/lib/ai';
import { getPool, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate the User
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Session invalid or expired. Please log in again." }, { status: 401 });
    }

    // 2. Parse multipart form data
    const formData = await req.formData();
    const jobDescription = formData.get('jobDescription') as string;
    const files = formData.getAll('files') as File[];

    if (!jobDescription || jobDescription.trim() === '') {
      return NextResponse.json({ error: "Job description text is required." }, { status: 400 });
    }

    if (!files || files.length === 0 || (files.length === 1 && files[0].name === '')) {
      return NextResponse.json({ error: "Please select and upload at least one resume." }, { status: 400 });
    }

    await initDb();
    const pool = getPool();
    const results = [];

    // 3. Process each resume sequentially
    for (const file of files) {
      if (file.name === '' || file.size === 0) continue;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Parse file contents based on extension
      const text = await extractTextFromBuffer(buffer, file.name);

      // Perform Gemini analysis
      const analysis = await analyzeResume(text, jobDescription);

      // Save to database
      const dbResult = await pool.query(
        `INSERT INTO analyses 
         (user_id, filename, job_description, score, match_status, missing_skills, course_suggestions) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [
          decoded.userId,
          file.name,
          jobDescription,
          analysis.score,
          analysis.matchStatus,
          JSON.stringify(analysis.missingSkills),
          JSON.stringify(analysis.courseSuggestions)
        ]
      );

      const dbRow = dbResult.rows[0];

      results.push({
        id: dbRow.id,
        filename: dbRow.filename,
        score: dbRow.score,
        matchStatus: dbRow.match_status,
        missingSkills: dbRow.missing_skills,
        suggestions: analysis.suggestions, // Gemini generated suggestions
        courseSuggestions: dbRow.course_suggestions,
        createdAt: dbRow.created_at
      });
    }

    // Sort results by score descending (highest matches first)
    results.sort((a, b) => b.score - a.score);

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Error in analyze route:", error);
    return NextResponse.json({ error: error.message || "Failed to parse and analyze resumes." }, { status: 500 });
  }
}
