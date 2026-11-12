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
  // Hồ sơ cảm quan (thang điểm 10)
  sensory: {
    chewiness: number; // Độ dẻo mọng sần sật
    sweetness: number; // Độ ngọt thanh tao
    aroma: number; // Hương thơm hoa nhãn
    amberColor: number; // Sắc vàng hổ phách
  };
  // Bảng thông số kỹ thuật
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
    nameEn: 'Zipper Pouch "Four Realms Pearls"',
    subNameVi: "Túi Zip Khóa Khí Tiện Lợi 150g",
    subNameEn: "Airtight Resealable Pouch 150g",
    size: "Túi 150g",
    price: 69000,
    image: "/images/tuizip.jpg",
    fallbackImages: ["/images/tuizip.jpg", "/images/hopnhua.jpg", "/images/setqua.jpg"],
    badgeVi: "Dưỡng Sinh Hằng Ngày",
    badgeEn: "Daily Wellness",
    taglineVi: "Thuận tiện mang theo, túi zip khóa kín khí giữ trọn độ dẻo thơm tự nhiên.",
    taglineEn: "Pocket-sized convenience, airtight zip seal preserving natural chewiness.",
    overviewVi:
      'Được ví như những viên "trân châu" thanh quý của đồng bằng châu thổ, gói 150g là lựa chọn hoàn hảo cho nhu cầu dùng thử, mang theo đi làm, tập luyện hay pha những tách trà dưỡng nhan hằng ngày.',
    overviewEn:
      'Cherished as golden "pearls" from alluvial soils, this 150g pack is tailored for daily nourishment, workplace snacking, and restorative herbal teas.',
    sensory: {
      chewiness: 8.5,
      sweetness: 8.5,
      aroma: 9.0,
      amberColor: 9.0,
    },
    specifications: [
      { labelVi: "Khối lượng tịnh", labelEn: "Net Weight", valueVi: "150g / túi", valueEn: "150g / pouch" },
      { labelVi: "Giống nhãn", labelEn: "Longan Variety", valueVi: "Nhãn Hương Chi chính vụ Hưng Yên", valueEn: "Authentic Hung Yen Huong Chi" },
      { labelVi: "Công nghệ sấy", labelEn: "Drying Method", valueVi: "Sấy nhiệt đối lưu tuần hoàn (Hot-air)", valueEn: "Hot-air Convective Drying" },
      { labelVi: "Độ ẩm", labelEn: "Moisture Content", valueVi: "Dưới 15% (Chuẩn dẻo mật)", valueEn: "Below 15% (Tender dry)" },
      { labelVi: "Quy chuẩn bao bì", labelEn: "Packaging", valueVi: "Túi zip màng nhôm khóa kín khí 2 mặt", valueEn: "Airtight double-foil zipper pouch" },
      { labelVi: "Hạn sử dụng", labelEn: "Shelf Life", valueVi: "12 tháng kể từ ngày sản xuất", valueEn: "12 months from production" },
      { labelVi: "Chứng nhận", labelEn: "Certification", valueVi: "OCOP 4 Sao, ATVSTP 0% Lưu Huỳnh", valueEn: "OCOP 4-Star, Food Safety, Sulfur-free" },
    ],
    culinaryUsages: [
      {
        titleVi: "Ăn liền dưỡng sinh",
        titleEn: "Ready-to-eat Snacking",
        descVi: "Dùng trực tiếp 5 - 10 múi mỗi ngày thay đồ ngọt công nghiệp, bổ sung năng lượng tức thì.",
        descEn: "Enjoy 5-10 pieces daily as an all-natural vitality snack.",
        icon: "✨",
      },
      {
        titleVi: "Hãm trà hoa thảo mộc",
        titleEn: "Herbal Tea Infusion",
        descVi: "Thả 3-5 múi vào tách trà hoa cúc, kỷ tử hoặc trà ô long giúp nước trà ngọt dịu thanh tao.",
        descEn: "Steep with chamomile, chrysanthemum, or goji berries for a calming herbal tea.",
        icon: "🍵",
      },
      {
        titleVi: "Nấu chè giải nhiệt",
        titleEn: "Sweet Dessert Soup",
        descVi: "Nấu chè hạt sen long nhãn, chè sâm bổ lượng mát lành bồi bổ gia đình.",
        descEn: "Simmer with lotus seeds or pear for traditional restorative sweet soup.",
        icon: "🥣",
      },
      {
        titleVi: "Ngâm rượu nếp bồi bổ",
        titleEn: "Restorative Wine Infusion",
        descVi: "Ngâm cùng rượu gạo nếp hoa vàng giúp ngủ sâu giấc và ấm tỳ vị.",
        descEn: "Infuse in aged rice wine for deep sleep and vitality.",
        icon: "🍶",
      },
    ],
    storageTipsVi: [
      "Kéo kín miệng khóa zip ngay sau khi lấy múi nhãn.",
      "Để nơi khô ráo, thoáng mát (dưới 25°C), tránh ánh nắng chiếu trực tiếp.",
      "Sau khi mở túi, nên bảo quản trong ngăn mát tủ lạnh (4 - 8°C) để giữ màu vàng óng lâu dài.",
    ],
    storageTipsEn: [
      "Seal the zipper strip tightly immediately after use.",
      "Store in a cool, dry place below 25°C, away from direct sunlight.",
      "Keep refrigerated (4-8°C) after opening to preserve honey color and aroma.",
    ],
  },

  // 2. Hộp Đặc Biệt 300g (Ngọc Nhãn Tiến Vua)
  "dac-biet": {
    id: "default-dac-biet",
    nameVi: 'Hộp "Ngọc Nhãn Tiến Vua"',
    nameEn: 'Special Box "Royal Longan"',
    subNameVi: "Phiên Bản Ngự Thiện Cùi Dày Hộp Mica 300g",
    subNameEn: "Imperial Edition Thick-fleshed 300g Box",
    size: "Hộp 300g",
    price: 153000,
    image: "/images/hopnhua.jpg",
    fallbackImages: ["/images/hopnhua.jpg", "/images/tuizip.jpg", "/images/setqua.jpg"],
    badgeVi: "Đặc Sản Tiến Vua",
    badgeEn: "Imperial Tribute",
    taglineVi: "Từng cùi nhãn tròn đều tăm tắp, sắc hổ phách vương giả, dẻo sần sật trên bàn trà.",
    taglineEn: "Thick-fleshed, golden amber perfection for fine tea tables and discerning palates.",
    overviewVi:
      'Tái hiện trọn vẹn phong vị Ngự Thiện triều đình tiến vua xưa. Từng múi nhãn Hương Chi bãi bồi Phố Hiến được tách hạt thủ công, sấy đối lưu 36 giờ giữ trọn vị ngọt thanh thuần khiết, đựng trong hộp mica nắp nhôm xé trang trọng.',
    overviewEn:
      'Recreating the historic royal tribute of Pho Hien port. Each thick-fleshed Huong Chi longan is hand-pitted and convection-dried for 36 hours, preserving pristine royal sweetness in an elegant airtight mica box.',
    sensory: {
      chewiness: 9.5,
      sweetness: 9.0,
      aroma: 9.5,
      amberColor: 9.5,
    },
    specifications: [
      { labelVi: "Khối lượng tịnh", labelEn: "Net Weight", valueVi: "300g / hộp", valueEn: "300g / box" },
      { labelVi: "Giống nhãn", labelEn: "Longan Variety", valueVi: "Hương Chi cổ thụ loại 1 bãi bồi Hồng Châu", valueEn: "Grade-1 Heritage Huong Chi" },
      { labelVi: "Công nghệ sấy", labelEn: "Drying Method", valueVi: "Sấy nhiệt nóng đối lưu 55-65°C không khói than", valueEn: "Clean convective hot-air drying" },
      { labelVi: "Độ dày cùi", labelEn: "Flesh Thickness", valueVi: "Dày múi, nở tròn đều tăm tắp", valueEn: "Thick, plump and evenly rounded" },
      { labelVi: "Quy chuẩn bao bì", labelEn: "Packaging", valueVi: "Hộp mica thực phẩm cao cấp nắp nhôm xé", valueEn: "Food-grade mica canister with peel-off aluminum seal" },
      { labelVi: "Hạn sử dụng", labelEn: "Shelf Life", valueVi: "12 tháng kể từ ngày sản xuất", valueEn: "12 months from production" },
      { labelVi: "Tiêu chuẩn", labelEn: "Standards", valueVi: "OCOP 4 Sao, Chứng nhận ATVSTP quốc gia", valueEn: "OCOP 4-Star & National Food Hygiene" },
    ],
    culinaryUsages: [
      {
        titleVi: "Thưởng trà bàn tiệc",
        titleEn: "Fine Tea Pairing",
        descVi: "Bày trên đĩa sứ thưởng thức cùng trà sen Tây Hồ hoặc trà mạn Tân Cương tiếp khách quý.",
        descEn: "Pair on fine porcelain alongside Lotus or Green tea for honored guests.",
        icon: "🫖",
      },
      {
        titleVi: "Chưng yến tiến vua",
        titleEn: "Bird's Nest Soup",
        descVi: "Chưng cách thủy cùng tổ yến và táo đỏ tạo nên món ngự thiện dưỡng nhan đỉnh cao.",
        descEn: "Double-boiled with bird's nest and red dates for sovereign vitality.",
        icon: "👑",
      },
      {
        titleVi: "Chè hạt sen long nhãn",
        titleEn: "Lotus Seed & Longan Dessert",
        descVi: "Ôm hạt sen bở xốp vào lòng múi nhãn dẻo ngọt, nấu nước đường phèn hoa bưởi thanh khiết.",
        descEn: "Stuff with tender lotus seeds in rock sugar and jasmine infusion.",
        icon: "🍲",
      },
      {
        titleVi: "Quà tặng thân tình",
        titleEn: "Heartfelt Gift",
        descVi: "Món quà tinh tế, trang nhã dành tặng ông bà, cha mẹ, thầy cô và bạn bè thân quý.",
        descEn: "An exquisite, thoughtful present for elders, family and friends.",
        icon: "🎁",
      },
    ],
    storageTipsVi: [
      "Đóng chặt nắp nhựa sau mỗi lần thưởng thức.",
      "Bảo quản nơi khô ráo, tránh nhiệt độ cao và nguồn nhiệt trực tiếp.",
      "Nên để ngăn mát tủ lạnh sau khi mở nắp nhôm để nhãn giữ được độ giòn dẻo lý tưởng.",
    ],
    storageTipsEn: [
      "Snap the plastic cap tight after every serving.",
      "Store in a dry location, away from stoves or direct heat sources.",
      "Refrigerate after peeling the aluminum seal to sustain ideal texture and honey notes.",
    ],
  },

  // 3. Lễ Hộp Hoàng Gia 900g (Vọng Nguyệt Thương Cảng)
  "set-qua": {
    id: "default-set-qua",
    nameVi: 'Lễ Hộp "Vọng Nguyệt Thương Cảng"',
    nameEn: 'Imperial Gift Set "Port Moonrise"',
    subNameVi: "Tuyệt Phẩm Hoàng Gia 900g Kèm Túi Xách Cao Cấp",
    subNameEn: "Imperial Tribute 900g with Luxury Tote",
    size: "Set 900g",
    price: 756000,
    image: "/images/setqua.jpg",
    fallbackImages: ["/images/setqua.jpg", "/images/hopnhua.jpg", "/images/tuizip.jpg"],
    badgeVi: "Lễ Hộp Ngoại Giao",
    badgeEn: "Diplomatic Gift Set",
    taglineVi: "Âm hưởng thương cảng Phố Hiến thế kỷ 17, đỉnh cao quà biếu sức khỏe và ngoại giao.",
    taglineEn: "Echoing 17th-century Pho Hien prosperity, the pinnacle of prestige and festive gifting.",
    overviewVi:
      'Lấy cảm hứng từ những đêm trăng rằm soi bóng bến thương cảng Phố Hiến sầm uất ngàn năm, Lễ Hộp Hoàng Gia 900g kết hợp nghệ thuật thủ công truyền thống và tuyển chọn những múi nhãn to tròn vàng óng nhất vụ mùa. Món quà ngoại giao sang trọng khẳng định vị thế người trao và trân quý người nhận.',
    overviewEn:
      'Inspired by full moon nights over the storied 17th-century merchant port, this 900g Imperial Set combines heritage packaging artistry with the harvest’s most supreme golden longan gems. A royal gesture of gratitude for partners, dignitaries, and cherished elders.',
    sensory: {
      chewiness: 10,
      sweetness: 9.5,
      aroma: 10,
      amberColor: 10,
    },
    specifications: [
      { labelVi: "Khối lượng tịnh", labelEn: "Net Weight", valueVi: "900g (Đóng hộp cao cấp)", valueEn: "900g (Luxury canisters)" },
      { labelVi: "Cấp phẩm", labelEn: "Grade Quality", valueVi: "Phẩm cấp Hoàng Kim Thượng Hạng (Top 5% mùa vụ)", valueEn: "Imperial Golden Grade (Top 5% of harvest)" },
      { labelVi: "Công nghệ sấy", labelEn: "Drying Method", valueVi: "Sấy đối lưu nhiệt thấp giữ trọn sắc vàng óng", valueEn: "Low-temp convective drying preserving gold tint" },
      { labelVi: "Thiết kế bao bì", labelEn: "Packaging Design", valueVi: "Lễ hộp mỹ thuật ép kim hoa văn cổ kèm túi lụa", valueEn: "Gold-embossed heritage presentation box with silk tote" },
      { labelVi: "Hạn sử dụng", labelEn: "Shelf Life", valueVi: "12 tháng kể từ ngày sản xuất", valueEn: "12 months from production" },
      { labelVi: "Tiêu chuẩn", labelEn: "Standards", valueVi: "OCOP 4 Sao, Đạt chuẩn quà biếu đối ngoại", valueEn: "OCOP 4-Star, Diplomatic Gift Grade" },
    ],
    culinaryUsages: [
      {
        titleVi: "Quà biếu tri ân Tết & Sự kiện",
        titleEn: "Festive & VIP Gifting",
        descVi: "Món quà trọn vẹn tâm ý dành tặng đối tác chiến lược, lãnh đạo và song thân phụ mẫu.",
        descEn: "The ultimate gesture of respect for corporate partners, leaders, and parents.",
        icon: "🎁",
      },
      {
        titleVi: "Dâng lễ cúng gia tiên",
        titleEn: "Ancestral Offerings",
        descVi: "Phẩm vật thuần khiết cung tiến tổ tiên dịp rằm, mùng một và lễ Tết cổ truyền.",
        descEn: "Pristine traditional offerings for sacred occasions and lunar celebrations.",
        icon: "🏮",
      },
      {
        titleVi: "Yến tiệc ngự thiện hoàng gia",
        titleEn: "Imperial Banquet",
        descVi: "Dùng chế biến các món tráng miệng thượng lưu như súp yến long nhãn, chè cung đình.",
        descEn: "Serve at banquet dinners for bird’s nest or royal royal desserts.",
        icon: "👑",
      },
      {
        titleVi: "Trưng bày sang trọng",
        titleEn: "Display & Decor",
        descVi: "Hộp quà thiết kế tinh mỹ làm sáng bừng không gian phòng khách và bàn trà truyền thống.",
        descEn: "A magnificent ornamental centerpiece for living rooms and tea chambers.",
        icon: "🏛️",
      },
    ],
    storageTipsVi: [
      "Bảo quản nguyên set trong hộp nơi khô ráo, cao ráo, tránh nơi ẩm mốc.",
      "Sau khi mở từng hộp con 450g bên trong, nên cất trong ngăn mát tủ lạnh.",
      "Tránh để gần các sản phẩm có mùi nồng để giữ trọn hương hoa nhãn tự nhiên.",
    ],
    storageTipsEn: [
      "Store presentation box in a cool, elevated, and dry place.",
      "Once individual inner canisters are unsealed, refrigerate immediately.",
      "Keep separated from pungent items to preserve pure longan floral fragrance.",
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
