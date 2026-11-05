using NguyetnhanPhohien.Application.DTOs.Auth;

namespace NguyetnhanPhohien.Application.Interfaces;

public interface IAuthService
{
    string? TryLoginWithCode(string code);
    Task<AdminLoginResponse> AdminLoginAsync(AdminLoginRequest request);
}
