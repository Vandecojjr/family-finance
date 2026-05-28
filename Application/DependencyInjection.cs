using System.Reflection;
using Application.Shared.Behaviors;
using Application.Shared.Authorization;
using Domain.Entities.RecurringExpenses.Services;
using FluentValidation;
using Mediator;
using Microsoft.Extensions.DependencyInjection;

namespace Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();
        
        services.AddScoped<RecurringExpensePaymentService>();
        
        services.AddMediator(o =>
        {
            o.ServiceLifetime = ServiceLifetime.Scoped;
        });
        services.AddValidatorsFromAssembly(assembly, includeInternalTypes: true);
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(AuthorizationBehavior<,>));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

        return services;
    }
}
