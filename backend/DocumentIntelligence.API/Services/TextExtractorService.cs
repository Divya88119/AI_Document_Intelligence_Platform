using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;
using DocumentIntelligence.API.Services.Interfaces;
using System.Text;
using UglyToad.PdfPig;

namespace DocumentIntelligence.API.Services;

public class TextExtractorService : ITextExtractorService
{
    private readonly ILogger<TextExtractorService> _logger;

    public TextExtractorService(ILogger<TextExtractorService> logger)
    {
        _logger = logger;
    }

    public async Task<ExtractedDocumentContentResult> ExtractTextAsync(
        string filePath,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        if (!File.Exists(filePath))
        {
            return new ExtractedDocumentContentResult
            {
                Succeeded = false,
                ErrorMessage = $"File not found at path: {filePath}"
            };
        }

        var extension = Path.GetExtension(filePath).ToLowerInvariant();

        try
        {
            return extension switch
            {
                ".pdf" => ExtractFromPdf(filePath),
                ".docx" => ExtractFromDocx(filePath),
                ".xlsx" => ExtractFromXlsx(filePath),
                ".txt" or ".csv" or ".json" => await ExtractFromPlainTextAsync(filePath, cancellationToken),
                ".jpg" or ".jpeg" or ".png" => ExtractFromImage(filePath),
                _ => await ExtractFromPlainTextAsync(filePath, cancellationToken)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to extract text from file: {FilePath}", filePath);
            return new ExtractedDocumentContentResult
            {
                Succeeded = false,
                ErrorMessage = $"Extraction error: {ex.Message}",
                RawText = $"[Error reading file contents: {ex.Message}]",
                PageCount = 1,
                WordCount = 0
            };
        }
    }

    private ExtractedDocumentContentResult ExtractFromPdf(string filePath)
    {
        var sb = new StringBuilder();
        var pageCount = 0;

        using (var document = PdfDocument.Open(filePath))
        {
            pageCount = document.NumberOfPages;
            for (var i = 1; i <= pageCount; i++)
            {
                var page = document.GetPage(i);
                var pageText = page.Text;
                if (!string.IsNullOrWhiteSpace(pageText))
                {
                    sb.AppendLine($"--- Page {i} ---");
                    sb.AppendLine(pageText.Trim());
                    sb.AppendLine();
                }
            }
        }

        var fullText = sb.ToString().Trim();
        return new ExtractedDocumentContentResult
        {
            Succeeded = true,
            RawText = fullText,
            PageCount = Math.Max(1, pageCount),
            WordCount = CountWords(fullText)
        };
    }

    private ExtractedDocumentContentResult ExtractFromDocx(string filePath)
    {
        var sb = new StringBuilder();
        using (var wordDocument = WordprocessingDocument.Open(filePath, false))
        {
            var body = wordDocument.MainDocumentPart?.Document?.Body;
            if (body != null)
            {
                foreach (var paragraph in body.Descendants<DocumentFormat.OpenXml.Wordprocessing.Paragraph>())
                {
                    var text = paragraph.InnerText;
                    if (!string.IsNullOrWhiteSpace(text))
                    {
                        sb.AppendLine(text);
                    }
                }
            }
        }

        var fullText = sb.ToString().Trim();
        return new ExtractedDocumentContentResult
        {
            Succeeded = true,
            RawText = fullText,
            PageCount = 1,
            WordCount = CountWords(fullText)
        };
    }

    private ExtractedDocumentContentResult ExtractFromXlsx(string filePath)
    {
        var sb = new StringBuilder();
        using (var spreadsheetDocument = SpreadsheetDocument.Open(filePath, false))
        {
            var workbookPart = spreadsheetDocument.WorkbookPart;
            if (workbookPart != null)
            {
                var sharedStringTable = workbookPart.SharedStringTablePart?.SharedStringTable;

                foreach (var sheet in workbookPart.Workbook.Sheets?.Cast<Sheet>() ?? Enumerable.Empty<Sheet>())
                {
                    sb.AppendLine($"--- Sheet: {sheet.Name} ---");
                    if (sheet.Id?.Value != null)
                    {
                        var worksheetPart = (WorksheetPart)workbookPart.GetPartById(sheet.Id.Value);
                        var sheetData = worksheetPart.Worksheet.Elements<SheetData>().FirstOrDefault();

                        if (sheetData != null)
                        {
                            foreach (var row in sheetData.Elements<Row>())
                            {
                                var cellValues = new List<string>();
                                foreach (var cell in row.Elements<Cell>())
                                {
                                    var cellText = GetCellValue(cell, sharedStringTable);
                                    if (!string.IsNullOrWhiteSpace(cellText))
                                    {
                                        cellValues.Add(cellText);
                                    }
                                }
                                if (cellValues.Count > 0)
                                {
                                    sb.AppendLine(string.Join(" | ", cellValues));
                                }
                            }
                        }
                    }
                    sb.AppendLine();
                }
            }
        }

        var fullText = sb.ToString().Trim();
        return new ExtractedDocumentContentResult
        {
            Succeeded = true,
            RawText = fullText,
            PageCount = 1,
            WordCount = CountWords(fullText)
        };
    }

    private async Task<ExtractedDocumentContentResult> ExtractFromPlainTextAsync(
        string filePath,
        CancellationToken cancellationToken)
    {
        var text = await File.ReadAllTextAsync(filePath, Encoding.UTF8, cancellationToken);
        return new ExtractedDocumentContentResult
        {
            Succeeded = true,
            RawText = text,
            PageCount = 1,
            WordCount = CountWords(text)
        };
    }

    private ExtractedDocumentContentResult ExtractFromImage(string filePath)
    {
        var fileInfo = new FileInfo(filePath);
        var message = $"[Image Document: {fileInfo.Name} ({fileInfo.Length / 1024} KB)]";
        return new ExtractedDocumentContentResult
        {
            Succeeded = true,
            RawText = message,
            PageCount = 1,
            WordCount = CountWords(message)
        };
    }

    private static string GetCellValue(Cell cell, SharedStringTable? sharedStringTable)
    {
        if (cell.CellValue == null) return string.Empty;
        var value = cell.CellValue.Text;

        if (cell.DataType != null && cell.DataType.Value == CellValues.SharedString && sharedStringTable != null)
        {
            if (int.TryParse(value, out var id))
            {
                var item = sharedStringTable.Elements<SharedStringItem>().ElementAtOrDefault(id);
                return item?.InnerText ?? value;
            }
        }

        return value;
    }

    private static int CountWords(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return 0;
        return text.Split(new[] { ' ', '\r', '\n', '\t' }, StringSplitOptions.RemoveEmptyEntries).Length;
    }
}

