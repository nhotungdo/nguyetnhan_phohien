"use client";

import { motion, useReducedMotion } from "framer-motion";

interface VisualizerProps {
  isHovered?: boolean;
  className?: string;
}

/**
 * 🍵 1. THƯỞNG TRÀ ĐỐI ẨM (Mindful Tea Infusion Visualizer)
 * - Tách trà gốm sứ men ngọc thanh tao
 * - Làn khói trà sen lượn lờ bốc lên
 * - Múi long nhãn óng vàng lắng đọng tạo các vòng sóng mật lan tỏa
 * - Cánh hoa sen & cúc chi dập dềnh thư thái
 */
export function TeaInfusionVisualizer({ isHovered = false, className = "" }: VisualizerProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className={`relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden bg-gradient-to-b from-[#FBF8F1] via-[#F4EDE0] to-[#E9DFCE] border border-[#E8DFC8] flex items-center justify-center select-none shadow-inner ${className}`}
    >
      {/* Nền ánh sáng ấm áp góc bàn trà */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_70%,rgba(251,191,36,0.18),transparent_70%)] pointer-events-none" />

      {/* Vòng hào quang hương thơm lan tỏa */}
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                scale: isHovered ? [1, 1.25, 1] : [1, 1.15, 1],
                opacity: isHovered ? [0.4, 0.7, 0.4] : [0.25, 0.5, 0.25],
              }
        }
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-36 h-36 rounded-full bg-amber-200/40 blur-2xl pointer-events-none"
      />

      {/* SVG Canvas Diễn Hoạt Tách Trà & Sóng Mật */}
      <svg
        viewBox="0 0 240 150"
        className="w-full h-full max-w-[220px] max-h-[140px] drop-shadow-md z-10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 1. Làn khói trà lượn lờ (Animated Steam Wisps) */}
        {!shouldReduceMotion && (
          <g className="opacity-75">
            {/* Làn khói 1 */}
            <motion.path
              d="M108 55 C104 42, 114 32, 108 20 C104 12, 110 5, 107 0"
              stroke="rgba(180, 83, 9, 0.35)"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              animate={{
                d: [
                  "M108 55 C104 42, 114 32, 108 20 C104 12, 110 5, 107 0",
                  "M108 55 C112 42, 104 30, 112 18 C115 10, 108 4, 111 0",
                  "M108 55 C104 42, 114 32, 108 20 C104 12, 110 5, 107 0",
                ],
                opacity: [0.2, 0.6, 0.1],
                y: [0, -6, 0],
              }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Làn khói 2 (Ở giữa, cao hơn) */}
            <motion.path
              d="M120 52 C125 38, 115 28, 122 14 C126 6, 118 2, 120 0"
              stroke="rgba(217, 119, 6, 0.45)"
              strokeWidth="2.8"
              strokeLinecap="round"
              fill="none"
              animate={{
                d: [
                  "M120 52 C125 38, 115 28, 122 14 C126 6, 118 2, 120 0",
                  "M120 52 C116 38, 124 26, 117 12 C114 5, 122 1, 119 0",
                  "M120 52 C125 38, 115 28, 122 14 C126 6, 118 2, 120 0",
                ],
                opacity: [0.3, 0.8, 0.2],
                y: [0, -8, 0],
              }}
              transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
            {/* Làn khói 3 (Bên phải) */}
            <motion.path
              d="M132 55 C136 43, 128 34, 134 22 C138 14, 131 6, 133 0"
              stroke="rgba(180, 83, 9, 0.35)"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              animate={{
                d: [
                  "M132 55 C136 43, 128 34, 134 22 C138 14, 131 6, 133 0",
                  "M132 55 C129 43, 137 32, 130 20 C127 12, 135 5, 132 0",
                  "M132 55 C136 43, 128 34, 134 22 C138 14, 131 6, 133 0",
                ],
                opacity: [0.2, 0.65, 0.15],
                y: [0, -5, 0],
              }}
              transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
          </g>
        )}

        {/* 2. Đĩa lót tách trà gốm sứ */}
        <ellipse cx="120" cy="128" rx="66" ry="14" fill="#D6C7B2" />
        <ellipse cx="120" cy="126" rx="62" ry="12" fill="#E8DFC8" className="stroke-[#B4A088]" strokeWidth="1.5" />
        <ellipse cx="120" cy="125" rx="48" ry="8" fill="#CBBBA4" opacity="0.6" />

        {/* 3. Thân tách trà gốm ngọc bích */}
        <path
          d="M78 68 C80 106, 92 118, 120 118 C148 118, 160 106, 162 68 Z"
          fill="url(#teaCupGradient)"
          stroke="#0F3E30"
          strokeWidth="2.5"
        />

        {/* Quai tách trà */}
        <path
          d="M158 76 C176 78, 176 102, 154 104"
          fill="none"
          stroke="#0F3E30"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M158 76 C173 78, 173 100, 154 103"
          fill="none"
          stroke="#34D399"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Viền hoa văn cung đình trên miệng chén */}
        <ellipse cx="120" cy="68" rx="42" ry="10" fill="#0A2C22" />
        <ellipse cx="120" cy="68" rx="40" ry="8.5" fill="url(#teaLiquorGradient)" />

        {/* 4. Sóng mật long nhãn lan tỏa trong lòng chén (Golden Ripples) */}
        {!shouldReduceMotion && (
          <g>
            <motion.ellipse
              cx="120"
              cy="68"
              rx="18"
              ry="4"
              fill="none"
              stroke="#FDE68A"
              strokeWidth="1.5"
              animate={{
                rx: [8, 32],
                ry: [2, 7.5],
                opacity: [0.9, 0],
              }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.ellipse
              cx="120"
              cy="68"
              rx="12"
              ry="3"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="1.2"
              animate={{
                rx: [4, 24],
                ry: [1, 6],
                opacity: [0.8, 0],
              }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: 0.8 }}
            />
          </g>
        )}

        {/* 5. Múi long nhãn vàng hổ phách chìm trong nước trà */}
        <motion.g
          animate={
            shouldReduceMotion
              ? {}
              : {
                  y: [-1.5, 1.5, -1.5],
                  rotate: [-3, 3, -3],
                }
          }
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Múi nhãn chính */}
          <ellipse cx="120" cy="68" rx="9" ry="5.5" fill="#D97706" />
          <ellipse cx="119" cy="67.5" rx="7.5" ry="4" fill="#FBBF24" />
          <ellipse cx="117.5" cy="66.5" rx="3.5" ry="1.8" fill="#FEF3C7" opacity="0.9" />
          {/* Hạt cúc chi hoặc cánh hoa sen trôi dập dềnh */}
          <circle cx="106" cy="67" r="2.8" fill="#FEF08A" />
          <circle cx="106" cy="67" r="1.4" fill="#D97706" />
          <path d="M133 65 C136 63, 139 67, 134 69 Z" fill="#F472B6" opacity="0.85" />
        </motion.g>

        {/* Gradients */}
        <defs>
          <linearGradient id="teaCupGradient" x1="78" y1="68" x2="162" y2="118" gradientUnits="userSpaceOnUse">
            <stop stopColor="#14532D" />
            <stop offset="0.35" stopColor="#0F3E30" />
            <stop offset="0.75" stopColor="#06251D" />
            <stop offset="1" stopColor="#041B14" />
          </linearGradient>
          <radialGradient id="teaLiquorGradient" cx="120" cy="68" r="40" fx="120" fy="67" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F59E0B" />
            <stop offset="0.55" stopColor="#B45309" />
            <stop offset="0.9" stopColor="#78350F" />
            <stop offset="1" stopColor="#451A03" />
          </radialGradient>
        </defs>
      </svg>

      {/* Micro-Badges thông điệp triết lý */}
      <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] font-bold text-amber-950/80 bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-xl border border-amber-200/60 shadow-2xs">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Nhiệt độ hãm 85°C – 90°C
        </span>
        <span className="text-amber-700 font-extrabold">100% Vị ngọt tự nhiên</span>
      </div>
    </div>
  );
}

