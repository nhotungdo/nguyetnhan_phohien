using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NguyetnhanPhohien.Application.DTOs.Ai;
using NguyetnhanPhohien.Application.DTOs.Products;
using NguyetnhanPhohien.Application.Interfaces;

namespace NguyetnhanPhohien.Infrastructure.Services;

/// <summary>
/// Bộ lọc an toàn thành phần và dị ứng cho danh mục sản phẩm Nguyệt Nhãn
/// </summary>
public static class ProductSafetyRegistry
{
    private static readonly Dictionary<string, HashSet<string>> AllergenTagsByProduct = new(StringComparer.OrdinalIgnoreCase)
    {
        // "Trân Châu Tứ Dã" chứa các loại hạt dinh dưỡng (Hạt điều, Hạnh nhân, Macca...)
        ["p-tu-da"] = new() { "hạt", "hạt điều", "hạnh nhân", "macca", "tree nuts", "hạt cây" },
        ["tu-da"] = new() { "hạt", "hạt điều", "hạnh nhân", "macca", "tree nuts", "hạt cây" },
        ["trân châu tứ dã"] = new() { "hạt", "hạt điều", "hạnh nhân", "macca", "tree nuts", "hạt cây" },

        // "Ngọc Nhãn Tiến Vua" là 100% cùi long nhãn sấy đối lưu thuần túy, an toàn cho người dị ứng hạt
        ["p-tien-vua"] = new(),
        ["tien-vua"] = new(),
        ["ngọc nhãn tiến vua"] = new(),

        // "Lễ Hộp Vọng Nguyệt" là set quà phối hợp cao cấp (có thể có hũ hạt đi kèm)
        ["p-vong-nguyet"] = new() { "hạt", "hạt điều", "hạnh nhân", "macca" },
        ["vọng nguyệt thương cảng"] = new() { "hạt", "hạt điều", "hạnh nhân", "macca" }
    };

    public static bool IsSafeForUser(string productId, string productName, bool isNutAllergic)
    {
        if (!isNutAllergic) return true;

        var key = AllergenTagsByProduct.Keys.FirstOrDefault(k =>
            productId.Contains(k, StringComparison.OrdinalIgnoreCase) ||
            productName.Contains(k, StringComparison.OrdinalIgnoreCase));

        if (key != null && AllergenTagsByProduct.TryGetValue(key, out var allergenSet))
        {
            if (allergenSet.Count > 0)
            {
                return false; // Chứa hạt -> Cấm gợi ý cho người dị ứng hạt!
            }
        }

        // Tên sản phẩm chứa từ "hạt" hoặc "tứ dã" cũng bị loại
        var lowerName = productName.ToLowerInvariant();
        if (lowerName.Contains("hạt") || lowerName.Contains("tứ dã"))
        {
            return false;
        }

        return true;
    }
}

public class NutritionAiService : INutritionAiService
{
    private readonly HttpClient _httpClient;
    private readonly IProductService _productService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<NutritionAiService> _logger;

    public NutritionAiService(
        HttpClient httpClient,
        IProductService productService,
        IConfiguration configuration,
        ILogger<NutritionAiService> logger)
    {
        _httpClient = httpClient;
        _productService = productService;
        _configuration = configuration;
        _logger = logger;
    }

    private string GetApiKey() =>
        _configuration["Gemini:ApiKey"] ?? string.Empty;

    private string GetModelName() =>
        _configuration["Gemini:Model"] ?? "gemini-3.5-flash-lite";

    private string GetBaseUrl() =>
        _configuration["Gemini:BaseUrl"] ?? "https://generativelanguage.googleapis.com";

    public async Task<NutritionConsultationResponse> ConsultAsync(
        NutritionConsultationRequest request, 
        CancellationToken cancellationToken = default)
    {
        var apiKey = GetApiKey();
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogWarning("Gemini API key is not configured in Gemini:ApiKey.");
            return new NutritionConsultationResponse
            {
                Reply = "Chào bạn! Tính năng AI Dinh dưỡng hiện đang trong quá trình cấu hình khóa API. Bạn vui lòng liên hệ trực tiếp với nhân viên tư vấn của Nguyệt Nhãn Phố Hiến để được hỗ trợ chu đáo nhất nhé!",
                PortionTip = "Khuyến nghị chung: Dùng 10 - 20g long nhãn hoặc 30g hạt dinh dưỡng mix mỗi ngày."
            };
        }

