using DocumentIntelligence.API.Models.DTOs;

namespace DocumentIntelligence.API.Services.Interfaces;

public interface IUserService
{
    Task<IReadOnlyList<UserResponseDto>> GetUsersAsync();
    Task<UserResponseDto?> GetUserByIdAsync(int id);
    Task<UserOperationResult<UserResponseDto>> CreateUserAsync(CreateUserDto createUserDto, int currentUserId);
    Task<UserOperationResult<UserResponseDto>> UpdateUserAsync(int id, UpdateUserDto updateUserDto, int currentUserId);
    Task<UserOperationResult> DeleteUserAsync(int id, int currentUserId);
    Task<LoginResponseDto?> LoginAsync(LoginDto loginDto);
}
