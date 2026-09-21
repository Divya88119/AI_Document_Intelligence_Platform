using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DocumentIntelligence.API.Migrations
{
    /// <inheritdoc />
    public partial class AddDataAnalysisVersioningAndAudit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CurrentVersion",
                table: "DataAnalysisReports",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DetailedAuditLogJson",
                table: "DataAnalysisReports",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RawCsvData",
                table: "DataAnalysisReports",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "VersionHistoryJson",
                table: "DataAnalysisReports",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CurrentVersion",
                table: "DataAnalysisReports");

            migrationBuilder.DropColumn(
                name: "DetailedAuditLogJson",
                table: "DataAnalysisReports");

            migrationBuilder.DropColumn(
                name: "RawCsvData",
                table: "DataAnalysisReports");

            migrationBuilder.DropColumn(
                name: "VersionHistoryJson",
                table: "DataAnalysisReports");
        }
    }
}
