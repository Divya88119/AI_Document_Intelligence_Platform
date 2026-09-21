using DocumentIntelligence.API.Models.DTOs;
using DocumentIntelligence.API.Services.Interfaces;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace DocumentIntelligence.API.Services;

public class AiIntelligenceService : IAiIntelligenceService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AiIntelligenceService> _logger;

    public AiIntelligenceService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<AiIntelligenceService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<DocumentAnalysisResult> AnalyzeDocumentAsync(
        string fileName,
        string rawText,
        CancellationToken cancellationToken = default)
    {
        var geminiKey = _configuration["AiSettings:GeminiApiKey"] ?? _configuration["Gemini:ApiKey"];
        var openAiKey = _configuration["AiSettings:OpenAiApiKey"] ?? _configuration["OpenAI:ApiKey"];

        if (!string.IsNullOrWhiteSpace(geminiKey))
        {
            try
            {
                var geminiResult = await AnalyzeWithGeminiAsync(geminiKey, fileName, rawText, cancellationToken);
                if (geminiResult != null) return geminiResult;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Gemini AI analysis failed. Falling back to built-in intelligence engine.");
            }
        }
        else if (!string.IsNullOrWhiteSpace(openAiKey))
        {
            try
            {
                var openAiResult = await AnalyzeWithOpenAiAsync(openAiKey, fileName, rawText, cancellationToken);
                if (openAiResult != null) return openAiResult;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "OpenAI analysis failed. Falling back to built-in intelligence engine.");
            }
        }

        // Built-in heuristic & statistical NLP engine
        return AnalyzeWithBuiltInEngine(fileName, rawText);
    }

    public async Task<string> AnswerQuestionAsync(
        string question,
        string documentText,
        IReadOnlyList<DocumentChatMessageDto>? chatHistory = null,
        CancellationToken cancellationToken = default)
    {
        var geminiKey = _configuration["AiSettings:GeminiApiKey"] ?? _configuration["Gemini:ApiKey"];
        var openAiKey = _configuration["AiSettings:OpenAiApiKey"] ?? _configuration["OpenAI:ApiKey"];

        if (!string.IsNullOrWhiteSpace(geminiKey))
        {
            try
            {
                var answer = await ChatWithGeminiAsync(geminiKey, question, documentText, chatHistory, cancellationToken);
                if (!string.IsNullOrWhiteSpace(answer)) return answer;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Gemini Q&A failed. Trying next provider.");
            }
        }

        if (!string.IsNullOrWhiteSpace(openAiKey))
        {
            try
            {
                var answer = await ChatWithOpenAiAsync(openAiKey, question, documentText, chatHistory, cancellationToken);
                if (!string.IsNullOrWhiteSpace(answer)) return answer;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "OpenAI Q&A failed. Falling back to built-in Q&A engine.");
            }
        }

        return AnswerWithBuiltInEngine(question, documentText);
    }

    private async Task<DocumentAnalysisResult?> AnalyzeWithGeminiAsync(
        string apiKey,
        string fileName,
        string rawText,
        CancellationToken cancellationToken)
    {
        var model = _configuration["AiSettings:GeminiModel"] ?? "gemini-1.5-flash";
        var client = _httpClientFactory.CreateClient();
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";

        var truncatedText = rawText.Length > 25000 ? rawText.Substring(0, 25000) : rawText;

        var prompt = $$"""
        You are an advanced Document Intelligence and Information Extraction AI.
        Analyze the following document named "{{fileName}}".

        Return ONLY a valid JSON object matching this schema:
        {
          "Category": "Invoice | Contract | Resume | Financial Report | Technical Spec | Identification | Form | Academic | General",
          "ConfidenceScore": 0.95,
          "ExecutiveSummary": "Detailed multi-sentence executive summary of the document.",
          "KeyHighlights": ["Highlight 1", "Highlight 2", "Highlight 3"],
          "KeyValues": {
             "Key1": "Value1",
             "Key2": "Value2"
          },
          "Entities": [
             {"Type": "Organization", "Value": "Company Name", "Description": "Role or context"},
             {"Type": "Person", "Value": "John Doe", "Description": "Signatory / Author"},
             {"Type": "Date", "Value": "2026-08-15", "Description": "Due Date"},
             {"Type": "Amount", "Value": "$5,000", "Description": "Total balance"}
          ],
          "ActionItems": ["Action item or obligation 1", "Action item 2"],
          "Language": "en"
        }

        Document Content:
        {{truncatedText}}
        """;

        var payload = new
        {
            contents = new[]
            {
                new
                {
                    parts = new[]
                    {
                        new { text = prompt }
                    }
                }
            },
            generationConfig = new
            {
                response_mime_type = "application/json",
                temperature = 0.2
            }
        };

        var response = await client.PostAsJsonAsync(url, payload, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning("Gemini API error: {Status} - {Body}", response.StatusCode, err);
            return null;
        }

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        using var doc = JsonDocument.Parse(json);
        var textResponse = doc.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString();

        if (string.IsNullOrWhiteSpace(textResponse)) return null;

        var parsed = JsonSerializer.Deserialize<DocumentAnalysisResult>(textResponse, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        if (parsed != null)
        {
            parsed.AiModelUsed = $"Gemini ({model})";
        }

        return parsed;
    }

    private async Task<DocumentAnalysisResult?> AnalyzeWithOpenAiAsync(
        string apiKey,
        string fileName,
        string rawText,
        CancellationToken cancellationToken)
    {
        var model = _configuration["AiSettings:OpenAiModel"] ?? "gpt-4o-mini";
        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

        var truncatedText = rawText.Length > 25000 ? rawText.Substring(0, 25000) : rawText;

        var prompt = $$"""
        Analyze the document named "{{fileName}}" and extract structured intelligence.
        Respond ONLY with a JSON object containing: Category, ConfidenceScore, ExecutiveSummary, KeyHighlights, KeyValues, Entities, ActionItems, Language.

        Document Content:
        {{truncatedText}}
        """;

        var payload = new
        {
            model = model,
            messages = new[]
            {
                new { role = "system", content = "You are a specialized document intelligence extraction API returning strictly JSON." },
                new { role = "user", content = prompt }
            },
            response_format = new { type = "json_object" },
            temperature = 0.2
        };

        var response = await client.PostAsJsonAsync("https://api.openai.com/v1/chat/completions", payload, cancellationToken);
        if (!response.IsSuccessStatusCode) return null;

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        using var doc = JsonDocument.Parse(json);
        var content = doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString();

        if (string.IsNullOrWhiteSpace(content)) return null;

        var parsed = JsonSerializer.Deserialize<DocumentAnalysisResult>(content, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        if (parsed != null)
        {
            parsed.AiModelUsed = $"OpenAI ({model})";
        }

        return parsed;
    }

    private async Task<string?> ChatWithGeminiAsync(
        string apiKey,
        string question,
        string documentText,
        IReadOnlyList<DocumentChatMessageDto>? chatHistory,
        CancellationToken cancellationToken)
    {
        var model = _configuration["AiSettings:GeminiModel"] ?? "gemini-1.5-flash";
        var client = _httpClientFactory.CreateClient();
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";

        var truncatedText = documentText.Length > 30000 ? documentText.Substring(0, 30000) : documentText;

        var historyContext = new StringBuilder();
        if (chatHistory != null && chatHistory.Count > 0)
        {
            historyContext.AppendLine("Previous conversation history:");
            foreach (var msg in chatHistory.TakeLast(5))
            {
                historyContext.AppendLine($"{msg.Role.ToUpperInvariant()}: {msg.Message}");
            }
            historyContext.AppendLine();
        }

        var systemPrompt = $"""
        You are an AI Document Assistant. You are answering user questions based strictly on the provided document.
        Be accurate, professional, and reference specific sections or facts from the text.
        If the answer cannot be found in the document, state that clearly.

        Document:
        {truncatedText}

        {historyContext}
        User Question: {question}
        """;

        var payload = new
        {
            contents = new[]
            {
                new { parts = new[] { new { text = systemPrompt } } }
            },
            generationConfig = new { temperature = 0.3 }
        };

        var response = await client.PostAsJsonAsync(url, payload, cancellationToken);
        if (!response.IsSuccessStatusCode) return null;

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        using var doc = JsonDocument.Parse(json);
        return doc.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString();
    }

    private async Task<string?> ChatWithOpenAiAsync(
        string apiKey,
        string question,
        string documentText,
        IReadOnlyList<DocumentChatMessageDto>? chatHistory,
        CancellationToken cancellationToken)
    {
        var model = _configuration["AiSettings:OpenAiModel"] ?? "gpt-4o-mini";
        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

        var truncatedText = documentText.Length > 30000 ? documentText.Substring(0, 30000) : documentText;

        var messages = new List<object>
        {
            new { role = "system", content = $"You are an expert document Q&A assistant. Answer questions strictly using this document context:\n\n{truncatedText}" }
        };

        if (chatHistory != null)
        {
            foreach (var h in chatHistory.TakeLast(5))
            {
                messages.Add(new { role = h.Role.ToLowerInvariant(), content = h.Message });
            }
        }

        messages.Add(new { role = "user", content = question });

        var payload = new
        {
            model = model,
            messages = messages,
            temperature = 0.3
        };

        var response = await client.PostAsJsonAsync("https://api.openai.com/v1/chat/completions", payload, cancellationToken);
        if (!response.IsSuccessStatusCode) return null;

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        using var doc = JsonDocument.Parse(json);
        return doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString();
    }

    // Built-in intelligent heuristic & NLP analyzer
    private DocumentAnalysisResult AnalyzeWithBuiltInEngine(string fileName, string rawText)
    {
        var textLower = rawText.ToLowerInvariant();
        var lines = rawText.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
                           .Select(l => l.Trim())
                           .Where(l => !string.IsNullOrWhiteSpace(l))
                           .ToList();

        // 1. Classification
        var category = "General Document";
        var confidence = 0.85;

        if (Regex.IsMatch(textLower, @"\b(invoice|subtotal|amount due|tax invoice|bill to|unit price|remit to)\b"))
        {
            category = "Invoice / Billing";
            confidence = 0.96;
        }
        else if (Regex.IsMatch(textLower, @"\b(resume|curriculum vitae|experience|education|skills|certifications|employment history)\b"))
        {
            category = "Resume / CV";
            confidence = 0.94;
        }
        else if (Regex.IsMatch(textLower, @"\b(agreement|contract|indemnity|confidentiality|terms and conditions|governing law|hereby agree)\b"))
        {
            category = "Legal Contract / NDA";
            confidence = 0.92;
        }
        else if (Regex.IsMatch(textLower, @"\b(balance sheet|income statement|cash flow|fiscal year|ebitda|quarterly report|revenue)\b"))
        {
            category = "Financial Report";
            confidence = 0.90;
        }
        else if (Regex.IsMatch(textLower, @"\b(api|architecture|specification|endpoint|controller|database schema|system design|requirement)\b"))
        {
            category = "Technical Specification";
            confidence = 0.93;
        }
        else if (Regex.IsMatch(textLower, @"\b(passport|identification|identity card|driver license|date of birth|ssn)\b"))
        {
            category = "Identification Document";
            confidence = 0.91;
        }

        // 2. Key-Values Extraction
        var keyValues = new Dictionary<string, string>();
        var entities = new List<ExtractedEntityDto>();

        // Extract Dates
        var dateMatches = Regex.Matches(rawText, @"\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4})\b", RegexOptions.IgnoreCase);
        var datesFound = new HashSet<string>();
        foreach (Match match in dateMatches)
        {
            if (datesFound.Add(match.Value) && datesFound.Count <= 5)
            {
                entities.Add(new ExtractedEntityDto { Type = "Date", Value = match.Value, Description = "Identified timestamp/date in document" });
            }
        }
        if (datesFound.Count > 0)
        {
            keyValues["Document Date"] = datesFound.First();
        }

        // Extract Amounts & Currency
        var amountMatches = Regex.Matches(rawText, @"(?:\$|€|£|₹|USD|EUR|INR)\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?");
        var amountsFound = new HashSet<string>();
        foreach (Match match in amountMatches)
        {
            if (amountsFound.Add(match.Value) && amountsFound.Count <= 5)
            {
                entities.Add(new ExtractedEntityDto { Type = "Financial Amount", Value = match.Value, Description = "Currency amount detected" });
            }
        }
        if (amountsFound.Count > 0)
        {
            keyValues["Primary Amount"] = amountsFound.First();
        }

        // Extract Emails
        var emailMatches = Regex.Matches(rawText, @"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b");
        var emailsFound = new HashSet<string>();
        foreach (Match match in emailMatches)
        {
            if (emailsFound.Add(match.Value) && emailsFound.Count <= 4)
            {
                entities.Add(new ExtractedEntityDto { Type = "Email", Value = match.Value, Description = "Contact email address" });
            }
        }
        if (emailsFound.Count > 0)
        {
            keyValues["Contact Email"] = string.Join(", ", emailsFound.Take(2));
        }

        // Extract Phone numbers
        var phoneMatches = Regex.Matches(rawText, @"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}");
        var phonesFound = new HashSet<string>();
        foreach (Match match in phoneMatches)
        {
            if (phonesFound.Add(match.Value) && phonesFound.Count <= 3)
            {
                entities.Add(new ExtractedEntityDto { Type = "Phone", Value = match.Value, Description = "Contact phone number" });
            }
        }

        // Extract Key Patterns based on category
        if (category.Contains("Invoice"))
        {
            var invNumMatch = Regex.Match(rawText, @"(?:invoice\s*(?:#|no|number|num)?[:\s]+)([A-Za-z0-9-_]+)", RegexOptions.IgnoreCase);
            if (invNumMatch.Success) keyValues["Invoice Number"] = invNumMatch.Groups[1].Value;

            var dueDateMatch = Regex.Match(rawText, @"(?:due\s*date[:\s]+)([^\r\n]+)", RegexOptions.IgnoreCase);
            if (dueDateMatch.Success) keyValues["Due Date"] = dueDateMatch.Groups[1].Value.Trim();
        }
        else if (category.Contains("Resume"))
        {
            if (lines.Count > 0)
            {
                keyValues["Candidate Name"] = lines[0];
                entities.Add(new ExtractedEntityDto { Type = "Person", Value = lines[0], Description = "Primary candidate / subject" });
            }
        }
        else if (category.Contains("Contract"))
        {
            var partiesMatch = Regex.Match(rawText, @"(?:between|by and between)\s+([^,.\r\n]+)\s+and\s+([^,.\r\n]+)", RegexOptions.IgnoreCase);
            if (partiesMatch.Success)
            {
                keyValues["Party 1"] = partiesMatch.Groups[1].Value.Trim();
                keyValues["Party 2"] = partiesMatch.Groups[2].Value.Trim();
                entities.Add(new ExtractedEntityDto { Type = "Organization", Value = partiesMatch.Groups[1].Value.Trim(), Description = "Contracting Party" });
                entities.Add(new ExtractedEntityDto { Type = "Organization", Value = partiesMatch.Groups[2].Value.Trim(), Description = "Contracting Party" });
            }
        }

        // 3. Highlights & Executive Summary
        var keyHighlights = new List<string>();
        var sampleParagraphs = lines.Where(l => l.Length > 25).Take(6).ToList();

        if (sampleParagraphs.Count > 0)
        {
            keyHighlights.AddRange(sampleParagraphs.Take(4));
        }
        else
        {
            keyHighlights.Add($"Document '{fileName}' successfully ingested and indexed.");
            keyHighlights.Add($"Identified category: {category} with {confidence * 100:0.#}% confidence.");
            keyHighlights.Add($"Total lines extracted: {lines.Count}, Entities detected: {entities.Count}.");
        }

        var summary = $"This document is classified as a {category} (Confidence: {confidence * 100:0.#}%). " +
                      $"It contains {lines.Count} content lines and {rawText.Length} characters. " +
                      $"Key metadata includes {entities.Count} recognized entities (dates, monetary amounts, and contact details). " +
                      $"The document is indexed and ready for semantic search, key-value queries, and AI Q&A.";

        var actionItems = new List<string>();
        if (category.Contains("Invoice"))
        {
            actionItems.Add("Verify billing amount and line items against purchase orders.");
            actionItems.Add("Schedule invoice payment prior to the specified due date.");
        }
        else if (category.Contains("Contract"))
        {
            actionItems.Add("Review liability, termination clauses, and indemnity terms with legal.");
            actionItems.Add("Ensure all required stakeholder signatures are collected.");
        }
        else if (category.Contains("Resume"))
        {
            actionItems.Add("Review candidate qualifications and schedule preliminary technical screening.");
        }
        else
        {
            actionItems.Add("Archive document in document intelligence repository.");
            actionItems.Add("Validate extracted key attributes.");
        }

        return new DocumentAnalysisResult
        {
            Category = category,
            ConfidenceScore = confidence,
            ExecutiveSummary = summary,
            KeyHighlights = keyHighlights,
            KeyValues = keyValues,
            Entities = entities,
            ActionItems = actionItems,
            Language = "en",
            AiModelUsed = "Built-in Intelligence Engine"
        };
    }

    private string AnswerWithBuiltInEngine(string question, string documentText)
    {
        if (string.IsNullOrWhiteSpace(documentText))
        {
            return "No extracted document text is available yet. Please make sure document processing is completed.";
        }

        var qLower = question.ToLowerInvariant();

        // 1. Check for Summary / Overview intent
        if (qLower.Contains("what is this") || qLower.Contains("about") || qLower.Contains("summar") ||
            qLower.Contains("overview") || qLower.Contains("explain") || qLower.Contains("main point"))
        {
            var lines = documentText.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
                                    .Select(l => l.Trim())
                                    .Where(l => l.Length > 20)
                                    .Take(4)
                                    .ToList();

            var sbSummary = new StringBuilder();
            sbSummary.AppendLine($"### 📄 Document Overview\n");
            if (lines.Count > 0)
            {
                foreach (var line in lines)
                {
                    sbSummary.AppendLine($"- {line}");
                }
            }
            else
            {
                var preview = documentText.Length > 300 ? documentText.Substring(0, 300) + "..." : documentText;
                sbSummary.AppendLine(preview);
            }
            sbSummary.AppendLine("\nYou can also ask me specific questions about figures, key parties, contractual terms, or dates!");
            return sbSummary.ToString();
        }

        // 2. Check for Financial / Monetary intent
        if (qLower.Contains("amount") || qLower.Contains("cost") || qLower.Contains("total") ||
            qLower.Contains("price") || qLower.Contains("fee") || qLower.Contains("dollar") || qLower.Contains("pay"))
        {
            var moneyMatches = Regex.Matches(documentText, @"[^\r\n]*?(?:\$|€|£|₹|USD|EUR|INR|\b(?:total|amount|due|subtotal|balance|cost)\b)[^\r\n]*", RegexOptions.IgnoreCase);
            var moneyLines = moneyMatches.Cast<Match>()
                                         .Select(m => m.Value.Trim())
                                         .Where(v => v.Length > 10 && v.Length < 250)
                                         .Distinct()
                                         .Take(4)
                                         .ToList();

            if (moneyLines.Count > 0)
            {
                var sbMoney = new StringBuilder();
                sbMoney.AppendLine("### 💰 Financial & Monetary Insights\n");
                foreach (var ml in moneyLines)
                {
                    sbMoney.AppendLine($"- **{ml}**");
                }
                return sbMoney.ToString();
            }
        }

        // 3. General Semantic & Keyword Extraction
        var qTerms = qLower.Split(new[] { ' ', '?', '!', ',', '.', ';', ':', '-', '(', ')', '[', ']' }, StringSplitOptions.RemoveEmptyEntries)
                           .Where(t => t.Length > 2 && !IsStopWord(t))
                           .ToList();

        var sentences = documentText.Split(new[] { '.', '\n', '\r', '?' }, StringSplitOptions.RemoveEmptyEntries)
                                    .Select(s => s.Trim())
                                    .Where(s => s.Length > 15)
                                    .ToList();

        var scored = new List<(string Sentence, int Score)>();

        foreach (var sentence in sentences)
        {
            var sLower = sentence.ToLowerInvariant();
            var score = 0;

            foreach (var term in qTerms)
            {
                if (sLower.Contains(term))
                {
                    score += 3;
                }
            }

            if (score > 0)
            {
                scored.Add((sentence, score));
            }
        }

        var topMatches = scored.OrderByDescending(x => x.Score).Take(3).Select(x => x.Sentence).ToList();

        if (topMatches.Count == 0)
        {
            var firstLines = documentText.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
                                         .Select(l => l.Trim())
                                         .Where(l => l.Length > 25)
                                         .Take(2)
                                         .ToList();

            var fallbackSb = new StringBuilder();
            fallbackSb.AppendLine($"I couldn't find a direct exact keyword match for **\"{question}\"** in this document. Here is key context from the document:\n");
            foreach (var fl in firstLines)
            {
                fallbackSb.AppendLine($"> \"{fl}\"\n");
            }
            fallbackSb.AppendLine("Feel free to ask about key highlights, financial amounts, names, or general summaries!");
            return fallbackSb.ToString();
        }

        var sb = new StringBuilder();
        sb.AppendLine($"Based on the document for **\"{question}\"**:\n");
        foreach (var match in topMatches)
        {
            sb.AppendLine($"> \"{match}\"\n");
        }

        return sb.ToString();
    }

    private static bool IsStopWord(string word)
    {
        var stopWords = new HashSet<string>
        {
            "what", "when", "where", "which", "who", "whom", "whose", "why", "how",
            "this", "that", "these", "those", "is", "are", "was", "were", "be", "been",
            "being", "have", "has", "had", "does", "did", "the", "and", "but", "for",
            "with", "about", "into", "through", "during", "before", "after", "above",
            "below", "from", "down", "in", "out", "on", "off", "over", "under", "again"
        };
        return stopWords.Contains(word);
    }
}

