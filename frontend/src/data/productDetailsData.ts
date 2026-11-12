export interface ProductDetailInfo {
  id: string;
  nameVi: string;
  nameEn: string;
  subNameVi: string;
  subNameEn: string;
  size: string;
  price: number;
  image: string;
  fallbackImages: string[];
  badgeVi: string;
  badgeEn: string;
  taglineVi: string;
  taglineEn: string;
  overviewVi: string;
  overviewEn: string;
  // Danh sách các thành phần hạt & nhãn mix
  ingredientsList: {
    nameVi: string;
    nameEn: string;
    characteristicVi: string;
    characteristicEn: string;
  }[];
  // Hồ sơ cảm quan (thang điểm 10)
  sensory: {
    nutCrispiness: number; // Độ giòn bùi của hạt (hạt điều, macca, hạnh nhân, bí xanh)
    longanChewiness: number; // Độ dẻo mọng ngọt mật của long nhãn Hương Chi
    naturalSweetness: number; // Vị ngọt thanh tao tự nhiên (không đường hóa học)
    harmoniousAroma: number; // Hương thơm ngậy hòa quyện hoa nhãn và hạt rang
  };
  // Bảng thông số kỹ thuật chi tiết
  specifications: {
    labelVi: string;
    labelEn: string;
    valueVi: string;
    valueEn: string;
  }[];
  // 4 Cách thưởng thức
  culinaryUsages: {
    titleVi: string;
    titleEn: string;
    descVi: string;
    descEn: string;
    icon: string;
  }[];
  // Hướng dẫn bảo quản
  storageTipsVi: string[];
  storageTipsEn: string[];
}

