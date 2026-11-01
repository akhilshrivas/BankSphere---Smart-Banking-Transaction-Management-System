namespace BankSphere.Domain.Common;

public static class JwtSecurityConstants
{
    public const string DefaultSecret = "BankSphereSuperSecretKeyForJwtTokenAuth2026!MustBeVeryLongAndSecureKey";
    public const string DefaultIssuer = "BankSphereAPI";
    public const string DefaultAudience = "BankSphereClient";
    public const int DefaultExpiryMinutes = 60;
}
