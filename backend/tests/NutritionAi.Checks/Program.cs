using System.Net;
using System.Reflection;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using NguyetnhanPhohien.Application.DTOs.Ai;
using NguyetnhanPhohien.Application.DTOs.Products;
using NguyetnhanPhohien.Application.Interfaces;
using NguyetnhanPhohien.Infrastructure.Services;

var product = new ProductResponse { Id = Guid.NewGuid(), Name = "Trân Châu Tứ Dã" };
var catalog = DispatchProxy.Create<IProductService, Catalog>();
((Catalog)(object)catalog).Products = [product];
var transport = new GeminiStub(product.Id);
NutritionAiService Service(bool configured) => new(new HttpClient(transport), catalog,
    new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
    { ["Gemini:ApiKey"] = configured ? "test-key" : "" }).Build(),
    NullLogger<NutritionAiService>.Instance);
void Check(bool condition, string name)
{
    if (!condition) throw new Exception(name);
    Console.WriteLine($"PASS: {name}");
}

var allergic = new NutritionConsultationRequest
{
    Message = "What should I eat?", Language = "en",
    HealthProfile = new() { Allergens = ["Almonds"] }
};
var unavailable = await Service(false).ConsultAsync(allergic);
Check(unavailable.Reply.Contains("unavailable") && unavailable.AllergenNotice != null
    && unavailable.PortionTip == null && unavailable.SuggestedProducts.Count == 0,
    "Missing key: localized, no dietary recommendation, allergy warning");
var fallbackEvents = new List<JsonElement>();
await foreach (var frame in Service(false).StreamConsultAsync(allergic))
    fallbackEvents.Add(JsonSerializer.Deserialize<JsonElement>(frame));
Check(fallbackEvents[1].GetProperty("suggestedProducts").GetArrayLength() == 0
    && fallbackEvents[1].GetProperty("allergenNotice").GetString()!.Contains("nut allergy"),
    "Streaming fallback preserves allergy and metadata contract");

foreach (var message in new[] { "I am allergic to nuts", "I have a cashew allergy", "Tôi dị ứng hạt điều" })
{
    var result = await Service(true).ConsultAsync(new() { Message = message, Language = "en" });
    Check(result.SuggestedProducts.Count == 0 && result.AllergenNotice != null, $"Filter: {message}");
}
var history = new List<ChatHistoryItem> { new() { Role = "user", Content = "I am allergic to almonds" } };
for (var i = 0; i < 8; i++) history.Add(new() { Role = "user", Content = "Tell me more" });
var historical = new NutritionConsultationRequest { Message = "Recommend a product", History = history, Language = "en" };
Check((await Service(true).ConsultAsync(historical)).SuggestedProducts.Count == 0,
    "Allergy survives beyond six model context messages");
Check(transport.Payload.Contains("LANGUAGE: Reply in English") && transport.Payload.Contains("SAFETY:"),
    "Provider receives explicit language and allergy instructions");
var streamEvents = new List<JsonElement>();
await foreach (var frame in Service(true).StreamConsultAsync(historical))
    streamEvents.Add(JsonSerializer.Deserialize<JsonElement>(frame));
Check(streamEvents.Last().GetProperty("suggestedProducts").GetArrayLength() == 0,
    "Streaming recommendations also filter historical allergy");
Check(transport.Payload.Contains("LANGUAGE: Reply in English"), "Streaming language instruction");
var ordinary = await Service(true).ConsultAsync(new()
{
    Message = "Recommend a product",
    History = [new() { Role = "assistant", Content = "Do you have a nut allergy?" }]
});
Check(ordinary.SuggestedProducts.Count == 1, "Assistant question does not mark user allergic");
Check((await Service(false).ConsultAsync(new() { Message = "Xin chào" })).Reply.Contains("chưa sẵn sàng"),
    "Vietnamese fallback");

public class Catalog : DispatchProxy
{
    public List<ProductResponse> Products { get; set; } = [];
    protected override object? Invoke(MethodInfo? method, object?[]? args) =>
        method?.Name == "GetAllAsync" ? Task.FromResult(Products) : throw new NotSupportedException();
}

public class GeminiStub(Guid productId) : HttpMessageHandler
{
    public string Payload { get; private set; } = "";
    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken token)
    {
        Payload = await request.Content!.ReadAsStringAsync(token);
        // Decode JSON escapes so assertions inspect the actual system instruction.
        Payload = JsonDocument.Parse(Payload).RootElement.GetProperty("system_instruction")
            .GetProperty("parts")[0].GetProperty("text").GetString()!;
        var streaming = request.RequestUri!.AbsolutePath.Contains("streamGenerateContent");
        var text = streaming ? $"Advice.\n[GỢI_Ý: {productId}]" : JsonSerializer.Serialize(new
        { reply = "Advice", suggested_product_ids = new[] { productId.ToString() }, portion_tip = "", allergen_warning = "" });
        var body = JsonSerializer.Serialize(new { candidates = new[] { new { content = new { parts = new[] { new { text } } } } } });
        return new(HttpStatusCode.OK) { Content = new StringContent(streaming ? $"data: {body}\n\n" : body) };
    }
}
