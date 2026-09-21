using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DocumentIntelligence.API.Migrations
{
    /// <inheritdoc />
    public partial class AddDataAnalysisReportEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DataAnalysisReports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DatasetName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DocumentId = table.Column<int>(type: "int", nullable: true),
                    CreatedByUserId = table.Column<int>(type: "int", nullable: false),
                    TotalRows = table.Column<int>(type: "int", nullable: false),
                    TotalColumns = table.Column<int>(type: "int", nullable: false),
                    DataHealthScore = table.Column<double>(type: "float", nullable: false),
                    ColumnProfilesJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    QualityAuditJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CleaningLogJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CleanedCsvData = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DescriptiveStatsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CorrelationMatrixJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    VisualReportsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PredictiveForecastsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AiExecutiveSummary = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AiKeyDriversJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AiRecommendationsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DataAnalysisReports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DataAnalysisReports_Documents_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "Documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_DataAnalysisReports_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DataAnalysisReports_CreatedByUserId",
                table: "DataAnalysisReports",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_DataAnalysisReports_DocumentId",
                table: "DataAnalysisReports",
                column: "DocumentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DataAnalysisReports");
        }
    }
}
