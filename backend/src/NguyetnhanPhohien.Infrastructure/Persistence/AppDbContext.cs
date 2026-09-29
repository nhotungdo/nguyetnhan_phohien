using NguyetnhanPhohien.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace NguyetnhanPhohien.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; } = null!;
    public DbSet<FacebookPage> FacebookPages { get; set; } = null!;
    public DbSet<FacebookPost> FacebookPosts { get; set; } = null!;
    public DbSet<Conversation> Conversations { get; set; } = null!;
    public DbSet<Message> Messages { get; set; } = null!;
    public DbSet<Customer> Customers { get; set; } = null!;
    public DbSet<AutoReplyRule> AutoReplyRules { get; set; } = null!;
    public DbSet<BotSetting> BotSettings { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>().HasKey(u => u.Id);
        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();

        // FacebookPage
        modelBuilder.Entity<FacebookPage>().HasKey(p => p.Id);
        modelBuilder.Entity<FacebookPage>().HasIndex(p => p.PageId).IsUnique();

        // FacebookPost
        modelBuilder.Entity<FacebookPost>().HasKey(p => p.Id);
        modelBuilder.Entity<FacebookPost>()
            .HasOne(p => p.Page)
            .WithMany(p => p.Posts)
            .HasForeignKey(p => p.FacebookPageId)
            .OnDelete(DeleteBehavior.Cascade);

        // Customer
        modelBuilder.Entity<Customer>().HasKey(c => c.Id);
        modelBuilder.Entity<Customer>().HasIndex(c => c.FacebookSenderId).IsUnique();

        // Conversation
        modelBuilder.Entity<Conversation>().HasKey(c => c.Id);
        modelBuilder.Entity<Conversation>()
            .HasOne(c => c.Page)
            .WithMany(p => p.Conversations)
            .HasForeignKey(c => c.FacebookPageId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Conversation>()
            .HasOne(c => c.Customer)
            .WithMany(cu => cu.Conversations)
            .HasForeignKey(c => c.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        // Message
        modelBuilder.Entity<Message>().HasKey(m => m.Id);
        modelBuilder.Entity<Message>()
            .HasOne(m => m.Conversation)
            .WithMany(c => c.Messages)
            .HasForeignKey(m => m.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);

        // AutoReplyRule
        modelBuilder.Entity<AutoReplyRule>().HasKey(a => a.Id);
        modelBuilder.Entity<AutoReplyRule>()
            .HasOne(a => a.Page)
            .WithMany()
            .HasForeignKey(a => a.FacebookPageId)
            .OnDelete(DeleteBehavior.Cascade);

        // BotSetting
        modelBuilder.Entity<BotSetting>().HasKey(b => b.Id);
        modelBuilder.Entity<BotSetting>()
            .HasOne(b => b.Page)
            .WithMany()
            .HasForeignKey(b => b.FacebookPageId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
