IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [Users] (
    [Id] int NOT NULL IDENTITY,
    [FullName] nvarchar(max) NOT NULL,
    [Email] nvarchar(max) NOT NULL,
    [PasswordHash] nvarchar(max) NOT NULL,
    [Role] nvarchar(max) NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260817092521_InitialCreate', N'8.0.30');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [Users] ADD [CreatedByUserId] int NULL;
GO

ALTER TABLE [Users] ADD [DeletedAt] datetime2 NULL;
GO

ALTER TABLE [Users] ADD [DeletedByUserId] int NULL;
GO

ALTER TABLE [Users] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
GO

ALTER TABLE [Users] ADD [UpdatedAt] datetime2 NULL;
GO

ALTER TABLE [Users] ADD [UpdatedByUserId] int NULL;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260819084223_AddUserAuditFields', N'8.0.30');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260819085011_AddUserAuditFields_add', N'8.0.30');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [Documents] (
    [Id] int NOT NULL IDENTITY,
    [OriginalFileName] nvarchar(max) NOT NULL,
    [StoredFileName] nvarchar(max) NOT NULL,
    [ContentType] nvarchar(max) NOT NULL,
    [FileSizeBytes] bigint NOT NULL,
    [StoragePath] nvarchar(max) NOT NULL,
    [ProcessingStatus] nvarchar(max) NOT NULL,
    [UploadedAt] datetime2 NOT NULL,
    [UploadedByUserId] int NOT NULL,
    CONSTRAINT [PK_Documents] PRIMARY KEY ([Id])
);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260831080707_AddDocumentUpload', N'8.0.30');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

CREATE INDEX [IX_Documents_UploadedByUserId] ON [Documents] ([UploadedByUserId]);
GO

ALTER TABLE [Documents] ADD CONSTRAINT [FK_Documents_Users_UploadedByUserId] FOREIGN KEY ([UploadedByUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260831080900_AddDocumentUploaderRelationship', N'8.0.30');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [DocumentChatMessages] (
    [Id] int NOT NULL IDENTITY,
    [DocumentId] int NOT NULL,
    [UserId] int NOT NULL,
    [Role] nvarchar(max) NOT NULL,
    [Message] nvarchar(max) NOT NULL,
    [Timestamp] datetime2 NOT NULL,
    CONSTRAINT [PK_DocumentChatMessages] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_DocumentChatMessages_Documents_DocumentId] FOREIGN KEY ([DocumentId]) REFERENCES [Documents] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_DocumentChatMessages_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);
GO

CREATE TABLE [DocumentExtractedContents] (
    [Id] int NOT NULL IDENTITY,
    [DocumentId] int NOT NULL,
    [RawText] nvarchar(max) NOT NULL,
    [PageCount] int NOT NULL,
    [WordCount] int NOT NULL,
    [ExtractedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_DocumentExtractedContents] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_DocumentExtractedContents_Documents_DocumentId] FOREIGN KEY ([DocumentId]) REFERENCES [Documents] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [DocumentInsights] (
    [Id] int NOT NULL IDENTITY,
    [DocumentId] int NOT NULL,
    [Category] nvarchar(max) NOT NULL,
    [ConfidenceScore] float NOT NULL,
    [ExecutiveSummary] nvarchar(max) NOT NULL,
    [KeyHighlightsJson] nvarchar(max) NOT NULL,
    [KeyValuesJson] nvarchar(max) NOT NULL,
    [EntitiesJson] nvarchar(max) NOT NULL,
    [ActionItemsJson] nvarchar(max) NOT NULL,
    [Language] nvarchar(max) NOT NULL,
    [AiModelUsed] nvarchar(max) NOT NULL,
    [ProcessedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_DocumentInsights] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_DocumentInsights_Documents_DocumentId] FOREIGN KEY ([DocumentId]) REFERENCES [Documents] ([Id]) ON DELETE CASCADE
);
GO

CREATE INDEX [IX_DocumentChatMessages_DocumentId] ON [DocumentChatMessages] ([DocumentId]);
GO

CREATE INDEX [IX_DocumentChatMessages_UserId] ON [DocumentChatMessages] ([UserId]);
GO

CREATE UNIQUE INDEX [IX_DocumentExtractedContents_DocumentId] ON [DocumentExtractedContents] ([DocumentId]);
GO

CREATE UNIQUE INDEX [IX_DocumentInsights_DocumentId] ON [DocumentInsights] ([DocumentId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260901092102_AddDocumentIntelligenceAndChatEntities', N'8.0.30');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [DataAnalysisReports] (
    [Id] int NOT NULL IDENTITY,
    [DatasetName] nvarchar(max) NOT NULL,
    [DocumentId] int NULL,
    [CreatedByUserId] int NOT NULL,
    [TotalRows] int NOT NULL,
    [TotalColumns] int NOT NULL,
    [DataHealthScore] float NOT NULL,
    [ColumnProfilesJson] nvarchar(max) NOT NULL,
    [QualityAuditJson] nvarchar(max) NOT NULL,
    [CleaningLogJson] nvarchar(max) NOT NULL,
    [CleanedCsvData] nvarchar(max) NOT NULL,
    [DescriptiveStatsJson] nvarchar(max) NOT NULL,
    [CorrelationMatrixJson] nvarchar(max) NOT NULL,
    [VisualReportsJson] nvarchar(max) NOT NULL,
    [PredictiveForecastsJson] nvarchar(max) NOT NULL,
    [AiExecutiveSummary] nvarchar(max) NOT NULL,
    [AiKeyDriversJson] nvarchar(max) NOT NULL,
    [AiRecommendationsJson] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_DataAnalysisReports] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_DataAnalysisReports_Documents_DocumentId] FOREIGN KEY ([DocumentId]) REFERENCES [Documents] ([Id]) ON DELETE SET NULL,
    CONSTRAINT [FK_DataAnalysisReports_Users_CreatedByUserId] FOREIGN KEY ([CreatedByUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);
GO

CREATE INDEX [IX_DataAnalysisReports_CreatedByUserId] ON [DataAnalysisReports] ([CreatedByUserId]);
GO

CREATE INDEX [IX_DataAnalysisReports_DocumentId] ON [DataAnalysisReports] ([DocumentId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260908070301_AddDataAnalysisReportEntity', N'8.0.30');
GO

COMMIT;
GO

