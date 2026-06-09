import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client safely
const getGenAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    throw new Error("GEMINI_API_KEY environment variable is missing or placeholder.");
  }
  return new GoogleGenerativeAI(apiKey);
};

export interface CourseSuggestion {
  name: string;
  platform: string;
  reason: string;
}

export interface AnalysisResult {
  score: number;
  matchStatus: string;
  missingSkills: string[];
  suggestions: string[];
  courseSuggestions: CourseSuggestion[];
}

// --------------------------------------------------------------------------
// LOCAL FALLBACK DATA & LOGIC (For offline or missing API key cases)
// --------------------------------------------------------------------------

// Database mapping common tech skills to high-quality courses
const COURSE_DATABASE: Record<string, CourseSuggestion> = {
  python: {
    name: "Python for Everybody Specialization",
    platform: "Coursera",
    reason: "Learn foundational Python programming, web scraping, and database manipulation to bridge backend skill requirements."
  },
  javascript: {
    name: "The Complete JavaScript Course: From Zero to Expert",
    platform: "Udemy",
    reason: "Master standard modern ES6+ JS syntax, asynchronous routines, and visual client-side application control."
  },
  typescript: {
    name: "Understanding TypeScript",
    platform: "Udemy",
    reason: "Gain type-safety capabilities, decorators, interface schemas, and structural JavaScript debugging experience."
  },
  react: {
    name: "React - The Complete Guide (incl. Hooks, React Router, Redux)",
    platform: "Udemy",
    reason: "Build interactive client-side interfaces, master hook states, and manage single-page routing structures."
  },
  node: {
    name: "The Complete Node.js Developer Course",
    platform: "Udemy",
    reason: "Learn server-side application logic, file streaming, web socket connections, and REST API deployment."
  },
  express: {
    name: "Just Express (with Node.js)",
    platform: "Udemy",
    reason: "Understand middleware configurations, API routing schemas, and backend response management."
  },
  mongodb: {
    name: "MongoDB - The Complete Developer's Guide",
    platform: "Udemy",
    reason: "Gain document-database expertise, design JSON collections, and write aggregation lookup queries."
  },
  postgresql: {
    name: "SQL and Relational Databases (PostgreSQL)",
    platform: "edX",
    reason: "Learn relational schema normalization, index keys, and efficient SQL join operations."
  },
  mysql: {
    name: "The Ultimate MySQL Bootcamp",
    platform: "Udemy",
    reason: "Master SQL queries, grouping filters, database triggers, and database schema creation."
  },
  docker: {
    name: "Docker Technologies for DevOps and Developers",
    platform: "Udemy",
    reason: "Learn container virtualization, image construction, custom dockerfiles, and port mapping configs."
  },
  aws: {
    name: "AWS Certified Solutions Architect Associate",
    platform: "Coursera",
    reason: "Gain cloud deployment architecture knowledge, ec2 scaling, S3 storage buckets, and IAM security controls."
  },
  kubernetes: {
    name: "Certified Kubernetes Administrator (CKA)",
    platform: "Udemy",
    reason: "Understand enterprise scaling, container orchestrations, pod configurations, and network endpoints."
  },
  git: {
    name: "Git & GitHub Boot Camp",
    platform: "Udemy",
    reason: "Master version branch controls, pull requests, cherry-picks, and collaborative Git workflow patterns."
  },
  bootstrap: {
    name: "Bootstrap 5 from Scratch",
    platform: "Udemy",
    reason: "Build responsive grids, visually structured flex items, and standard styling components."
  },
  tailwind: {
    name: "Tailwind CSS from Scratch",
    platform: "Udemy",
    reason: "Build highly-customized utility layouts and responsive visual themes without bloating stylesheets."
  },
  html: {
    name: "HTML5 and CSS3 for Beginners",
    platform: "Udemy",
    reason: "Understand structural page layout tags, forms, input attributes, and markup hierarchy rules."
  },
  css: {
    name: "CSS - The Complete Guide (incl. Flexbox, Grid & Sass)",
    platform: "Udemy",
    reason: "Learn layouts, custom animations, transitions, backdrop filters, and responsive styles."
  },
  java: {
    name: "Java Programming Masterclass",
    platform: "Udemy",
    reason: "Learn classic class structures, inheritance, multithreading, and enterprise backend engineering."
  }
};

