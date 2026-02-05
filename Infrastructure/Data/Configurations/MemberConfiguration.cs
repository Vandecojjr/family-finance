using Domain.Entities.Families;
using Domain.Entities.Accounts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class MemberConfiguration : IEntityTypeConfiguration<Member>
{
    public void Configure(EntityTypeBuilder<Member> builder)
    {


        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.Email)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(x => x.Cpf)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(x => x.AccountId)
            .IsRequired(false);

        builder.HasOne(x => x.Family)
            .WithMany(x => x.Members)
            .HasForeignKey(x => x.FamilyId);
    }
}