        try
        {
            List<ProductResponse> products;
            try
            {
                products = await _productService.GetAllAsync(includeInactive: false);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Không thể tải danh sách sản phẩm từ DB, sử dụng danh sách fallback.");
                products = new List<ProductResponse>();
            }

            var isNutAllergic = DetectNutAllergy(request);
            var systemInstruction = BuildSystemPrompt(products, isStreamingMode: false);
            var payload = BuildGeminiPayload(request, systemInstruction, useJsonSchema: true);

            var model = GetModelName();
            var url = $"{GetBaseUrl()}/v1beta/models/{model}:generateContent?key={apiKey}";

            var jsonContent = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json");

            var response = await _httpClient.PostAsync(url, jsonContent, cancellationToken);
            var responseString = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Lỗi gọi Gemini API ({StatusCode}): {Body}", response.StatusCode, responseString);
                return new NutritionConsultationResponse
                {
                    Reply = "Chào bạn, chuyên gia dinh dưỡng Nguyệt Nhãn Phố Hiến hiện đang tiếp nhận nhiều lượt hỏi cùng lúc. Bạn vui lòng gửi lại câu hỏi sau giây lát hoặc kết nối trực tiếp với nhân viên hỗ trợ nhé!"
                };
            }

            var jsonNode = JsonNode.Parse(responseString);
            var rawContent = jsonNode?["candidates"]?[0]?["content"]?["parts"]?[0]?["text"]?.GetValue<string>() ?? string.Empty;

            // Phân giải và sửa chữa JSON qua thuật toán JsonRepair đa tầng
            TryParseOrRepairGeminiJson(
                rawContent,
                out var reply,
                out var productIds,
                out var portionTip,
                out var allergenNotice);

            // Áp dụng bộ lọc dị ứng cưỡng chế phía server
            var matchedProducts = ResolveSuggestedProducts(productIds, products, isNutAllergic);

            // Nếu phát hiện khách dị ứng mà AI quên điền allergenNotice, server chủ động chèn cảnh báo an toàn
            if (isNutAllergic && string.IsNullOrWhiteSpace(allergenNotice))
            {
                allergenNotice = "Lưu ý an toàn: Quý khách có cơ địa dị ứng hạt, cửa hàng khuyến nghị dùng 'Ngọc Nhãn Tiến Vua' (100% cùi nhãn sấy đối lưu thuần khiết, không chứa hạt cây).";
            }

