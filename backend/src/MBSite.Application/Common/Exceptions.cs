namespace MBSite.Application.Common;

/// <summary>Base for expected application errors mapped to HTTP status codes.</summary>
public abstract class AppException : Exception
{
    protected AppException(string message) : base(message) { }
}

/// <summary>404 — requested resource does not exist (or is not visible).</summary>
public sealed class NotFoundException : AppException
{
    public NotFoundException(string message) : base(message) { }
}

/// <summary>400 — invalid input / business-rule violation.</summary>
public sealed class ValidationException : AppException
{
    public ValidationException(string message) : base(message) { }
}

/// <summary>409 — conflict (e.g. duplicate slug/SKU).</summary>
public sealed class ConflictException : AppException
{
    public ConflictException(string message) : base(message) { }
}

/// <summary>401 — authentication failed.</summary>
public sealed class UnauthorizedException : AppException
{
    public UnauthorizedException(string message) : base(message) { }
}