/**
 * 🪷 2. CHÈ SEN TIẾN VUA (Royal Lotus-In-Longan Pearl Visualizer)
 * - Mô phỏng kỹ nghệ độc bản "Hạt sen lồng cùi nhãn"
 * - Cùi nhãn vàng hổ phách ôm lấy hạt sen ngọc ngà
 * - Ánh sáng lấp lánh (Sparkle Shimmer) phản chiếu độ giòn sần sật
 * - Nhánh lá dứa thơm & giọt siro thanh mát
 */
export function LotusLonganVisualizer({ isHovered = false, className = "" }: VisualizerProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className={`relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden bg-gradient-to-b from-[#FFFDF7] via-[#FAF3E3] to-[#F1E5CB] border border-[#E8DFC8] flex items-center justify-center select-none shadow-inner ${className}`}
    >
      {/* Vệt ánh sáng tỏa ngát */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.15),transparent_65%)] pointer-events-none" />

      {/* SVG Canvas Hạt Sen Lồng Múi Nhãn */}
      <svg
        viewBox="0 0 240 150"
        className="w-full h-full max-w-[220px] max-h-[140px] drop-shadow-md z-10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Lá dứa xanh tươi nền phía sau */}
        <g opacity="0.85">
          <path
            d="M50 120 C70 85, 95 65, 110 50 C95 80, 80 105, 68 126 Z"
            fill="#15803D"
            opacity="0.75"
          />
          <path
            d="M190 120 C170 85, 145 65, 130 50 C145 80, 160 105, 172 126 Z"
            fill="#16A34A"
            opacity="0.75"
          />
        </g>

        {/* Bát sứ hoàng gia đựng chè sen */}
        <ellipse cx="120" cy="118" rx="60" ry="16" fill="#E2D6C0" />
        <ellipse cx="120" cy="115" rx="56" ry="14" fill="#FAF5EB" className="stroke-[#C2B29A]" strokeWidth="1.5" />
        <ellipse cx="120" cy="114" rx="48" ry="10" fill="#FEF3C7" opacity="0.6" />

        {/* Khối chính: HẠT SEN LỒNG CÙI NHÃN (Lotus Seed Nested In Longan) */}
        <motion.g
          animate={
            shouldReduceMotion
              ? {}
              : {
                  y: isHovered ? [-3, 3, -3] : [-1.5, 1.5, -1.5],
                  scale: isHovered ? 1.04 : 1,
                }
          }
          transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Hào quang bọc ngoài viên ngọc nhãn */}
          <motion.circle
            cx="120"
            cy="84"
            r="38"
            fill="none"
            stroke="#FBBF24"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            opacity="0.45"
          />

          {/* Lớp cùi nhãn Hương Chi hổ phách (Vỏ ngoài ôm ấp) */}
          <path
            d="M86 84 C86 64, 100 50, 120 50 C140 50, 154 64, 154 84 C154 104, 140 116, 120 116 C100 116, 86 104, 86 84 Z"
            fill="url(#longanAmberGradient)"
            stroke="#B45309"
            strokeWidth="2"
          />

          {/* Vệt bóng phản chiếu độ dẻo giòn sần sật của cùi nhãn */}
          <path
            d="M93 72 C98 58, 114 54, 128 54 C116 58, 102 66, 98 78 Z"
            fill="#FEF3C7"
            opacity="0.7"
          />

          {/* HẠT SEN BỞ BÙI TRẮNG NGÀ NẰM CHÍNH GIỮA */}
          <ellipse
            cx="120"
            cy="84"
            rx="18"
            ry="20"
            fill="url(#lotusSeedGradient)"
            stroke="#D6C7B2"
            strokeWidth="1.5"
          />

          {/* Đầu rốn hạt sen tự nhiên */}
          <ellipse cx="120" cy="67" rx="3.5" ry="2" fill="#A89276" opacity="0.75" />

          {/* Ánh sáng kim cương lấp lánh (Sparkle Shimmer) */}
          {!shouldReduceMotion && (
            <motion.g
              animate={{
                scale: [0.7, 1.3, 0.7],
                opacity: [0.4, 1, 0.4],
                rotate: [0, 90, 180],
              }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "138px 66px" }}
            >
              <path
                d="M138 60 L140 66 L146 68 L140 70 L138 76 L136 70 L130 68 L136 66 Z"
                fill="#FDE68A"
              />
            </motion.g>
          )}

          {/* Giọt nước đường phèn thanh mát nhỏ xuống */}
          {!shouldReduceMotion && (
            <motion.path
              d="M120 116 C118 122, 118 125, 120 128 C122 125, 122 122, 120 116 Z"
              fill="#F59E0B"
              animate={{
                y: [0, 6, 0],
                opacity: [0.8, 0.2, 0.8],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </motion.g>

        {/* Gradients */}
        <defs>
          <radialGradient id="longanAmberGradient" cx="120" cy="78" r="36" fx="112" fy="68" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FDE68A" />
            <stop offset="0.35" stopColor="#F59E0B" />
            <stop offset="0.75" stopColor="#D97706" />
            <stop offset="1" stopColor="#92400E" />
          </radialGradient>
          <linearGradient id="lotusSeedGradient" x1="108" y1="68" x2="132" y2="102" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" />
            <stop offset="0.5" stopColor="#FFFBEB" />
            <stop offset="0.85" stopColor="#F5EFE0" />
            <stop offset="1" stopColor="#E6D7BD" />
          </linearGradient>
        </defs>
      </svg>

      {/* Micro-Badges thông điệp */}
      <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] font-bold text-amber-950/80 bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-xl border border-amber-200/60 shadow-2xs">
        <span className="flex items-center gap-1 text-emerald-800">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          Quy tắc 2 phút vàng
        </span>
        <span className="text-amber-800 font-extrabold">Cùi nhãn giòn • Sen bùi bở</span>
      </div>
    </div>
  );
}

/**
 * 🏺 3. BÌNH RƯỢU NẾP THƠM THẢO (Amber Wine Aging Visualizer)
 * - Chum sành/bình gốm cổ truyền thắt dải lụa điều
 * - Bọt khí lên men li ti dâng lên qua từng tầng long nhãn
 * - Sóng sánh ánh rượu hổ phách ngâm nếp cái hoa vàng
 * - Biểu tượng món quà nghĩa tình bền lâu
 */
export function AmberWineVisualizer({ isHovered = false, className = "" }: VisualizerProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className={`relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden bg-gradient-to-b from-[#FAF4EC] via-[#F4E9DB] to-[#E9DAC6] border border-[#E8DFC8] flex items-center justify-center select-none shadow-inner ${className}`}
    >
      {/* Vệt ánh sáng ủ men ấm cúng */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_65%,rgba(180,83,9,0.18),transparent_70%)] pointer-events-none" />

      {/* SVG Canvas Bình Rượu Nếp Long Nhãn */}
      <svg
        viewBox="0 0 240 150"
        className="w-full h-full max-w-[220px] max-h-[140px] drop-shadow-md z-10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Đĩa đế kê bình */}
        <ellipse cx="120" cy="132" rx="48" ry="10" fill="#D3C3AD" />
        <ellipse cx="120" cy="130" rx="44" ry="8" fill="#BFAFA0" opacity="0.6" />

        {/* THÂN BÌNH GỐM / THỦY TINH TRUYỀN THỐNG */}
        <motion.g
          animate={
            shouldReduceMotion
              ? {}
              : {
                  y: isHovered ? [-2, 2, -2] : [0, 0, 0],
                  scale: isHovered ? 1.03 : 1,
                }
          }
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "120px 80px" }}
        >
          {/* Bình thủy tinh lộ cốt rượu hổ phách */}
          <path
            d="M102 34 L138 34 L142 50 C162 66, 168 96, 156 122 C150 128, 138 130, 120 130 C102 130, 90 128, 84 122 C72 96, 78 66, 98 50 Z"
            fill="url(#wineLiquidGradient)"
            stroke="#78350F"
            strokeWidth="2.5"
          />

          {/* Lớp nhãn ngâm lắng đọng dưới đáy bình */}
          <path
            d="M87 114 C94 108, 104 106, 120 106 C136 106, 146 108, 153 114 C150 126, 138 128, 120 128 C102 128, 90 126, 87 114 Z"
            fill="#5C2607"
            opacity="0.8"
          />

          {/* Các múi nhãn chìm nổi dưới đáy */}
          <circle cx="104" cy="118" r="5" fill="#B45309" />
          <circle cx="118" cy="116" r="6.5" fill="#D97706" />
          <circle cx="134" cy="120" r="5.5" fill="#92400E" />

          {/* 3. Bọt khí lên men li ti nổi lên (Rising Fermentation Bubbles) */}
          {!shouldReduceMotion && (
            <g>
              <motion.circle
                cx="110"
                cy="105"
                r="2"
                fill="#FEF3C7"
                opacity="0.75"
                animate={{
                  cy: [105, 55],
                  opacity: [0.8, 0],
                  x: [-1, 2, -1],
                }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeOut" }}
              />
              <motion.circle
                cx="124"
                cy="95"
                r="2.5"
                fill="#FDE68A"
                opacity="0.85"
                animate={{
                  cy: [95, 50],
                  opacity: [0.9, 0],
                  x: [1, -2, 1],
                }}
                transition={{ duration: 2.7, repeat: Infinity, ease: "easeOut", delay: 0.7 }}
              />
              <motion.circle
                cx="136"
                cy="100"
                r="1.8"
                fill="#FEF3C7"
                opacity="0.7"
                animate={{
                  cy: [100, 56],
                  opacity: [0.8, 0],
                }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeOut", delay: 1.4 }}
              />
            </g>
          )}

          {/* Vệt sáng cong tạo chiều sâu chất liệu bình thủy tinh bóng */}
          <path
            d="M93 58 C84 72, 85 95, 92 112"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.45"
          />

          {/* Cổ bình và Nắp gốm thắt dải lụa điều */}
          <ellipse cx="120" cy="34" rx="20" ry="6" fill="#78350F" stroke="#451A03" strokeWidth="1.5" />
          <path d="M104 22 L136 22 L138 34 L102 34 Z" fill="#9A3412" stroke="#451A03" strokeWidth="1.5" />
          <ellipse cx="120" cy="22" rx="17" ry="5" fill="#C2410C" />

          {/* Dải lụa đỏ phong ấn may mắn thắt quanh cổ bình */}
          <path d="M98 36 C110 39, 130 39, 142 36" stroke="#DC2626" strokeWidth="4" strokeLinecap="round" />
          {/* Nơ và dải lụa rủ xuống */}
          <motion.path
            d="M136 38 C144 48, 142 62, 145 74"
            stroke="#DC2626"
            strokeWidth="3"
            strokeLinecap="round"
            animate={
              shouldReduceMotion
                ? {}
                : {
                    d: [
                      "M136 38 C144 48, 142 62, 145 74",
                      "M136 38 C146 50, 140 64, 147 74",
                      "M136 38 C144 48, 142 62, 145 74",
                    ],
                  }
            }
            transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Khánh gỗ chúc may mắn */}
          <rect x="139" y="52" width="12" height="15" rx="2" fill="#B91C1C" />
          <circle cx="145" cy="56" r="1.5" fill="#FDE047" />
        </motion.g>

        {/* Gradients */}
        <defs>
          <linearGradient id="wineLiquidGradient" x1="84" y1="50" x2="156" y2="130" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F59E0B" />
            <stop offset="0.3" stopColor="#D97706" />
            <stop offset="0.7" stopColor="#92400E" />
            <stop offset="1" stopColor="#451A03" />
          </linearGradient>
        </defs>
      </svg>

      {/* Micro-Badges thông điệp */}
      <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] font-bold text-amber-950/80 bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-xl border border-amber-200/60 shadow-2xs">
        <span className="flex items-center gap-1 text-red-900">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
          Ủ men 60 – 90 ngày
        </span>
        <span className="text-amber-800 font-extrabold">Ấm tỳ vị • Bổ khí huyết</span>
      </div>
    </div>
  );
}