const COMMON_SKILLS = Object.keys(COURSE_DATABASE);

// Standard English stop words
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'cant', 'cannot', 'could',
  'did', 'didnt', 'do', 'does', 'doesnt', 'doing', 'dont', 'down', 'during', 'each', 'few', 'for', 'from', 'further',
  'had', 'hadnt', 'has', 'hasnt', 'have', 'havent', 'having', 'he', 'hed', 'hell', 'hes', 'her', 'here', 'heres',
  'hers', 'herself', 'him', 'himself', 'his', 'how', 'hows', 'i', 'id', 'ill', 'im', 'ive', 'if', 'in', 'into',
  'is', 'isnt', 'it', 'its', 'itself', 'lets', 'me', 'more', 'most', 'mustnt', 'my', 'myself', 'no', 'nor', 'not',
  'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'shant', 'she', 'shed', 'shell', 'shes', 'should', 'shouldnt', 'so', 'some', 'such', 'than', 'that',
  'thats', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'theres', 'these', 'they', 'theyd',
  'theyll', 'theyre', 'theyve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was',
  'wasnt', 'we', 'wed', 'well', 'were', 'weve', 'werent', 'what', 'whats', 'when', 'whens', 'where', 'wheres',
  'which', 'while', 'who', 'whos', 'whom', 'why', 'whys', 'with', 'wont', 'would', 'wouldnt', 'you', 'youd',
  'youll', 'youre', 'youve', 'your', 'yours', 'yourself', 'yourselves'
]);

function cleanWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1);
}

// Fallback algorithm mapping skill overlaps locally
export function localFallbackAnalysis(resumeText: string, jobDescription: string): AnalysisResult {
  const resumeWords = new Set(cleanWords(resumeText));
  const jdWords = cleanWords(jobDescription).filter(word => !STOP_WORDS.has(word));
  
  const missingSkills: string[] = [];
  const foundSkills: string[] = [];
  
  COMMON_SKILLS.forEach(skill => {
    const isRequired = jobDescription.toLowerCase().includes(skill);
    const hasSkill = resumeText.toLowerCase().includes(skill);
    
    if (isRequired && !hasSkill) {
      missingSkills.push(skill.toUpperCase());
    } else if (isRequired && hasSkill) {
      foundSkills.push(skill.toUpperCase());
    }
  });

  // Calculate score based on text word overlap & skill presence ratio
  const jdTermsSet = new Set(jdWords);
  let matchCount = 0;
  jdTermsSet.forEach(term => {
    if (resumeWords.has(term)) {
      matchCount++;
    }
  });

  let score = 0;
  if (jdTermsSet.size > 0) {
    const baseRatio = matchCount / jdTermsSet.size;
    const skillRatio = foundSkills.length / (foundSkills.length + missingSkills.length || 1);
    score = Math.round((baseRatio * 0.4 + skillRatio * 0.6) * 100);
  }
  
  // Normal range limits
  if (score < 20) score = 20;
  if (score > 95) score = 95;

  let matchStatus = "Low match";
  if (score >= 80) matchStatus = "Strong match";
  else if (score >= 60) matchStatus = "Moderate match";

  // Suggestions based on section keyword analysis
  const suggestions: string[] = [
    "Tailor your summary block to directly map key phrases mentioned in the JD.",
    "Quantify your accomplishments (e.g. 'Optimized performance by 30%', 'Reduced costs by $10K')."
  ];

  if (!resumeText.toLowerCase().includes("project")) {
    suggestions.unshift("Add a dedicated Projects section demonstrating structural programming and logic.");
  }
  if (!resumeText.toLowerCase().includes("experience")) {
    suggestions.unshift("Detail work history/experience or list academic internship roles.");
  }
  if (!resumeText.toLowerCase().includes("skills")) {
    suggestions.unshift("List your skills explicitly in a layout category structure for better scanner parsing.");
  }

  // Map missing skills to courses
  const courseSuggestions: CourseSuggestion[] = [];
  missingSkills.slice(0, 3).forEach(skill => {
    const lowerSkill = skill.toLowerCase();
    if (COURSE_DATABASE[lowerSkill]) {
      courseSuggestions.push(COURSE_DATABASE[lowerSkill]);
    }
  });

  // Ensure default course items exist
  if (courseSuggestions.length === 0) {
    courseSuggestions.push({
      name: "Technical Writing and Professional Resume Documentation",
      platform: "Coursera",
      reason: "Optimize spacing, layout hierarchy, and keywords alignment for search engines and ATS compliance."
    });
  }

  return {
    score,
    matchStatus,
    missingSkills: missingSkills.length > 0 ? missingSkills : ["No major gaps detected"],
    suggestions,
    courseSuggestions
  };
}

