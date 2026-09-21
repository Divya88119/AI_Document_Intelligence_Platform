using DocumentIntelligence.API.Authorization;
using DocumentIntelligence.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace DocumentIntelligence.API.Data;

public static class InitialAdminSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();

        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<ApplicationDbContext>>();

        try
        {
            // Automatically apply any pending EF Core database migrations
            await context.Database.MigrateAsync();
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Database migration on startup encountered an issue.");
        }

        var name = configuration["InitialAdmin:FullName"] ?? "System Administrator";
        var email = configuration["InitialAdmin:Email"] ?? "admin@docintel.io";
        var password = configuration["InitialAdmin:Password"] ?? "AdminPassword123!";

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            return;
        }

        try
        {
            var existingUser = await context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());

            if (existingUser != null)
            {
                // Always sync the configured admin password, role, and active status
                existingUser.FullName = name;
                existingUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
                existingUser.Role = ApplicationRoles.Admin;
                existingUser.IsActive = true;
                existingUser.IsDeleted = false;
                existingUser.UpdatedAt = DateTime.UtcNow;

                await context.SaveChangesAsync();
                logger.LogInformation("Admin account updated and credentials synced for {Email}.", email);
            }
            else
            {
                // Create initial administrator
                context.Users.Add(new User
                {
                    FullName = name,
                    Email = email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                    Role = ApplicationRoles.Admin,
                    IsActive = true,
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow
                });

                await context.SaveChangesAsync();
                logger.LogInformation("Initial administrator account created for {Email}.", email);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to seed or sync initial admin account.");
        }
    }
}
