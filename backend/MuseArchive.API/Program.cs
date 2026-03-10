using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MuseArchive.API.Data;
using MuseArchive.API.Services;
using Microsoft.Extensions.FileProviders;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure Entity Framework
builder.Services.AddDbContext<MuseArchiveDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add Music Library Scanner and Duplicate Cleanup as scoped services
builder.Services.AddScoped<MusicLibraryScanner>();
builder.Services.AddScoped<DuplicateCleanupService>();

// Add HttpClient for external API calls (Wikipedia)
builder.Services.AddHttpClient();
builder.Services.AddScoped<ArtistWikiService>();

// Configure JWT Authentication
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "MuseArchive_SuperSecret_JWT_Key_2026_ChangeInProd!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = "MuseArchive",
            ValidAudience            = "MuseArchive",
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        };
    });

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseAuthentication();

// Add static files for music folder
var musicPath = @"C:\Users\poneling\Desktop\proje\music";
if (Directory.Exists(musicPath))
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(musicPath),
        RequestPath = "/music"
    });
}

app.UseAuthorization();

app.MapControllers();

// Startup: migrate → clean duplicates → scan
using (var scope = app.Services.CreateScope())
{
    var db      = scope.ServiceProvider.GetRequiredService<MuseArchiveDbContext>();
    var cleanup = scope.ServiceProvider.GetRequiredService<DuplicateCleanupService>();
    var scanner = scope.ServiceProvider.GetRequiredService<MusicLibraryScanner>();

    // 1. Apply pending EF migrations (creates DB + tables if needed)
    await db.Database.MigrateAsync();

    // 2. Remove duplicate artists/albums (safe now that DB exists)
    await cleanup.CleanDuplicatesAsync();

    // 3. Scan music library
    await scanner.ScanAndImportMusicLibraryAsync();
}

app.Run();
