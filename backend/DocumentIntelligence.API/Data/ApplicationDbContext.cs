using DocumentIntelligence.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace DocumentIntelligence.API.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }

    public DbSet<DocumentRecord> Documents { get; set; }

    public DbSet<DocumentExtractedContent> DocumentExtractedContents { get; set; }

    public DbSet<DocumentInsight> DocumentInsights { get; set; }

    public DbSet<DocumentChatMessage> DocumentChatMessages { get; set; }

    public DbSet<DataAnalysisReport> DataAnalysisReports { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<DataAnalysisReport>(entity =>
        {
            entity.HasOne(r => r.CreatedByUser)
                .WithMany()
                .HasForeignKey(r => r.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(r => r.Document)
                .WithMany()
                .HasForeignKey(r => r.DocumentId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<DocumentRecord>(entity =>
        {
            entity.Property(document => document.ProcessingStatus)
                .HasConversion<string>();

            entity.HasIndex(document => document.UploadedByUserId);

            entity.HasOne(document => document.UploadedByUser)
                .WithMany(user => user.UploadedDocuments)
                .HasForeignKey(document => document.UploadedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(document => document.ExtractedContent)
                .WithOne(content => content.Document)
                .HasForeignKey<DocumentExtractedContent>(content => content.DocumentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(document => document.Insight)
                .WithOne(insight => insight.Document)
                .HasForeignKey<DocumentInsight>(insight => insight.DocumentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(document => document.ChatMessages)
                .WithOne(chat => chat.Document)
                .HasForeignKey(chat => chat.DocumentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DocumentChatMessage>(entity =>
        {
            entity.HasOne(chat => chat.User)
                .WithMany()
                .HasForeignKey(chat => chat.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
