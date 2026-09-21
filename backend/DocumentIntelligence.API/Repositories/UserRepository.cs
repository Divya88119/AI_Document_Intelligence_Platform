using DocumentIntelligence.API.Data;
using DocumentIntelligence.API.Models.Entities;
using DocumentIntelligence.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DocumentIntelligence.API.Repositories;

public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;

    public UserRepository(ApplicationDbContext context) => _context = context;

    public async Task<IReadOnlyList<User>> GetActiveUsersAsync() => await _context.Users
        .AsNoTracking()
        .Where(user => !user.IsDeleted)
        .ToListAsync();

    public Task<User?> GetActiveUserByIdAsync(int id) => _context.Users
        .FirstOrDefaultAsync(user => user.Id == id && !user.IsDeleted);

    public Task<User?> GetActiveUserByEmailAsync(string email)
    {
        var normalizedEmail = email.Trim().ToLower();
        return _context.Users
            .FirstOrDefaultAsync(user => user.Email.ToLower() == normalizedEmail && user.IsActive && !user.IsDeleted);
    }

    public Task<bool> ActiveEmailExistsAsync(string email, int? excludedUserId = null)
    {
        var normalizedEmail = email.Trim().ToLower();
        return _context.Users.AnyAsync(user =>
            user.Email.ToLower() == normalizedEmail &&
            !user.IsDeleted &&
            (!excludedUserId.HasValue || user.Id != excludedUserId.Value));
    }

    public void Add(User user) => _context.Users.Add(user);

    public Task SaveChangesAsync() => _context.SaveChangesAsync();
}