export const PRODUCT_DETAILS_MAP: Record<string, ProductDetailInfo> = {
  // 1. Gói Túi Zip 150g (Trân Châu Tứ Dã)
  "tui-zip": {
    id: "default-tui-zip",
    nameVi: 'Gói "Trân Châu Tứ Dã"',
    nameEn: 'Nut & Longan Pouch "Four Realms Pearls"',
    subNameVi: "Túi Zip Khóa Khí 150g - Long Nhãn Mix 4 Loại Hạt",
    subNameEn: "Resealable Pouch 150g - Longan & 4 Nut Blend",
    size: "Túi 150g",
    price: 69000,
    image: "/images/tuizip.jpg",
    fallbackImages: ["/images/tuizip.jpg", "/images/hopnhua.jpg", "/images/setqua.jpg"],
    badgeVi: "Hạt Mix Dưỡng Sinh 150g",
    badgeEn: "Daily Nut & Longan Blend",
    taglineVi: "Sự hòa quyện hoàn hảo giữa Long nhãn Phố Hiến dẻo ngọt và 4 loại hạt dinh dưỡng giòn bùi ngậy.",
    taglineEn: "A harmonious fusion of sweet Pho Hien longan and 4 crunchy, wholesome tree nuts.",
    overviewVi:
      'Lấy cảm hứng từ danh xưng "Trân Châu Tứ Dã" - những viên trân châu nhãn ngọt lành được phối kết cùng 4 loại hạt dinh dưỡng tuyển chọn từ bốn phương (Hạt điều, Hạt macca, Hạt bí xanh, Hạt hạnh nhân). Túi 150g gọn nhẹ, khóa zip chống ẩm tiện lợi, là bữa phụ dưỡng sinh tràn đầy năng lượng cho người bận rộn.',
    overviewEn:
      'Inspired by the "Four Realms Pearls" heritage, blending golden dried longan with 4 premium tree nuts (Cashews, Macadamia, Pumpkin seeds, Almonds). Packed in a 150g moisture-proof zipper pouch, perfect for healthy on-the-go nourishment.',
    ingredientsList: [
      { nameVi: "Long Nhãn Hương Chi Phố Hiến", nameEn: "Pho Hien Convection-Dried Longan", characteristicVi: "Cùi dày dẻo ngọt mật, sấy nhiệt đối lưu không khói than", characteristicEn: "Thick-fleshed, naturally sweet and convection-dried" },
      { nameVi: "Hạt Macca Tây Nguyên", nameEn: "Highland Macadamia Nuts", characteristicVi: "Nhân tròn múp, bùi ngậy tan trong miệng, giàu Omega-7", characteristicEn: "Creamy, buttery crunch packed with healthy fats" },
      { nameVi: "Hạt Điều Bình Phước", nameEn: "Binh Phuoc Cashew Nuts", characteristicVi: "Hạt nguyên loại 1, sấy chín giòn thơm bùi béo tự nhiên", characteristicEn: "Grade-1 whole cashews, delicately roasted and aromatic" },
      { nameVi: "Hạt Hạnh Nhân Tự Nhiên", nameEn: "Whole Almonds", characteristicVi: "Giòn rụm, giàu vitamin E và chất xơ thực vật", characteristicEn: "Crunchy texture, abundant in vitamin E and fiber" },
      { nameVi: "Hạt Bí Xanh Tuyển Chọn", nameEn: "Green Pumpkin Seeds", characteristicVi: "Hạt mẩy đều, thơm bùi, bổ sung kẽm và khoáng chất", characteristicEn: "Plump green kernels, rich in zinc and essential minerals" },
    ],
    sensory: {
      nutCrispiness: 9.0,
      longanChewiness: 8.5,
      naturalSweetness: 8.5,
      harmoniousAroma: 9.0,
    },
    specifications: [
      { labelVi: "Khối lượng tịnh", labelEn: "Net Weight", valueVi: "150g / túi", valueEn: "150g / pouch" },
      { labelVi: "Thành phần phối trộn", labelEn: "Ingredients", valueVi: "Long nhãn Phố Hiến, Hạt điều, Macca, Bí xanh, Hạnh nhân", valueEn: "Dried longan, Cashews, Macadamia, Pumpkin seeds, Almonds" },
      { labelVi: "Phương pháp chế biến", labelEn: "Processing", valueVi: "Long nhãn sấy đối lưu + Hạt sấy giòn nhiệt thấp không chiên dầu", valueEn: "Convection-dried longan + Slow-roasted oil-free nuts" },
      { labelVi: "Hàm lượng phụ gia", labelEn: "Additives", valueVi: "0% Đường hóa học - 0% Lưu huỳnh - 0% Chất bảo quản", valueEn: "0% Added Sugar - 0% Sulfur - 0% Preservatives" },
      { labelVi: "Quy chuẩn bao bì", labelEn: "Packaging", valueVi: "Túi zip tráng màng nhôm khóa kín khí 2 mặt chống ẩm", valueEn: "Airtight double-foil zipper pouch" },
      { labelVi: "Hạn sử dụng", labelEn: "Shelf Life", valueVi: "12 tháng kể từ ngày sản xuất", valueEn: "12 months from production" },
      { labelVi: "Tiêu chuẩn kiểm nghiệm", labelEn: "Standards", valueVi: "OCOP 4 Sao, Chứng nhận ATVSTP quốc gia", valueEn: "OCOP 4-Star & National Food Hygiene Standard" },
    ],
    culinaryUsages: [
      {
        titleVi: "Ăn liền dưỡng sinh hàng ngày",
        titleEn: "Daily Energy Snacking",
        descVi: "Thưởng thức trực tiếp: một múi nhãn dẻo ngọt kèm một hạt bùi béo tạo vị ngon bùng nổ, nạp năng lượng tức thì.",
        descEn: "Enjoy straight: sweet chewy longan paired with buttery nuts for instant clean energy.",
        icon: "🌰",
      },
      {
        titleVi: "Mix cùng sữa chua & Granola",
        titleEn: "Yogurt & Smoothie Bowl",
        descVi: "Rắc một nắm hạt và long nhãn lên bát sữa chua Hy Lạp hoặc yến mạch bữa sáng dinh dưỡng.",
        descEn: "Sprinkle over Greek yogurt or morning oats for wholesome breakfast crunch.",
        icon: "🥣",
      },
      {
        titleVi: "Nhâm nhi cùng trà mạn / trà sen",
        titleEn: "Fine Tea Accompaniment",
        descVi: "Vị chát dịu của trà sen hay trà ô long hòa quyện xuất sắc với độ bùi của hạt và vị ngọt của long nhãn.",
        descEn: "Elegantly balances the gentle tannins of lotus or green tea.",
        icon: "🍵",
      },
      {
        titleVi: "Bữa phụ tập gym & eat-clean",
        titleEn: "Fitness & Wellness Fuel",
        descVi: "Cung cấp protein thực vật và chất béo tốt lành mạnh cho người ăn kiêng, tập luyện.",
        descEn: "Plant protein and healthy unsaturated fats tailored for clean-eating regimens.",
        icon: "⚡",
      },
    ],
    storageTipsVi: [
      "Kéo kín khóa zip ngay sau khi lấy hạt và múi nhãn.",
      "Bảo quản nơi khô ráo, thoáng mát (dưới 25°C), tránh nơi ẩm ướt và ánh nắng gắt.",
      "Sau khi mở túi, nên bảo quản trong ngăn mát tủ lạnh (4 - 8°C) để giữ trọn độ giòn của hạt và độ dẻo của nhãn.",
    ],
    storageTipsEn: [
      "Reseal the zipper strip tightly after each serving.",
      "Store in a cool, dry pantry below 25°C, away from moisture and direct sunlight.",
      "Refrigerate (4-8°C) after unsealing to preserve optimal nut crunchiness and longan aroma.",
    ],
  },

  // 2. Hộp Đặc Biệt 300g (Ngọc Nhãn Tiến Vua)
  "dac-biet": {
    id: "default-dac-biet",
    nameVi: 'Hộp "Ngọc Nhãn Tiến Vua"',
    nameEn: 'Special Box "Royal Longan & Premium Nuts"',
    subNameVi: "Phiên Bản Ngự Thiện Hộp Mica 300g - Long Nhãn & 4 Loại Hạt",
    subNameEn: "Imperial Edition 300g Canister - Longan & Tree Nut Fusion",
    size: "Hộp 300g",
    price: 153000,
    image: "/images/hopnhua.jpg",
    fallbackImages: ["/images/hopnhua.jpg", "/images/tuizip.jpg", "/images/setqua.jpg"],
    badgeVi: "Đặc Sản Tiến Vua 300g",
    badgeEn: "Imperial Tribute 300g",
    taglineVi: "Từng tầng hạt dinh dưỡng xếp lớp sang trọng bên cùi nhãn Hương Chi tiến vua hổ phách.",
    taglineEn: "Elegantly layered nutrient-rich nuts embracing golden imperial Huong Chi longan.",
    overviewVi:
      'Hộp "Ngọc Nhãn Tiến Vua" 300g tôn vinh tinh hoa ẩm thực cung đình. Sự kết hợp độc bản giữa cùi nhãn Hương Chi bãi bồi Phố Hiến sấy nhiệt đối lưu dẻo mềm cùng 4 loại hạt dinh dưỡng cao cấp (Hạt điều, Macca, Bí xanh, Hạnh nhân) tuyển chọn loại 1. Đựng trong hộp mica nắp nhôm xé cao cấp, nhìn rõ từng tầng hạt xếp lớp bắt mắt, sang trọng khi đặt trên bàn trà tiếp khách.',
    overviewEn:
      'The "Royal Longan" 300g canister celebrates royal banquet refinement. An exclusive blend of thick-fleshed Pho Hien convection-dried longan and 4 premium whole nuts (Cashews, Macadamia, Pumpkin seeds, Almonds). Sealed in a transparent food-grade mica canister with an aluminum peel-off lid.',
    ingredientsList: [
      { nameVi: "Long Nhãn Tiến Vua Hương Chi", nameEn: "Royal Tribute Huong Chi Longan", characteristicVi: "Cùi dày mọng, màu vàng cánh gián hổ phách, dẻo sần sật ngọt thanh", characteristicEn: "Thick-fleshed amber fruit, tenderly chewy with pure honeyed taste" },
      { nameVi: "Hạt Macca Tây Nguyên Hạng A", nameEn: "Grade-A Highland Macadamia", characteristicVi: "Hạt tròn đều, vị bùi béo tự nhiên, giàu chất chống oxy hóa", characteristicEn: "Uniform kernels, rich buttery taste, abundant in antioxidants" },
      { nameVi: "Hạt Điều Bình Phước Rang Chín", nameEn: "Roasted Binh Phuoc Cashews", characteristicVi: "Hạt điều loại W240 to tròn, thơm bùi ngậy giòn tan", characteristicEn: "Large W240 whole cashews, crunchy, fragrant and rich" },
      { nameVi: "Hạt Hạnh Nhân Nguyên Vị", nameEn: "Whole Natural Almonds", characteristicVi: "Hạt nâu vàng giòn rụm, giàu vitamin E, magie và canxi", characteristicEn: "Nutrient-dense natural almonds, providing vitamin E and magnesium" },
      { nameVi: "Hạt Bí Xanh Mẩy Hạt", nameEn: "Premium Green Pumpkin Kernels", characteristicVi: "Xanh bóng tự nhiên, bùi thơm, dồi dào kẽm và protein thực vật", characteristicEn: "Plump green seeds, naturally roasted, providing zinc and plant protein" },
    ],
    sensory: {
      nutCrispiness: 9.5,
      longanChewiness: 9.5,
      naturalSweetness: 9.0,
      harmoniousAroma: 9.5,
    },
    specifications: [
      { labelVi: "Khối lượng tịnh", labelEn: "Net Weight", valueVi: "300g / hộp", valueEn: "300g / canister" },
      { labelVi: "Thành phần", labelEn: "Ingredients", valueVi: "Long nhãn Hương Chi Phố Hiến, Hạt điều, Macca, Hạnh nhân, Bí xanh", valueEn: "Huong Chi longan, Cashews, Macadamia, Almonds, Pumpkin seeds" },
      { labelVi: "Công nghệ chế biến", labelEn: "Processing", valueVi: "Nhãn sấy đối lưu 36h + Hạt sấy chín chậm nhiệt thấp giữ trọn dầu tốt", valueEn: "36h convection drying + Low-temp nut roasting preserving healthy oils" },
      { labelVi: "Quy cách đóng gói", labelEn: "Packaging", valueVi: "Hộp tròn mica cao cấp, màng nhôm xé kín khí, nắp đậy tiện dụng", valueEn: "Premium transparent mica canister with peel-off foil seal and cap" },
      { labelVi: "Hạn sử dụng", labelEn: "Shelf Life", valueVi: "12 tháng kể từ ngày sản xuất", valueEn: "12 months from production" },
      { labelVi: "Tiêu chuẩn an toàn", labelEn: "Food Safety", valueVi: "OCOP 4 Sao, 0% Lưu huỳnh, 0% Phẩm màu hay đường hóa học", valueEn: "OCOP 4-Star, 0% Sulfur fumes, 0% Artificial color or sugar" },
    ],
    culinaryUsages: [
      {
        titleVi: "Bày bàn trà tiếp đón thượng khách",
        titleEn: "Distinguished Tea Reception",
        descVi: "Xếp hạt và long nhãn trên khay gốm sứ sang trọng, vừa nhâm nhi trà vừa thưởng thức vị ngọt thơm bùi ngậy.",
        descEn: "Present on fine tea sets; each bite harmonizes rich nut oils with sweet longan.",
        icon: "🫖",
      },
      {
        titleVi: "Bồi bổ sức khỏe mẹ bầu & người lớn tuổi",
        titleEn: "Prenatal & Senior Wellness",
        descVi: "Sự kết hợp hoàn chỉnh giữa canxi, magie, sắt, omega và năng lượng thanh sạch.",
        descEn: "A balanced formula delivering plant calcium, iron, omega fats, and gentle energy.",
        icon: "🤱",
      },
      {
        titleVi: "Món ăn vặt dưỡng nhan văn phòng",
        titleEn: "Office Beauty & Focus Snack",
        descVi: "Giúp tập trung trí não, no lâu mà không lo tăng cân hay tích tụ mỡ xấu.",
        descEn: "Fuels mental clarity and sustained satiety without unhealthy refined sugars.",
        icon: "✨",
      },
      {
        titleVi: "Quà biếu sức khỏe tinh tế",
        titleEn: "Refined Health Present",
        descVi: "Món quà văn hóa trang nhã biếu cha mẹ, thầy cô, người thân trong các dịp họp mặt.",
        descEn: "A thoughtful, tasteful wellness gift for loved ones, teachers, and elders.",
        icon: "🎁",
      },
    ],
    storageTipsVi: [
      "Đóng chặt nắp nhựa sau mỗi lần sử dụng.",
      "Bảo quản nơi khô ráo, tránh nhiệt độ cao và ánh nắng trực tiếp.",
      "Sau khi bóc lớp màng nhôm bảo vệ, nên để trong ngăn mát tủ lạnh (4-8°C) để giữ hạt luôn giòn rụm và nhãn luôn dẻo thơm.",
    ],
    storageTipsEn: [
      "Snap the cap tightly after every opening.",
      "Store in a dry ambient space away from direct sunlight.",
      "Refrigerate (4-8°C) once the aluminum seal is peeled to maintain crispiness and tender texture.",
    ],
  },

  // 3. Lễ Hộp Hoàng Gia 900g (Vọng Nguyệt Thương Cảng)
  "set-qua": {
    id: "default-set-qua",
    nameVi: 'Lễ Hộp "Vọng Nguyệt Thương Cảng"',
    nameEn: 'Imperial Gift Set "Port Moonrise"',
    subNameVi: "Lễ Hộp Thượng Hạng 900g Kèm Túi Xách - Long Nhãn & Hạt Dinh Dưỡng",
    subNameEn: "Prestige Gift Set 900g with Silk Tote - Longan & Imperial Nut Collection",
    size: "Set 900g",
    price: 756000,
    image: "/images/setqua.jpg",
    fallbackImages: ["/images/setqua.jpg", "/images/hopnhua.jpg", "/images/tuizip.jpg"],
    badgeVi: "Lễ Hộp Ngoại Giao 900g",
    badgeEn: "Diplomatic Gift Set 900g",
    taglineVi: "Âm hưởng Phố Hiến thế kỷ 17, đỉnh cao quà biếu sức khỏe kết hợp long nhãn tiến vua và 4 loại hạt.",
    taglineEn: "Echoing 17th-century Pho Hien prosperity, the pinnacle of gifting blending royal longan and fine nuts.",
    overviewVi:
      'Lấy cảm hứng từ những đêm ngắm trăng bên bến thương cảng Phố Hiến sầm uất ngàn năm, Lễ Hộp "Vọng Nguyệt Thương Cảng" là bộ phẩm vật ngoại giao cao cấp nhất của Nguyệt Nhãn. Bên trong là các hộp hạt dinh dưỡng cao cấp (Macca, Điều, Hạnh nhân, Bí xanh) hòa quyện cùng Long Nhãn tiến vua Hương Chi cùi dày thượng hạng. Hộp quà mỹ thuật ép kim hoa văn thời Lê kèm túi xách sang trọng, gửi gắm lời chúc Phúc Lộc Trường Niên và Sức Khỏe Vững Bền.',
    overviewEn:
      'Drawing inspiration from full-moon nights over historic Pho Hien merchant port, "Port Moonrise" is Nguyet Nhan’s finest diplomatic gift set. Contains a curated ensemble of 4 premium nuts (Macadamia, Cashews, Almonds, Pumpkin seeds) and royal Huong Chi dried longan. Packaged in an embossed gold-accented heritage gift box with an elegant silk tote.',
    ingredientsList: [
      { nameVi: "Long Nhãn Hoàng Kim Tuyển Chọn", nameEn: "Imperial Gold Grade Longan", characteristicVi: "Top 5% cùi nhãn to tròn đều nhất mùa vụ, vàng óng dẻo ngọt thuần khiết", characteristicEn: "Top 5% harvest pick, golden amber hue, supreme natural chewiness" },
      { nameVi: "Hạt Macca Thượng Hạng Nứt Nanh", nameEn: "Reserve Whole Macadamia", characteristicVi: "Hạt đại loại 1, nhân trắng ngà, thơm béo ngậy chuẩn vị hoàng gia", characteristicEn: "Jumbo Grade-1 kernels, exceptionally creamy and buttery" },
      { nameVi: "Hạt Điều Bình Phước Thượng Hạng", nameEn: "Binh Phuoc Reserve Cashews", characteristicVi: "Hạt nguyên vẹn không vụn vỡ, thơm ngậy bùi ngọt hậu vị", characteristicEn: "Premium unbroken whole cashews, rich roasted flavor and crisp crunch" },
      { nameVi: "Hạt Hạnh Nhân Tự Nhiên Tuyển Chọn", nameEn: "Select Whole Almonds", characteristicVi: "Hạt mẩy đều, giòn rụm, giữ nguyên lớp lụa giàu chất chống oxy hóa", characteristicEn: "Evenly plump almonds with natural skin packed with polyphenols" },
      { nameVi: "Hạt Bí Xanh Ấn Độ Thượng Phẩm", nameEn: "Selected Green Pumpkin Kernels", characteristicVi: "Hạt xanh đậm đều màu, giòn bùi, bổ dưỡng", characteristicEn: "Deep green seeds, nutrient-dense, roasted to peak aroma" },
    ],
    sensory: {
      nutCrispiness: 10,
      longanChewiness: 10,
      naturalSweetness: 9.5,
      harmoniousAroma: 10,
    },
    specifications: [
      { labelVi: "Khối lượng tịnh", labelEn: "Net Weight", valueVi: "900g (Bộ lễ hộp cao cấp)", valueEn: "900g (Imperial presentation set)" },
      { labelVi: "Thành phần tuyển chọn", labelEn: "Ingredients", valueVi: "Long nhãn Phố Hiến tiến vua, Hạt macca, Hạt điều, Hạnh nhân, Bí xanh", valueEn: "Imperial longan, Macadamia, Cashews, Almonds, Pumpkin seeds" },
      { labelVi: "Tiêu chuẩn tuyển lựa", labelEn: "Selection Standard", valueVi: "Phẩm cấp Hoàng Kim thượng hạng (Tuyển lựa thủ công từng hạt và múi)", valueEn: "Imperial Gold Selection (Manually hand-sorted for uniform size)" },
      { labelVi: "Thiết kế bao bì", labelEn: "Presentation", valueVi: "Lễ hộp cứng mỹ thuật ép nhũ kim hoa văn cổ kèm túi xách cao cấp", valueEn: "Rigid gold-embossed heritage presentation box with matching tote" },
      { labelVi: "Hạn sử dụng", labelEn: "Shelf Life", valueVi: "12 tháng kể từ ngày sản xuất", valueEn: "12 months from production" },
      { labelVi: "Tiêu chuẩn kiểm nghiệm", labelEn: "Certification", valueVi: "Đạt chuẩn OCOP 4 Sao, Quà biếu đối ngoại quốc tế", valueEn: "OCOP 4-Star Certified, Diplomatic Gift Grade" },
    ],
    culinaryUsages: [
      {
        titleVi: "Quà biếu ngoại giao & Đối tác cấp cao",
        titleEn: "Diplomatic & Executive Gifting",
        descVi: "Món quà tinh hoa văn hóa và sức khỏe đẳng cấp, khẳng định vị thế và sự trân trọng tuyệt đối với đối tác.",
        descEn: "A prestigious cultural wellness gift honoring VIP partners and esteemed dignitaries.",
        icon: "🏛️",
      },
      {
        titleVi: "Quà mừng thọ & Tri ân đấng sinh thành",
        titleEn: "Filial Respect & Longevity Gift",
        descVi: "Gửi gắm lời chúc Phúc Thọ An Khang, bồi bổ trí não, tim mạch và giấc ngủ cho cha mẹ, ông bà.",
        descEn: "Conveys heartfelt wishes for longevity and vitality to parents and grandparents.",
        icon: "🧧",
      },
      {
        titleVi: "Món ngự thiện trên bàn tiệc gia đình",
        titleEn: "Royal Family Feast Delicacy",
        descVi: "Vừa có nhãn ngọt thơm để hãm trà, nấu chè tiến vua, vừa có đĩa hạt cao cấp giòn bùi thiết đãi người thân.",
        descEn: "Includes sweet longan for tea and royal desserts alongside crunchy gourmet nuts.",
        icon: "👑",
      },
      {
        titleVi: "Trưng bày lễ gia tiên trang trọng",
        titleEn: "Ancestral Altar Presentation",
        descVi: "Bao bì ép kim tinh mỹ, phẩm vật thanh sạch dâng cúng tổ tiên trong các dịp lễ Tết cổ truyền.",
        descEn: "A magnificent, respectful offering for ancestral altars during lunar festivities.",
        icon: "🏮",
      },
    ],
    storageTipsVi: [
      "Bảo quản nguyên lễ hộp nơi khô ráo, thoáng mát, tránh nơi ẩm mốc và nhiệt độ cao.",
      "Khi mở các hộp con bên trong, đóng chặt nắp sau khi dùng và cất ngăn mát tủ lạnh (4-8°C).",
      "Không để gần các gia vị hoặc thực phẩm có mùi nồng để giữ trọn hương vị hạt và nhãn.",
    ],
    storageTipsEn: [
      "Keep presentation set in a cool, elevated, and dry environment.",
      "Once inner canisters are opened, reseal tightly and refrigerate at 4-8°C.",
      "Keep away from pungent foods to preserve the delicate aroma of longan and roasted nuts.",
    ],
  },
};

export function findProductDetail(prodOrId?: { id?: string; name?: string } | string): ProductDetailInfo {
  if (!prodOrId) return PRODUCT_DETAILS_MAP["tui-zip"];
  const idOrName = typeof prodOrId === "string" ? prodOrId.toLowerCase() : `${prodOrId.id || ""} ${prodOrId.name || ""}`.toLowerCase();

  if (idOrName.includes("tui-zip") || idOrName.includes("tứ dã") || idOrName.includes("150g") || idOrName.includes("túi")) {
    return PRODUCT_DETAILS_MAP["tui-zip"];
  }
  if (idOrName.includes("set-qua") || idOrName.includes("hoàng gia") || idOrName.includes("thương cảng") || idOrName.includes("900g") || idOrName.includes("lễ hộp")) {
    return PRODUCT_DETAILS_MAP["set-qua"];
  }
  return PRODUCT_DETAILS_MAP["dac-biet"];
}
