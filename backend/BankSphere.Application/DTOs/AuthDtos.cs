namespace BankSphere.Application.DTOs;

public record RegisterRequestDto(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string PhoneNumber,
    string Address,
    string City,
    string Country,
    DateTime DateOfBirth,
    string? Role = "Customer"
);

public record LoginRequestDto(
    string Email,
    string Password
);

public record RefreshTokenRequestDto(
    string AccessToken,
    string RefreshToken
);

public record AuthResponseDto(
    bool Success,
    string Message,
    string? AccessToken = null,
    string? RefreshToken = null,
    DateTime? ExpiresAt = null,
    UserInfoDto? User = null
);

public record UserInfoDto(
    Guid Id,
    string Email,
    string FirstName,
    string LastName,
    string Role,
    Guid? CustomerId = null
);
