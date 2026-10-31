"use client";

import { useState, useRef, useEffect, useId } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  Plus,
  AlertCircle,
  ShieldAlert,
  Leaf,
  CheckCircle2,
  MessageSquareShare
} from "lucide-react";
import {
  nutritionAiApi,
  type SuggestedProduct,
  type NutritionStreamMeta
} from "@/services/api.service";
import { useCartStore } from "@/stores/useCartStore";
import type { ProductResponse } from "@/types/api.types";
import { FastImage, resolveImageUrl } from "@/components/FastImage";

interface MessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
  suggestedProducts?: SuggestedProduct[];
  portionTip?: string;
  allergenNotice?: string;
  isStreaming?: boolean;
}

interface NutritionAiWidgetProps {
  language?: "vi" | "en";
  isKeyboardOpen?: boolean;
  onSwitchToLiveChat?: () => void;
}

const QUICK_PROMPTS = [
  {
    icon: "🥑",
    label: "Ăn hạt mix có sợ béo?",
    prompt: "Tôi đang ăn kiêng sợ béo, ăn long nhãn mix cùng các loại hạt macca, hạnh nhân có an toàn và không bị tăng cân không?",
    autoAllergy: false
  },
  {
    icon: "🌙",
    label: "Mất ngủ, khó ngủ",
    prompt: "Tôi hay bị mất ngủ, trằn trọc thì dùng Long nhãn ôm hạt sen hay trà dưỡng nhan thế nào để ngủ sâu giấc?",
    autoAllergy: false
  },
  {
    icon: "🤰",
    label: "Dinh dưỡng mẹ bầu",
    prompt: "Mẹ bầu hoặc phụ nữ sau sinh thì nên chọn loại hạt dinh dưỡng mix nào và liều lượng bao nhiêu là tốt nhất?",
    autoAllergy: false
  },
  {
    icon: "⚠️",
    label: "Kiểm tra dị ứng hạt",
    prompt: "Tôi có cơ địa dị ứng hạt vỏ cứng (hạt điều, hạnh nhân, macca), cửa hàng có sản phẩm long nhãn nào an toàn tuyệt đối không chứa hạt không?",
    autoAllergy: true
  }
];

// Hàm fallback thumbnail bao bì khi sản phẩm chưa có ảnh upload hoặc ảnh bị 404
function getProductPackagingFallback(name?: string): string {
  const n = (name || "").toLowerCase();
  if (n.includes("tiến vua") || n.includes("ngự thiện") || n.includes("hộp")) {
    return "/images/hopnhua.jpg";
  }
  if (n.includes("tứ dã") || n.includes("trân châu") || n.includes("túi") || n.includes("gói")) {
    return "/images/tuizip.jpg";
  }
  if (n.includes("vọng nguyệt") || n.includes("thương cảng") || n.includes("set") || n.includes("lễ hộp")) {
    return "/images/setqua.jpg";
  }
  return "/images/hopnhua.jpg";
}

// Ưu tiên đường dẫn ảnh thật của sản phẩm từ DB/admin, chỉ fallback ảnh bao bì khi chưa có
function getProductThumbnail(prod: { name?: string; imageUrl?: string }): string {
  if (prod.imageUrl && (prod.imageUrl.startsWith("http") || prod.imageUrl.startsWith("/uploads/") || prod.imageUrl.startsWith("/images/"))) {
    return resolveImageUrl(prod.imageUrl);
  }
  return getProductPackagingFallback(prod.name);
}

