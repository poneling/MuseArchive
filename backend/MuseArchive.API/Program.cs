using Microsoft.EntityFrameworkCore;
using MuseArchive.API.Data;
using MuseArchive.API.Services;
using Microsoft.Extensions.FileProviders;

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

// Add Music Library Scanner as scoped service
builder.Services.AddScoped<MusicLibraryScanner>();

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

// Scan music library on startup
using (var scope = app.Services.CreateScope())
{
    var scanner = scope.ServiceProvider.GetRequiredService<MusicLibraryScanner>();
    await scanner.ScanAndImportMusicLibraryAsync();
}

app.Run();
