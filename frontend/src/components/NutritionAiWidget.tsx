"use client";

import { useState, useRef, useEffect, useId } from "react";
import {
  Lightbulb,
  Send,
  Loader2,
  Plus,
  AlertCircle,
  ShieldAlert,
  Leaf,
  CheckCircle2,
  MessageSquareShare,
  RotateCcw
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
  initialPrompt?: string;
  customRecipeContext?: string;
}

// Hàm tạo prompt gợi ý nhanh theo ngôn ngữ
function getQuickPrompts(lang: "vi" | "en") {
  if (lang === "en") {
    return [
      {
        icon: "🥑",
        label: "Weight management & mixed nuts?",
        prompt: "I am on a diet. Is having convection-dried longan with macadamia and almonds safe and weight-friendly?",
        autoAllergy: false,
      },
      {
        icon: "🌙",
        label: "Insomnia & sleep support",
        prompt: "I often experience insomnia. How should I consume longan with lotus seeds or herbal tea for deep restorative sleep?",
        autoAllergy: false,
      },
      {
        icon: "🤰",
        label: "Prenatal & postpartum nutrition",
        prompt: "Which nutrient-dense nut blends and daily dosages are best recommended for pregnant or nursing mothers?",
        autoAllergy: false,
      },
      {
        icon: "⚠️",
        label: "Tree nut allergy safety check",
        prompt: "I am allergic to tree nuts (cashews, almonds, macadamia). Do you have pure dried longan products that are 100% nut-free?",
        autoAllergy: true,
      },
    ];
  }
  return [
    {
      icon: "🥑",
      label: "Ăn hạt mix có sợ béo?",
      prompt: "Tôi đang ăn kiêng sợ béo, ăn long nhãn mix cùng các loại hạt macca, hạnh nhân có an toàn và không bị tăng cân không?",
      autoAllergy: false,
    },
    {
      icon: "🌙",
      label: "Mất ngủ, khó ngủ",
      prompt: "Tôi hay bị mất ngủ, trằn trọc thì dùng Long nhãn ôm hạt sen hay trà dưỡng nhan thế nào để ngủ sâu giấc?",
      autoAllergy: false,
    },
    {
      icon: "🤰",
      label: "Dinh dưỡng mẹ bầu",
      prompt: "Mẹ bầu hoặc phụ nữ sau sinh thì nên chọn loại hạt dinh dưỡng mix nào và liều lượng bao nhiêu là tốt nhất?",
      autoAllergy: false,
    },
    {
      icon: "⚠️",
      label: "Kiểm tra dị ứng hạt",
      prompt: "Tôi có cơ địa dị ứng hạt vỏ cứng (hạt điều, hạnh nhân, macca), cửa hàng có sản phẩm long nhãn nào an toàn tuyệt đối không chứa hạt không?",
      autoAllergy: true,
    },
  ];
}

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

