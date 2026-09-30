using NguyetnhanPhohien.Application.DTOs.Auth;

namespace NguyetnhanPhohien.Application.Interfaces;

public interface IAuthService
{
    Task<AdminLoginResponse> AdminLoginAsync(AdminLoginRequest request);
}