            return new NutritionConsultationResponse
            {
                Reply = reply,
                SuggestedProducts = matchedProducts,
                PortionTip = string.IsNullOrWhiteSpace(portionTip) ? null : portionTip,
                AllergenNotice = string.IsNullOrWhiteSpace(allergenNotice) ? null : allergenNotice
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi xử lý tư vấn dinh dưỡng AI.");
            return new NutritionConsultationResponse
            {
                Reply = "Đã có sự gián đoạn tạm thời khi kết nối với Chuyên gia AI Dinh Dưỡng. Quý khách có thể thử lại sau ít phút hoặc chọn tab Tư Vấn Viên để được hỗ trợ nhé!"
            };
        }
    }

    private static readonly JsonSerializerOptions CamelCaseOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public async IAsyncEnumerable<string> StreamConsultAsync(
        NutritionConsultationRequest request, 
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var apiKey = GetApiKey();
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            yield return JsonSerializer.Serialize(new { @event = "error", message = "Chưa cấu hình API Key cho Gemini (Gemini:ApiKey)." }, CamelCaseOptions);
            yield break;
        }

        List<ProductResponse> products;
        try
        {
            products = await _productService.GetAllAsync(includeInactive: false);
        }
        catch
        {
            products = new List<ProductResponse>();
        }

        var isNutAllergic = DetectNutAllergy(request);
        var systemInstruction = BuildSystemPrompt(products, isStreamingMode: true);
        var payload = BuildGeminiPayload(request, systemInstruction, useJsonSchema: false);

        var model = GetModelName();
        var url = $"{GetBaseUrl()}/v1beta/models/{model}:streamGenerateContent?alt=sse&key={apiKey}";

        using var requestMessage = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
        };

        HttpResponseMessage response;
        string? initError = null;
        try
        {
            response = await _httpClient.SendAsync(requestMessage, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khởi tạo Stream SSE tới Gemini API.");
            initError = JsonSerializer.Serialize(new { @event = "error", message = "Không thể kết nối tới dịch vụ AI vào lúc này." }, CamelCaseOptions);
            response = null!;
        }

        if (initError != null)
        {
            yield return initError;
            yield break;
        }

        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError("Lỗi Stream Gemini API ({StatusCode}): {Err}", response.StatusCode, err);
            yield return JsonSerializer.Serialize(new { @event = "error", message = "Đã có lỗi xảy ra trong quá trình nhận phản hồi từ AI." }, CamelCaseOptions);
            yield break;
        }

        using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var reader = new StreamReader(stream);

        var accumulatedFullText = new StringBuilder();
        var pendingBuffer = new StringBuilder();
        var isBufferingMeta = false;
        var metaTagKeywords = new[] { "[GỢI_Ý", "[GỢI Ý", "[KHẨU_PHẦN", "[KHẨU PHẦN", "[DỊ_ỨNG", "[DỊ ỨNG" };

        string? line;
        while ((line = await reader.ReadLineAsync(cancellationToken)) != null)
        {
            if (line.StartsWith("data: "))
            {
                var jsonData = line.Substring(6).Trim();
                if (string.IsNullOrEmpty(jsonData) || jsonData == "[DONE]") continue;

                string? chunkText = null;
                try
                {
                    var node = JsonNode.Parse(jsonData);
                    chunkText = node?["candidates"]?[0]?["content"]?["parts"]?[0]?["text"]?.GetValue<string>();
                }
                catch
                {
                    // Bỏ qua lỗi parse chunk trung gian
                }

                if (!string.IsNullOrEmpty(chunkText))
                {
                    accumulatedFullText.Append(chunkText);

                    if (isBufferingMeta)
                    {
                        // Đang trong khối metadata ở cuối câu, không stream ra text thường
                        continue;
                    }

                    pendingBuffer.Append(chunkText);
                    var buf = pendingBuffer.ToString();

                    // Tìm vị trí xuất hiện sớm nhất của các tag metadata
                    int firstTagIdx = -1;
                    foreach (var tag in metaTagKeywords)
                    {
                        var idx = buf.IndexOf(tag, StringComparison.OrdinalIgnoreCase);
                        if (idx != -1 && (firstTagIdx == -1 || idx < firstTagIdx))
                        {
                            firstTagIdx = idx;
                        }
                    }

                    if (firstTagIdx != -1)
                    {
                        isBufferingMeta = true;
                        // Trích xuất toàn bộ câu chữ nằm trước tag metadata để phát ngay cho khách (không bị cụt câu)
                        var textBeforeTag = buf.Substring(0, firstTagIdx);
                        if (!string.IsNullOrEmpty(textBeforeTag))
                        {
                            yield return JsonSerializer.Serialize(new { @event = "chunk", text = textBeforeTag }, CamelCaseOptions);
                        }
                        pendingBuffer.Clear();
                    }
                    else
                    {
                        // Kiểm tra nếu buffer có chứa ký tự mở ngoặc vuông '[' ở sát cuối (dưới 15 ký tự)
                        // Giữ lại 15 ký tự cuối để kiểm tra xem chunk tiếp theo có ghép thành [GỢI_Ý không
                        var lastBracketIdx = buf.LastIndexOf('[');
                        if (lastBracketIdx != -1 && (buf.Length - lastBracketIdx < 15))
                        {
                            var safeToFlush = buf.Substring(0, lastBracketIdx);
                            if (!string.IsNullOrEmpty(safeToFlush))
                            {
                                yield return JsonSerializer.Serialize(new { @event = "chunk", text = safeToFlush }, CamelCaseOptions);
                                pendingBuffer.Clear();
                                pendingBuffer.Append(buf.Substring(lastBracketIdx));
                            }
                        }
                        else
                        {
                            yield return JsonSerializer.Serialize(new { @event = "chunk", text = buf }, CamelCaseOptions);
                            pendingBuffer.Clear();
                        }
                    }
                }
            }
        }

        // Nếu stream kết thúc mà không có tag metadata nào, xả nốt buffer còn lại
        if (!isBufferingMeta && pendingBuffer.Length > 0)
        {
            yield return JsonSerializer.Serialize(new { @event = "chunk", text = pendingBuffer.ToString() }, CamelCaseOptions);
            pendingBuffer.Clear();
        }

        // Khi stream chữ hoàn tất, phân giải metadata từ buffer và chuỗi tích lũy
        var allText = accumulatedFullText.ToString();
        var productIds = ExtractTagValues(allText, "GỢI_Ý");
        var portionTip = ExtractTagValue(allText, "KHẨU_PHẦN");
        var allergenNotice = ExtractTagValue(allText, "DỊ_ỨNG");

        // Lọc sản phẩm an toàn server-side
        var matchedProducts = ResolveSuggestedProducts(productIds, products, isNutAllergic);
        if (isNutAllergic && string.IsNullOrWhiteSpace(allergenNotice))
        {
            allergenNotice = "Lưu ý an toàn: Quý khách có cơ địa dị ứng hạt, cửa hàng khuyến nghị dùng 'Ngọc Nhãn Tiến Vua' (100% cùi nhãn sấy đối lưu thuần khiết, không chứa hạt cây).";
        }

        // Bắn event meta với CamelCaseOptions chuẩn xác (đảm bảo suggestedProducts, price, id... không bị PascalCase)
        yield return JsonSerializer.Serialize(new
        {
            @event = "meta",
            suggestedProducts = matchedProducts,
            portionTip = string.IsNullOrWhiteSpace(portionTip) ? null : portionTip,
            allergenNotice = string.IsNullOrWhiteSpace(allergenNotice) ? null : allergenNotice
        }, CamelCaseOptions);
    }

    private string BuildSystemPrompt(List<ProductResponse> products, bool isStreamingMode)
    {
        var catalogSb = new StringBuilder();
        if (products.Count > 0)
        {
            foreach (var p in products)
            {
                catalogSb.AppendLine($"- [ID: {p.Id}] Tên: \"{p.Name}\" | Quy cách: {p.Size} | Giá: {p.Price:N0}đ | Mô tả: {p.Description}");
            }
        }
        else
        {
            catalogSb.AppendLine("- [ID: default-tien-vua] Tên: \"Ngọc Nhãn Tiến Vua\" (Phiên bản Ngự Thiện) | Quy cách: 500g | Giá: 350,000đ | Mô tả: Nhãn lồng cùi dày Hương Chi sấy đối lưu thuần túy");
            catalogSb.AppendLine("- [ID: default-tu-da] Tên: Gói \"Trân Châu Tứ Dã\" | Quy cách: 500g | Giá: 320,000đ | Mô tả: Long nhãn kết hợp các loại hạt dinh dưỡng");
            catalogSb.AppendLine("- [ID: default-vong-nguyet] Tên: Lễ Hộp \"Vọng Nguyệt Thương Cảng\" | Quy cách: 1kg | Giá: 850,000đ | Mô tả: Lễ hộp quà tặng thượng phẩm Phố Hiến");
        }

        var formatInstruction = isStreamingMode
            ? @"
HƯỚNG DẪN TRẢ LỜI CHO STREAMING:
- Trả lời bằng văn bản tiếng Việt tự nhiên, ân cần, chia đoạn rõ ràng.
- TUYỆT ĐỐI KHÔNG trả lời bằng khối JSON.
- Ở cuối câu trả lời, nếu có sản phẩm phù hợp trong danh mục, đặt trên một dòng riêng biệt theo cú pháp:
[GỢI_Ý: id_san_pham_1, id_san_pham_2]
- Nếu có khẩu phần khuyến nghị ngắn gọn:
[KHẨU_PHẦN: 3 - 5 múi nhãn (15 - 20g)/ngày]
- Nếu có cảnh báo dị ứng thực sự:
[DỊ_ỨNG: ...]"
            : @"
QUY TẮC ĐỊNH DẠNG JSON ĐẦU RA BẮT BUỘC:
Bắt buộc trả về đủ cả 4 trường trong JSON object:
{
  ""reply"": ""Nội dung tư vấn chi tiết, ân cần, chia đoạn rõ ràng. Tuyệt đối không dùng dấu ngoặc kép bên trong văn bản này (thay vì viết \""Ngọc Nhãn Tiến Vua\"" hãy viết 'Ngọc Nhãn Tiến Vua')."",
  ""suggested_product_ids"": [""id-san-pham-thuc-te""],
  ""portion_tip"": ""Khẩu phần khuyến nghị ngắn gọn sạch chữ, ví dụ: '15 - 20g (khoảng 3 - 5 múi nhãn)/ngày'. Luôn cung cấp khẩu phần phù hợp."",
  ""allergen_warning"": ""Chỉ ghi khi khách hàng hỏi về dị ứng hoặc có nguy cơ dị ứng thực sự với hạt vỏ cứng (Tree nuts). Nếu an toàn hoặc không có nguy cơ, bắt buộc để chuỗi rỗng ''.""
}";

        return $@"
VAI TRÒ & NGUYÊN TẮC THƯƠNG HIỆU:
1. Bạn là ""Chuyên Viên AI Dinh Dưỡng & Dưỡng Sinh"" của Thương hiệu Đặc sản Nguyệt Nhãn Phố Hiến (Hưng Yên).
2. TUYỆT ĐỐI KHÔNG tự xưng là ""bác sĩ"", ""nhà thuốc"", ""hiệu thuốc"", ""bác sĩ kê đơn"". Bạn là chuyên gia tư vấn dinh dưỡng tự nhiên, ẩm thực bồi bổ sức khỏe và đặc sản tiến vua.
3. KHÔNG cam kết ""chữa khỏi bệnh""; chỉ dùng các cụm từ chuẩn mực: ""hỗ trợ bồi bổ khí huyết"", ""dưỡng tâm an thần"", ""cải thiện chất lượng giấc ngủ"", ""bổ sung năng lượng tự nhiên"".

PHONG CÁCH TƯ VẤN & ĐỘ SÂU TRI THỨC:
- Trả lời đầy đủ, chi tiết, ân cần và giàu kiến thức dinh dưỡng thực tiễn (độ dài lý tưởng 1200 - 2200 ký tự).
- Khi người dùng hỏi về công thức dưỡng sinh, cách hãm trà, nấu chè hạt sen long nhãn hay bài thuốc ẩm thực dân gian:
  + Nêu rõ nguyên liệu chuẩn bị và định lượng cụ thể.
  + Hướng dẫn chi tiết từng bước sơ chế, chế biến và thời gian nấu để giữ trọn dưỡng chất.
  + Giải thích cơ chế dưỡng sinh theo y học cổ truyền (bổ khí huyết, dưỡng tâm, an thần, kiện tỳ vị).
  + Đưa ra lời khuyên về thời điểm dùng tốt nhất trong ngày và đối tượng phù hợp.

HƯỚNG DẪN TƯ VẤN CÁ NHÂN HÓA THEO THỂ TRẠNG (KHI CÓ [THÔNG TIN THỂ TRẠNG]):
Khi nhận được [THÔNG TIN THỂ TRẠNG KHÁCH HÀNG ĐANG CHỌN], BẮT BUỘC bạn phải mở đầu bằng việc ghi nhận thể trạng của khách và cá nhân hóa sâu sắc lời khuyên:
- Ăn kiêng, giảm calo, duy trì vóc dáng:
  + Phân tích calo tự nhiên của long nhãn (khoảng 280 kcal/100g sấy khô, vị ngọt tự nhiên không thêm đường tinh luyện).
  + Định lượng & cách dùng: Khuyên dùng 10 - 15g/ngày (khoảng 3 - 5 múi nhãn), dùng vào bữa phụ sáng hoặc xế chiều trước khi vận động; TUYỆT ĐỐI không ăn sau 20h tối. Nên kết hợp pha trà thảo mộc (cúc la mã, hoa nhài) hoặc dùng kèm một lượng nhỏ macca/hạnh nhân để bổ sung chất béo tốt không bão hòa, tạo cảm giác no lâu và không làm đường huyết tăng vọt.
  + Sản phẩm đề xuất: 'Ngọc Nhãn Tiến Vua' (nhãn nguyên chất) hoặc 'Trân Châu Tứ Dã' (hạt dinh dưỡng kiểm soát khẩu phần).
- Mất ngủ, khó ngủ, dưỡng tâm an thần:
  + Phân tích cơ chế Y học cổ truyền: Long nhãn quy kinh Tâm và Tỳ, ích khí bổ huyết, dưỡng tâm an thần, cải thiện rõ rệt chứng lo âu, hồi hộp, khó vào giấc hoặc hay mộng mị.
  + Hướng dẫn công thức vàng: Hãm trà long nhãn táo đỏ kỷ tử hạt sen hoặc nấu chè hạt sen long nhãn Phố Hiến (ít ngọt), dùng ấm trước khi đi ngủ 1 - 2 tiếng.
  + Sản phẩm đề xuất: 'Ngọc Nhãn Tiến Vua' làm cốt liệu nấu chè/hãm trà thượng hạng.
- Phụ nữ mang thai / sau sinh cần bồi bổ:
  + Phân tích: Long nhãn giàu sắt, vitamin nhóm B và khoáng chất tự nhiên giúp phục hồi khí huyết, giảm mệt mỏi.
  + Lưu ý quan trọng: Phụ nữ mang thai 3 tháng đầu chỉ dùng lượng nhỏ thăm dò (5 - 10g), lắng nghe cơ thể; phụ nữ sau sinh và cho con bú dùng rất tốt để kích thích khí huyết và chất lượng sữa mẹ.
  + Sản phẩm đề xuất: 'Ngọc Nhãn Tiến Vua' hoặc Lễ Hộp 'Vọng Nguyệt Thương Cảng'.
- Cơ địa dị ứng hạt:
  + Cảnh báo an toàn: Quý khách dị ứng hạt vỏ cứng (Tree nuts) KHÔNG ĐƯỢC dùng dòng 'Trân Châu Tứ Dã' (vì có hạt điều, hạnh nhân, macca).
  + Sản phẩm đề xuất: 'Ngọc Nhãn Tiến Vua' 100% cùi long nhãn sấy đối lưu thuần khiết, hoàn toàn KHÔNG chứa hạt cây, an toàn tuyệt đối.

DANH MỤC SẢN PHẨM THỰC TẾ ĐANG KINH DOANH:
{catalogSb}

QUY TẮC BẮT BUỘC VỀ SẢN PHẨM & DỊ ỨNG:
- CHỈ ĐƯỢC GỢI Ý sản phẩm có thực trong danh mục trên. TUYỆT ĐỐI KHÔNG tự bịa ra sản phẩm mới.
- NGUY TẮC AN TOÀN DỊ ỨNG:
  + Gói 'Trân Châu Tứ Dã' có chứa hạt dinh dưỡng (hạt điều, hạnh nhân, macca...). NẾU KHÁCH CÓ TIỀN SỬ DỊ ỨNG HẠT, CẤM GỢI Ý DÒNG NÀY!
  + 'Ngọc Nhãn Tiến Vua' là 100% cùi nhãn Hương Chi thuần túy sấy đối lưu, hoàn toàn không chứa hạt cây, an toàn tuyệt đối cho người dị ứng hạt.
- Khi khách hỏi công thức món ăn (chè hạt sen, trà cúc dưỡng nhan...), hướng dẫn tự nấu ở nhà và gợi ý dùng 'Ngọc Nhãn Tiến Vua' làm nguyên liệu cốt lõi.
- TUYỆT ĐỐI KHÔNG tư vấn, không gợi ý và không nhắc đến 'hạt óc chó' trong các câu trả lời hay công thức (cửa hàng Nguyệt Nhãn Phố Hiến hoàn toàn KHÔNG kinh doanh và KHÔNG sử dụng hạt óc chó; nếu khách hỏi riêng về hạt óc chó, hãy thông báo lịch sự rằng cửa hàng không có sản phẩm hạt óc chó và gợi ý các loại hạt dinh dưỡng sẵn có như hạnh nhân, macca, hạt điều, hạt sen hoặc long nhãn tiến vua).

{formatInstruction}
";
    }

    private object BuildGeminiPayload(NutritionConsultationRequest request, string systemInstruction, bool useJsonSchema)
    {
        var contents = new List<object>();

        if (request.History != null && request.History.Count > 0)
        {
            foreach (var h in request.History.TakeLast(6))
            {
                var role = h.Role.ToLower() == "assistant" || h.Role.ToLower() == "model" ? "model" : "user";
                contents.Add(new
                {
                    role = role,
                    parts = new[] { new { text = h.Content } }
                });
            }
        }

        var userPrompt = new StringBuilder();
        var hasHealthProfile = request.HealthProfile != null && (
            !string.IsNullOrWhiteSpace(request.HealthProfile.Goal) ||
            !string.IsNullOrWhiteSpace(request.HealthProfile.HealthCondition) ||
            (request.HealthProfile.Allergens != null && request.HealthProfile.Allergens.Count > 0));

        if (hasHealthProfile)
        {
            userPrompt.AppendLine("[THÔNG TIN THỂ TRẠNG KHÁCH HÀNG ĐANG CHỌN]");
            if (!string.IsNullOrEmpty(request.HealthProfile!.Goal))
                userPrompt.AppendLine($"- Mục tiêu thể trạng: {request.HealthProfile.Goal}");
            if (!string.IsNullOrEmpty(request.HealthProfile.HealthCondition))
                userPrompt.AppendLine($"- Tình trạng sức khỏe đặc biệt: {request.HealthProfile.HealthCondition}");
            if (request.HealthProfile.Allergens != null && request.HealthProfile.Allergens.Count > 0)
                userPrompt.AppendLine($"- Dị ứng: {string.Join(", ", request.HealthProfile.Allergens)}");
            userPrompt.AppendLine("(LƯU Ý BẮT BUỘC CHO AI: Khách hàng đang chọn thể trạng này. BẮT BUỘC mở đầu bằng việc ghi nhận thể trạng của khách và tư vấn chuyên sâu, khẩu phần cùng sản phẩm phù hợp nhất theo thể trạng này!)");
            userPrompt.AppendLine();
        }

        userPrompt.Append(request.Message);

        contents.Add(new
        {
            role = "user",
            parts = new[] { new { text = userPrompt.ToString() } }
        });

        object generationConfig;
        if (useJsonSchema)
        {
            generationConfig = new
            {
                temperature = 0.5,
                maxOutputTokens = 3500,
                response_mime_type = "application/json",
                response_schema = new
                {
                    type = "OBJECT",
                    properties = new
                    {
                        reply = new { type = "STRING", description = "Văn bản tư vấn tiếng Việt chi tiết, sâu sắc" },
                        suggested_product_ids = new { type = "ARRAY", items = new { type = "STRING" } },
                        portion_tip = new { type = "STRING", description = "Khẩu phần khuyến nghị mỗi ngày" },
                        allergen_warning = new { type = "STRING", description = "Cảnh báo dị ứng nếu có nguy cơ" }
                    },
                    required = new[] { "reply", "suggested_product_ids", "portion_tip", "allergen_warning" }
                }
            };
        }
        else
        {
            generationConfig = new
            {
                temperature = 0.6,
                maxOutputTokens = 3500
            };
        }

        return new
        {
            system_instruction = new
            {
                parts = new[] { new { text = systemInstruction } }
            },
            contents = contents,
            generationConfig = generationConfig
        };
    }

    /// <summary>
    /// Thuật toán JSON Repair đa tầng: Đảm bảo khách hàng KHÔNG BAO GIỜ nhận raw JSON syntax.
    /// </summary>
    private bool TryParseOrRepairGeminiJson(
        string rawText,
        out string reply,
        out List<string> productIds,
        out string? portionTip,
        out string? allergenWarning)
    {
        productIds = new List<string>();
        portionTip = null;
        allergenWarning = null;

        var cleaned = StripMarkdownCodeBlocks(rawText);

        // Lớp 1: Thử parse chuẩn bằng JsonNode
        try
        {
            var node = JsonNode.Parse(cleaned);
            if (node != null && node["reply"] != null)
            {
                reply = node["reply"]!.GetValue<string>();
                portionTip = CleanMetadataString(node["portion_tip"]?.GetValue<string>());
                allergenWarning = CleanMetadataString(node["allergen_warning"]?.GetValue<string>());

                var arr = node["suggested_product_ids"]?.AsArray();
                if (arr != null)
                {
                    foreach (var item in arr)
                    {
                        var val = item?.GetValue<string>()?.Trim();
                        if (!string.IsNullOrEmpty(val)) productIds.Add(val);
                    }
                }
                return true;
            }
        }
        catch
        {
            // JsonNode.Parse thất bại do lỗi cú pháp unescaped quote -> chuyển sang Lớp 2
        }

        // Lớp 2: Regex Repair trích xuất an toàn các trường
        try
        {
            // Trích xuất "reply"
            var matchReply = Regex.Match(cleaned, @"[""']reply[""']\s*:\s*""([\s\S]*?)""\s*,\s*[""'](?:suggested_product_ids|portion_tip|allergen_warning)""", RegexOptions.IgnoreCase);
            if (!matchReply.Success)
            {
                matchReply = Regex.Match(cleaned, @"[""']reply[""']\s*:\s*""([\s\S]*?)""\s*\}?\s*$", RegexOptions.IgnoreCase);
            }

            if (matchReply.Success)
            {
                reply = matchReply.Groups[1].Value.Replace("\\\"", "\"").Replace("\\n", "\n").Trim();
            }
            else
            {
                // Nếu regex cũng không bắt được chuỗi đóng mở quote, làm sạch toàn bộ cú pháp JSON
                reply = SanitizeJsonArtifacts(cleaned);
            }

            // Trích xuất "portion_tip"
            var matchPortion = Regex.Match(cleaned, @"[""']portion_tip[""']\s*:\s*""([\s\S]*?)""(?:\s*,\s*[""']|\s*\})", RegexOptions.IgnoreCase);
            if (matchPortion.Success)
            {
                portionTip = CleanMetadataString(matchPortion.Groups[1].Value);
            }

            // Trích xuất "allergen_warning"
            var matchAllergen = Regex.Match(cleaned, @"[""']allergen_warning[""']\s*:\s*""([\s\S]*?)""(?:\s*,\s*[""']|\s*\})", RegexOptions.IgnoreCase);
            if (matchAllergen.Success)
            {
                allergenWarning = CleanMetadataString(matchAllergen.Groups[1].Value);
            }

            // Trích xuất "suggested_product_ids"
            var matchIds = Regex.Match(cleaned, @"[""']suggested_product_ids[""']\s*:\s*\[([\s\S]*?)\]", RegexOptions.IgnoreCase);
            if (matchIds.Success)
            {
                var idMatches = Regex.Matches(matchIds.Groups[1].Value, @"[""']([a-zA-Z0-9_\-]+)[""']");
                foreach (Match m in idMatches)
                {
                    productIds.Add(m.Groups[1].Value);
                }
            }

            return true;
        }
        catch
        {
            // Lớp 3: Fallback phòng vệ cao nhất -> Làm sạch hoàn toàn, không lộ JSON thô
            reply = SanitizeJsonArtifacts(cleaned);
            return false;
        }
    }

    private string SanitizeJsonArtifacts(string text)
    {
        var res = text;
        // Bỏ ký tự đầu/cuối của json object
        res = Regex.Replace(res, @"^[\s\{]*""reply""\s*:\s*""?", "", RegexOptions.IgnoreCase);
        res = Regex.Replace(res, @"""\s*,\s*""(?:suggested_product_ids|portion_tip|allergen_warning)[\s\S]*$", "", RegexOptions.IgnoreCase);
        res = Regex.Replace(res, @"[\}\]]+\s*$", "");
        res = res.Replace("\\\"", "\"").Replace("\\n", "\n").Trim();
        return string.IsNullOrWhiteSpace(res) ? "Chào bạn, chuyên gia dinh dưỡng Nguyệt Nhãn Phố Hiến rất vui được hỗ trợ tư vấn cho bạn!" : res;
    }

    private string StripMarkdownCodeBlocks(string text)
    {
        var trimmed = text.Trim();
        if (trimmed.StartsWith("```json", StringComparison.OrdinalIgnoreCase))
        {
            trimmed = trimmed.Substring(7);
        }
        else if (trimmed.StartsWith("```"))
        {
            trimmed = trimmed.Substring(3);
        }

        if (trimmed.EndsWith("```"))
        {
            trimmed = trimmed.Substring(0, trimmed.Length - 3);
        }
        return trimmed.Trim();
    }

    private bool DetectNutAllergy(NutritionConsultationRequest request)
    {
        // 1. Kiểm tra trong HealthProfile
        if (request.HealthProfile?.Allergens != null && request.HealthProfile.Allergens.Any())
        {
            var allergens = string.Join(" ", request.HealthProfile.Allergens).ToLowerInvariant();
            if (allergens.Contains("hạt") || allergens.Contains("điều") || allergens.Contains("hạnh nhân") ||
                allergens.Contains("macca") || allergens.Contains("nut"))
            {
                return true;
            }
        }

        // 2. Kiểm tra trong tin nhắn hiện tại
        var msg = request.Message.ToLowerInvariant();
        if (msg.Contains("dị ứng hạt") || msg.Contains("dị ứng điều") || msg.Contains("dị ứng hạnh nhân") ||
            msg.Contains("dị ứng đậu phộng") || msg.Contains("dị ứng macca") ||
            msg.Contains("bị dị ứng"))
        {
            return true;
        }

        return false;
    }

    private List<SuggestedProductDto> ResolveSuggestedProducts(
        List<string> productIds, 
        List<ProductResponse> allProducts, 
        bool isNutAllergic)
    {
        var result = new List<SuggestedProductDto>();
        if (allProducts.Count == 0) return result;

        foreach (var id in productIds)
        {
            var match = allProducts.FirstOrDefault(p =>
                p.Id.ToString().Equals(id, StringComparison.OrdinalIgnoreCase) ||
                p.Name.Contains(id, StringComparison.OrdinalIgnoreCase) ||
                id.Contains(p.Name, StringComparison.OrdinalIgnoreCase));

            if (match != null && !result.Any(r => r.Id == match.Id.ToString()))
            {
                // Áp dụng bộ lọc an toàn dị ứng phía server
                if (ProductSafetyRegistry.IsSafeForUser(match.Id.ToString(), match.Name, isNutAllergic))
                {
                    result.Add(new SuggestedProductDto
                    {
                        Id = match.Id.ToString(),
                        Name = match.Name,
                        Size = match.Size,
                        Price = match.Price,
                        ImageUrl = ResolveProductThumbnail(match.Name, match.Images),
                        Reason = "Sản phẩm thượng phẩm phù hợp với nhu cầu chăm sóc sức khỏe của bạn"
                    });
                }
            }
        }

        // Nếu khách bị dị ứng hạt mà chưa có sản phẩm nào an toàn được chọn, tự động gợi ý "Ngọc Nhãn Tiến Vua"
        if (isNutAllergic && result.Count == 0)
        {
            var safeMatch = allProducts.FirstOrDefault(p => p.Name.Contains("Tiến Vua", StringComparison.OrdinalIgnoreCase));
            if (safeMatch != null)
            {
                result.Add(new SuggestedProductDto
                {
                    Id = safeMatch.Id.ToString(),
                    Name = safeMatch.Name,
                    Size = safeMatch.Size,
                    Price = safeMatch.Price,
                    ImageUrl = ResolveProductThumbnail(safeMatch.Name, safeMatch.Images),
                    Reason = "100% Cùi long nhãn sấy đối lưu thuần túy, hoàn toàn an toàn cho người dị ứng hạt"
                });
            }
        }

        return result;
    }

    private static string ResolveProductThumbnail(string productName, List<ProductImageResponse>? images)
    {
        // 1. Ưu tiên tuyệt đối ảnh thật do admin upload trong DB nếu có
        var first = images?.OrderBy(i => i.DisplayOrder).FirstOrDefault()?.ImagePath;
        if (!string.IsNullOrWhiteSpace(first))
        {
            return first;
        }

        // 2. Chỉ fallback ảnh tĩnh tương ứng khi sản phẩm chưa có ảnh upload trong DB
        var name = (productName ?? "").ToLowerInvariant();
        if (name.Contains("tiến vua") || name.Contains("ngự thiện") || name.Contains("hộp"))
        {
            return "/images/hopnhua.jpg";
        }
        if (name.Contains("tứ dã") || name.Contains("trân châu") || name.Contains("túi") || name.Contains("gói"))
        {
            return "/images/tuizip.jpg";
        }
        if (name.Contains("vọng nguyệt") || name.Contains("thương cảng") || name.Contains("set") || name.Contains("lễ hộp"))
        {
            return "/images/setqua.jpg";
        }

        return "/images/hopnhua.jpg";
    }

    private List<string> ExtractTagValues(string text, string tagName)
    {
        var result = new List<string>();
        var pattern = $@"\[{tagName}:\s*([^\]]+)\]";
        var match = Regex.Match(text, pattern, RegexOptions.IgnoreCase);
        if (match.Success)
        {
            var values = match.Groups[1].Value.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries);
            foreach (var v in values)
            {
                var clean = v.Trim();
                if (!string.IsNullOrEmpty(clean)) result.Add(clean);
            }
        }
        return result;
    }

    private string? ExtractTagValue(string text, string tagName)
    {
        var pattern = $@"\[{tagName}:\s*([^\]]+)\]";
        var match = Regex.Match(text, pattern, RegexOptions.IgnoreCase);
        return match.Success ? CleanMetadataString(match.Groups[1].Value) : null;
    }

    private string? CleanMetadataString(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return null;
        var clean = text.Replace("**", "").Replace("###", "").Trim();
        return string.IsNullOrWhiteSpace(clean) ? null : clean;
    }
}
