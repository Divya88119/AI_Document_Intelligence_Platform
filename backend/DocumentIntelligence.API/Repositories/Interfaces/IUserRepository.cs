using DocumentIntelligence.API.Models.Entities;

namespace DocumentIntelligence.API.Repositories.Interfaces;

public interface IUserRepository
{
    Task<IReadOnlyList<User>> GetActiveUsersAsync();
    Task<User?> GetActiveUserByIdAsync(int id);
    Task<User?> GetActiveUserByEmailAsync(string email);
    Task<bool> ActiveEmailExistsAsync(string email, int? excludedUserId = null);
    void Add(User user);
    Task SaveChangesAsync();
}
