using Domain.Entities.Categories;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.Icon)
            .HasMaxLength(50);
            
        builder.Property(x => x.Color)
            .HasMaxLength(10);

        // Self-referencing relationship
        builder.HasOne(x => x.Parent)
            .WithMany(x => x.SubCategories)
            .HasForeignKey(x => x.ParentId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict); // Avoid cascade delete for now to prevent recursive issues if not handled carefully

        // Family Relationship (Custom Categories)
        // If FamilyId is null, it's a system category.
        // We probably don't need a strong navigation property to Family for system categories, 
        // but for custom ones we might want valid FK.
        // If we want to enforce FK constraint only when not null:
        /*
        builder.HasOne<Family>()
            .WithMany()
            .HasForeignKey(x => x.FamilyId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Cascade);
        */
        // Since Family entity is in another aggregate, we might just keep the ID without navigation 
        // OR add navigation if we want database level constraint.
        // Let's add simple configuration for property.
        builder.Property(x => x.FamilyId).IsRequired(false);
    }
}
