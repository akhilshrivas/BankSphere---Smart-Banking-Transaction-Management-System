using FluentValidation;
using BankSphere.Application.DTOs;

namespace BankSphere.Application.Validators;

public class RegisterRequestValidator : AbstractValidator<RegisterRequestDto>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty().MinimumLength(6).WithMessage("Password must be at least 6 characters long.");
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(50);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(50);
    }
}

public class LoginRequestValidator : AbstractValidator<LoginRequestDto>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class TransferRequestValidator : AbstractValidator<TransferRequestDto>
{
    public TransferRequestValidator()
    {
        RuleFor(x => x.SourceAccountId).NotEmpty();
        RuleFor(x => x.DestinationAccountNumber).NotEmpty().Length(10, 16);
        RuleFor(x => x.Amount).GreaterThan(0).WithMessage("Transfer amount must be greater than zero.");
    }
}

public class DepositRequestValidator : AbstractValidator<DepositRequestDto>
{
    public DepositRequestValidator()
    {
        RuleFor(x => x.AccountId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0).WithMessage("Deposit amount must be greater than zero.");
    }
}

public class WithdrawalRequestValidator : AbstractValidator<WithdrawalRequestDto>
{
    public WithdrawalRequestValidator()
    {
        RuleFor(x => x.AccountId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0).WithMessage("Withdrawal amount must be greater than zero.");
    }
}

public class CreateBeneficiaryValidator : AbstractValidator<CreateBeneficiaryDto>
{
    public CreateBeneficiaryValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.AccountNumber).NotEmpty().Length(10, 16);
        RuleFor(x => x.BankName).NotEmpty();
    }
}
