namespace DocumentIntelligence.API.Services;

public enum UserOperationStatus
{
    Success,
    NotFound,
    DuplicateEmail
}

public class UserOperationResult
{
    public UserOperationStatus Status { get; init; }

    public static UserOperationResult Success() => new() { Status = UserOperationStatus.Success };
    public static UserOperationResult NotFoundResult() => new() { Status = UserOperationStatus.NotFound };
}

public class UserOperationResult<T> : UserOperationResult
{
    public T? Value { get; init; }

    public static UserOperationResult<T> Success(T value) => new()
    {
        Status = UserOperationStatus.Success,
        Value = value
    };

    public static UserOperationResult<T> NotFound() => new() { Status = UserOperationStatus.NotFound };
    public static UserOperationResult<T> DuplicateEmail() => new() { Status = UserOperationStatus.DuplicateEmail };
}