// --------------------------------------------------------------------------
// MAIN ANALYSIS ENTRYPOINT
// --------------------------------------------------------------------------

export async function analyzeResume(resumeText: string, jobDescription: string): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  // If the API key is not configured, empty, or placeholder, fall back to local parsing
  if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    console.warn("GEMINI_API_KEY is not configured or is set to placeholder. Falling back to local offline analysis.");
    return localFallbackAnalysis(resumeText, jobDescription);
  }

  try {
    const client = getGenAIClient();
    const model = client.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
You are an expert HR Specialist and AI Resume Screener. Your task is to analyze the candidate's resume text against the provided Job Description (JD).

Job Description:
"""
${jobDescription}
"""

Candidate's Resume Text:
"""
${resumeText}
"""

Instructions:
1. Compare the candidate's resume with the requirements of the job description.
2. Compute a matching score from 0 to 100 based on core skills, experience, projects, and general suitability.
3. Group the status as "Strong match" (score >= 80), "Moderate match" (60 <= score < 80), or "Low match" (score < 60).
4. Identify missing skills and keywords.
5. Provide actionable suggestions on how they can improve their resume specifically for this job description (e.g. adding specific achievements, restructuring, emphasizing projects).
6. Provide a "courseSuggestions" list. For the missing skills, suggest 2 to 4 actual, high-quality courses that the candidate could take to bridge their skill gaps. Provide the platform (e.g., Coursera, Udemy, edX, Udacity, or Pluralsight) and a brief reason.

You MUST respond strictly with a valid JSON object matching this schema:
{
  "score": number,
  "matchStatus": "Strong match" | "Moderate match" | "Low match",
  "missingSkills": string[],
  "suggestions": string[],
  "courseSuggestions": [
    {
      "name": string,
      "platform": string,
      "reason": string
    }
  ]
}

Return ONLY the raw JSON output. Do not wrap in markdown code blocks.
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean text if it contains markdown code block notation (in case the model ignores responseMimeType config)
    let cleanText = responseText.trim();
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.substring(7);
    }
    if (cleanText.endsWith("```")) {
      cleanText = cleanText.substring(0, cleanText.length - 3);
    }
    cleanText = cleanText.trim();

    const analysisResult: AnalysisResult = JSON.parse(cleanText);
    return analysisResult;
  } catch (error: any) {
    console.error("Error analyzing resume with Gemini:", error);
    // If the API key is invalid (400 Bad Request) or any other API error happens, fall back to local analysis
    console.warn("API Error occurred during Gemini analysis. Falling back to local offline analysis.");
    return localFallbackAnalysis(resumeText, jobDescription);
  }
}
