using System.Text;
using System.Threading.RateLimiting;
using MBSite.Api.Middleware;
using MBSite.Application;
using MBSite.Infrastructure;
using MBSite.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// --- Logging (Serilog) ---
builder.Host.UseSerilog((context, config) =>
    config.ReadFrom.Configuration(context.Configuration)
          .WriteTo.Console());

// --- Uploads directory anchored to the content root (independent of CWD) ---
var uploadsRoot = Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "uploads");
Directory.CreateDirectory(uploadsRoot);
builder.Configuration["Storage:LocalPath"] = uploadsRoot;

// --- Application + Infrastructure ---
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// --- Background notification dispatch (drains the queue, retries with backoff) ---
builder.Services.AddHostedService<MBSite.Api.BackgroundServices.NotificationDispatcherService>();

// --- Auth (JWT bearer for admin) ---
var jwtKey = builder.Configuration["Jwt:Key"] ?? "dev-only-insecure-key-change-me-please-32bytes!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "MBSite";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "MBSite";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });
builder.Services.AddAuthorization();

// --- Web ---
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();
builder.Services.AddHealthChecks();

// --- Rate limiting ---
builder.Services.AddRateLimiter(opts =>
{
    opts.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Auth login: strict — 10 attempts per IP per minute (brute-force protection).
    opts.AddFixedWindowLimiter("auth", o =>
    {
        o.Window = TimeSpan.FromMinutes(1);
        o.PermitLimit = 10;
        o.QueueLimit = 0;
        o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    });

    // Webhook: generous — providers retry on failure; block extreme abuse.
    opts.AddFixedWindowLimiter("webhook", o =>
    {
        o.Window = TimeSpan.FromMinutes(1);
        o.PermitLimit = 120;
        o.QueueLimit = 0;
        o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    });

    // Public tracking: moderate — prevents reference/email enumeration.
    opts.AddFixedWindowLimiter("tracking", o =>
    {
        o.Window = TimeSpan.FromMinutes(1);
        o.PermitLimit = 30;
        o.QueueLimit = 0;
        o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    });
});

// --- CORS for the React storefront/admin ---
const string CorsPolicy = "StorefrontCors";
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5173" };
builder.Services.AddCors(options =>
    options.AddPolicy(CorsPolicy, policy =>
        policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

// --- Pipeline ---
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseSerilogRequestLogging();
app.UseRateLimiter();

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

// Always migrate and seed on startup (safe to run repeatedly — idempotent).
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (db.Database.GetPendingMigrations().Any())
        db.Database.Migrate();
    var hasher = scope.ServiceProvider.GetRequiredService<MBSite.Application.Common.Interfaces.IPasswordHasher>();
    await DataSeeder.SeedAsync(db, hasher, builder.Configuration);
}

app.UseHttpsRedirection();
// Serve uploaded images from the content-root wwwroot regardless of working dir.
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(Path.Combine(app.Environment.ContentRootPath, "wwwroot"))
});
app.UseCors(CorsPolicy);
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();

// Exposed for integration tests (WebApplicationFactory).
public partial class Program { }