export function NutritionAiWidget({
  language = "vi",
  isKeyboardOpen = false,
  onSwitchToLiveChat,
  initialPrompt,
  customRecipeContext
}: NutritionAiWidgetProps) {
  const instanceId = useId();
  const seqRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasTriggeredInitialPromptRef = useRef<string | null>(null);

  // Bộ chọn thể trạng sức khỏe (Health Profile State)
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [isNutAllergic, setIsNutAllergic] = useState<boolean>(false);

  const AI_HISTORY_STORAGE_KEY = "phohien_nutrition_ai_history";

  const getInitialWelcomeMessage = (): MessageItem => ({
    id: "welcome-init",
    role: "assistant",
    content: language === "en"
      ? "Hello! I am your AI Nutrition & Wellness Advisor from Nguyet Nhan Pho Hien. Our specialty blends include convection-dried longan and nutrient-dense tree nuts (lotus seeds, macadamia, almonds, cashews). How may I assist your health and wellness goals today?"
      : "Kính chào quý khách! Tôi là Chuyên Viên AI Dinh Dưỡng & Dưỡng Sinh Nguyệt Nhãn Phố Hiến. Dòng sản phẩm của chúng tôi là sự kết hợp tinh hoa giữa Long Nhãn sấy đối lưu và Hệ sinh thái Hạt dinh dưỡng cao cấp (Hạt sen, Macca, Hạnh nhân, Điều, Bí xanh). Quý khách đang cần tư vấn cho thể trạng hoặc mục tiêu sức khỏe nào ạ?",
    time: language === "en" ? "Just now" : "Vừa xong"
  });

  const [messages, setMessages] = useState<MessageItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem(AI_HISTORY_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return [getInitialWelcomeMessage()];
  });

  // Lưu lịch sử vào sessionStorage để không bao giờ mất khi đóng panel / unmount (debounce 400ms)
  useEffect(() => {
    if (typeof window === "undefined" || messages.length === 0) return;
    const timer = setTimeout(() => {
      try {
        sessionStorage.setItem(AI_HISTORY_STORAGE_KEY, JSON.stringify(messages));
      } catch {}
    }, 400);
    return () => clearTimeout(timer);
  }, [messages]);

  const handleResetChat = () => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(AI_HISTORY_STORAGE_KEY);
      } catch {}
    }
    setMessages([getInitialWelcomeMessage()]);
    setErrorMsg(null);
  };

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

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim() && hasTriggeredInitialPromptRef.current !== initialPrompt.trim()) {
      hasTriggeredInitialPromptRef.current = initialPrompt.trim();
      const timer = setTimeout(() => {
        handleSendMessage(initialPrompt.trim());
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [initialPrompt]);

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
      time: language === "en" ? "Just now" : "Vừa xong"
    };

    const aiMessageId = `ai-${instanceId}-${aiSeq}`;
    const initialAiMessage: MessageItem = {
      id: aiMessageId,
      role: "assistant",
      content: "",
      time: language === "en" ? "Just now" : "Vừa xong",
      isStreaming: true
    };

    setMessages((prev) => [...prev, userMessage, initialAiMessage]);
    if (!textToSend) setInput("");
    setIsLoading(true);
    setErrorMsg(null);

    // Preserve user disclosures for server-side allergy checks; the server limits model context.
    const history = messages
      .filter((m) => m.content.trim().length > 0)
      .map((m) => ({
        role: m.role,
        content: m.content
      }));

    // Chuẩn bị Health Profile (ưu tiên giá trị truyền trực tiếp khi vừa bấm nút để tránh race-condition)
    const activeGoal = overrideGoal !== undefined ? overrideGoal : selectedGoal;
    const activeNutAllergic = overrideNutAllergic !== undefined ? overrideNutAllergic : isNutAllergic;

    let goalDescription: string | undefined = undefined;
    if (activeGoal === "diet") {
      goalDescription = language === "en" ? "Weight management, calorie control, staying fit" : "Ăn kiêng, giảm calo, duy trì vóc dáng";
    } else if (activeGoal === "insomnia") {
      goalDescription = language === "en" ? "Insomnia, sleep disorders, calming the mind" : "Mất ngủ, khó ngủ, dưỡng tâm an thần";
    } else if (activeGoal === "pregnancy") {
      goalDescription = language === "en" ? "Prenatal & postnatal nourishment for mothers" : "Phụ nữ mang thai / sau sinh cần bồi bổ";
    }

    const hasAnyProfile = !!goalDescription || activeGoal === "pregnancy" || activeNutAllergic;
    const healthProfile = hasAnyProfile
      ? {
          goal: goalDescription,
          healthCondition: activeGoal === "pregnancy" 
            ? (language === "en" ? "Pregnant / breastfeeding woman" : "Phụ nữ mang thai / đang cho con bú") 
            : undefined,
          allergens: activeNutAllergic 
            ? (language === "en" ? ["Tree nuts", "Cashews", "Almonds", "Macadamia"] : ["Hạt vỏ cứng (Tree nuts)", "Hạt điều", "Hạnh nhân", "Macca"]) 
            : undefined
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
          healthProfile,
          language
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
            setErrorMsg(err.message || (language === "en" ? "Unable to connect to AI Advisor." : "Không thể kết nối đến Trợ lý AI."));
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
      const msg = err instanceof Error ? err.message : (language === "en" ? "Unable to connect to AI Advisor. Please try again shortly." : "Không thể kết nối đến Trợ lý AI. Vui lòng thử lại sau ít giây.");
      setErrorMsg(msg);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMessageId
            ? {
                ...m,
                content: m.content
                  ? `${m.content}\n\n*(Lưu ý: Phản hồi bị ngắt quãng do kết nối mạng. Quý khách có thể thử lại hoặc chọn các câu hỏi gợi ý bên dưới để được tư vấn tiếp nhé.)*`
                  : (language === "en" ? "There was a temporary interruption connecting to the AI Nutrition Advisor. Please try again shortly!" : "Đã có sự gián đoạn tạm thời khi kết nối với Chuyên gia AI Dinh Dưỡng. Quý khách vui lòng thử lại sau ít giây nhé!"),
                isStreaming: false
              }
            : m
        )
      );
    } finally {
      setMessages((prev) => prev.map((msg) =>
        msg.id === aiMessageId ? { ...msg, isStreaming: false } : msg
      ));
      setIsLoading(false);
    }
  };

  const handleAddToCart = (product: SuggestedProduct) => {
    const fallbackThumb = getProductPackagingFallback(product.name);
    const cartProduct: ProductResponse = {
      id: product.id,
      name: product.name || (language === "en" ? "Product" : "Sản phẩm"),
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
      diet: language === "en"
        ? "I am on a diet focusing on weight control and calorie reduction. How can I enjoy dried longan and your store's products to stay energized without gaining weight?"
        : "Tôi đang theo chế độ ăn kiêng, giảm calo và giữ vóc dáng. Với thể trạng này, tôi nên sử dụng long nhãn và các sản phẩm của cửa hàng như thế nào để vừa đủ chất vừa không lo tăng cân?",
      insomnia: language === "en"
        ? "I often struggle with falling asleep and staying asleep. Please advise me on a mindful sleep wellness routine and suitable products from Nguyệt Nhãn Phố Hiến."
        : "Tôi thường xuyên bị khó ngủ, mất ngủ, ngủ không sâu giấc. Hãy tư vấn giúp tôi liệu trình dưỡng tâm an thần và sản phẩm phù hợp từ Nguyệt Nhãn Phố Hiến.",
      pregnancy: language === "en"
        ? "I am pregnant / postpartum and need safe, wholesome nourishment. Please advise me on a safe nutrition regimen and suitable products for mother and baby."
        : "Tôi là phụ nữ mang thai / sau sinh cần bồi bổ sức khỏe. Hãy tư vấn giúp tôi chế độ dinh dưỡng an toàn và các dòng sản phẩm phù hợp cho mẹ và bé."
    };

    handleSendMessage(goalPrompts[goal], goal, isNutAllergic);
  };

  const handleNutAllergyToggle = () => {
    if (isLoading) return;
    const nextVal = !isNutAllergic;
    setIsNutAllergic(nextVal);

    if (nextVal) {
      handleSendMessage(
        language === "en"
          ? "I have a tree nut allergy (cashews, almonds, macadamia). Does your store have any 100% nut-free dried longan products that are safe for me?"
          : "Tôi có cơ địa dị ứng hạt vỏ cứng (Tree nuts). Cửa hàng có dòng sản phẩm nào an toàn tuyệt đối không chứa hạt cây để tôi sử dụng an tâm không?",
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
            title={language === "en" ? "Low calorie, healthy diet" : "Tối ưu calo, thực đơn lành mạnh"}
          >
            {language === "en" ? "🌿 Diet & Shape" : "🌿 Ăn kiêng"}
          </button>

          <button
            onClick={() => handleGoalSelect("insomnia")}
            disabled={isLoading}
            className={`min-h-[30px] sm:min-h-[28px] text-[11px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-full border transition-all shrink-0 font-medium disabled:opacity-50 active:scale-95 touch-manipulation ${
              selectedGoal === "insomnia"
                ? "bg-indigo-600 text-white border-indigo-700 shadow-xs"
                : "bg-white text-stone-700 border-amber-200 hover:bg-amber-50"
            }`}
            title={language === "en" ? "Restorative calm & sleep" : "Dưỡng tâm an thần, giấc ngủ ngon"}
          >
            {language === "en" ? "🌙 Deep Sleep" : "🌙 Trị mất ngủ"}
          </button>

          <button
            onClick={() => handleGoalSelect("pregnancy")}
            disabled={isLoading}
            className={`min-h-[30px] sm:min-h-[28px] text-[11px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-full border transition-all shrink-0 font-medium disabled:opacity-50 active:scale-95 touch-manipulation ${
              selectedGoal === "pregnancy"
                ? "bg-pink-600 text-white border-pink-700 shadow-xs"
                : "bg-white text-stone-700 border-amber-200 hover:bg-amber-50"
            }`}
            title={language === "en" ? "Essential minerals for mothers" : "Bổ huyết, vi khoáng cho mẹ"}
          >
            {language === "en" ? "🤰 Prenatal & Nursing" : "🤰 Mẹ bầu"}
          </button>

          <button
            onClick={handleNutAllergyToggle}
            disabled={isLoading}
            className={`min-h-[30px] sm:min-h-[28px] text-[11px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-full border transition-all shrink-0 font-bold flex items-center gap-1 disabled:opacity-50 active:scale-95 touch-manipulation ${
              isNutAllergic
                ? "bg-rose-600 text-white border-rose-700 shadow-xs animate-pulse"
                : "bg-white text-rose-700 border-rose-200 hover:bg-rose-50"
            }`}
            title={language === "en" ? "Toggle nut-allergen safety filter" : "Bật/Tắt chế độ cảnh báo và loại trừ sản phẩm chứa hạt"}
          >
            <span>⚠️</span>
            <span>
              {isNutAllergic
                ? (language === "en" ? "Filtered: Nut Allergy" : "Đã lọc: Dị ứng hạt")
                : (language === "en" ? "Nut Allergy" : "Dị ứng hạt")}
            </span>
          </button>
        </div>
      )}

      {/* 2. Gợi ý câu hỏi nhanh (Prompt Suggestions) - ẩn khi đang gõ chữ */}
      {!isTypingMode && (
        <div className="px-3 sm:px-4 py-2 bg-stone-50/80 border-b border-amber-200/60 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar overscroll-x-contain shrink-0">
          <span className="text-[11px] font-semibold text-amber-900 shrink-0 flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-[#B45309]" />
            {language === "en" ? "Questions:" : "Gợi ý hỏi:"}
          </span>
          {customRecipeContext && (
            <button
              disabled={isLoading}
              onClick={() => {
                const prompt = language === "en"
                  ? `Please evaluate and advise on my custom nut mix: ${customRecipeContext}. What are its nutritional highlights and who is it best suited for?`
                  : `Hãy phân tích dinh dưỡng và tư vấn công thức mix hạt tự chọn của tôi: ${customRecipeContext}. Công thức này phù hợp thể trạng nào?`;
                handleSendMessage(prompt);
              }}
              className="min-h-[30px] sm:min-h-[28px] text-xs bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 hover:from-amber-500/30 hover:to-amber-500/40 text-amber-950 border border-amber-400/80 px-3 py-1 rounded-full whitespace-nowrap shadow-xs transition-all active:scale-95 shrink-0 flex items-center gap-1.5 font-bold disabled:opacity-50 touch-manipulation cursor-pointer"
            >
              <span>🧪</span>
              <span>{language === "en" ? "Analyze my current blend" : "Phân tích công thức hạt này"}</span>
            </button>
          )}
          {getQuickPrompts(language).map((item, idx) => (
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

          {/* Nút làm mới lịch sử trò chuyện */}
          <button
            onClick={handleResetChat}
            disabled={isLoading || messages.length <= 1}
            className="ml-auto min-h-[30px] sm:min-h-[28px] text-[11px] bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 border border-stone-300/70 px-2.5 py-1 rounded-full whitespace-nowrap shadow-2xs transition-all active:scale-95 shrink-0 flex items-center gap-1 disabled:opacity-30 disabled:pointer-events-none touch-manipulation"
            title={language === "en" ? "Clear conversation history" : "Làm mới cuộc trò chuyện"}
          >
            <RotateCcw className="w-3 h-3" />
            <span>{language === "en" ? "Reset" : "Làm mới"}</span>
          </button>
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
                  <span>{language === "en" ? "Pho Hien AI Nutrition Advisor" : "Chuyên Viên AI Dinh Dưỡng Phố Hiến"}</span>
                </div>
              )}

              {/* Nội dung tư vấn */}
              {msg.role === "assistant" && !msg.content ? (
                <div className="flex items-center gap-2 py-1 text-xs text-amber-900">
                  <Loader2 className="w-3.5 h-3.5 text-[#B45309] animate-spin shrink-0" />
                  <span>{language === "en" ? "AI Expert is analyzing nutritional profile..." : "Chuyên gia AI đang phân tích dữ liệu dinh dưỡng..."}</span>
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
                  <span><strong>{language === "en" ? "Recommended portion:" : "Khẩu phần khuyến nghị:"}</strong> {msg.portionTip}</span>
                </div>
              )}

              {/* Banner cảnh báo an toàn dị ứng */}
              {msg.allergenNotice && (
                <div className="mt-2.5 p-2.5 bg-rose-50/90 border border-rose-200/80 rounded-xl text-xs text-rose-950 flex items-start gap-2 shadow-2xs">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>{language === "en" ? "Safety notice:" : "Lưu ý an toàn:"}</strong> {msg.allergenNotice}</span>
                </div>
              )}

              {/* Danh sách thẻ sản phẩm gợi ý */}
              {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-amber-100/80 space-y-2">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-amber-800 block">
                    {language === "en" ? "🌿 Matching boutique products:" : "🌿 Sản phẩm phù hợp từ cửa hàng:"}
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
                              alt={prod.name || (language === "en" ? "Product" : "Sản phẩm")}
                              fallbackSrc={fallbackThumb}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs sm:text-sm text-stone-900 truncate">
                              {prod.name || (language === "en" ? "Product" : "Sản phẩm")}
                            </h4>
                            <p className="text-[11px] text-stone-500">{prod.size || ""}</p>
                            <p className="text-xs sm:text-sm font-extrabold text-[#B45309]">
                              {(prod.price ?? 0).toLocaleString(language === "en" ? "en-US" : "vi-VN")}
                              {language === "en" ? " VND" : "đ"}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleAddToCart(prod)}
                          className="min-h-[36px] bg-gradient-to-r from-[#B45309] to-[#D97706] hover:from-[#92400E] hover:to-[#B45309] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 shadow-xs transition-transform active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{language === "en" ? "Add" : "Thêm"}</span>
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
            {language === "en" ? "Retry" : "Thử lại"}
          </button>
        </div>
      )}

      {/* 5. Chuyển sang tư vấn viên người thật - ẩn khi đang gõ chữ */}
      {!isTypingMode && onSwitchToLiveChat && (
        <div className="px-3.5 py-2 bg-gradient-to-r from-amber-100/70 via-amber-50 to-orange-100/50 border-t border-amber-200/60 flex items-center justify-between text-xs text-amber-950 shrink-0 gap-2">
          <span className="text-[11px] sm:text-xs">
            {language === "en" ? "Need wholesale pricing or order support?" : "Cần giá sỉ hoặc hỗ trợ đơn hàng?"}
          </span>
          <button
            onClick={onSwitchToLiveChat}
            className="font-bold text-[#B45309] hover:text-[#92400E] flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-lg bg-white/80 border border-amber-200/50 shadow-2xs active:scale-95 min-h-[32px] text-[11px] sm:text-xs"
          >
            <MessageSquareShare className="w-3.5 h-3.5" />
            {language === "en" ? "Talk to human advisor" : "Gặp nhân viên tư vấn"}
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
