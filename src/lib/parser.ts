import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error("Failed to parse PDF file. Ensure the file is not corrupted.");
  }
}

export async function parseDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (error) {
    console.error("DOCX parsing error:", error);
    throw new Error("Failed to parse Word Document (.docx).");
  }
}

export function parseTxt(buffer: Buffer): string {
  return buffer.toString('utf8');
}

export async function extractTextFromBuffer(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') {
    return parsePdf(buffer);
  } else if (ext === 'docx') {
    return parseDocx(buffer);
  } else if (ext === 'txt') {
    return parseTxt(buffer);
  } else {
    throw new Error(`Unsupported file extension: .${ext}. Only .pdf, .docx, and .txt files are supported.`);
  }
}
