using Mlp.Api.Hubs;
using Mlp.Api.Services;
using Mlp.Application.Interfaces;
using Mlp.Application.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Configuração dos Controllers e SignalR
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddOpenApi();

// 2. Injeção de Dependências (Clean Architecture)
builder.Services.AddScoped<IMlpService, MlpService>();
builder.Services.AddSingleton<ITrainingNotifier, SignalRTrainingNotifier>();

// 3. Configuração de CORS (Essencial para o Next.js e SignalR com WebSockets)
const string frontendCorsPolicy = "FrontendPolicy";
builder.Services.AddCors(options =>
{
    options.AddPolicy(frontendCorsPolicy, policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",
                "http://127.0.0.1:3000"
              )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Obrigatório para comunicação SignalR via WebSocket com credenciais
    });
});

var app = builder.Build();

// 4. Pipeline de Middlewares
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors(frontendCorsPolicy);

app.MapControllers();

// 5. Mapeamento do Hub SignalR
app.MapHub<TrainingHub>("/hubs/training");

app.Run();
