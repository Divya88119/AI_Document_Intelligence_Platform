using DocumentIntelligence.API.Authorization;
using DocumentIntelligence.API.Models.DTOs;
using DocumentIntelligence.API.Services;
using DocumentIntelligence.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DocumentIntelligence.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    [Authorize(Roles = ApplicationRoles.Admin)]
    public async Task<ActionResult<IReadOnlyList<UserResponseDto>>> GetUsers()
    {
        return Ok(await _userService.GetUsersAsync());
    }

    [HttpGet("{id}")]
    [Authorize(Roles = ApplicationRoles.Admin)]
    public async Task<ActionResult<UserResponseDto>> GetUser(int id)
    {
        var user = await _userService.GetUserByIdAsync(id);

        return user is null
            ? Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "User not found.",
                detail: $"User with ID {id} was not found.")
            : Ok(user);
    }

    [HttpPost]
    [Authorize(Roles = ApplicationRoles.Admin)]
    public async Task<ActionResult<UserResponseDto>> CreateUser(CreateUserDto createUserDto)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId is null)
        {
            return Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Authentication failed.",
                detail: "The authenticated user ID is missing or invalid.");
        }

        var result = await _userService.CreateUserAsync(createUserDto, currentUserId.Value);

        if (result.Status == UserOperationStatus.DuplicateEmail)
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Duplicate email address.",
                detail: "A user with this email already exists.");
        }

        return CreatedAtAction(nameof(GetUser), new { id = result.Value!.Id }, result.Value);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = ApplicationRoles.Admin)]
    public async Task<ActionResult<UserResponseDto>> UpdateUser(int id, UpdateUserDto updateUserDto)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId is null)
        {
            return Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Authentication failed.",
                detail: "The authenticated user ID is missing or invalid.");
        }

        var result = await _userService.UpdateUserAsync(id, updateUserDto, currentUserId.Value);

        return result.Status switch
        {
            UserOperationStatus.NotFound => Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "User not found.",
                detail: $"User with ID {id} was not found."),
            UserOperationStatus.DuplicateEmail => Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Duplicate email address.",
                detail: "Another user with this email already exists."),
            _ => Ok(result.Value)
        };
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = ApplicationRoles.Admin)]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId is null)
        {
            return Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Authentication failed.",
                detail: "The authenticated user ID is missing or invalid.");
        }

        var result = await _userService.DeleteUserAsync(id, currentUserId.Value);

        return result.Status == UserOperationStatus.NotFound
            ? Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "User not found.",
                detail: $"User with ID {id} was not found.")
            : NoContent();
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDto>> Login(LoginDto loginDto)
    {
        var response = await _userService.LoginAsync(loginDto);

        return response is null
            ? Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Login failed.",
                detail: "Invalid email or password.")
            : Ok(response);
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