// Bộ định dạng Markdown an toàn, không phụ thuộc thư viện ngoài
function FormattedMessage({ content }: { content: string }) {
  const lines = content.split("\n");

  const renderInline = (str: string) => {
    // Tách bold **bold**
    const parts = str.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-bold text-amber-950">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-1.5 text-xs sm:text-[13px] leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Tiêu đề ### hoặc ##
        if (trimmed.startsWith("### ")) {
          return (
            <h5 key={idx} className="font-bold text-amber-900 text-xs sm:text-[13px] mt-2 mb-0.5">
              {renderInline(trimmed.slice(4))}
            </h5>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h4 key={idx} className="font-bold text-amber-950 text-sm mt-2.5 mb-1">
              {renderInline(trimmed.slice(3))}
            </h4>
          );
        }

        // Danh sách gạch đầu dòng * hoặc -
        if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1 my-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
              <span>{renderInline(trimmed.slice(2))}</span>
            </div>
          );
        }

        // Danh sách đánh số 1. 2.
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1 my-0.5">
              <span className="font-bold text-amber-700 text-[11px] shrink-0 mt-0.5 min-w-[14px]">
                {numMatch[1]}.
              </span>
              <span>{renderInline(numMatch[2])}</span>
            </div>
          );
        }

        return <p key={idx}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

