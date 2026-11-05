import ExcelJS from "exceljs";
import type { DayPointDto, OrderResponse } from "@/types/api.types";

/**
 * Định dạng ngày YYYY-MM-DD sang DD/MM/YYYY
 */
function formatDisplayDate(key: string): string {
  const parts = key.split("-");
  if (parts.length < 3) return key;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Lấy thứ trong tuần từ chuỗi YYYY-MM-DD
 */
function getDayOfWeekName(key: string): string {
  try {
    const d = new Date(key + "T00:00:00");
    const day = d.getDay();
    const names = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    return names[day] ?? "";
  } catch {
    return "";
  }
}

/**
 * Format tiền tệ VNĐ dạng text cho CSV: 1.500.000 đ
 */
function formatVndText(num: number): string {
  return `${Math.round(num).toLocaleString("vi-VN")} đ`;
}

/**
 * Escape chuỗi văn bản cho file CSV (RFC 4180)
 */
function escapeCsv(val: unknown): string {
  if (val == null) return '""';
  const s = String(val).replace(/"/g, '""');
  return `"${s}"`;
}

/**
 * Trích xuất danh sách sản phẩm tóm tắt từ một đơn hàng
 */
function getOrderProductsSummary(order: OrderResponse): string {
  if (order.items && order.items.length > 0) {
    return order.items
      .map((it) => `${it.quantity}x ${it.productName}${it.productSize ? ` (${it.productSize})` : ""}`)
      .join(", ");
  }
  if (order.productName) {
    return `${order.quantity ?? 1}x ${order.productName}${order.productSize ? ` (${order.productSize})` : ""}`;
  }
  return "Không có chi tiết";
}

/**
 * Dịch trạng thái đơn hàng sang tiếng Việt hiển thị
 */
function translateOrderStatus(status: string): string {
  switch (status) {
    case "Delivered":
      return "Đã giao hàng";
    case "Shipping":
      return "Đang vận chuyển";
    case "Processing":
      return "Đang chuẩn bị hàng";
    case "Pending":
      return "Chờ xác nhận";
    case "Cancelled":
      return "Đã hủy";
    default:
      return status;
  }
}

/**
 * Tính toán danh sách Top sản phẩm bán chạy từ đơn hàng
 */
function calculateTopProducts(orders: OrderResponse[]) {
  const valid = orders.filter((o) => o.status !== "Cancelled");
  const map: Record<string, { name: string; size: string; quantity: number; revenue: number }> = {};
  let totalRev = 0;

  for (const o of valid) {
    if (o.items && o.items.length > 0) {
      for (const it of o.items) {
        const k = `${it.productName}_${it.productSize ?? ""}`;
        if (!map[k]) {
          map[k] = { name: it.productName, size: it.productSize ?? "Mặc định", quantity: 0, revenue: 0 };
        }
        map[k].quantity += it.quantity;
        map[k].revenue += it.totalPrice;
        totalRev += it.totalPrice;
      }
    } else if (o.productName) {
      const k = `${o.productName}_${o.productSize ?? ""}`;
      if (!map[k]) {
        map[k] = { name: o.productName, size: o.productSize ?? "Mặc định", quantity: 0, revenue: 0 };
      }
      map[k].quantity += o.quantity ?? 1;
      map[k].revenue += o.totalAmount;
      totalRev += o.totalAmount;
    }
  }

  return Object.values(map)
    .sort((a, b) => b.quantity - a.quantity)
    .map((item, idx) => ({
      rank: idx + 1,
      ...item,
      sharePct: totalRev > 0 ? (item.revenue / totalRev) * 100 : 0,
    }));
}

/**
 * Tự động canh chỉnh độ rộng cột theo nội dung (chống lỗi #######)
 */
function autoFitColumnWidths(worksheet: ExcelJS.Worksheet) {
  worksheet.columns.forEach((column) => {
    let maxLen = 12;
    column.eachCell?.({ includeEmpty: false }, (cell) => {
      if (cell.value != null) {
        const valStr = typeof cell.value === "object" ? JSON.stringify(cell.value) : String(cell.value);
        if (valStr.length > maxLen) {
          maxLen = valStr.length;
        }
      }
    });
    // Giữ độ rộng tối thiểu 14 để ngày tháng và tiền tệ luôn hiển thị thoáng
    column.width = Math.min(Math.max(maxLen + 4, 15), 50);
  });
}

/**
 * =========================================================================
 * 1. XUẤT BẢNG EXCEL THÔNG MINH (SMART TABLE .XLSX)
 * =========================================================================
 */
export async function exportRevenueExcel(
  chartData: DayPointDto[],
  rawOrders: OrderResponse[],
  rangeDays: number
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Nguyệt Nhãn Phố Hiến";
  workbook.created = new Date();
  workbook.properties.date1904 = false;

  const totalRevenue = chartData.reduce((s, p) => s + p.revenue, 0);
  const totalOrders = chartData.reduce((s, p) => s + p.orders, 0);
  const avgAov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const avgRevPerDay = rangeDays > 0 ? Math.round(totalRevenue / rangeDays) : 0;

  const reportDaysSet = new Set(chartData.map((d) => d.key));
  const vietnamDate = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
  const reportOrders = rawOrders.filter((o) =>
    reportDaysSet.has(vietnamDate.format(new Date(o.createdAt)))
  );
  const cancelledOrdersCount = reportOrders.filter((o) => o.status === "Cancelled").length;

  // -------------------------------------------------------------
  // SHEET 1: DOANH THU & HIỆU SUẤT THEO NGÀY
  // -------------------------------------------------------------
  const wsRevenue = workbook.addWorksheet("Doanh Thu Theo Ngày", {
    views: [{ showGridLines: true }],
  });

  // Tiêu đề thương hiệu A1:I1
  wsRevenue.mergeCells("A1:I1");
  const titleCell = wsRevenue.getCell("A1");
  titleCell.value = "BÁO CÁO DOANH THU & HIỆU SUẤT BÁN HÀNG - NGUYỆT NHÃN PHỐ HIẾN";
  titleCell.font = { name: "Arial", size: 15, bold: true, color: { argb: "FF1B4332" } };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFEF3C7" }, // Vàng kem hoàng gia
  };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  wsRevenue.getRow(1).height = 36;

  // Metadata dòng 2
  wsRevenue.mergeCells("A2:I2");
  const metaCell = wsRevenue.getCell("A2");
  metaCell.value = `Kỳ báo cáo: ${rangeDays} ngày qua | Xuất báo cáo lúc: ${new Date().toLocaleString("vi-VN")} | Đơn vị tiền tệ: VNĐ`;
  metaCell.font = { name: "Arial", size: 10, italic: true, color: { argb: "FF4B5563" } };
  metaCell.alignment = { vertical: "middle", horizontal: "center" };
  wsRevenue.getRow(2).height = 22;

  // Dòng 3: Trống
  wsRevenue.getRow(3).height = 10;

  // Thẻ tóm tắt KPIs dòng 4 & 5
  const kpiHeaders = [
    { col: "B", label: "TỔNG DOANH THU (ĐÃ GIAO)" },
    { col: "C", label: "ĐƠN THÀNH CÔNG" },
    { col: "D", label: "GIÁ TRỊ TB / ĐƠN (AOV)" },
    { col: "E", label: "DOANH THU TB / NGÀY" },
    { col: "F", label: "ĐƠN HỦY (ĐÃ TRỪ)" },
  ];

  kpiHeaders.forEach(({ col, label }) => {
    const c = wsRevenue.getCell(`${col}4`);
    c.value = label;
    c.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF78350F" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDE68A" } };
    c.alignment = { horizontal: "center", vertical: "middle" };
  });

  const kpiValues = [
    { col: "B", val: totalRevenue, numFmt: '#,##0 "₫"' },
    { col: "C", val: `${totalOrders} đơn`, numFmt: undefined },
    { col: "D", val: avgAov, numFmt: '#,##0 "₫"' },
    { col: "E", val: avgRevPerDay, numFmt: '#,##0 "₫"' },
    { col: "F", val: `${cancelledOrdersCount} đơn`, numFmt: undefined },
  ];

  kpiValues.forEach(({ col, val, numFmt }) => {
    const c = wsRevenue.getCell(`${col}5`);
    c.value = val;
    c.font = { name: "Arial", size: 12, bold: true, color: { argb: "FF1E293B" } };
    c.alignment = { horizontal: "center", vertical: "middle" };
    if (numFmt) c.numFmt = numFmt;
  });

  wsRevenue.getRow(4).height = 20;
  wsRevenue.getRow(5).height = 26;
  wsRevenue.getRow(6).height = 12;

  // Tiêu đề bảng dòng 7
  const sectionTitle = wsRevenue.getCell("A7");
  sectionTitle.value = "CHI TIẾT THEO TỪNG NGÀY BÁN HÀNG";
  sectionTitle.font = { name: "Arial", size: 11, bold: true, color: { argb: "FF1B4332" } };

  // Chuẩn bị dữ liệu bảng thông minh (Smart Table)
  const dailyRows = chartData.map((d, idx) => {
    const aov = d.orders > 0 ? Math.round(d.revenue / d.orders) : 0;
    let evalText = "⚪ Không phát sinh đơn";
    if (d.revenue >= 1000000) evalText = "🔥 Doanh thu bùng nổ";
    else if (d.revenue > 0) evalText = "🟢 Hoạt động tốt";

    return [
      idx + 1,
      formatDisplayDate(d.key),
      getDayOfWeekName(d.key),
      d.revenue,
      d.orders,
      aov,
      evalText,
    ];
  });

  wsRevenue.addTable({
    name: "Bang_DoanhThu_Ngay",
    ref: "A8",
    headerRow: true,
    totalsRow: true,
    style: {
      theme: "TableStyleMedium9",
      showRowStripes: true,
    },
    columns: [
      { name: "STT", totalsRowLabel: "Tổng cộng:" },
      { name: "Ngày Bán Hàng" },
      { name: "Thứ" },
      { name: "Doanh Thu (VNĐ)", totalsRowFunction: "sum" },
      { name: "Số Đơn Thành Công", totalsRowFunction: "sum" },
      { name: "Doanh Thu TB / Đơn", totalsRowFunction: "average" },
      { name: "Đánh Giá Hiệu Suất" },
    ],
    rows: dailyRows,
  });

  // Định dạng number format cho các cột trong bảng Smart Table
  const tableStartRow = 9;
  const tableEndRow = tableStartRow + dailyRows.length; // bao gồm cả dòng Totals

  for (let r = tableStartRow; r <= tableEndRow; r++) {
    const row = wsRevenue.getRow(r);
    row.getCell(1).alignment = { horizontal: "center" };
    row.getCell(2).alignment = { horizontal: "center" };
    row.getCell(3).alignment = { horizontal: "center" };
    // Cột Doanh Thu (cột 4)
    row.getCell(4).numFmt = '#,##0 "₫"';
    row.getCell(4).alignment = { horizontal: "right" };
    // Cột Số đơn (cột 5)
    row.getCell(5).alignment = { horizontal: "center" };
    // Cột AOV (cột 6)
    row.getCell(6).numFmt = '#,##0 "₫"';
    row.getCell(6).alignment = { horizontal: "right" };
    // Cột Đánh giá (cột 7)
    row.getCell(7).alignment = { horizontal: "left" };
  }

  autoFitColumnWidths(wsRevenue);

  // -------------------------------------------------------------
  // SHEET 2: TOP SẢN PHẨM BÁN CHẠY
  // -------------------------------------------------------------
  const wsProducts = workbook.addWorksheet("Top Sản Phẩm Bán Chạy", {
    views: [{ showGridLines: true }],
  });

  wsProducts.mergeCells("A1:G1");
  const pTitle = wsProducts.getCell("A1");
  pTitle.value = "BẢNG XẾP HẠNG SẢN PHẨM BÁN CHẠY (TỪ CÁC ĐƠN HÀNG THÀNH CÔNG)";
  pTitle.font = { name: "Arial", size: 14, bold: true, color: { argb: "FF1B4332" } };
  pTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };
  pTitle.alignment = { vertical: "middle", horizontal: "center" };
  wsProducts.getRow(1).height = 32;

  const topProductsList = calculateTopProducts(reportOrders);
  const productRows = topProductsList.map((p) => [
    p.rank,
    p.name,
    p.size,
    p.quantity,
    p.revenue,
    p.sharePct / 100, // để dùng number format %
    p.rank === 1 ? "🥇 Bán chạy nhất" : p.rank === 2 ? "🥈 Á quân doanh số" : "🟢 Sức mua tốt",
  ]);

  if (productRows.length > 0) {
    wsProducts.addTable({
      name: "Bang_Top_SanPham",
      ref: "A3",
      headerRow: true,
      totalsRow: true,
      style: {
        theme: "TableStyleMedium14",
        showRowStripes: true,
      },
      columns: [
        { name: "Hạng (#)", totalsRowLabel: "Tổng cộng:" },
        { name: "Tên Sản Phẩm" },
        { name: "Quy Cách / Kích Cỡ" },
        { name: "Số Lượng Đã Bán", totalsRowFunction: "sum" },
        { name: "Doanh Thu Mang Lại (VNĐ)", totalsRowFunction: "sum" },
        { name: "Tỷ Trọng Doanh Thu", totalsRowFunction: "sum" },
        { name: "Nhận Định" },
      ],
      rows: productRows,
    });

    const pStartRow = 4;
    const pEndRow = pStartRow + productRows.length;
    for (let r = pStartRow; r <= pEndRow; r++) {
      const row = wsProducts.getRow(r);
      row.getCell(1).alignment = { horizontal: "center" };
      row.getCell(3).alignment = { horizontal: "center" };
      row.getCell(4).alignment = { horizontal: "center" };
      row.getCell(5).numFmt = '#,##0 "₫"';
      row.getCell(5).alignment = { horizontal: "right" };
      row.getCell(6).numFmt = "0.0%";
      row.getCell(6).alignment = { horizontal: "right" };
    }
  }

  autoFitColumnWidths(wsProducts);

  // -------------------------------------------------------------
  // SHEET 3: DANH SÁCH ĐƠN HÀNG CHI TIẾT
  // -------------------------------------------------------------
  const wsOrders = workbook.addWorksheet("Chi Tiết Đơn Hàng", {
    views: [{ showGridLines: true }],
  });

  wsOrders.mergeCells("A1:K1");
  const oTitle = wsOrders.getCell("A1");
  oTitle.value = "DANH SÁCH CHI TIẾT ĐƠN HÀNG TRONG KỲ BÁO CÁO";
  oTitle.font = { name: "Arial", size: 14, bold: true, color: { argb: "FF1B4332" } };
  oTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };
  oTitle.alignment = { vertical: "middle", horizontal: "center" };
  wsOrders.getRow(1).height = 32;

  const orderRows = reportOrders.map((o, idx) => {
    let formattedTime = "";
    try {
      formattedTime = new Date(o.createdAt).toLocaleString("vi-VN");
    } catch {
      formattedTime = o.createdAt;
    }

    return [
      idx + 1,
      `#${o.id.slice(0, 8).toUpperCase()}`,
      formattedTime,
      o.customerName,
      o.customerPhone,
      o.customerAddress,
      getOrderProductsSummary(o),
      translateOrderStatus(o.status),
      o.discountAmount || 0,
      o.totalAmount,
      o.note || "",
    ];
  });

  if (orderRows.length > 0) {
    wsOrders.addTable({
      name: "Bang_ChiTiet_DonHang",
      ref: "A3",
      headerRow: true,
      totalsRow: true,
      style: {
        theme: "TableStyleMedium2",
        showRowStripes: true,
      },
      columns: [
        { name: "STT", totalsRowLabel: "Tổng cộng:" },
        { name: "Mã Đơn Hàng" },
        { name: "Thời Gian Đặt" },
        { name: "Khách Hàng" },
        { name: "Số Điện Thoại" },
        { name: "Địa Chỉ Nhận Hàng" },
        { name: "Sản Phẩm Đặt Mua" },
        { name: "Trạng Thái Đơn" },
        { name: "Giảm Giá (VNĐ)", totalsRowFunction: "sum" },
        { name: "Tổng Tiền (VNĐ)", totalsRowFunction: "sum" },
        { name: "Ghi Chú" },
      ],
      rows: orderRows,
    });

    const oStartRow = 4;
    const oEndRow = oStartRow + orderRows.length;
    for (let r = oStartRow; r <= oEndRow; r++) {
      const row = wsOrders.getRow(r);
      row.getCell(1).alignment = { horizontal: "center" };
      row.getCell(2).alignment = { horizontal: "center" };
      row.getCell(3).alignment = { horizontal: "center" };
      row.getCell(5).alignment = { horizontal: "center" };
      row.getCell(8).alignment = { horizontal: "center" };
      row.getCell(9).numFmt = '#,##0 "₫"';
      row.getCell(9).alignment = { horizontal: "right" };
      row.getCell(10).numFmt = '#,##0 "₫"';
      row.getCell(10).alignment = { horizontal: "right" };
    }
  }

  autoFitColumnWidths(wsOrders);

  // Xuất file tải về
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerFileDownload(blob, `bao-cao-doanh-thu-thong-minh-${rangeDays}-ngay-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * =========================================================================
 * 2. XUẤT CSV BẢNG PHẲNG CHUẨN RFC 4180 (UTF-8 BOM CHUẨN)
 * =========================================================================
 */
export function exportRevenueCsv(chartData: DayPointDto[], rangeDays: number): void {
  const L: string[] = [];
  // Dòng 1: Header chuẩn bảng phẳng, không sep=;
  L.push(
    [
      escapeCsv("STT"),
      escapeCsv("Ngày Bán Hàng"),
      escapeCsv("Thứ"),
      escapeCsv("Doanh Thu Thực Tế (VNĐ)"),
      escapeCsv("Số Đơn Thành Công"),
      escapeCsv("Doanh Thu TB / Đơn (VNĐ)"),
      escapeCsv("Đánh Giá Hiệu Suất"),
    ].join(",")
  );

  let totalRev = 0;
  let totalOrders = 0;

  chartData.forEach((d, idx) => {
    totalRev += d.revenue;
    totalOrders += d.orders;
    const aov = d.orders > 0 ? Math.round(d.revenue / d.orders) : 0;
    let evalText = "Không phát sinh đơn";
    if (d.revenue >= 1000000) evalText = "Doanh thu bùng nổ";
    else if (d.revenue > 0) evalText = "Hoạt động tốt";

    L.push(
      [
        idx + 1,
        escapeCsv(formatDisplayDate(d.key)),
        escapeCsv(getDayOfWeekName(d.key)),
        d.revenue,
        d.orders,
        aov,
        escapeCsv(evalText),
      ].join(",")
    );
  });

  // Dòng tổng cộng ở cuối bảng phẳng
  const overallAov = totalOrders > 0 ? Math.round(totalRev / totalOrders) : 0;
  L.push(
    [
      escapeCsv("TỔNG CỘNG"),
      escapeCsv(`${rangeDays} ngày`),
      '""',
      totalRev,
      totalOrders,
      overallAov,
      escapeCsv(formatVndText(totalRev)),
    ].join(",")
  );

  const csvContent = L.join("\r\n");
  // Nhúng đúng byte UTF-8 BOM chống vỡ font tiếng Việt
  const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
  const blob = new Blob([bom, csvContent], { type: "text/csv;charset=utf-8;" });
  triggerFileDownload(blob, `bao-cao-doanh-thu-bang-phang-${rangeDays}-ngay-${new Date().toISOString().slice(0, 10)}.csv`);
}

/**
 * =========================================================================
 * 3. XUẤT DANH SÁCH ĐƠN HÀNG EXCEL (.XLSX) CHO TRANG ORDERS
 * =========================================================================
 */
export async function exportOrdersExcel(orders: OrderResponse[], filterLabel = "Tất cả"): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Nguyet Nhan Pho Hien";
  workbook.created = new Date();

  const ws = workbook.addWorksheet("Danh Sách Đơn Hàng", {
    views: [{ showGridLines: true }],
  });

  ws.mergeCells("A1:K1");
  const title = ws.getCell("A1");
  title.value = `DANH SÁCH ĐƠN HÀNG - NGUYỆT NHÃN PHỐ HIẾN (BỘ LỌC: ${filterLabel.toUpperCase()})`;
  title.font = { name: "Arial", size: 14, bold: true, color: { argb: "FF1B4332" } };
  title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };
  title.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(1).height = 32;

  const rows = orders.map((o, idx) => {
    let formattedTime = "";
    try {
      formattedTime = new Date(o.createdAt).toLocaleString("vi-VN");
    } catch {
      formattedTime = o.createdAt;
    }

    return [
      idx + 1,
      `#${o.id.slice(0, 8).toUpperCase()}`,
      formattedTime,
      o.customerName,
      o.customerPhone,
      o.customerAddress,
      getOrderProductsSummary(o),
      translateOrderStatus(o.status),
      o.discountAmount || 0,
      o.totalAmount,
      o.note || "",
    ];
  });

  if (rows.length > 0) {
    ws.addTable({
      name: "Bang_DanhSach_DonHang",
      ref: "A3",
      headerRow: true,
      totalsRow: true,
      style: {
        theme: "TableStyleMedium9",
        showRowStripes: true,
      },
      columns: [
        { name: "STT", totalsRowLabel: "Tổng cộng:" },
        { name: "Mã Đơn" },
        { name: "Ngày Đặt" },
        { name: "Khách Hàng" },
        { name: "Số Điện Thoại" },
        { name: "Địa Chỉ Nhận Hàng" },
        { name: "Chi Tiết Đơn Hàng" },
        { name: "Trạng Thái" },
        { name: "Giảm Giá (VNĐ)", totalsRowFunction: "sum" },
        { name: "Tổng Tiền (VNĐ)", totalsRowFunction: "sum" },
        { name: "Ghi Chú" },
      ],
      rows,
    });

    const startRow = 4;
    const endRow = startRow + rows.length;
    for (let r = startRow; r <= endRow; r++) {
      const row = ws.getRow(r);
      row.getCell(1).alignment = { horizontal: "center" };
      row.getCell(2).alignment = { horizontal: "center" };
      row.getCell(3).alignment = { horizontal: "center" };
      row.getCell(5).alignment = { horizontal: "center" };
      row.getCell(8).alignment = { horizontal: "center" };
      row.getCell(9).numFmt = '#,##0 "₫"';
      row.getCell(9).alignment = { horizontal: "right" };
      row.getCell(10).numFmt = '#,##0 "₫"';
      row.getCell(10).alignment = { horizontal: "right" };
    }
  }

  autoFitColumnWidths(ws);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerFileDownload(blob, `danh-sach-don-hang-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * =========================================================================
 * 4. XUẤT DANH SÁCH ĐƠN HÀNG CSV (.CSV) CHO TRANG ORDERS
 * =========================================================================
 */
export function exportOrdersCsv(orders: OrderResponse[]): void {
  const L: string[] = [];
  L.push(
    [
      escapeCsv("STT"),
      escapeCsv("Mã Đơn"),
      escapeCsv("Ngày Đặt"),
      escapeCsv("Khách Hàng"),
      escapeCsv("Số Điện Thoại"),
      escapeCsv("Địa Chỉ Nhận Hàng"),
      escapeCsv("Chi Tiết Sản Phẩm"),
      escapeCsv("Trạng Thái"),
      escapeCsv("Tiền Giảm Giá (VNĐ)"),
      escapeCsv("Tổng Tiền (VNĐ)"),
      escapeCsv("Ghi Chú"),
    ].join(",")
  );

  let totalMoney = 0;
  orders.forEach((o, idx) => {
    totalMoney += o.totalAmount;
    let formattedTime = "";
    try {
      formattedTime = new Date(o.createdAt).toLocaleString("vi-VN");
    } catch {
      formattedTime = o.createdAt;
    }

    L.push(
      [
        idx + 1,
        escapeCsv(`#${o.id.slice(0, 8).toUpperCase()}`),
        escapeCsv(formattedTime),
        escapeCsv(o.customerName),
        escapeCsv(o.customerPhone),
        escapeCsv(o.customerAddress),
        escapeCsv(getOrderProductsSummary(o)),
        escapeCsv(translateOrderStatus(o.status)),
        o.discountAmount || 0,
        o.totalAmount,
        escapeCsv(o.note || ""),
      ].join(",")
    );
  });

  L.push(
    [
      escapeCsv("TỔNG CỘNG"),
      escapeCsv(`${orders.length} đơn`),
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      totalMoney,
      escapeCsv(formatVndText(totalMoney)),
    ].join(",")
  );

  const csvContent = L.join("\r\n");
  const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
  const blob = new Blob([bom, csvContent], { type: "text/csv;charset=utf-8;" });
  triggerFileDownload(blob, `danh-sach-don-hang-${new Date().toISOString().slice(0, 10)}.csv`);
}

/**
 * Kích hoạt tải file trên trình duyệt
 */
function triggerFileDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
