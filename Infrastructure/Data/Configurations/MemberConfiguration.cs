using Domain.Entities.Members;
using Domain.Entities.Members.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class MemberConfiguration : IEntityTypeConfiguration<Member>
{
    public void Configure(EntityTypeBuilder<Member> builder)
    {
        builder.ToTable("Members");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .HasConversion(
                name => name.Value,
                value => MemberName.Create(value)
            )
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.FamilyId)
            .IsRequired();

        builder.HasOne(x => x.Family)
            .WithMany(x => x.Members)
            .HasForeignKey(x => x.FamilyId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
