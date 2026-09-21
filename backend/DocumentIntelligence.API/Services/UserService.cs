using DocumentIntelligence.API.Authorization;
using DocumentIntelligence.API.Models.DTOs;
using DocumentIntelligence.API.Models.Entities;
using DocumentIntelligence.API.Repositories.Interfaces;
using DocumentIntelligence.API.Services.Interfaces;

namespace DocumentIntelligence.API.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly TokenService _tokenService;
    private readonly IConfiguration _configuration;

    public UserService(IUserRepository userRepository, TokenService tokenService, IConfiguration configuration)
    {
        _userRepository = userRepository;
        _tokenService = tokenService;
        _configuration = configuration;
    }

    public async Task<IReadOnlyList<UserResponseDto>> GetUsersAsync()
    {
        var users = await _userRepository.GetActiveUsersAsync();
        return users.Select(MapToResponse).ToList();
    }

    public async Task<UserResponseDto?> GetUserByIdAsync(int id)
    {
        var user = await _userRepository.GetActiveUserByIdAsync(id);
        return user is null ? null : MapToResponse(user);
    }

    public async Task<UserOperationResult<UserResponseDto>> CreateUserAsync(CreateUserDto createUserDto, int currentUserId)
    {
        if (await _userRepository.ActiveEmailExistsAsync(createUserDto.Email))
        {
            return UserOperationResult<UserResponseDto>.DuplicateEmail();
        }

        var user = new User
        {
            FullName = createUserDto.FullName,
            Email = createUserDto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(createUserDto.Password),
            Role = ApplicationRoles.User,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedByUserId = currentUserId,
            IsDeleted = false
        };

        _userRepository.Add(user);
        await _userRepository.SaveChangesAsync();

        return UserOperationResult<UserResponseDto>.Success(MapToResponse(user));
    }

    public async Task<UserOperationResult<UserResponseDto>> UpdateUserAsync(
        int id,
        UpdateUserDto updateUserDto,
        int currentUserId)
    {
        var user = await _userRepository.GetActiveUserByIdAsync(id);
        if (user is null)
        {
            return UserOperationResult<UserResponseDto>.NotFound();
        }

        if (await _userRepository.ActiveEmailExistsAsync(updateUserDto.Email, id))
        {
            return UserOperationResult<UserResponseDto>.DuplicateEmail();
        }

        user.FullName = updateUserDto.FullName;
        user.Email = updateUserDto.Email;
        user.IsActive = updateUserDto.IsActive;
        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedByUserId = currentUserId;

        await _userRepository.SaveChangesAsync();

        return UserOperationResult<UserResponseDto>.Success(MapToResponse(user));
    }

    public async Task<UserOperationResult> DeleteUserAsync(int id, int currentUserId)
    {
        var user = await _userRepository.GetActiveUserByIdAsync(id);
        if (user is null)
        {
            return UserOperationResult.NotFoundResult();
        }

        user.IsDeleted = true;
        user.IsActive = false;
        user.DeletedAt = DateTime.UtcNow;
        user.DeletedByUserId = currentUserId;

        await _userRepository.SaveChangesAsync();

        return UserOperationResult.Success();
    }

    public async Task<LoginResponseDto?> LoginAsync(LoginDto loginDto)
    {
        var user = await _userRepository.GetActiveUserByEmailAsync(loginDto.Email);
        if (user is null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
        {
            return null;
        }

        var expiryMinutes = Convert.ToDouble(_configuration["Jwt:ExpiryMinutes"]);

        return new LoginResponseDto
        {
            Token = _tokenService.CreateToken(user),
            Expiration = DateTime.UtcNow.AddMinutes(expiryMinutes),
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role
        };
    }

    private static UserResponseDto MapToResponse(User user) => new()
    {
        Id = user.Id,
        FullName = user.FullName,
        Email = user.Email,
        Role = user.Role,
        IsActive = user.IsActive,
        CreatedAt = user.CreatedAt,
        CreatedByUserId = user.CreatedByUserId,
        UpdatedAt = user.UpdatedAt,
        UpdatedByUserId = user.UpdatedByUserId
    };
}
