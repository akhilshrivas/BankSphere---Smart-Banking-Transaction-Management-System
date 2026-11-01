using BankSphere.Application.DTOs;
using BankSphere.Application.Interfaces;
using BankSphere.Domain.Entities;
using BankSphere.Domain.Enums;
using BankSphere.Domain.Interfaces;

namespace BankSphere.Application.Services;

public class BeneficiaryService : IBeneficiaryService
{
    private readonly IRepository<Beneficiary> _repo;
    private readonly IUnitOfWork _unitOfWork;

    public BeneficiaryService(IRepository<Beneficiary> repo, IUnitOfWork unitOfWork)
    {
        _repo = repo;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<BeneficiaryDto>> GetBeneficiariesAsync(Guid customerId, CancellationToken cancellationToken = default)
    {
        var list = await _repo.FindAsync(b => b.CustomerId == customerId, cancellationToken);
        return list.OrderByDescending(b => b.CreatedAt).Select(b => new BeneficiaryDto(
            b.Id,
            b.CustomerId,
            b.Name,
            b.AccountNumber,
            b.BankName,
            b.RoutingNumber,
            b.Nickname,
            b.Email,
            b.IsVerified,
            b.CreatedAt
        )).ToList();
    }

    public async Task<BeneficiaryDto> AddBeneficiaryAsync(Guid customerId, CreateBeneficiaryDto request, CancellationToken cancellationToken = default)
    {
        var entity = new Beneficiary
        {
            CustomerId = customerId,
            Name = request.Name,
            AccountNumber = request.AccountNumber,
            BankName = string.IsNullOrWhiteSpace(request.BankName) ? "BankSphere" : request.BankName,
            RoutingNumber = request.RoutingNumber ?? "021000021",
            Nickname = request.Nickname,
            Email = request.Email,
            IsVerified = true,
            CreatedAt = DateTime.UtcNow
        };

        await _repo.AddAsync(entity, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);

        return new BeneficiaryDto(
            entity.Id,
            entity.CustomerId,
            entity.Name,
            entity.AccountNumber,
            entity.BankName,
            entity.RoutingNumber,
            entity.Nickname,
            entity.Email,
            entity.IsVerified,
            entity.CreatedAt
        );
    }

    public async Task<bool> DeleteBeneficiaryAsync(Guid beneficiaryId, Guid customerId, CancellationToken cancellationToken = default)
    {
        var item = await _repo.GetByIdAsync(beneficiaryId, cancellationToken);
        if (item == null || item.CustomerId != customerId) return false;

        _repo.Remove(item);
        await _unitOfWork.CommitAsync(cancellationToken);
        return true;
    }
}

public class NotificationService : INotificationService
{
    private readonly IRepository<Notification> _repo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IRealtimeNotifier _notifier;

    public NotificationService(IRepository<Notification> repo, IUnitOfWork unitOfWork, IRealtimeNotifier notifier)
    {
        _repo = repo;
        _unitOfWork = unitOfWork;
        _notifier = notifier;
    }

    public async Task<IReadOnlyList<NotificationDto>> GetNotificationsAsync(Guid customerId, bool unreadOnly = false, CancellationToken cancellationToken = default)
    {
        var list = unreadOnly
            ? await _repo.FindAsync(n => n.CustomerId == customerId && !n.IsRead, cancellationToken)
            : await _repo.FindAsync(n => n.CustomerId == customerId, cancellationToken);

        return list.OrderByDescending(n => n.CreatedAt).Select(n => new NotificationDto(
            n.Id, n.CustomerId, n.Title, n.Message, n.Type, n.IsRead, n.CreatedAt
        )).ToList();
    }

    public async Task MarkAsReadAsync(Guid notificationId, CancellationToken cancellationToken = default)
    {
        var item = await _repo.GetByIdAsync(notificationId, cancellationToken);
        if (item != null)
        {
            item.IsRead = true;
            _repo.Update(item);
            await _unitOfWork.CommitAsync(cancellationToken);
        }
    }

    public async Task CreateNotificationAsync(Guid customerId, string title, string message, NotificationType type, CancellationToken cancellationToken = default)
    {
        var notif = new Notification
        {
            CustomerId = customerId,
            Title = title,
            Message = message,
            Type = type,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        await _repo.AddAsync(notif, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);

        var dto = new NotificationDto(notif.Id, notif.CustomerId, notif.Title, notif.Message, notif.Type, notif.IsRead, notif.CreatedAt);
        await _notifier.SendUserNotificationAsync(customerId, dto);
    }
}

public class AuditService : IAuditService
{
    private readonly IRepository<AuditLog> _repo;
    private readonly IUnitOfWork _unitOfWork;

    public AuditService(IRepository<AuditLog> repo, IUnitOfWork unitOfWork)
    {
        _repo = repo;
        _unitOfWork = unitOfWork;
    }

    public async Task LogAsync(Guid? userId, string userEmail, string action, string entityName, string? entityId, string? details, string? ipAddress = null)
    {
        var audit = new AuditLog
        {
            UserId = userId,
            UserEmail = userEmail,
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            Details = details,
            IpAddress = ipAddress,
            Timestamp = DateTime.UtcNow
        };

        await _repo.AddAsync(audit);
        await _unitOfWork.CommitAsync();
    }

    public async Task<IReadOnlyList<AuditLogDto>> GetLogsAsync(int skip = 0, int take = 100, CancellationToken cancellationToken = default)
    {
        var all = await _repo.GetAllAsync(cancellationToken);
        return all.OrderByDescending(a => a.Timestamp)
            .Skip(skip)
            .Take(take)
            .Select(a => new AuditLogDto(
                a.Id, a.UserId, a.UserEmail, a.Action, a.EntityName, a.EntityId, a.Details, a.IpAddress, a.Timestamp
            )).ToList();
    }
}
