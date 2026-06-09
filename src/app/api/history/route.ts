import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getPool, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Session invalid or expired. Please log in again." }, { status: 401 });
    }

    await initDb();
    const pool = getPool();

    const result = await pool.query(
      `SELECT id, filename, job_description, score, match_status, missing_skills, course_suggestions, created_at 
       FROM analyses 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [decoded.userId]
    );

    // Map DB fields to JSON camelCase response
    const history = result.rows.map(row => ({
      id: row.id,
      filename: row.filename,
      jobDescription: row.job_description,
      score: row.score,
      matchStatus: row.match_status,
      missingSkills: row.missing_skills,
      courseSuggestions: row.course_suggestions,
      createdAt: row.created_at
    }));

    return NextResponse.json({ history });
  } catch (error: any) {
    console.error("Error in history route:", error);
    return NextResponse.json({ error: "Failed to retrieve analysis history." }, { status: 500 });
  }
}
