using NguyetnhanPhohien.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace NguyetnhanPhohien.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    // ===== LEGACY (Facebook Integration - giữ lại nếu cần) =====
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<FacebookPage> FacebookPages { get; set; } = null!;
    public DbSet<FacebookPost> FacebookPosts { get; set; } = null!;
    public DbSet<Conversation> Conversations { get; set; } = null!;
    public DbSet<Message> Messages { get; set; } = null!;
    public DbSet<Customer> Customers { get; set; } = null!;
    public DbSet<AutoReplyRule> AutoReplyRules { get; set; } = null!;
    public DbSet<BotSetting> BotSettings { get; set; } = null!;

    // ===== ORDER =====
    public DbSet<Order> Orders { get; set; } = null!;
    public DbSet<OrderItem> OrderItems { get; set; } = null!;
    public DbSet<DiscountCode> DiscountCodes { get; set; } = null!;
    public DbSet<WebsiteContent> WebsiteContents { get; set; } = null!;
    public DbSet<Product> Products { get; set; } = null!;
    public DbSet<ProductImage> ProductImages { get; set; } = null!;

    // ===== LIVE CHAT =====
    public DbSet<ChatSession> ChatSessions { get; set; } = null!;
    public DbSet<ChatMessage> ChatMessages { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ===== LEGACY CONFIGS =====
        modelBuilder.Entity<User>().HasKey(u => u.Id);
        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();

        modelBuilder.Entity<FacebookPage>().HasKey(p => p.Id);
        modelBuilder.Entity<FacebookPage>().HasIndex(p => p.PageId).IsUnique();

        modelBuilder.Entity<FacebookPost>().HasKey(p => p.Id);
        modelBuilder.Entity<FacebookPost>()
            .HasOne(p => p.Page)
            .WithMany(p => p.Posts)
            .HasForeignKey(p => p.FacebookPageId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Customer>().HasKey(c => c.Id);
        modelBuilder.Entity<Customer>().HasIndex(c => c.FacebookSenderId).IsUnique();

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

        modelBuilder.Entity<Message>().HasKey(m => m.Id);
        modelBuilder.Entity<Message>()
            .HasOne(m => m.Conversation)
            .WithMany(c => c.Messages)
            .HasForeignKey(m => m.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<AutoReplyRule>().HasKey(a => a.Id);
        modelBuilder.Entity<AutoReplyRule>()
            .HasOne(a => a.Page)
            .WithMany()
            .HasForeignKey(a => a.FacebookPageId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<BotSetting>().HasKey(b => b.Id);
        modelBuilder.Entity<BotSetting>()
            .HasOne(b => b.Page)
            .WithMany()
            .HasForeignKey(b => b.FacebookPageId)
            .OnDelete(DeleteBehavior.Cascade);

        // ===== ORDER & ORDER ITEM =====
        modelBuilder.Entity<Order>().HasKey(o => o.Id);
        modelBuilder.Entity<Order>()
            .Property(o => o.BaseAmount)
            .HasPrecision(18, 2);
        modelBuilder.Entity<Order>()
            .Property(o => o.TotalAmount)
            .HasPrecision(18, 2);
        modelBuilder.Entity<Order>()
            .Property(o => o.DiscountAmount)
            .HasPrecision(18, 2);
        modelBuilder.Entity<Order>()
            .HasIndex(o => o.ProductId);

        modelBuilder.Entity<OrderItem>().HasKey(i => i.Id);
        modelBuilder.Entity<OrderItem>()
            .Property(i => i.UnitPrice)
            .HasPrecision(18, 2);
        modelBuilder.Entity<OrderItem>()
            .Property(i => i.TotalPrice)
            .HasPrecision(18, 2);
        modelBuilder.Entity<OrderItem>()
            .HasOne(i => i.Order)
            .WithMany(o => o.Items)
            .HasForeignKey(i => i.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        // ===== DISCOUNT CODE =====
        modelBuilder.Entity<DiscountCode>().HasKey(d => d.Id);
        modelBuilder.Entity<DiscountCode>().HasIndex(d => d.Code).IsUnique();
        modelBuilder.Entity<DiscountCode>()
            .Property(d => d.PercentOff)
            .HasPrecision(5, 2);
        modelBuilder.Entity<DiscountCode>()
            .Property(d => d.AmountOff)
            .HasPrecision(18, 2);

        // ===== WEBSITE CONTENT =====
        modelBuilder.Entity<WebsiteContent>().HasKey(w => w.Id);
        modelBuilder.Entity<WebsiteContent>().HasIndex(w => w.Key).IsUnique();

        // ===== CHAT SESSION & MESSAGE =====
        modelBuilder.Entity<ChatSession>().HasKey(cs => cs.Id);
        // Unique: tránh race condition tạo 2 phiên chat cho cùng một sessionId
        modelBuilder.Entity<ChatSession>().HasIndex(cs => cs.SessionId).IsUnique();

        modelBuilder.Entity<ChatMessage>().HasKey(cm => cm.Id);
        modelBuilder.Entity<ChatMessage>()
            .HasOne(cm => cm.ChatSession)
            .WithMany(cs => cs.Messages)
            .HasForeignKey(cm => cm.ChatSessionId)
            .OnDelete(DeleteBehavior.Cascade);

        // ===== PRODUCT =====
        modelBuilder.Entity<Product>().HasKey(p => p.Id);
        modelBuilder.Entity<Product>()
            .Property(p => p.Price)
            .HasPrecision(18, 2);

        // ===== PRODUCT IMAGE =====
        modelBuilder.Entity<ProductImage>().HasKey(pi => pi.Id);
        modelBuilder.Entity<ProductImage>()
            .HasOne(pi => pi.Product)
            .WithMany(p => p.Images)
            .HasForeignKey(pi => pi.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