export function NutritionAiWidget({ language = "vi", isKeyboardOpen = false, onSwitchToLiveChat }: NutritionAiWidgetProps) {
  const instanceId = useId();
  const seqRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Bộ chọn thể trạng sức khỏe (Health Profile State)
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [isNutAllergic, setIsNutAllergic] = useState<boolean>(false);

  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "welcome-init",
      role: "assistant",
      content: language === "en"
        ? "Hello! I am your AI Nutrition & Wellness Advisor from Nguyet Nhan Pho Hien. Our specialty blends include convection-dried longan and nutrient-dense tree nuts (lotus seeds, macadamia, almonds, cashews). How may I assist your health and wellness goals today?"
        : "Kính chào quý khách! Tôi là Chuyên Viên AI Dinh Dưỡng & Dưỡng Sinh Nguyệt Nhãn Phố Hiến. Dòng sản phẩm của chúng tôi là sự kết hợp tinh hoa giữa Long Nhãn sấy đối lưu và Hệ sinh thái Hạt dinh dưỡng cao cấp (Hạt sen, Macca, Hạnh nhân, Điều, Bí xanh). Quý khách đang cần tư vấn cho thể trạng hoặc mục tiêu sức khỏe nào ạ?",
      time: "Vừa xong"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const isTypingMode = isKeyboardOpen || isInputFocused;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const addItemToCart = useCartStore((state) => state.addItem);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleSendMessage = async (
    textToSend?: string,
    overrideGoal?: string | null,
    overrideNutAllergic?: boolean
  ) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    // Tăng tuần tự ID an toàn
    seqRef.current += 1;
    const userSeq = seqRef.current;
    seqRef.current += 1;
    const aiSeq = seqRef.current;

    const userMessage: MessageItem = {
      id: `usr-${instanceId}-${userSeq}`,
      role: "user",
      content: text,
      time: "Vừa xong"
    };

    const aiMessageId = `ai-${instanceId}-${aiSeq}`;
    const initialAiMessage: MessageItem = {
      id: aiMessageId,
      role: "assistant",
      content: "",
      time: "Vừa xong",
      isStreaming: true
    };

    setMessages((prev) => [...prev, userMessage, initialAiMessage]);
    if (!textToSend) setInput("");
    setIsLoading(true);
    setErrorMsg(null);

    // Chuẩn bị lịch sử hội thoại gần nhất
    const history = messages
      .filter((m) => m.content.trim().length > 0)
      .slice(-4)
      .map((m) => ({
        role: m.role,
        content: m.content
      }));

    // Chuẩn bị Health Profile (ưu tiên giá trị truyền trực tiếp khi vừa bấm nút để tránh race-condition)
    const activeGoal = overrideGoal !== undefined ? overrideGoal : selectedGoal;
    const activeNutAllergic = overrideNutAllergic !== undefined ? overrideNutAllergic : isNutAllergic;

    let goalDescription: string | undefined = undefined;
    if (activeGoal === "diet") goalDescription = "Ăn kiêng, giảm calo, duy trì vóc dáng";
    else if (activeGoal === "insomnia") goalDescription = "Mất ngủ, khó ngủ, dưỡng tâm an thần";
    else if (activeGoal === "pregnancy") goalDescription = "Phụ nữ mang thai / sau sinh cần bồi bổ";

    const hasAnyProfile = !!goalDescription || activeGoal === "pregnancy" || activeNutAllergic;
    const healthProfile = hasAnyProfile
      ? {
          goal: goalDescription,
          healthCondition: activeGoal === "pregnancy" ? "Phụ nữ mang thai / đang cho con bú" : undefined,
          allergens: activeNutAllergic ? ["Hạt vỏ cứng (Tree nuts)", "Hạt điều", "Hạnh nhân", "Macca"] : undefined
        }
      : undefined;

    // Khởi tạo AbortController mới
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await nutritionAiApi.stream(
        {
          message: text,
          history,
          healthProfile
        },
        {
          onChunk: (chunk: string) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? { ...msg, content: msg.content + chunk }
                  : msg
              )
            );
          },
          onMeta: (meta: NutritionStreamMeta) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? {
                      ...msg,
                      suggestedProducts: meta.suggestedProducts,
                      portionTip: meta.portionTip,
                      allergenNotice: meta.allergenNotice
                    }
                  : msg
              )
            );
          },
          onError: (err: Error) => {
            console.error("Lỗi stream SSE AI:", err);
            setErrorMsg(err.message || "Không thể kết nối đến Trợ lý AI.");
          },
          onDone: () => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? { ...msg, isStreaming: false }
                  : msg
              )
            );
            setIsLoading(false);
          }
        },
        controller.signal
      );
    } catch (err: unknown) {
      console.error("AI consultation request error:", err);
      const msg = err instanceof Error ? err.message : "Không thể kết nối đến Trợ lý AI. Vui lòng thử lại sau ít giây.";
      setErrorMsg(msg);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMessageId
            ? {
                ...m,
                content: m.content || "Đã có sự gián đoạn tạm thời khi kết nối với Chuyên gia AI Dinh Dưỡng. Quý khách vui lòng thử lại sau ít giây nhé!",
                isStreaming: false
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (product: SuggestedProduct) => {
    const fallbackThumb = getProductPackagingFallback(product.name);
    const cartProduct: ProductResponse = {
      id: product.id,
      name: product.name || "Sản phẩm",
      price: product.price ?? 0,
      size: product.size || "",
      description: product.reason || "",
      isActive: true,
      displayOrder: 1,
      images: [
        {
          id: "img-" + product.id,
          imagePath: product.imageUrl || fallbackThumb,
          displayOrder: 1
        }
      ]
    };
    addItemToCart(cartProduct);
  };

  const handleGoalSelect = (goal: "diet" | "insomnia" | "pregnancy") => {
    if (isLoading) return;

    if (selectedGoal === goal) {
      // Bấm lần thứ hai để hủy chọn thể trạng
      setSelectedGoal(null);
      return;
    }

    setSelectedGoal(goal);

    // Kích hoạt ngay tư vấn chuyên sâu theo thể trạng vừa chọn
    const goalPrompts: Record<string, string> = {
      diet: "Tôi đang theo chế độ ăn kiêng, giảm calo và giữ vóc dáng. Với thể trạng này, tôi nên sử dụng long nhãn và các sản phẩm của cửa hàng như thế nào để vừa đủ chất vừa không lo tăng cân?",
      insomnia: "Tôi thường xuyên bị khó ngủ, mất ngủ, ngủ không sâu giấc. Hãy tư vấn giúp tôi liệu trình dưỡng tâm an thần và sản phẩm phù hợp từ Nguyệt Nhãn Phố Hiến.",
      pregnancy: "Tôi là phụ nữ mang thai / sau sinh cần bồi bổ sức khỏe. Hãy tư vấn giúp tôi chế độ dinh dưỡng an toàn và các dòng sản phẩm phù hợp cho mẹ và bé."
    };

    handleSendMessage(goalPrompts[goal], goal, isNutAllergic);
  };

  const handleNutAllergyToggle = () => {
    if (isLoading) return;
    const nextVal = !isNutAllergic;
    setIsNutAllergic(nextVal);

    if (nextVal) {
      handleSendMessage(
        "Tôi có cơ địa dị ứng hạt vỏ cứng (Tree nuts). Cửa hàng có dòng sản phẩm nào an toàn tuyệt đối không chứa hạt cây để tôi sử dụng an tâm không?",
        selectedGoal,
        true
      );
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-stone-50/40 w-full overflow-hidden">
      {/* 1. Bộ chọn thể trạng nhanh (Health Profile Chips) - ẩn khi đang gõ chữ để nhường diện tích xem tin nhắn */}
      {!isTypingMode && (
        <div className="px-3 sm:px-4 py-2 bg-gradient-to-r from-amber-100/80 via-amber-50 to-orange-50/60 border-b border-amber-200/70 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar overscroll-x-contain shrink-0">
          <span className="text-[11px] font-bold text-amber-950 shrink-0 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-[#B45309]" />
            {language === "en" ? "Profile:" : "Thể trạng:"}
          </span>

          <button
            onClick={() => handleGoalSelect("diet")}
            disabled={isLoading}
            className={`min-h-[30px] sm:min-h-[28px] text-[11px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-full border transition-all shrink-0 font-medium disabled:opacity-50 active:scale-95 touch-manipulation ${
              selectedGoal === "diet"
                ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                : "bg-white text-stone-700 border-amber-200 hover:bg-amber-50"
            }`}
            title="Tối ưu calo, thực đơn lành mạnh"
          >
            🌿 Ăn kiêng
          </button>

          <button
            onClick={() => handleGoalSelect("insomnia")}
            disabled={isLoading}
            className={`min-h-[30px] sm:min-h-[28px] text-[11px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-full border transition-all shrink-0 font-medium disabled:opacity-50 active:scale-95 touch-manipulation ${
              selectedGoal === "insomnia"
                ? "bg-indigo-600 text-white border-indigo-700 shadow-xs"
                : "bg-white text-stone-700 border-amber-200 hover:bg-amber-50"
            }`}
            title="Dưỡng tâm an thần, giấc ngủ ngon"
          >
            🌙 Trị mất ngủ
          </button>

          <button
            onClick={() => handleGoalSelect("pregnancy")}
            disabled={isLoading}
            className={`min-h-[30px] sm:min-h-[28px] text-[11px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-full border transition-all shrink-0 font-medium disabled:opacity-50 active:scale-95 touch-manipulation ${
              selectedGoal === "pregnancy"
                ? "bg-pink-600 text-white border-pink-700 shadow-xs"
                : "bg-white text-stone-700 border-amber-200 hover:bg-amber-50"
            }`}
            title="Bổ huyết, vi khoáng cho mẹ"
          >
            🤰 Mẹ bầu
          </button>

          <button
            onClick={handleNutAllergyToggle}
            disabled={isLoading}
            className={`min-h-[30px] sm:min-h-[28px] text-[11px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-full border transition-all shrink-0 font-bold flex items-center gap-1 disabled:opacity-50 active:scale-95 touch-manipulation ${
              isNutAllergic
                ? "bg-rose-600 text-white border-rose-700 shadow-xs animate-pulse"
                : "bg-white text-rose-700 border-rose-200 hover:bg-rose-50"
            }`}
            title="Bật/Tắt chế độ cảnh báo và loại trừ sản phẩm chứa hạt"
          >
            <span>⚠️</span>
            <span>{isNutAllergic ? "Đã lọc: Dị ứng hạt" : "Dị ứng hạt"}</span>
          </button>
        </div>
      )}

      {/* 2. Gợi ý câu hỏi nhanh (Prompt Suggestions) - ẩn khi đang gõ chữ */}
      {!isTypingMode && (
        <div className="px-3 sm:px-4 py-2 bg-stone-50/80 border-b border-amber-200/60 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar overscroll-x-contain shrink-0">
          <span className="text-[11px] font-semibold text-amber-900 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#B45309]" />
            {language === "en" ? "Questions:" : "Gợi ý hỏi:"}
          </span>
          {QUICK_PROMPTS.map((item, idx) => (
            <button
              key={idx}
              disabled={isLoading}
              onClick={() => {
                const nextAllergy = item.autoAllergy ? true : isNutAllergic;
                if (item.autoAllergy) setIsNutAllergic(true);
                handleSendMessage(item.prompt, selectedGoal, nextAllergy);
              }}
              className="min-h-[30px] sm:min-h-[28px] text-xs bg-white hover:bg-amber-50/80 text-amber-950 border border-amber-200/90 px-3 py-1 rounded-full whitespace-nowrap shadow-2xs transition-all active:scale-95 shrink-0 flex items-center gap-1.5 disabled:opacity-50 touch-manipulation"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* 3. Khung hội thoại tin nhắn */}
      <div className="flex-1 min-h-0 p-3 sm:p-4 overflow-y-auto space-y-3.5 bg-gradient-to-b from-stone-50/30 via-transparent to-white/50 custom-chat-scrollbar overscroll-contain">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`p-3.5 sm:p-4 rounded-2xl leading-relaxed shadow-xs ${
                msg.role === "user"
                  ? "max-w-[88%] sm:max-w-[82%] bg-gradient-to-br from-[#B45309] to-[#92400E] text-white rounded-br-xs text-[13.5px] sm:text-sm"
                  : "max-w-[92%] sm:max-w-[85%] bg-white border border-amber-100/90 text-stone-900 rounded-tl-xs text-[13.5px] sm:text-sm"
              }`}
            >
              {/* Role badge cho Chuyên Viên AI */}
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#B45309] mb-2 pb-1.5 border-b border-amber-100/80">
                  <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Chuyên Viên AI Dinh Dưỡng Phố Hiến</span>
                </div>
              )}

              {/* Nội dung tư vấn */}
              {msg.role === "assistant" && !msg.content ? (
                <div className="flex items-center gap-2 py-1 text-xs text-amber-900">
                  <Loader2 className="w-3.5 h-3.5 text-[#B45309] animate-spin shrink-0" />
                  <span>Chuyên gia AI đang phân tích dữ liệu dinh dưỡng...</span>
                </div>
              ) : (
                <div>
                  <FormattedMessage content={msg.content} />
                  {msg.isStreaming && (
                    <span className="inline-block w-1.5 h-3.5 bg-amber-600 animate-pulse ml-0.5 align-middle" />
                  )}
                </div>
              )}

              {/* Banner khẩu phần khuyến nghị */}
              {msg.portionTip && (
                <div className="mt-2.5 p-2.5 bg-emerald-50/90 border border-emerald-200/80 rounded-xl text-xs text-emerald-950 flex items-start gap-2 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Khẩu phần khuyến nghị:</strong> {msg.portionTip}</span>
                </div>
              )}

              {/* Banner cảnh báo an toàn dị ứng */}
              {msg.allergenNotice && (
                <div className="mt-2.5 p-2.5 bg-rose-50/90 border border-rose-200/80 rounded-xl text-xs text-rose-950 flex items-start gap-2 shadow-2xs">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>Lưu ý an toàn:</strong> {msg.allergenNotice}</span>
                </div>
              )}

              {/* Danh sách thẻ sản phẩm gợi ý */}
              {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-amber-100/80 space-y-2">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-amber-800 block">
                    🌿 Sản phẩm phù hợp từ cửa hàng:
                  </span>
                  {msg.suggestedProducts.map((prod) => {
                    const mainThumb = getProductThumbnail(prod);
                    const fallbackThumb = getProductPackagingFallback(prod.name);
                    return (
                      <div
                        key={prod.id}
                        className="bg-amber-50/60 hover:bg-amber-100/50 border border-amber-200/80 rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-3 transition-all shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-12 h-12 rounded-lg overflow-hidden relative bg-white shrink-0 border border-amber-200/60 shadow-2xs">
                            <FastImage
                              src={mainThumb}
                              alt={prod.name || "Sản phẩm"}
                              fallbackSrc={fallbackThumb}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs sm:text-sm text-stone-900 truncate">{prod.name || "Sản phẩm"}</h4>
                            <p className="text-[11px] text-stone-500">{prod.size || ""}</p>
                            <p className="text-xs sm:text-sm font-extrabold text-[#B45309]">
                              {(prod.price ?? 0).toLocaleString("vi-VN")}đ
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleAddToCart(prod)}
                          className="min-h-[36px] bg-gradient-to-r from-[#B45309] to-[#D97706] hover:from-[#92400E] hover:to-[#B45309] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 shadow-xs transition-transform active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <span className={`text-[10px] block mt-2 opacity-65 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                {msg.time}
              </span>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Banner lỗi & Rate Limit hiển thị chi tiết */}
      {errorMsg && (
        <div className="px-3.5 py-2 bg-rose-50 border-t border-rose-200 text-rose-800 text-xs flex items-center justify-between shrink-0">
          <span className="flex items-center gap-1.5 line-clamp-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </span>
          <button
            onClick={() => handleSendMessage()}
            className="font-bold underline text-rose-900 ml-2 shrink-0 hover:text-rose-700 text-xs"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* 5. Chuyển sang tư vấn viên người thật - ẩn khi đang gõ chữ */}
      {!isTypingMode && onSwitchToLiveChat && (
        <div className="px-3.5 py-2 bg-gradient-to-r from-amber-100/70 via-amber-50 to-orange-100/50 border-t border-amber-200/60 flex items-center justify-between text-xs text-amber-950 shrink-0 gap-2">
          <span className="text-[11px] sm:text-xs">Cần giá sỉ hoặc hỗ trợ đơn hàng?</span>
          <button
            onClick={onSwitchToLiveChat}
            className="font-bold text-[#B45309] hover:text-[#92400E] flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-lg bg-white/80 border border-amber-200/50 shadow-2xs active:scale-95 min-h-[32px] text-[11px] sm:text-xs"
          >
            <MessageSquareShare className="w-3.5 h-3.5" />
            Gặp nhân viên tư vấn
          </button>
        </div>
      )}

      {/* 6. Ô nhập câu hỏi */}
      <div className={`p-2.5 sm:p-3.5 bg-white border-t border-amber-200/70 shrink-0 transition-all ${
        isTypingMode ? "pb-2 pt-2" : "pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      }`}>
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            disabled={isLoading}
            onFocus={() => {
              setIsInputFocused(true);
              setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
              }, 200);
            }}
            onBlur={() => {
              setTimeout(() => {
                setIsInputFocused(false);
              }, 150);
            }}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              language === "en"
                ? "Ask about nutrition, recipes, health..."
                : "Hỏi về calo, hạt mix, cách hãm trà, thể trạng..."
            }
            className="w-full bg-stone-50/80 border border-amber-200/90 focus:border-[#B45309] focus:ring-2 focus:ring-[#B45309]/20 rounded-full pl-4 pr-12 py-2.5 sm:py-2 text-base sm:text-sm outline-none transition-all placeholder:text-stone-400 leading-normal"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !input.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-8 sm:h-8 bg-gradient-to-r from-[#B45309] to-[#D97706] text-white rounded-full flex items-center justify-center hover:opacity-95 transition-all active:scale-90 disabled:opacity-40 shadow-xs shrink-0"
            aria-label="Gửi câu hỏi"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
