# 🤖 AI Resume Screening System

An AI-powered Resume Screening System that analyzes resumes against a job description using NLP and BERT-based similarity scoring.

## 🚀 Features

* 📄 Upload multiple resumes (PDF, DOCX, TXT)
* 📋 Paste job description directly
* 🧠 AI-based scoring using Sentence Transformers (BERT)
* 📊 Resume ranking system
* 🔑 Keyword gap detection
* 💡 Smart suggestions for improvement
* 🌐 Interactive web UI using Gradio

## 🛠️ Tech Stack

* Python
* Gradio (UI)
* Sentence Transformers (BERT)
* Scikit-learn
* PDFPlumber / python-docx

## ⚙️ How It Works

1. User uploads resume(s)
2. Pastes job description
3. System extracts text from resumes
4. Uses BERT embeddings to compute similarity
5. Ranks resumes based on score
6. Provides missing keywords and suggestions

## ▶️ How to Run

```bash
pip install -r requirements.txt
python app.py
```

## 📂 Project Structure

```
ai-resume-screener/
│── app.py
│── requirements.txt
│── README.md
```

## 📊 Example Output

* Resume Score: 78/100
* Missing Skills: Docker, AWS, Microservices
* Suggestions:

  * Add project details
  * Include experience section
  * Tailor resume to job description

## 🚧 Future Improvements

* 🔐 User authentication system
* ☁️ Cloud deployment
* 📊 Data visualization dashboard
* 🤖 Advanced skill classification
* 🌐 Full-stack web application (React + FastAPI)

## 👨‍💻 Author

Gowtham Garimella
