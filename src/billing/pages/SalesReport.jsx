import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Button,
  Table,
  Spin,
  message,
  Tag,
  Space,
  Typography,
  Progress,
  Dropdown,
  Menu,
  Tooltip,
  Empty
} from "antd";
import {
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import {
  IndianRupee,
  Users,
  ShoppingBasket,
  Wallet,
  TrendingUp,
  AlertTriangle,
  Package,
  ShoppingCart,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Clock,
  CheckCircle,
  Calendar,
  Percent,
  RotateCcw,
  Receipt,
  Layers
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell
} from "recharts";
import dayjs from "dayjs";
import reportService from "../service/reportService";
import { useBranch } from "../../context/BranchContext";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Color Palette for charts
const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#14b8a6", "#f43f5e"];

function SalesReport() {
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("today");
  const [dateRange, setDateRange] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [trendMetric, setTrendMetric] = useState("revenue"); // revenue | quantity | average
  const { selectedBranch } = useBranch();

  useEffect(() => {
    fetchReport(period, dateRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch, period]);

  useEffect(() => {
    if (period === "custom" && dateRange && dateRange[0] && dateRange[1]) {
      fetchReport("custom", dateRange);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const fetchReport = async (p = period, dr = dateRange) => {
    setLoading(true);
    try {
      const params = { period: p };

      if (p === "custom" && dr && dr[0] && dr[1]) {
        params.startDate = dr[0].toISOString();
        params.endDate = dr[1].toISOString();
      }

      const response = await reportService.getModernSalesReport(params);
      setReportData(response.data);
      message.success("Report loaded successfully");
    } catch (error) {
      console.error("Error fetching report:", error);
      message.error(error.response?.data?.message || "Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (value) => {
    setPeriod(value);
    if (value !== "custom") {
      setDateRange(null);
    } else {
      setDateRange([dayjs().subtract(7, "day"), dayjs()]);
    }
  };

  const formatCurrency = (val) => {
    const num = parseFloat(val || 0);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(num);
  };

  const getPeriodLabel = () => {
    switch (period) {
      case "today":
        return "Today";
      case "yesterday":
        return "Yesterday";
      case "week":
        return "This Week";
      case "month":
        return "This Month";
      case "year":
        return "This Year";
      case "custom":
        return dateRange && dateRange[0] && dateRange[1]
          ? `${dayjs(dateRange[0]).format("DD MMM YYYY")} - ${dayjs(dateRange[1]).format("DD MMM YYYY")}`
          : "Custom Range";
      default:
        return "";
    }
  };

  // Process line chart trend data
  const getTrendChartData = () => {
    if (!reportData || !reportData.salesTrend || !reportData.salesTrend.trendData) return [];
    return reportData.salesTrend.trendData.map((item) => ({
      name: item.label,
      value: trendMetric === "revenue" ? item.revenue : trendMetric === "quantity" ? item.quantity : item.average
    }));
  };

  // Payment Donut chart data
  const getPaymentDonutData = () => {
    if (!reportData || !reportData.paymentMethods || !reportData.paymentMethods.methods) return [];
    return reportData.paymentMethods.methods.map((pm) => ({
      name: pm.method.toUpperCase(),
      value: pm.total_amount,
      percentage: pm.percentage
    }));
  };

  // Category Donut chart data
  const getCategoryDonutData = () => {
    if (!reportData || !reportData.categories || !reportData.categories.list) return [];
    return reportData.categories.list.map((c) => ({
      name: c.category_name,
      value: c.total_revenue
    }));
  };

  // Render Volume Heatmap
  const renderHeatmap = () => {
    if (!reportData || !reportData.heatmap || !reportData.heatmap.heatmapData) {
      return <Empty description="No heatmap data available" />;
    }

    const data = reportData.heatmap.heatmapData;
    const counts = data.map((d) => d.count);
    const maxCount = Math.max(...counts, 1);

    const getHeatmapColor = (count) => {
      if (count === 0) return "bg-slate-100 dark:bg-slate-800/40 hover:bg-slate-200";
      const percent = count / maxCount;
      if (percent <= 0.16) return "bg-violet-100 hover:bg-violet-200";
      if (percent <= 0.33) return "bg-violet-200 hover:bg-violet-300";
      if (percent <= 0.5) return "bg-violet-300 hover:bg-violet-400";
      if (percent <= 0.66) return "bg-violet-400 hover:bg-violet-500";
      if (percent <= 0.83) return "bg-violet-500 hover:bg-violet-600";
      return "bg-violet-700 hover:bg-violet-800";
    };

    const formatHour = (hour) => {
      if (hour === 0) return "12 AM";
      if (hour === 12) return "12 PM";
      return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
    };

    const daysOrder = [
      { label: "Mon", value: 2 },
      { label: "Tue", value: 3 },
      { label: "Wed", value: 4 },
      { label: "Thu", value: 5 },
      { label: "Fri", value: 6 },
      { label: "Sat", value: 7 },
      { label: "Sun", value: 1 }
    ];

    const cells = [];
    for (let hour = 6; hour <= 23; hour++) {
      for (let dayIndex = 0; dayIndex < daysOrder.length; dayIndex++) {
        const day = daysOrder[dayIndex];
        const match = data.find((h) => h.dayOfWeek === day.value && h.hourOfDay === hour);
        const count = match ? match.count : 0;
        const revenue = match ? parseFloat(match.revenue) : 0;

        cells.push(
          <Tooltip
            key={`${day.label}-${hour}`}
            title={`${day.label} at ${formatHour(hour)}: ${count} bills (${formatCurrency(revenue)})`}
          >
            <div className={`w-[22px] h-[22px] rounded-[5px] ${getHeatmapColor(count)} transition-all duration-150 hover:scale-110 cursor-pointer`} />
          </Tooltip>
        );
      }
    }

    const hourLabels = [
      "6 AM", "8 AM", "10 AM", "12 PM", "2 PM", "4 PM", "6 PM", "8 PM", "10 PM", "12 AM"
    ];

    return (
      <div className="flex flex-col gap-2 py-2">
        <div className="flex items-start gap-3 overflow-x-auto custom-scrollbar pb-3 justify-start md:justify-center">
          <div className="grid grid-rows-7 gap-[5px] h-[198px] text-[11px] text-slate-400 font-bold select-none pr-1">
            <span className="flex items-center justify-end h-[24px] leading-none">Mon</span>
            <span className="flex items-center justify-end h-[24px] leading-none">Tue</span>
            <span className="flex items-center justify-end h-[24px] leading-none">Wed</span>
            <span className="flex items-center justify-end h-[24px] leading-none">Thu</span>
            <span className="flex items-center justify-end h-[24px] leading-none">Fri</span>
            <span className="flex items-center justify-end h-[24px] leading-none">Sat</span>
            <span className="flex items-center justify-end h-[24px] leading-none">Sun</span>
          </div>

          <div className="w-max">
            <div className="grid grid-rows-7 grid-flow-col gap-[5px] w-max">
              {cells}
            </div>
            
            <div className="flex justify-between text-[10px] text-slate-400 mt-2.5 px-1 select-none font-semibold">
              {hourLabels.map((lbl, idx) => (
                <span key={idx}>{lbl}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-2">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full text-[10px] text-slate-500 font-semibold select-none shadow-sm">
            <span className="text-slate-700 font-bold mr-1">Bills Count</span>
            <span className="text-slate-400">Less</span>
            <div className="flex gap-[3px] mx-1">
              <div className="w-[8px] h-[8px] rounded-[1px] bg-slate-100" />
              <div className="w-[8px] h-[8px] rounded-[1px] bg-violet-100" />
              <div className="w-[8px] h-[8px] rounded-[1px] bg-violet-200" />
              <div className="w-[8px] h-[8px] rounded-[1px] bg-violet-300" />
              <div className="w-[8px] h-[8px] rounded-[1px] bg-violet-400" />
              <div className="w-[8px] h-[8px] rounded-[1px] bg-violet-500" />
              <div className="w-[8px] h-[8px] rounded-[1px] bg-violet-700" />
            </div>
            <span className="text-slate-400">More</span>
          </div>
        </div>
      </div>
    );
  };

  // Render Metric Change indicator
  const renderChangeIndicator = (val) => {
    const change = parseFloat(val || 0);
    if (change === 0) {
      return (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">0%</span>
          <span className="text-[10px] text-slate-400 font-medium">vs prev period</span>
        </div>
      );
    }
    const isPositive = change > 0;
    return (
      <div className="flex items-center gap-1.5">
        <span className={`text-[10px] font-bold flex items-center px-1.5 py-0.5 rounded ${
          isPositive ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
        }`}>
          {isPositive ? <ArrowUpRight size={10} className="mr-0.5" /> : <ArrowDownRight size={10} className="mr-0.5" />}
          {Math.abs(change).toFixed(1)}%
        </span>
        <span className="text-[10px] text-slate-400 font-medium">vs prev period</span>
      </div>
    );
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!reportData) {
      message.warning("No data to export");
      return;
    }

    setExporting(true);
    try {
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Summary Stats
      const summaryData = [
        ["SALES REPORT SUMMARY"],
        [""],
        ["Report Period:", getPeriodLabel()],
        ["Branch:", selectedBranch?.name || "All Branches"],
        ["Generated On:", dayjs().format("DD MMM YYYY, hh:mm A")],
        [""],
        ["KPI METRICS", "Value", "Growth vs Prev Period %"],
        ["Total Sales", reportData.summary.totalSales, `${reportData.summary.totalSalesChange}%`],
        ["Bills Generated", reportData.summary.billsCount, `${reportData.summary.billsChange}%`],
        ["Items Sold", reportData.summary.itemsSold, `${reportData.summary.itemsSoldChange}%`],
        ["Average Bill Value", reportData.summary.avgBillValue, `${reportData.summary.avgBillValueChange}%`],
        ["Unique Customers", reportData.summary.uniqueCustomers, `${reportData.summary.uniqueCustomersChange}%`],
        [""],
        ["AI BUSINESS INSIGHTS"],
        ...reportData.insights.map((ins, i) => [`${i + 1}.`, ins.text])
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      // Sheet 2: Payments Methods Breakdown
      const paymentData = [
        ["PAYMENT METHODS BREAKDOWN"],
        [""],
        ["Payment Method", "Bills Count", "Revenue Collected (₹)", "Sales Contribution %", "Period Growth %"]
      ];
      reportData.paymentMethods.methods.forEach((pm) => {
        paymentData.push([
          pm.method,
          pm.count,
          pm.total_amount,
          `${pm.percentage}%`,
          `${pm.growth}%`
        ]);
      });
      const paymentSheet = XLSX.utils.aoa_to_sheet(paymentData);
      XLSX.utils.book_append_sheet(workbook, paymentSheet, "Payment Methods");

      // Sheet 3: Top Selling Products
      const productsData = [
        ["TOP 5 SELLING PRODUCTS"],
        [""],
        ["Product Code", "Product Name", "Quantity Sold", "Total Revenue (₹)", "Revenue Share %"]
      ];
      reportData.topSellingProducts.products.forEach((p) => {
        productsData.push([
          p.product_code,
          p.product_name,
          p.total_quantity,
          p.total_revenue,
          `${p.contribution}%`
        ]);
      });
      const productsSheet = XLSX.utils.aoa_to_sheet(productsData);
      XLSX.utils.book_append_sheet(workbook, productsSheet, "Top Products");

      const filename = `Sales_Report_${period.toUpperCase()}_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;
      XLSX.writeFile(workbook, filename);
      message.success("Report exported to Excel successfully!");
    } catch (error) {
      console.error("Excel export error:", error);
      message.error("Failed to export Excel report");
    } finally {
      setExporting(false);
    }
  };

  // Export to PDF
  const exportToPDF = async () => {
    if (!reportData) {
      message.warning("No data to export");
      return;
    }

    setExporting(true);
    try {
      const pdfContent = document.createElement("div");
      pdfContent.style.width = "210mm";
      pdfContent.style.padding = "20mm";
      pdfContent.style.backgroundColor = "#ffffff";
      pdfContent.style.fontFamily = "Arial, sans-serif";

      pdfContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 25px; border-bottom: 3px solid #6366f1; padding-bottom: 15px;">
          <h1 style="color: #6366f1; margin: 0; font-size: 26px; font-weight: bold; letter-spacing: 0.5px;">SALES REPORT</h1>
          <p style="color: #4b5563; margin: 6px 0 0 0; font-size: 13px; font-weight: 600;">
            ${getPeriodLabel()} | ${selectedBranch?.name || "All Branches"}
          </p>
          <p style="color: #9ca3af; margin: 4px 0 0 0; font-size: 11px;">
            Generated on ${dayjs().format("DD MMM YYYY, hh:mm A")}
          </p>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="color: #1f2937; font-size: 16px; margin-bottom: 10px; border-left: 4px solid #10b981; padding-left: 8px;">Key Performance Indicators</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
            <tr style="background: #f8fafc;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; font-size: 13px;">Total Sales</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; color: #10b981; font-weight: bold; font-size: 13px;">
                ₹${reportData.summary.totalSales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; font-size: 13px;">Bills Generated</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; font-size: 13px;">${reportData.summary.billsCount}</td>
            </tr>
            <tr style="background: #f8fafc;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; font-size: 13px;">Items Sold</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; font-size: 13px;">${reportData.summary.itemsSold}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; font-size: 13px;">Average Bill Value</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; font-size: 13px;">
                ₹${reportData.summary.avgBillValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="color: #1f2937; font-size: 16px; margin-bottom: 10px; border-left: 4px solid #6366f1; padding-left: 8px;">Payment Methods Breakdown</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #6366f1; color: white;">
                <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">Payment Method</th>
                <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">Bills Count</th>
                <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">Amount (₹)</th>
                <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">Growth %</th>
                <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">Percentage %</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.paymentMethods.methods
                .map(
                  (pm, index) => `
                <tr style="background: ${index % 2 === 0 ? "#f8fafc" : "#ffffff"};">
                  <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">${pm.method.toUpperCase()}</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${pm.count}</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; font-weight: 500;">
                    ₹${pm.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; color: ${pm.growth >= 0 ? "#10b981" : "#ef4444"}; font-weight: bold;">
                    ${pm.growth}%
                  </td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #6366f1;">
                    ${pm.percentage}%
                  </td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="color: #1f2937; font-size: 16px; margin-bottom: 10px; border-left: 4px solid #f59e0b; padding-left: 8px;">Top Product Categories</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #f59e0b; color: white;">
                <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">Category Name</th>
                <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">Qty Sold</th>
                <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">Revenue (₹)</th>
                <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">Share %</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.categories.list
                .map(
                  (c, index) => `
                <tr style="background: ${index % 2 === 0 ? "#f8fafc" : "#ffffff"};">
                  <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">${c.category_name}</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${c.total_quantity}</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">
                    ₹${c.total_revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #f59e0b;">
                    ${c.percentage}%
                  </td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <div style="margin-top: 35px; padding-top: 15px; border-top: 2px solid #e2e8f0; text-align: center; color: #9ca3af; font-size: 11px;">
          <p style="margin: 0; font-weight: 500;">This report is a high-fidelity system-generated analytical summary.</p>
          <p style="margin: 4px 0 0 0;">© ${dayjs().year()} - All Rights Reserved</p>
        </div>
      `;

      document.body.appendChild(pdfContent);

      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });

      document.body.removeChild(pdfContent);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      const filename = `Sales_Report_${period.toUpperCase()}_${dayjs().format("YYYYMMDD_HHmmss")}.pdf`;
      pdf.save(filename);
      message.success("Report exported to PDF successfully!");
    } catch (error) {
      console.error("PDF export error:", error);
      message.error("Failed to export PDF report");
    } finally {
      setExporting(false);
    }
  };

  const exportMenu = (
    <Menu>
      <Menu.Item key="excel" icon={<FileExcelOutlined />} onClick={exportToExcel}>
        Export to Excel
      </Menu.Item>
      <Menu.Item key="pdf" icon={<FilePdfOutlined />} onClick={exportToPDF}>
        Export to PDF
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="p-6 bg-slate-50/50 min-height-screen">
      <div className="max-w-[1500px] mx-auto flex flex-col gap-6">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp size={26} className="text-indigo-600 animate-pulse" /> Sales Report
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Track and analyze store sales performance, payment channels, and insights.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {selectedBranch && (
              <Tag color="indigo" title="you can change branch on top bar" className="px-3.5 !py-1.5 text-sm font-bold rounded-full shadow-sm border-indigo-100 !flex items-center gap-1.5">
                <Layers size={14} />
                {selectedBranch.name === "All Branches" ? "All Branches" : selectedBranch.name}
              </Tag>
            )}
            {reportData && (
              <Dropdown overlay={exportMenu} placement="bottomRight" disabled={exporting}>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  loading={exporting}
                  className="bg-indigo-600 border-indigo-600 hover:bg-indigo-700 shadow-md font-bold rounded-lg h-9"
                >
                  Export Report
                </Button>
              </Dropdown>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        <Card className="shadow-sm border-slate-100/80 rounded-xl">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col gap-1 w-full sm:w-[220px]">
              <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">Report Period</Text>
              <Select
                value={period}
                onChange={handlePeriodChange}
                className="w-full h-10 font-medium"
              >
                <Option value="today">Today</Option>
                <Option value="yesterday">Yesterday</Option>
                <Option value="week">This Week</Option>
                <Option value="month">This Month</Option>
                <Option value="year">This Year</Option>
                <Option value="custom">Custom Range</Option>
              </Select>
            </div>

            {period === "custom" && (
              <div className="flex flex-col gap-1 w-full sm:w-[320px]">
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date Range</Text>
                <RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  className="w-full h-10 border-slate-200"
                  format="DD MMM YYYY"
                />
              </div>
            )}

            <div className="flex items-end h-[42px] mt-auto">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchReport(period, dateRange)}
                loading={loading}
                className="h-10 border-slate-200 hover:text-indigo-600 hover:border-indigo-600 font-bold px-5"
              >
                Refresh
              </Button>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Spin size="large" />
            <Text className="text-slate-400 font-medium animate-pulse">Calculating complex metrics...</Text>
          </div>
        ) : reportData ? (
          <>
            {/* KPI Cards Row */}
            <Row gutter={[16, 16]}>
              
              {/* Card 1: Total Sales */}
              <Col xs={24} sm={12} md={8} lg={8} xl={8} xxl={4}>
                <Card className="rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 shadow-sm relative overflow-hidden bg-white h-full" bodyStyle={{ padding: '20px' }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Sales</span>
                      <h2 className="text-2xl font-bold text-slate-900 !my-2">{formatCurrency(reportData.summary.totalSales)}</h2>
                    </div>
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                      <IndianRupee size={20} />
                    </div>
                  </div>
                  <div className="flex items-center mt-2">
                    {renderChangeIndicator(reportData.summary.totalSalesChange)}
                  </div>
                </Card>
              </Col>

              {/* Card 2: Bills Generated */}
              <Col xs={24} sm={12} md={8} lg={8} xl={8} xxl={4}>
                <Card className="rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 shadow-sm relative overflow-hidden bg-white h-full" bodyStyle={{ padding: '20px' }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Bills Generated</span>
                      <h2 className="text-2xl font-bold text-slate-900 !my-2">{reportData.summary.billsCount}</h2>
                    </div>
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                      <Receipt size={20} />
                    </div>
                  </div>
                  <div className="flex items-center mt-2">
                    {renderChangeIndicator(reportData.summary.billsChange)}
                  </div>
                </Card>
              </Col>

              {/* Card 3: Items Sold */}
              <Col xs={24} sm={12} md={8} lg={8} xl={8} xxl={4}>
                <Card className="rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200 shadow-sm relative overflow-hidden bg-white h-full" bodyStyle={{ padding: '20px' }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Items Sold</span>
                      <h2 className="text-2xl font-bold text-slate-900 !my-2">{reportData.summary.itemsSold}</h2>
                    </div>
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                      <ShoppingBasket size={20} />
                    </div>
                  </div>
                  <div className="flex items-center mt-2">
                    {renderChangeIndicator(reportData.summary.itemsSoldChange)}
                  </div>
                </Card>
              </Col>

              {/* Card 4: Avg Bill Value */}
              <Col xs={24} sm={12} md={8} lg={8} xl={8} xxl={4}>
                <Card className="rounded-xl border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all duration-200 shadow-sm relative overflow-hidden bg-white h-full" bodyStyle={{ padding: '20px' }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Avg. Bill Value</span>
                      <h2 className="text-2xl font-bold text-slate-900 !my-2">{formatCurrency(reportData.summary.avgBillValue)}</h2>
                    </div>
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                      <Percent size={20} />
                    </div>
                  </div>
                  <div className="flex items-center mt-2">
                    {renderChangeIndicator(reportData.summary.avgBillValueChange)}
                  </div>
                </Card>
              </Col>

              {/* Card 5: Unique Customers */}
              <Col xs={24} sm={12} md={8} lg={8} xl={8} xxl={4}>
                <Card className="rounded-xl border border-slate-200 hover:border-pink-300 hover:shadow-md transition-all duration-200 shadow-sm relative overflow-hidden bg-white h-full" bodyStyle={{ padding: '20px' }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Unique Customers</span>
                      <h2 className="text-2xl font-bold text-slate-900 !my-2">{reportData.summary.uniqueCustomers}</h2>
                    </div>
                    <div className="p-2.5 bg-pink-50 text-pink-600 rounded-lg shrink-0">
                      <Users size={20} />
                    </div>
                  </div>
                  <div className="flex items-center mt-2">
                    {renderChangeIndicator(reportData.summary.uniqueCustomersChange)}
                  </div>
                </Card>
              </Col>

              {/* Card 6: Sales Growth */}
              <Col xs={24} sm={12} md={8} lg={8} xl={8} xxl={4}>
                <Card className="rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all duration-200 shadow-sm relative overflow-hidden bg-white h-full" bodyStyle={{ padding: '20px' }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Sales Growth</span>
                      <h2 className="text-2xl font-bold text-slate-900 !my-2">
                        {reportData.summary.totalSalesChange >= 0 ? "+" : ""}
                        {reportData.summary.totalSalesChange.toFixed(1)}%
                      </h2>
                    </div>
                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg shrink-0">
                      <TrendingUp size={20} />
                    </div>
                  </div>
                  <div className="flex items-center mt-2">
                    <span className="text-slate-400 text-xs font-semibold">Period-over-Period</span>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Row 1: Line Chart (Trends) & Heatmap */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              
              {/* Sales Trend Card */}
              <Card
                className="shadow-sm border-slate-100/80 rounded-xl"
                title={
                  <div className="flex items-center justify-between w-full pr-2 py-1.5">
                    <span className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                      <TrendingUp size={18} className="text-indigo-600" /> Sales Trend
                    </span>
                    <Select
                      value={trendMetric}
                      onChange={setTrendMetric}
                      className="w-[140px]"
                      size="small"
                    >
                      <Option value="revenue">Revenue</Option>
                      <Option value="quantity">Quantity</Option>
                      <Option value="average">Avg. Value</Option>
                    </Select>
                  </div>
                }
              >
                <div className="flex flex-col gap-4">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getTrendChartData()} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => (trendMetric !== "quantity" ? `₹${val >= 1000 ? (val / 1000).toFixed(0) + "k" : val}` : val)}
                        />
                        <RechartsTooltip
                          contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                          formatter={(value) => [trendMetric !== "quantity" ? formatCurrency(value) : value, trendMetric.toUpperCase()]}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#6366f1"
                          strokeWidth={3}
                          dot={{ r: 4, stroke: "#6366f1", strokeWidth: 2, fill: "#ffffff" }}
                          activeDot={{ r: 6, stroke: "#6366f1", strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4 text-xs font-semibold text-slate-500">
                    <div className="bg-slate-50 rounded-lg p-3 flex flex-col gap-1">
                      <span>Highest Day Insight</span>
                      <strong className="text-slate-800 text-sm">
                        {reportData.salesTrend.highestPoint.label}: {formatCurrency(reportData.salesTrend.highestPoint.value)}
                      </strong>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 flex flex-col gap-1">
                      <span>Lowest Day Insight</span>
                      <strong className="text-slate-800 text-sm">
                        {reportData.salesTrend.lowestPoint.label}: {formatCurrency(reportData.salesTrend.lowestPoint.value)}
                      </strong>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Heatmap Card */}
              <Card
                className="shadow-sm border-slate-100/80 rounded-xl"
                title={
                  <div className="py-1.5">
                    <span className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                      <Clock size={18} className="text-indigo-600" /> Hourly Sales Heatmap
                    </span>
                  </div>
                }
              >
                <div className="flex flex-col justify-between h-[360px]">
                  {renderHeatmap()}
                  <div className="bg-violet-50/50 border border-violet-100/80 rounded-lg p-3 flex items-start gap-2.5 mt-2">
                    <Lightbulb size={16} className="text-violet-600 mt-0.5" />
                    <div className="text-xs">
                      <strong className="text-violet-900 font-bold block">Peak Hours Recommendation</strong>
                      <span className="text-violet-700 font-medium">
                        Your highest volume occurs around <span className="underline decoration-2 font-bold">{reportData.heatmap.peakTime}</span>. Plan staff schedules accordingly to maximize sales.
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Row 2: Payment Methods & Product Categories */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              
              {/* Payment Methods Card */}
              <Card
                className="shadow-sm border-slate-100/80 rounded-xl"
                title={
                  <div className="py-1.5">
                    <span className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                      <Wallet size={18} className="text-indigo-600" /> Sales by Payment Method
                    </span>
                  </div>
                }
              >
                <Row align="middle" gutter={16}>
                  <Col xs={24} md={12} className="flex justify-center h-[230px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getPaymentDonutData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {getPaymentDonutData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value, name, entry) => [`${entry.payload.percentage}%`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] text-center">
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Total Paid</span>
                      <strong className="text-slate-800 text-lg font-black">{formatCurrency(reportData.paymentMethods.methods.reduce((s, m) => s + m.total_amount, 0))}</strong>
                    </div>
                  </Col>

                  <Col xs={24} md={12} className="flex flex-col gap-2.5">
                    {reportData.paymentMethods.methods.map((pm, index) => (
                      <div key={pm.method} className="flex items-center justify-between text-xs border-b border-slate-50 pb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="font-semibold text-slate-700 uppercase">{pm.method.replace("_", " ")}</span>
                        </div>
                        <div className="flex gap-4 font-bold text-slate-800">
                          <span>{pm.count} bills</span>
                          <span>{formatCurrency(pm.total_amount)}</span>
                        </div>
                      </div>
                    ))}
                  </Col>
                </Row>

                <div className="grid grid-cols-4 gap-2 border-t border-slate-50 pt-4 mt-2 text-center text-xs font-semibold text-slate-500">
                  <div className="bg-slate-50 rounded-lg p-2.5">
                    <span className="block text-[10px] uppercase text-slate-400">Most Used</span>
                    <strong className="text-slate-800 text-sm block truncate">{reportData.paymentMethods.mostUsed}</strong>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2.5">
                    <span className="block text-[10px] uppercase text-slate-400">Fastest Growing</span>
                    <strong className="text-slate-800 text-sm block truncate">{reportData.paymentMethods.fastestGrowing}</strong>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2.5">
                    <span className="block text-[10px] uppercase text-slate-400">Refunds & Cancelled</span>
                    <strong className="text-slate-800 text-sm block truncate">{formatCurrency(reportData.paymentMethods.refunds)}</strong>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2.5">
                    <span className="block text-[10px] uppercase text-slate-400">Pending Amount</span>
                    <strong className="text-slate-800 text-sm block truncate">{formatCurrency(reportData.paymentMethods.pending)}</strong>
                  </div>
                </div>
              </Card>

              {/* Product Categories Card */}
              <Card
                className="shadow-sm border-slate-100/80 rounded-xl"
                title={
                  <div className="py-1.5">
                    <span className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                      <Layers size={18} className="text-indigo-600" /> Sales by Product Category
                    </span>
                  </div>
                }
              >
                <Row align="middle" gutter={16}>
                  <Col xs={24} md={12} className="flex justify-center h-[230px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getCategoryDonutData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {getCategoryDonutData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] text-center">
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Total Sales</span>
                      <strong className="text-slate-800 text-lg font-black">{formatCurrency(reportData.categories.list.reduce((s, c) => s + c.total_revenue, 0))}</strong>
                    </div>
                  </Col>

                  <Col xs={24} md={12} className="flex flex-col gap-2.5 max-h-[230px] overflow-y-auto custom-scrollbar">
                    {reportData.categories.list.map((c, index) => (
                      <div key={c.category_name} className="flex items-center justify-between text-xs border-b border-slate-50 pb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="font-semibold text-slate-700">{c.category_name}</span>
                        </div>
                        <div className="flex gap-4 font-bold text-slate-800">
                          <span>{c.total_quantity} sold</span>
                          <span>{c.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </Col>
                </Row>

                <div className="border-t border-slate-50 pt-4 mt-2">
                  <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Top Performing Category:</span>
                    <strong className="text-slate-800 text-sm">{reportData.categories.topCategory}</strong>
                  </div>
                </div>
              </Card>
            </div>

            {/* Row 3: Tables (Top Selling Products & Slow Moving Products) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              
              {/* Top Selling Products */}
              <Card
                className="shadow-sm border-slate-100/80 rounded-xl"
                title={
                  <div className="py-1.5 flex items-center justify-between">
                    <span className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                      <ShoppingCart size={18} className="text-indigo-600" /> Top 5 Selling Products
                    </span>
                  </div>
                }
              >
                <Table
                  dataSource={reportData.topSellingProducts.products}
                  pagination={false}
                  rowKey="product_id"
                  size="small"
                  columns={[
                    {
                      title: "Product",
                      dataIndex: "product_name",
                      key: "product_name",
                      render: (text, record) => (
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 text-xs">{text}</span>
                          <span className="text-[10px] text-slate-400">{record.product_code}</span>
                        </div>
                      )
                    },
                    {
                      title: "Qty Sold",
                      dataIndex: "total_quantity",
                      key: "total_quantity",
                      align: "center",
                      render: (val) => <span className="font-semibold text-slate-700 text-xs">{val}</span>
                    },
                    {
                      title: "Revenue",
                      dataIndex: "total_revenue",
                      key: "total_revenue",
                      align: "right",
                      render: (val) => <span className="font-bold text-indigo-600 text-xs">{formatCurrency(val)}</span>
                    },
                    {
                      title: "Contribution",
                      dataIndex: "contribution",
                      key: "contribution",
                      width: 140,
                      render: (val) => (
                        <div className="flex items-center gap-2">
                          <Progress percent={val} showInfo={false} size="small" strokeColor="#6366f1" className="flex-1" />
                          <span className="text-[11px] font-bold text-slate-600">{val}%</span>
                        </div>
                      )
                    }
                  ]}
                />
                <div className="border-t border-slate-50 pt-4 mt-3 flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Top 5 products contribute:</span>
                  <strong className="text-indigo-600 font-bold">{reportData.topSellingProducts.top5Contribution}% of total sales</strong>
                </div>
              </Card>

              {/* Slow Moving Products */}
              <Card
                className="shadow-sm border-slate-100/80 rounded-xl"
                title={
                  <div className="py-1.5 flex items-center justify-between">
                    <span className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                      <AlertTriangle size={18} className="text-indigo-600" /> Slow Moving Products
                    </span>
                  </div>
                }
              >
                <Table
                  dataSource={reportData.slowMovingProducts.products}
                  pagination={false}
                  rowKey="product_id"
                  size="small"
                  columns={[
                    {
                      title: "Product",
                      dataIndex: "product_name",
                      key: "product_name",
                      render: (text, record) => (
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 text-xs">{text}</span>
                          <span className="text-[10px] text-slate-400">{record.product_code}</span>
                        </div>
                      )
                    },
                    {
                      title: "Sold (30D)",
                      dataIndex: "total_sold",
                      key: "total_sold",
                      align: "center",
                      render: (val) => <span className="font-semibold text-slate-700 text-xs">{val}</span>
                    },
                    {
                      title: "Current Stock",
                      dataIndex: "stock_quantity",
                      key: "stock_quantity",
                      align: "center",
                      render: (val) => <span className="font-semibold text-slate-700 text-xs">{val}</span>
                    },
                    {
                      title: "Days Unsold",
                      dataIndex: "days_unsold",
                      key: "days_unsold",
                      align: "center",
                      render: (val) => (
                        <Tag color={val > 30 ? "red" : "orange"} className="font-bold text-[10px] rounded-full px-2">
                          {val} Days
                        </Tag>
                      )
                    }
                  ]}
                />
                <div className="border-t border-slate-50 pt-4 mt-3 flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Recommendation:</span>
                  <strong className="text-amber-600 font-bold">{reportData.slowMovingProducts.recommendation}</strong>
                </div>
              </Card>
            </div>

            {/* Row 4: Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
              
              {/* Customer Analysis */}
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={15} className="text-indigo-600" /> Customer Analysis
                  </span>
                </div>
                <div className="flex flex-col gap-3.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Walk-in Customers</span>
                    <strong className="text-slate-800">{reportData.customerAnalysis.walkInCount} ({reportData.customerAnalysis.walkInPercentage}%)</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Registered Customers</span>
                    <strong className="text-slate-800">{reportData.customerAnalysis.registeredCount} ({reportData.customerAnalysis.registeredPercentage}%)</strong>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-50 pt-2">
                    <span className="text-slate-500 font-bold">Repeat Customers</span>
                    <strong className="text-indigo-600 font-black">{reportData.customerAnalysis.repeatCount} ({reportData.customerAnalysis.repeatPercentage}%)</strong>
                  </div>
                </div>
              </div>

              {/* Discount Analysis */}
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Percent size={15} className="text-indigo-600" /> Discount Analysis
                  </span>
                </div>
                <div className="flex flex-col gap-3.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Discount Given</span>
                    <strong className="text-slate-800">{formatCurrency(reportData.discountAnalysis.totalDiscount)}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Bills with Discount</span>
                    <strong className="text-slate-800">{reportData.discountAnalysis.billsWithDiscount} ({reportData.discountAnalysis.billsWithDiscountPercentage}%)</strong>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-50 pt-2">
                    <span className="text-slate-500 font-bold">Avg. Discount</span>
                    <strong className="text-indigo-600 font-black">{reportData.discountAnalysis.averageDiscountPercentage.toFixed(1)}%</strong>
                  </div>
                </div>
              </div>

              {/* Returns & Cancellations */}
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <RotateCcw size={15} className="text-indigo-600" /> Returns & Cancel
                  </span>
                </div>
                <div className="flex flex-col gap-3.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Cancelled Bills</span>
                    <strong className="text-slate-800">{reportData.returnsAndCancellations.cancelledBills}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Returned Items</span>
                    <strong className="text-slate-800">{reportData.returnsAndCancellations.returnedItems}</strong>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-50 pt-2">
                    <span className="text-slate-500 font-bold">Loss Impact</span>
                    <strong className="text-rose-600 font-black">{formatCurrency(Math.abs(reportData.returnsAndCancellations.lossImpact))}</strong>
                  </div>
                </div>
              </div>

              {/* Sales Comparison */}
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp size={15} className="text-indigo-600" /> Sales Comparison
                  </span>
                </div>
                <div className="flex flex-col gap-3.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Current period</span>
                    <strong className="text-slate-800">{formatCurrency(reportData.salesComparison.currentRevenue)}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Previous period</span>
                    <strong className="text-slate-800">{formatCurrency(reportData.salesComparison.previousRevenue)}</strong>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-50 pt-2">
                    <span className="text-slate-500 font-bold">Difference</span>
                    <strong className={`font-black ${reportData.salesComparison.difference >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                      {reportData.salesComparison.difference >= 0 ? "+" : ""}
                      {formatCurrency(reportData.salesComparison.difference)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Bill Status */}
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle size={15} className="text-indigo-600" /> Bill Status
                  </span>
                </div>
                <div className="flex flex-col gap-3.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Paid Bills</span>
                    <strong className="text-slate-800">{reportData.billStatus.paidBills} ({reportData.billStatus.paidPercentage}%)</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Pending Bills</span>
                    <strong className="text-slate-800">{reportData.billStatus.pendingBills} ({reportData.billStatus.pendingPercentage}%)</strong>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-50 pt-2">
                    <span className="text-slate-500 font-bold">Pending Amount</span>
                    <strong className="text-rose-600 font-black">{formatCurrency(reportData.billStatus.pendingAmount)}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Insights Card */}
            <Card
              className="shadow-sm hidden border-slate-100/80 rounded-xl bg-gradient-to-br from-indigo-50/30 to-violet-50/20"
              title={
                <div className="py-1 flex items-center gap-2.5">
                  <Sparkles size={20} className="text-indigo-600 animate-pulse" />
                  <span className="text-base font-extrabold text-slate-800">AI Business Insights</span>
                </div>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportData.insights.map((insight, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-slate-100/60 shadow-sm hover:translate-x-1 transition-transform duration-200">
                    <div className="p-1.5 rounded-lg bg-indigo-50/60 text-indigo-600 mt-0.5">
                      <Lightbulb size={16} />
                    </div>
                    <div>
                      <span className="text-slate-700 text-xs font-semibold leading-relaxed">{insight.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

          </>
        ) : (
          <Card className="rounded-xl border-slate-100 shadow-sm p-10">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <TrendingUp size={48} className="text-slate-300" />
              <div className="flex flex-col gap-1">
                <Text className="text-slate-700 font-bold text-base">Select a Period to Generate Report</Text>
                <Text className="text-slate-400 text-sm">Choose from today, yesterday, week, or select custom dates.</Text>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default SalesReport;
