"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Upload, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  BookOpen, 
  Clock, 
  X,
  Plus
} from 'lucide-react';

interface Course {
  name: string;
  platform: string;
  reason: string;
}

interface Analysis {
  id?: number;
  filename: string;
  score: number;
  matchStatus: string;
  missingSkills: string[];
  suggestions: string[];
  courseSuggestions: Course[];
  createdAt: string;
  jobDescription?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<Analysis[]>([]);
  const [history, setHistory] = useState<Analysis[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);

  // Fetch user info and history on load
  useEffect(() => {
    fetchUserData();
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setUser(data.user);
    } catch (err) {
      console.error("Error fetching user data:", err);
      router.push('/login');
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Run resume analysis
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      setError('Please paste a job description.');
      return;
    }
    if (files.length === 0) {
      setError('Please upload at least one resume file.');
      return;
    }

    setLoading(true);
    setError('');
    setSelectedHistoryId(null);

    const formData = new FormData();
    formData.append('jobDescription', jobDescription);
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze resumes.');
      }

      setResults(data.results);
      setFiles([]); // Clear uploaded files
      fetchHistory(); // Refresh history sidebar
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load a historical analysis into view
  const loadHistoryItem = (item: Analysis) => {
    setSelectedHistoryId(item.id || null);
    setResults([item]);
    if (item.jobDescription) {
      setJobDescription(item.jobDescription);
    }
  };

  // Helper for match score styling classes
  const getScoreClass = (score: number) => {
    if (score >= 80) return 'score-high';
    if (score >= 60) return 'score-mid';
    return 'score-low';
  };

  const getBadgeClass = (score: number) => {
    if (score >= 80) return 'badge-high';
    if (score >= 60) return 'badge-mid';
    return 'badge-low';
  };

  return (
    <div className="dashboard-layout animate-fade-in">
      {/* Left Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">🤖 ResumeScreen</div>
        
        <h3 className="sidebar-title">
          <Clock size={13} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Analysis History
        </h3>
        
        <div className="history-list">
          {history.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
              No history found. Create your first scan!
            </div>
          ) : (
            history.map((item) => (
              <button
                key={item.id}
                onClick={() => loadHistoryItem(item)}
                className={`history-item ${selectedHistoryId === item.id ? 'active' : ''}`}
              >
                <div className="history-file">{item.filename}</div>
                <div className="history-meta">
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  <span className={`badge ${getBadgeClass(item.score)}`}>
                    {item.score}% Match
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {user && (
          <div className="user-profile">
            <div className="user-avatar">
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="user-info">
              <div className="user-name">{user.username}</div>
              <button onClick={handleLogout} className="btn-logout">
                <LogOut size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                Log Out
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Workspace */}
      <main className="main-workspace">
        <header className="header">
          <div>
            <h1 className="header-title">AI Resume Analyzer</h1>
            <p className="header-subtitle">Upload multiple resumes and evaluate them against role requirements instantly.</p>
          </div>
        </header>

        {error && <div className="auth-error">{error}</div>}

        <div className="workspace-grid">
          {/* Inputs Panel */}
          <section className="panel-card glass">
            <h2 className="panel-title">
              <FileText size={18} className="dropzone-icon" style={{ margin: 0 }} />
              Workspace Input
            </h2>
            <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
                  Job Description
                </label>
                <textarea
                  className="textarea-jd"
                  placeholder="Paste the job description or requirement specifications here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
                  Upload Resumes (.pdf, .docx, .txt)
                </label>
                <div 
                  className={`dropzone ${dragActive ? 'active' : ''}`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Upload size={32} className="dropzone-icon" />
                  <p className="dropzone-text">Drag & drop resume files here</p>
                  <p className="dropzone-subtext">or click to browse your local filesystem</p>
                  <input
                    id="file-upload"
                    type="file"
                    className="file-input"
                    multiple
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileChange}
                    disabled={loading}
                  />
                </div>

                {files.length > 0 && (
                  <div className="file-list">
                    {files.map((file, index) => (
                      <div key={index} className="file-list-item">
                        <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                        <button
                          type="button"
                          className="file-remove-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={loading || !jobDescription.trim() || (files.length === 0 && results.length === 0)}
              >
                {loading ? 'Analyzing Resumes...' : 'Run Diagnostics'}
              </button>
            </form>
          </section>

          {/* Output / Results Panel */}
          <section>
            {loading ? (
              <div className="panel-card glass loading-overlay">
                <div className="spinner"></div>
                <h3 className="loading-text">Performing AI Screening</h3>
                <p className="loading-subtext">Parsing documents & calculating alignment scores...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="results-container">
                {results.map((result, idx) => (
                  <article key={idx} className="result-card glass animate-slide-up">
                    <div className="result-header">
                      <div className="result-filename" title={result.filename}>
                        {result.filename}
                      </div>
                      <div className="score-display-wrapper">
                        <div className={`score-circle ${getScoreClass(result.score)}`}>
                          <span className="score-number">{result.score}</span>
                          <span className="score-label">Match</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="result-section-title">
                        <AlertCircle size={16} style={{ color: 'var(--match-low)' }} />
                        Missing Keywords & Gaps
                      </h3>
                      <div className="skills-tags">
                        {result.missingSkills.length === 0 ? (
                          <span style={{ color: 'var(--match-high)', fontSize: '0.9rem' }}>
                            ✓ Perfect keywords overlap! No major skill gaps detected.
                          </span>
                        ) : (
                          result.missingSkills.map((skill, index) => (
                            <span key={index} className="skill-tag">
                              {skill}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    {result.suggestions && result.suggestions.length > 0 && (
                      <div>
                        <h3 className="result-section-title">
                          <Sparkles size={16} style={{ color: 'var(--accent-secondary)' }} />
                          Improvement Recommendations
                        </h3>
                        <ul className="suggestions-list">
                          {result.suggestions.map((suggestion, index) => (
                            <li key={index} className="suggestion-item">
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Course Suggestions Module */}
                    <div className="courses-container">
                      <h3 className="result-section-title">
                        <BookOpen size={16} style={{ color: 'var(--accent-primary)' }} />
                        Recommended Courses to Bridge Gaps
                      </h3>
                      <div className="courses-grid">
                        {result.courseSuggestions && result.courseSuggestions.length > 0 ? (
                          result.courseSuggestions.map((course, index) => (
                            <div key={index} className="course-card glass">
                              <div className="course-meta">
                                <span className="course-platform">{course.platform}</span>
                              </div>
                              <h4 className="course-name">{course.name}</h4>
                              <p className="course-reason">{course.reason}</p>
                            </div>
                          ))
                        ) : (
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            No courses suggestions generated.
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="panel-card glass" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '350px', color: 'var(--text-muted)' }}>
                <FileText size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                <p>No screening run yet</p>
                <p style={{ fontSize: '0.85rem' }}>Enter a Job Description and upload resumes to run diagnostics.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
