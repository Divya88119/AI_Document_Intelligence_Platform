import os
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(36, 805, "AI Document Intelligence & Data Analytics Platform — Architectural Playbook")
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.5)
            self.line(36, 798, 559, 798)
            
        # Footer
        footer_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(559, 25, footer_text)
        self.drawString(36, 25, "Confidential — Prepared for Engineering & Data Science Technical Interviews")
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(36, 35, 559, 35)
        self.restoreState()

def build_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=46,
        bottomMargin=46
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    primary_color = colors.HexColor("#1e1b4b")
    accent_color = colors.HexColor("#4f46e5")
    text_dark = colors.HexColor("#0f172a")
    text_muted = colors.HexColor("#475569")
    card_bg = colors.HexColor("#f8fafc")
    border_color = colors.HexColor("#cbd5e1")
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.white
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#c7d2fe")
    )
    
    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#e2e8f0")
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=accent_color,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=text_dark,
        spaceAfter=4
    )

    pitch_style = ParagraphStyle(
        'Pitch_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor("#1e293b")
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11.5,
        textColor=text_dark,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=2
    )

    qa_q_style = ParagraphStyle(
        'QA_Q',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#1e1b4b"),
        spaceAfter=2
    )

    qa_a_style = ParagraphStyle(
        'QA_A',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11.5,
        textColor=colors.HexColor("#334155")
    )

    story = []

    # 1. Header Banner
    header_content = [
        [Paragraph("<b>ENTERPRISE ARCHITECTURAL PLAYBOOK & INTERVIEW GUIDE</b>", ParagraphStyle('Badge', fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.HexColor("#a5b4fc")))],
        [Paragraph("AI Document Intelligence & Automated Data Analytics Platform", title_style)],
        [Paragraph("Full Stack .NET 8 Web API, EF Core, SQL Server, and React 18 with TypeScript", subtitle_style)],
        [Spacer(1, 4)],
        [Paragraph("<b>Key Pillars:</b> Document Intelligence (OCR/NLP/Chat) &bull; Automated Data Science (EDA/Cleaning/Forecasting)", meta_style)]
    ]
    
    header_table = Table(header_content, colWidths=[523])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#0f172a")),
        ('PADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROUNDEDCORNERS', [8, 8, 8, 8])
    ]))
    story.append(header_table)
    story.append(Spacer(1, 10))

    # 2. 30-Second Elevator Pitch
    story.append(Paragraph("1. The 30-Second Elevator Pitch", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=accent_color, spaceBefore=1, spaceAfter=6))
    
    pitch_text = (
        "\"I designed and built an enterprise-grade <b>AI Document Intelligence & Automated Data Analytics Platform</b> "
        "using <b>.NET 8</b>, <b>Entity Framework Core</b>, <b>SQL Server</b>, and <b>React 18 with TypeScript & Tailwind CSS</b>.<br/><br/>"
        "The platform solves two high-impact enterprise workflows:<br/>"
        "&bull; <b>Unstructured Document Intelligence:</b> Ingests multi-format documents (PDF, Word, Excel), executes text/table extraction, "
        "AI document classification, entity/key-value extraction, and grounded semantic Q&A without hallucinations.<br/>"
        "&bull; <b>Automated Data Science & Predictive Analytics:</b> Ingests raw tabular datasets (CSV/Excel), runs automated data quality audits, "
        "imputes missing values, computes descriptive statistics & Pearson correlation matrices, generates visual trend reports, and forecasts future trajectory "
        "using regression algorithms with <b>95% confidence intervals</b>.<br/><br/>"
        "Engineered with non-blocking background channels (<code>System.Threading.Channels</code>), JWT authentication, and role-based access control.\""
    )
    
    pitch_table = Table([[Paragraph(pitch_text, pitch_style)]], colWidths=[523])
    pitch_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LINELEFT', (0, 0), (-1, -1), 3.5, accent_color),
    ]))
    story.append(pitch_table)
    story.append(Spacer(1, 10))

    # 3. System Architecture Table
    story.append(Paragraph("2. End-to-End System Architecture", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=accent_color, spaceBefore=1, spaceAfter=6))

    arch_data = [
        [Paragraph("<b>Layer</b>", body_style), Paragraph("<b>Technologies</b>", body_style), Paragraph("<b>Key Responsibilities</b>", body_style)],
        [
            Paragraph("<b>Frontend SPA</b>", body_style),
            Paragraph("React 18, Vite, TypeScript, Tailwind CSS, Lucide, Axios", body_style),
            Paragraph("Document Studio, Chat Q&A, 6-tab Data Science Studio, Protected Routes, JWT session interceptors.", body_style)
        ],
        [
            Paragraph("<b>API Gateway</b>", body_style),
            Paragraph("ASP.NET Core 8 Web API, JWT Bearer, CORS, RFC 7807 Middleware", body_style),
            Paragraph("JWT validation, Claims-Based RBAC (Admin/User), streaming multipart uploads, REST routing.", body_style)
        ],
        [
            Paragraph("<b>Background Engine</b>", body_style),
            Paragraph("<code>System.Threading.Channels</code>, <code>BackgroundService</code>", body_style),
            Paragraph("Asynchronous queueing, sub-50ms ingestion, non-blocking I/O, auto-recovery on server restarts.", body_style)
        ],
        [
            Paragraph("<b>Extraction & AI</b>", body_style),
            Paragraph("<code>PdfPig</code>, <code>OpenXML</code>, Gemini API, OpenAI, Heuristic NLP", body_style),
            Paragraph("Page-by-page PDF extraction, Word/Excel table parser, entity extraction, grounded conversational Q&A.", body_style)
        ],
        [
            Paragraph("<b>Data Analytics Core</b>", body_style),
            Paragraph("Statistical Dispersion, IQR Outliers, Least-Squares Regression", body_style),
            Paragraph("Data Health Score, median imputation, Pearson correlation matrix, time-series forecasting with 95% CI.", body_style)
        ],
        [
            Paragraph("<b>Persistence Layer</b>", body_style),
            Paragraph("SQL Server 2022, EF Core 8, Local Disk Storage", body_style),
            Paragraph("3NF relational tables, indexed foreign keys, migration history, secure local binary storage.", body_style)
        ]
    ]

    arch_table = Table(arch_data, colWidths=[90, 140, 293])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
        ('GRID', (0, 0), (-1, -1), 0.5, border_color),
        ('PADDING', (0, 0), (-1, -1), 4.5),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(arch_table)
    story.append(Spacer(1, 10))

    # 4. Module-by-Module Technical Deep Dive
    story.append(Paragraph("3. Module-by-Module Technical Deep Dive", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=accent_color, spaceBefore=1, spaceAfter=6))

    modules = [
        ("Module 1: Authentication, RBAC & Security", "JWT Bearer, BCrypt.Net, Claims-Based RBAC, InitialAdminSeeder", [
            "Issues HMAC-SHA256 signed JWT tokens containing User ID, Email, and Role claims (Admin/User).",
            "One-way password hashing using BCrypt.Net with 11 salt rounds.",
            "InitialAdminSeeder automatically runs EF Core database migrations on startup and synchronizes credentials."
        ]),
        ("Module 2: Multi-Format Document Extraction Engine", "PdfPig (PDF), DocumentFormat.OpenXml (.docx/.xlsx), UTF-8 Decoders", [
            "PDF Parser: Iterates page-by-page with PdfPig to extract structural text flow without requiring Acrobat.",
            "Word/Excel: Traverses OpenXml DOM trees and shared string tables to generate clean tabular CSV rows.",
            "Captures metadata: RawText, total WordCount, total PageCount, and ExtractedAt timestamp."
        ]),
        ("Module 3: Asynchronous Background Processing Pipeline", "System.Threading.Channels.Channel<int>, BackgroundService, State Machine", [
            "Decouples ingestion: Upload endpoint saves binary, marks record as 'Queued', and responds in < 50ms.",
            "Background worker consumes queue with thread safety, moving state from Queued -> Processing -> Completed/Failed.",
            "Fault-tolerance: Server restarts trigger auto-scan of SQL Server to re-enqueue uncompleted jobs."
        ]),
        ("Module 4: AI Document Intelligence & Structuring", "Google Gemini API, OpenAI API, Built-in Offline Heuristic NLP Engine", [
            "Smart Classification: Identifies categories (Invoice, Contract, Resume, Financial Report) with confidence score.",
            "Structured Entities: Pulls out monetary totals, due dates, signatories, and contact information.",
            "Multi-Engine Resilience: Automatically falls back to offline heuristic NLP if cloud AI APIs are unreachable."
        ]),
        ("Module 5: Semantic Q&A & Document Chat Studio", "Prompt Grounding, Negative Constraint Prompting, EF Core Persistence", [
            "Injects verified extracted document text into system prompt as ground truth.",
            "Zero-Hallucination rule: 'Answer strictly using only document context; state clearly if not mentioned.'",
            "Maintains chat history table (DocumentChatMessage) for auditability and session resumption."
        ]),
        ("Module 6: Automated Data Analytics, Versioning & Dynamic Visual Studio", "Data Profiler, Version Lineage (v1.0/v1.1), IQR Diff Engine, Dynamic Visual Studio", [
            "1. Data Profiling & Health Audit: Inferred schema (Numeric, DateTime, Categorical), cardinality, null count, and 0-100% Health Score.",
            "2. Detailed Transformation Audit: Step-by-step before vs. after comparison cards showing affected cells, original values, transformed values, and statistical rationale.",
            "3. Dataset Version Control Pattern: Maintains immutable snapshot lineage (v1.0 Raw Ingested, v1.1 Auto-Cleaned Baseline), allowing instant version switching & CSV export.",
            "4. Dynamic Client Visualization Studio: Generates on-demand Bar, Line, Area, Donut, and Scatter charts by custom X/Y axes and aggregations (SUM, AVG, COUNT, MIN, MAX).",
            "5. AI Natural Language Chart Assistant: Parses natural language client prompts (e.g. 'Show average profit by region as a donut chart') and renders the exact visualization.",
            "6. Descriptive Statistics & EDA: Computes Mean, Median, StdDev, Min, Max, Q25, Q75, Skewness, and Pearson Correlation Matrix heatmap.",
            "7. Predictive Time-Series Forecasting: Extrapolates future horizons with 95% Confidence Bands and projected growth rate (Delta %)."
        ]),
        ("Module 7 & 8: Executive Dashboard & React 18 Single Page App", "React 18, TypeScript, Tailwind CSS, Lucide Icons, EF Core AsNoTracking", [
            "Dashboard: Real-time KPIs for storage consumption, processing success rates, and category distribution.",
            "Frontend UX: Dark-mode studio, side-by-side text & AI insight viewer, and 1-click sample dataset generators."
        ])
    ]

    for title, tech, points in modules:
        mod_content = [
            [Paragraph(f"<b>{title}</b>", h2_style)],
            [Paragraph(f"<b>Tech Stack:</b> <code>{tech}</code>", ParagraphStyle('Tech', fontName='Helvetica', fontSize=7.5, textColor=text_muted))],
            [Spacer(1, 2)]
        ]
        for pt in points:
            mod_content.append([Paragraph(f"&bull; {pt}", bullet_style)])
            
        mod_table = Table(mod_content, colWidths=[523])
        mod_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), card_bg),
            ('GRID', (0, 0), (-1, -1), 0.5, border_color),
            ('PADDING', (0, 0), (-1, -1), 5),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(KeepTogether([mod_table, Spacer(1, 6)]))

    story.append(PageBreak())

    # 5. Top Interview Questions & Model Answers
    story.append(Paragraph("4. Top 10 Technical Interview Questions & Model Answers", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=accent_color, spaceBefore=1, spaceAfter=6))

    qa_list = [
        (
            "Q1: Why did you use System.Threading.Channels instead of processing files synchronously inside the controller?",
            "Document parsing, OCR, and AI calls take several seconds per file. Executing them synchronously blocks thread pool threads, "
            "degrades API throughput, and risks HTTP 504 timeouts. With System.Threading.Channels.Channel<int>, the upload endpoint saves the binary, "
            "marks the record as 'Queued', and responds in under 50ms. The background worker consumes jobs asynchronously with built-in backpressure."
        ),
        (
            "Q2: How does the platform handle server restarts during background processing?",
            "On startup, DocumentProcessingWorker.ExecuteAsync scans the database for any documents stuck in 'Uploaded' or 'Queued' status "
            "and pushes their IDs back into the processing channel. Additionally, document processing is wrapped in try-catch blocks: "
            "if an error occurs, the status transitions to 'Failed' with error logs without crashing the background worker."
        ),
        (
            "Q3: Walk me through your automated data cleaning and imputation pipeline.",
            "When a raw tabular dataset is ingested: 1) Deduplication: Removes exact duplicate rows using hash signatures. "
            "2) Type Profiling: Inferred schema classifies columns as Numeric, DateTime, Categorical, or Free Text. "
            "3) Missing Value Imputation: Numeric nulls are imputed with the column median (which is robust against extreme outliers), "
            "while categorical nulls become 'Unknown'. 4) Outlier Detection: Computes IQR = Q3 - Q1 and flags points outside [Q1 - 1.5*IQR, Q3 + 1.5*IQR]."
        ),
        (
            "Q4: How does your predictive forecasting algorithm work?",
            "We apply time-series regression extrapolation. We calculate the linear slope (m) and intercept (c) using least-squares regression "
            "(y = mx + c) and project values across future horizons (t+1, t+2, ...). We compute standard error of regression to construct "
            "95% confidence intervals (1.96 * SE), providing upper and lower bounds alongside the projected growth rate (Delta %)."
        ),
        (
            "Q5: What is the Pearson Correlation Matrix and why is it useful?",
            "The Pearson correlation coefficient measures linear relationships between continuous numeric variables between -1.0 (perfect negative) "
            "and +1.0 (perfect positive). The heatmap enables data analysts to immediately identify which factors drive business outcomes "
            "(e.g., strong positive correlation between AdSpend and Revenue, or negative correlation between SupportTickets and Retention)."
        ),
        (
            "Q6: How do you prevent hallucinations in the Document Chat Studio?",
            "We use grounded prompt engineering. The document's verified extracted text is injected directly into the LLM system prompt as reference "
            "ground truth. We enforce strict negative constraints: 'Answer strictly using only the provided document text. If not mentioned, state "
            "explicitly that the information is not present.' We set temperature low (0.1-0.2) to prioritize factual precision."
        ),
        (
            "Q7: What happens if external AI APIs (Gemini/OpenAI) fail or have no internet access?",
            "The system includes an offline heuristic NLP fallback engine. It uses regex patterns, token analysis, and statistical text heuristics "
            "to classify the document, extract monetary figures, dates, and contact info, and generate summaries completely offline."
        ),
        (
            "Q8: Why did you use .AsNoTracking() in Entity Framework Core?",
            "In read-only endpoints (such as fetching reports, listing documents, or calculating dashboard statistics), EF Core's change tracker is "
            "unnecessary. .AsNoTracking() bypasses identity resolution and snapshot tracking, significantly reducing memory allocations and improving query execution speed."
        ),
        (
            "Q9: How is authentication and authorization enforced across the frontend and backend?",
            "On the backend, ASP.NET Core JWT Bearer authentication validates token signature, issuer, audience, and expiration. Endpoints use "
            "[Authorize] and [Authorize(Roles = 'Admin')]. On the frontend, an Axios request interceptor attaches the JWT token from localStorage to "
            "headers, and a response interceptor automatically handles HTTP 401 by clearing sessions and redirecting to /login."
        ),
        (
            "Q10: How do you ensure high performance and scalability with large document uploads?",
            "We enforce file size constraints (25MB default), stream binary payloads directly to disk storage rather than loading large buffers in memory, "
            "and offload all heavy parsing to an asynchronous bounded queue with backpressure control."
        )
    ]

    for q_text, a_text in qa_list:
        qa_content = [
            [Paragraph(f"<b>{q_text}</b>", qa_q_style)],
            [Paragraph(a_text, qa_a_style)]
        ]
        qa_table = Table(qa_content, colWidths=[523])
        qa_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ('GRID', (0, 0), (-1, -1), 0.5, border_color),
            ('PADDING', (0, 0), (-1, -1), 5),
            ('LINELEFT', (0, 0), (-1, -1), 3, accent_color),
        ]))
        story.append(KeepTogether([qa_table, Spacer(1, 5)]))

    # 6. Live Interview Demo Checklist
    story.append(Spacer(1, 6))
    story.append(Paragraph("5. Live Interview Demonstration Checklist", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=accent_color, spaceBefore=1, spaceAfter=6))

    demo_steps = [
        "1. Open App at http://localhost:5173 and log in with admin@docintel.io / AdminPassword123!.",
        "2. Navigate to 'Data Analytics Studio' and click '1-Click Demo Sales Dataset'.",
        "3. Show the Data Health Score (100%), Feature Inferred Schema, and Automated Cleaning Log.",
        "4. Click 'Download Cleaned CSV' to demonstrate normalized dataset export.",
        "5. Show the Descriptive Statistics Table (Mean, StdDev, Skewness) and Pearson Correlation Heatmap.",
        "6. Show the Predictive Forecasting Chart highlighting the +3.3% upward growth trajectory with 95% Confidence Bands.",
        "7. Open the 'Documents Hub', view an extracted Invoice/Contract, and ask a question in the Live Chat Studio.",
        "8. Open http://localhost:5000/swagger to show clean RESTful API endpoint specifications."
    ]

    for step in demo_steps:
        story.append(Paragraph(f"&bull; <b>{step}</b>", bullet_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully generated at: {filename}")

if __name__ == "__main__":
    out_pdf = os.path.abspath("docs/AI_Document_Intelligence_and_Data_Analytics_Interview_Guide.pdf")
    build_pdf(out_pdf)

