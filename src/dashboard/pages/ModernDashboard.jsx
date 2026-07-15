import React, { useEffect, useState } from "react";
import { Row, Col, Card, Typography, Skeleton, Select, Tag, Table, Empty, DatePicker, Tooltip, Avatar, Modal } from "antd";
import {
  IndianRupee, Users, ShoppingBasket, Wallet, TrendingUp, AlertTriangle,
  Package, ShoppingCart, Lightbulb, ArrowUpRight, ArrowDownRight, Sparkles, Clock, CheckCircle,
  Calendar, X
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis,
  Tooltip as RechartsTooltip, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import dashboardService from "../service/dashboardService";
import { useBranch } from "../../context/BranchContext";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import BillDetailsModal from "./BillDetailsModal";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Color Palette for Pie Chart
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const DAYS_OF_WEEK = [
  { label: 'Mon', value: 2 },
  { label: 'Tue', value: 3 },
  { label: 'Wed', value: 4 },
  { label: 'Thu', value: 5 },
  { label: 'Fri', value: 6 },
  { label: 'Sat', value: 7 },
  { label: 'Sun', value: 1 }
];

const ModernDashboard = () => {
  const [period, setPeriod] = useState("today");
  const [dateRange, setDateRange] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { selectedBranch } = useBranch();
  const navigate = useNavigate();
  const [showHeatmapInsight, setShowHeatmapInsight] = useState(true);

  // Bill Modal State
  const [selectedBillId, setSelectedBillId] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [billModalVisible, setBillModalVisible] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);

  const getDynamicSuggestions = () => {
    if (!dashboardData) return [];

    const peakInfo = getPeakTimeInsight();
    const upiPct = dashboardData.insights.bestPaymentPercentage || 0;
    const bestMethod = dashboardData.insights.bestPaymentMethod || 'UPI';
    const lowStock = dashboardData.summary.lowStockCount || 0;

    const list = [
      {
        text: "Add combo offers on weekends to boost average bill value by 15-20%.",
        actionText: "Create Combo Coupon",
        link: "/coupon/customer-coupons"
      }
    ];

    if (peakInfo) {
      list.push({
        text: `Optimize staffing on ${peakInfo.day} between ${peakInfo.hours} to handle peak customer traffic.`,
        actionText: null,
        link: null
      });
    }

    if (bestMethod && upiPct) {
      list.push({
        text: `${bestMethod} accounts for ${upiPct}% of sales. Offer loyalty points on cashless payments to speed up checkouts.`,
        actionText: "Manage Points",
        link: "/coupon/points"
      });
    }

    if (lowStock > 0) {
      list.push({
        text: `You have ${lowStock} items running low on stock. Refill them ahead of peak trading hours to prevent lost sales.`,
        actionText: null,
        link: null
      });
    }

    return list;
  };

  useEffect(() => {
    if (!dashboardData) return;
    const list = getDynamicSuggestions();
    if (list.length <= 1) return;

    const timer = setInterval(() => {
      setSuggestionIndex((prev) => (prev + 1) % list.length);
    }, 10000);

    return () => clearInterval(timer);
  }, [dashboardData]);

  useEffect(() => {
    if (showHeatmapInsight) {
      const timer = setTimeout(() => {
        setShowHeatmapInsight(false);
      }, 60000);
      return () => clearTimeout(timer);
    }
  }, [showHeatmapInsight]);

  const handleBillClick = (record) => {
    setSelectedBillId(record.id);
    setSelectedBill(record);
    setBillModalVisible(true);
  };

  const handleProductClick = (record) => {
    navigate(`/product/list?search=${encodeURIComponent(record.product_code)}`);
  };

  const handlePeriodChange = (value) => {
    setPeriod(value);
    if (value === "custom") {
      setDateRange([dayjs().subtract(7, 'day'), dayjs()]);
    } else {
      setDateRange(null);
    }
  };

  useEffect(() => {
    if (period === 'custom') {
      if (dateRange && dateRange[0] && dateRange[1]) {
        fetchDashboardData();
      }
    } else {
      fetchDashboardData();
    }
  }, [period, dateRange, selectedBranch]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      let startDateStr = null;
      let endDateStr = null;
      if (period === 'custom' && dateRange && dateRange[0] && dateRange[1]) {
        startDateStr = dateRange[0].toISOString();
        endDateStr = dateRange[1].toISOString();
      }
      const response = await dashboardService.getDashboardV2Data(period, startDateStr, endDateStr);
      setDashboardData(response.data);
    } catch (err) {
      console.error("Failed to fetch dashboard V2 data:", err);
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    const num = parseFloat(val || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // Process Weekly Trend for Bar Chart
  const getWeeklyChartData = () => {
    if (!dashboardData || !dashboardData.weeklyTrend) return [];

    const dayMap = { 2: 'Mon', 3: 'Tue', 4: 'Wed', 5: 'Thu', 6: 'Fri', 7: 'Sat', 1: 'Sun' };
    const daysOrder = [2, 3, 4, 5, 6, 7, 1];

    return daysOrder.map(dayNum => {
      const match = dashboardData.weeklyTrend.find(w => w.dayOfWeek === dayNum);
      return {
        name: dayMap[dayNum],
        'Revenue (₹)': match ? parseFloat(match.revenue) : 0
      };
    });
  };

  // Calculate dynamic peak day and time slot based on heatmap data
  const getPeakTimeInsight = () => {
    if (!dashboardData || !dashboardData.heatmap || dashboardData.heatmap.length === 0) {
      return {
        day: "Saturdays",
        hours: "12 PM - 6 PM"
      };
    }

    // 1. Group by day of week (1-7) to find the day with the highest revenue
    const dayMap = { 1: 'Sunday', 2: 'Monday', 3: 'Tuesday', 4: 'Wednesday', 5: 'Thursday', 6: 'Friday', 7: 'Saturday' };
    const dayStats = {};
    Object.keys(dayMap).forEach(d => {
      dayStats[d] = { count: 0, revenue: 0 };
    });

    dashboardData.heatmap.forEach(item => {
      if (dayStats[item.dayOfWeek]) {
        dayStats[item.dayOfWeek].count += item.count;
        dayStats[item.dayOfWeek].revenue += parseFloat(item.revenue || 0);
      }
    });

    let peakDayValue = 7; // Default to Saturday
    let maxDayRevenue = -1;
    Object.keys(dayStats).forEach(d => {
      if (dayStats[d].revenue > maxDayRevenue) {
        maxDayRevenue = dayStats[d].revenue;
        peakDayValue = parseInt(d);
      }
    });

    const peakDayName = dayMap[peakDayValue] + 's'; // e.g. "Saturdays"

    // 2. Filter data for that peak day
    const dayHeatmap = dashboardData.heatmap.filter(h => h.dayOfWeek === peakDayValue);

    // 3. Define 3-hour slots to find the peak hours
    const slotStats = [
      { label: '9 AM - 12 PM', rev: 0, hours: [9, 10, 11] },
      { label: '12 PM - 3 PM', rev: 0, hours: [12, 13, 14] },
      { label: '3 PM - 6 PM', rev: 0, hours: [15, 16, 17] },
      { label: '6 PM - 9 PM', rev: 0, hours: [18, 19, 20] },
      { label: '9 PM - 12 AM', rev: 0, hours: [21, 22, 23] }
    ];

    slotStats.forEach(s => {
      dayHeatmap.forEach(item => {
        if (s.hours.includes(item.hourOfDay)) {
          s.rev += parseFloat(item.revenue || 0);
        }
      });
    });

    let maxSingleIdx = 0;
    let maxSingleRev = -1;
    slotStats.forEach((s, idx) => {
      if (s.rev > maxSingleRev) {
        maxSingleRev = s.rev;
        maxSingleIdx = idx;
      }
    });

    let hoursText = slotStats[maxSingleIdx].label;

    // Check adjacent slots to see if we should form a 6-hour window
    if (maxSingleIdx === 1) { // 12 PM - 3 PM
      if (slotStats[2].rev > slotStats[1].rev * 0.4) {
        hoursText = '12 PM - 6 PM';
      }
    } else if (maxSingleIdx === 2) { // 3 PM - 6 PM
      if (slotStats[1].rev > slotStats[3].rev && slotStats[1].rev > slotStats[2].rev * 0.4) {
        hoursText = '12 PM - 6 PM';
      } else if (slotStats[3].rev > slotStats[2].rev * 0.4) {
        hoursText = '3 PM - 9 PM';
      }
    } else if (maxSingleIdx === 3) { // 6 PM - 9 PM
      if (slotStats[2].rev > slotStats[3].rev * 0.4) {
        hoursText = '3 PM - 9 PM';
      }
    }

    return {
      day: peakDayName,
      hours: hoursText
    };
  };

  // GitHub-style Sales Heatmap Cell processing
  const renderHeatmap = () => {
    if (!dashboardData || !dashboardData.heatmap) return <Empty description="No heatmap data available" />;

    const heatmapData = dashboardData.heatmap;
    const counts = heatmapData.map(d => d.count);
    const maxCount = Math.max(...counts, 1);

    const getHeatmapColor = (count) => {
      if (count === 0) return 'bg-slate-100 hover:bg-slate-200';
      const percent = count / maxCount;
      if (percent <= 0.16) return 'bg-violet-100 hover:bg-violet-200';
      if (percent <= 0.33) return 'bg-violet-200 hover:bg-violet-300';
      if (percent <= 0.50) return 'bg-violet-300 hover:bg-violet-400';
      if (percent <= 0.66) return 'bg-violet-400 hover:bg-violet-500';
      if (percent <= 0.83) return 'bg-violet-500 hover:bg-violet-600';
      return 'bg-violet-700 hover:bg-violet-800';
    };

    const formatHour = (hour) => {
      if (hour === 0) return '12 AM';
      if (hour === 12) return '12 PM';
      return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
    };

    const cells = [];
    for (let hour = 6; hour <= 23; hour++) {
      for (let dayIndex = 0; dayIndex < DAYS_OF_WEEK.length; dayIndex++) {
        const day = DAYS_OF_WEEK[dayIndex];
        const match = heatmapData.find(h => h.dayOfWeek === day.value && h.hourOfDay === hour);
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
          {/* Day Labels Column - Aligned row-by-row with grid */}
          <div className="grid grid-rows-7 gap-[5px] h-[198px] text-[11px] text-slate-400 font-bold select-none pr-1">
            <span className="flex items-center justify-end h-[24px] leading-none">Mon</span>
            <span className="flex items-center justify-end h-[24px] leading-none">Tue</span>
            <span className="flex items-center justify-end h-[24px] leading-none">Wed</span>
            <span className="flex items-center justify-end h-[24px] leading-none">Thu</span>
            <span className="flex items-center justify-end h-[24px] leading-none">Fri</span>
            <span className="flex items-center justify-end h-[24px] leading-none">Sat</span>
            <span className="flex items-center justify-end h-[24px] leading-none">Sun</span>
          </div>

          {/* GitHub Grid Container */}
          <div className="w-max">
            <div className="grid grid-rows-7 grid-flow-col gap-[5px] w-max">
              {cells}
            </div>

            {/* Hour Labels Row */}
            <div className="flex justify-between text-[10px] text-slate-400 mt-2.5 px-1 select-none font-semibold">
              {hourLabels.map((lbl, idx) => (
                <span key={idx}>{lbl}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Heatmap Legend */}
        <div className="flex justify-center mt-3">
          <div className="flex items-center gap-2 bg-slate-50/70 border border-slate-100/80 px-4 py-1.5 rounded-full text-[11px] text-slate-500 font-semibold select-none shadow-sm">
            <span className="text-slate-700 font-bold mr-1">Sales Volume</span>
            <span className="text-[10px] text-slate-400">Less</span>
            <div className="flex gap-[3px] mx-1">
              <div className="w-[10px] h-[10px] rounded-[2px] bg-slate-100" />
              <div className="w-[10px] h-[10px] rounded-[2px] bg-violet-100" />
              <div className="w-[10px] h-[10px] rounded-[2px] bg-violet-200" />
              <div className="w-[10px] h-[10px] rounded-[2px] bg-violet-300" />
              <div className="w-[10px] h-[10px] rounded-[2px] bg-violet-400" />
              <div className="w-[10px] h-[10px] rounded-[2px] bg-violet-500" />
              <div className="w-[10px] h-[10px] rounded-[2px] bg-violet-700" />
            </div>
            <span className="text-[10px] text-slate-400">More</span>
          </div>
        </div>
      </div>
    );
  };

  const getSparklineData = (type) => {
    if (!dashboardData) return [];
    if (type === 'revenue' && dashboardData.weeklyTrend) {
      return dashboardData.weeklyTrend.map(w => ({ value: parseFloat(w.revenue) }));
    }
    return [
      { value: 10 }, { value: 18 }, { value: 12 }, { value: 24 },
      { value: 15 }, { value: 30 }, { value: 22 }, { value: 35 }
    ];
  };

  const getPeriodLabel = () => {
    switch (period) {
      case "today": return "vs yesterday";
      case "yesterday": return "vs day before";
      case "week": return "vs last week";
      case "month": return "vs last month";
      case "year": return "vs last year";
      case "custom": return "vs prev period";
      default: return "";
    }
  };

  return (
    <div className="p-5 min-h-screen bg-slate-50 font-sans">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">Overview of your store performance</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {selectedBranch && (
            <div className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></span>
              {selectedBranch.name === "All Branches" ? "All Branches" : selectedBranch.name}
            </div>
          )}

          <Select
            value={period}
            onChange={handlePeriodChange}
            className="w-[130px] shadow-sm rounded-lg"
            dropdownStyle={{ borderRadius: '8px' }}
          >
            <Option value="today">Today</Option>
            <Option value="yesterday">Yesterday</Option>
            <Option value="week">This Week</Option>
            <Option value="month">This Month</Option>
            <Option value="year">This Year</Option>
            <Option value="custom">Custom Range</Option>
          </Select>

          {period === "custom" && (
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              className="shadow-sm rounded-lg"
              format="DD MMM YYYY"
              inputReadOnly
            />
          )}

          <div className="px-3 py-1.5 bg-violet-50 text-violet-700 text-xs font-semibold rounded-lg flex items-center gap-2">
            <Clock size={14} />
            <span>{dayjs().format("D MMMM YYYY")}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <Row gutter={[16, 16]}>
            {[1, 2, 3, 4].map(i => (
              <Col xs={24} sm={12} lg={6} key={i}>
                <Card className="rounded-xl border border-slate-200 shadow-sm h-32">
                  <Skeleton active paragraph={{ rows: 2 }} title={false} />
                </Card>
              </Col>
            ))}
          </Row>
          <Card className="rounded-xl border border-slate-200 shadow-sm h-96">
            <Skeleton active paragraph={{ rows: 6 }} />
          </Card>
        </div>
      ) : dashboardData ? (
        <div className="space-y-6">
          {/* Row 1: Stat Cards */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card className="rounded-xl border border-slate-200 hover:border-violet-300 hover:shadow-md transition-all duration-200 shadow-sm relative overflow-hidden bg-white">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Revenue</span>
                    <h2 className="text-2xl font-bold text-slate-900 !my-2">{formatCurrency(dashboardData.summary.periodRevenue)}</h2>
                  </div>
                  <div className="p-2.5 bg-violet-50 text-violet-600 rounded-lg">
                    <Wallet size={20} />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    {dashboardData.summary.revenueChange >= 0 ? (
                      <span className="text-xs font-bold text-emerald-600 flex items-center bg-emerald-50 px-1.5 py-0.5 rounded">
                        <ArrowUpRight size={12} /> {dashboardData.summary.revenueChange}%
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-rose-600 flex items-center bg-rose-50 px-1.5 py-0.5 rounded">
                        <ArrowDownRight size={12} /> {Math.abs(dashboardData.summary.revenueChange)}%
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-medium">{getPeriodLabel()}</span>
                  </div>

                  <div className="w-[80px] h-[30px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getSparklineData('revenue')}>
                        <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card className="rounded-xl border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all duration-200 shadow-sm relative overflow-hidden bg-white">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Bills</span>
                    <h2 className="text-2xl font-bold text-slate-900 !my-2">{dashboardData.summary.periodBills}</h2>
                  </div>
                  <div className="p-2.5 bg-orange-50 text-orange-500 rounded-lg">
                    <IndianRupee size={20} />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    {dashboardData.summary.billsChange >= 0 ? (
                      <span className="text-xs font-bold text-emerald-600 flex items-center bg-emerald-50 px-1.5 py-0.5 rounded">
                        <ArrowUpRight size={12} /> {dashboardData.summary.billsChange}%
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-rose-600 flex items-center bg-rose-50 px-1.5 py-0.5 rounded">
                        <ArrowDownRight size={12} /> {Math.abs(dashboardData.summary.billsChange)}%
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-medium">{getPeriodLabel()}</span>
                  </div>

                  <div className="w-[80px] h-[30px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getSparklineData('bills')}>
                        <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card className="rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 shadow-sm relative overflow-hidden bg-white">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Customers</span>
                    <h2 className="text-2xl font-bold text-slate-900 !my-2">{dashboardData.summary.totalCustomers}</h2>
                  </div>
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Users size={20} />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    {dashboardData.summary.custChange >= 0 ? (
                      <span className="text-xs font-bold text-emerald-600 flex items-center bg-emerald-50 px-1.5 py-0.5 rounded">
                        <ArrowUpRight size={12} /> {dashboardData.summary.custChange}%
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-rose-600 flex items-center bg-rose-50 px-1.5 py-0.5 rounded">
                        <ArrowDownRight size={12} /> {Math.abs(dashboardData.summary.custChange)}%
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-medium">{getPeriodLabel()}</span>
                  </div>

                  <div className="w-[80px] h-[30px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getSparklineData('customers')}>
                        <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card className="rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200 shadow-sm relative overflow-hidden bg-white">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Products</span>
                    <h2 className="text-2xl font-bold text-slate-900 !my-2">{dashboardData.summary.totalProducts}</h2>
                  </div>
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                    <ShoppingBasket size={20} />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5">
                    {dashboardData.summary.lowStockCount > 0 ? (
                      <span className="text-xs font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                        {dashboardData.summary.lowStockCount} Low Stock
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <CheckCircle size={10} /> Stock OK
                      </span>
                    )}
                  </div>

                  <div className="w-[80px] h-[30px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getSparklineData('products')}>
                        <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Row 2: Business Insights Banner */}
          <div className="p-4 bg-violet-600 text-white rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3 relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-8 -translate-y-4">
              <Sparkles size={160} />
            </div>

            <div className="flex items-center gap-3.5 z-10">
              <div className="p-2.5 bg-white/10 text-white rounded-xl">
                <Lightbulb size={24} className="animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-semibold tracking-wide">Business Insights</h4>
                <p className="text-xs text-violet-100/90 mt-0.5">
                  {dashboardData.insights.peakTime ? (
                    `Evening (${dashboardData.insights.peakTime}) is your busiest time. Consider more staff during these hours.`
                  ) : (
                    dashboardData.insights.insightText
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/billing/reports')}
              className="text-xs font-bold !text-violet-900 bg-white hover:bg-violet-100 transition-colors px-4 py-2 rounded-lg cursor-pointer z-10 flex items-center gap-1 shadow-sm"
            >
              View Full Report &rarr;
            </button>
          </div>

          {/* Row 3: Recent Bills & Top Products */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card
                title={
                  <div className="flex items-center justify-between w-full py-1">
                    <div className="flex items-center gap-2">
                      <ShoppingCart size={18} className="text-violet-600" />
                      <span className="text-sm font-bold text-slate-800">Recent Bills</span>
                    </div>
                    <button
                      onClick={() => navigate('/billing/list')}
                      className="text-xs font-semibold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      View All
                    </button>
                  </div>
                }
                className="rounded-xl border border-slate-200 shadow-sm bg-white h-full"
              >
                <Table
                  className="h-full"
                  dataSource={dashboardData.recentBills}
                  rowKey="id"
                  pagination={{ pageSize: 6, showSizeChanger: false }}
                  size="small"
                  scroll={{ x: 650 }}
                  columns={[
                    {
                      title: "Bill No",
                      dataIndex: "billing_no",
                      key: "billing_no",
                      render: (text) => <span className="font-semibold text-slate-800">{text}</span>
                    },
                    {
                      title: "Customer",
                      dataIndex: "customer_name",
                      key: "customer_name",
                      render: (text) => <span className="text-slate-600">{text || 'Walk-in Customer'}</span>
                    },
                    {
                      title: "Time",
                      dataIndex: "createdAt",
                      key: "createdAt",
                      render: (val) => dayjs(val).format("hh:mm A")
                    },
                    {
                      title: "Amount",
                      dataIndex: "total_amount",
                      key: "total_amount",
                      render: (val) => <span className="font-bold text-slate-800">{formatCurrency(val)}</span>,
                      align: "right"
                    },
                    {
                      title: "Payment",
                      dataIndex: "payment_method",
                      key: "payment_method",
                      render: (val) => {
                        const isUpi = val?.includes('UPI');
                        return (
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${isUpi ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                            }`}>
                            {isUpi ? 'UPI' : val}
                          </span>
                        );
                      }
                    }
                  ]}
                  onRow={(record) => ({
                    onClick: () => handleBillClick(record),
                    className: "hover:bg-slate-50 cursor-pointer transition-colors"
                  })}
                />
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card
                title={
                  <div className="flex items-center justify-between w-full py-1">
                    <div className="flex items-center gap-2">
                      <Sparkles size={18} className="text-violet-600" />
                      <span className="text-sm font-bold text-slate-800">Top Selling Products</span>
                    </div>
                    <button
                      onClick={() => navigate('/Product/list')}
                      className="text-xs font-semibold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      View All
                    </button>
                  </div>
                }
                className="rounded-xl border border-slate-200 shadow-sm bg-white"
              >
                <Table
                  dataSource={dashboardData.topProducts}
                  rowKey="product_id"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: "Product",
                      dataIndex: "product_name",
                      key: "product_name",
                      render: (text, record) => (
                        <div className="flex items-center gap-2.5 py-1">
                          <Avatar
                            src={record.image_url}
                            shape="square"
                            size={36}
                            className="bg-slate-100 border border-slate-100 rounded"
                            icon={<ShoppingBasket size={16} className="text-slate-400" />}
                          />
                          <div>
                            <div className="font-semibold text-slate-800 text-xs leading-none">{text}</div>
                            <div className="text-[10px] text-slate-400 font-medium mt-1">{record.product_code}</div>
                          </div>
                        </div>
                      )
                    },
                    {
                      title: "Sold",
                      dataIndex: "total_quantity",
                      key: "total_quantity",
                      align: "center",
                      render: (qty) => <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs">{qty}</span>
                    },
                    {
                      title: "Revenue",
                      dataIndex: "total_revenue",
                      key: "total_revenue",
                      align: "right",
                      render: (val) => <span className="font-bold text-slate-800">{formatCurrency(val)}</span>
                    }
                  ]}
                  onRow={(record) => ({
                    onClick: () => handleProductClick(record),
                    className: "hover:bg-slate-50 cursor-pointer transition-colors"
                  })}
                />
              </Card>
            </Col>
          </Row>

          {/* Row 4: Sales Overview & Heatmap */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card
                title={
                  <div className="flex items-center justify-between w-full py-1">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={18} className="text-violet-600" />
                      <span className="text-sm font-bold text-slate-800">Sales Overview</span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">This Week</span>
                  </div>
                }
                className="rounded-xl border border-slate-200 shadow-sm bg-white"
              >
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={getWeeklyChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatCurrency} />
                      <RechartsTooltip
                        formatter={(val) => [formatCurrency(val), 'Revenue']}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      />
                      <Bar dataKey="Revenue (₹)" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card className="rounded-xl border border-slate-200 shadow-sm bg-white">
                {/* Custom Card Header */}
                <div className="flex justify-between items-start w-full mb-5 gap-4">
                  <div className="flex gap-3">
                    <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center h-10 w-10 shrink-0">
                      <Clock size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800 leading-tight">Sales by Time of Day</h3>
                      <p className="text-xs text-slate-500 mt-1 font-medium">Understand when your store is busiest to optimize staffing and promotions.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-sm text-xs font-semibold text-slate-600 select-none shrink-0">
                    <Calendar size={14} className="text-slate-400" />
                    <span>Last 30 Days</span>
                    <span className="text-[8px] text-slate-400 ml-0.5">▼</span>
                  </div>
                </div>

                {/* Dynamic Insight Banner */}
                {showHeatmapInsight && (() => {
                  const peakInfo = getPeakTimeInsight();
                  return (
                    <div className="bg-violet-50/50 border border-violet-100/40 rounded-xl p-4 mb-5 flex gap-3.5 items-start">
                      <div className="p-2 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center shrink-0 w-8 h-8">
                        <Lightbulb size={16} />
                      </div>
                      <div className="space-y-0.5 flex-1 pr-4">
                        <h4 className="text-xs font-bold text-slate-800">Insight</h4>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                          Your store sees the highest sales on <span className="text-violet-700 font-bold">{peakInfo.day} between {peakInfo.hours}.</span> Consider scheduling more staff and offers during these peak hours.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowHeatmapInsight(false)}
                        className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100/50 rounded transition-colors cursor-pointer shrink-0 flex items-center justify-center"
                        title="Dismiss Insight"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })()}

                {/* Heatmap Grid Wrapper */}
                <div className="border border-slate-100 bg-white rounded-xl p-4">
                  {renderHeatmap()}
                </div>
              </Card>
            </Col>
          </Row>

          {/* Row 5: What's Happening */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3.5 tracking-tight uppercase">What's Happening?</h3>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-emerald-700/80 font-bold uppercase tracking-wider">Best Payment Method</span>
                    <h3 className="text-lg font-extrabold text-emerald-900">{dashboardData.insights.bestPaymentMethod}</h3>
                    <p className="text-xs text-slate-500 !mb-0">{dashboardData.insights.bestPaymentPercentage}% of total payments</p>
                  </div>
                  <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
                    <Wallet size={20} />
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-xl flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-orange-700/80 font-bold uppercase tracking-wider">Peak Sales Time</span>
                    <h3 className="text-lg font-bold text-orange-950">{dashboardData.insights.peakTime}</h3>
                    <p className="text-xs text-slate-500 !mb-0">{dashboardData.insights.peakPercentage}% of daily sales</p>
                  </div>
                  <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                    <Clock size={20} />
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-blue-700/80 font-bold uppercase tracking-wider">New Customers</span>
                    <h3 className="text-lg font-bold text-blue-900">{dashboardData.summary.periodCustomers}</h3>
                    <p className="text-xs text-slate-500 !mb-0">
                      {dashboardData.summary.custChange >= 0 ? (
                        <span className="text-emerald-600 font-semibold">&uarr; {dashboardData.summary.custChange}% vs yesterday</span>
                      ) : (
                        <span className="text-rose-600 font-semibold">&darr; {Math.abs(dashboardData.summary.custChange)}% vs yesterday</span>
                      )}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                    <Users size={20} />
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-xl flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-rose-700/80 font-bold uppercase tracking-wider">Low Stock Items</span>
                    <h3 className="text-lg font-bold text-rose-900">{dashboardData.summary.lowStockCount}</h3>
                    <p className="text-xs text-slate-500 !mb-0">Needs attention immediately</p>
                  </div>
                  <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
                    <AlertTriangle size={20} />
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          {/* Row 6: Alerts & Details */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={8}>
              <Card
                title={
                  <div className="flex items-center justify-between w-full py-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={18} className="text-rose-500" />
                      <span className="text-sm font-bold text-slate-800">Low Stock Alert</span>
                    </div>
                    <Tag color="red">{dashboardData.summary.lowStockCount}</Tag>
                  </div>
                }
                className="rounded-xl border border-slate-200 shadow-sm bg-white"
              >
                {dashboardData.lowStockProducts.length > 0 ? (
                  <Table
                    dataSource={dashboardData.lowStockProducts}
                    rowKey="product_id"
                    pagination={false}
                    size="small"
                    columns={[
                      {
                        title: "Product",
                        dataIndex: "product_name",
                        key: "product_name",
                        render: (text, record) => (
                          <div>
                            <div className="font-semibold text-slate-800 text-[11px] leading-tight">{text}</div>
                            <div className="text-[9px] text-slate-400 mt-0.5">{record.product_code}</div>
                          </div>
                        )
                      },
                      {
                        title: "Stock",
                        dataIndex: "quantity",
                        key: "quantity",
                        align: "center",
                        render: (qty) => <span className="font-bold text-rose-600">{qty}</span>
                      },
                      {
                        title: "Status",
                        key: "status",
                        align: "right",
                        render: (_, record) => (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${record.quantity <= 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-orange-50 text-orange-600 border border-orange-100'
                            }`}>
                            {record.quantity <= 0 ? 'Out of Stock' : 'Low Stock'}
                          </span>
                        )
                      }
                    ]}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <CheckCircle size={36} className="text-emerald-500 mb-2" />
                    <span className="text-xs text-slate-500 font-semibold">Stock status is excellent!</span>
                  </div>
                )}
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card
                title={
                  <div className="flex items-center justify-between w-full py-1">
                    <div className="flex items-center gap-2">
                      <Wallet size={18} className="text-violet-600" />
                      <span className="text-sm font-bold text-slate-800">Payment Methods</span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">All Transactions</span>
                  </div>
                }
                className="rounded-xl border border-slate-200 shadow-sm bg-white min-h-[270px] h-full"
              >
                {dashboardData.paymentMethods && dashboardData.paymentMethods.length > 0 ? (
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-[180px] h-[180px] relative flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dashboardData.paymentMethods.map(pm => ({
                              name: pm.method === 'UPI Current Account' || pm.method === 'UPI Normal Account' ? 'UPI' : pm.method,
                              value: parseFloat(pm.total_amount)
                            }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {dashboardData.paymentMethods.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Total Revenue</span>
                        <span className="text-sm font-extrabold text-slate-800 mt-0.5">
                          {formatCurrency(dashboardData.summary.periodRevenue)}
                        </span>
                      </div>
                    </div>

                    <div className="w-full grid grid-cols-2 gap-2 mt-4 px-2">
                      {dashboardData.paymentMethods.map((pm, idx) => {
                        const name = pm.method === 'UPI Current Account' || pm.method === 'UPI Normal Account' ? 'UPI' : pm.method;
                        return (
                          <div key={pm.method} className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                            <div className="flex-1 flex justify-between items-center text-[10px]">
                              <span className="font-semibold text-slate-600 uppercase">{name}</span>
                              <span className="font-bold text-slate-800">{formatCurrency(pm.total_amount)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <Empty description="No payment method breakdown" />
                )}
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card
                title={
                  <div className="flex items-center justify-between w-full py-1">
                    <div className="flex items-center gap-2">
                      <Package size={18} className="text-violet-600" />
                      <span className="text-sm font-bold text-slate-800">Recent Inwards</span>
                    </div>
                    <button
                      onClick={() => navigate('/inward/list')}
                      className="text-xs font-semibold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      View All
                    </button>
                  </div>
                }
                className="rounded-xl border border-slate-200 shadow-sm bg-white min-h-[270px] h-full"
              >
                {dashboardData.recentInwards && dashboardData.recentInwards.length > 0 ? (
                  <div className="space-y-2 max-h-[260px] overflow-y-auto custom-scrollbar pr-1">
                    {dashboardData.recentInwards.map((inward) => (
                      <div key={inward.id} className="p-2 border border-slate-100 hover:border-slate-200 rounded-lg flex items-center justify-between transition-colors">
                        <div>
                          <div className="font-bold text-slate-800 text-xs">{inward.inward_no}</div>
                          <div className="text-[10px] text-slate-500 font-medium mt-0.5">{inward.supplier_name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-800 text-xs">{formatCurrency(inward.total_amount)}</div>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase mt-1 inline-block ${inward.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                            {inward.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
                      <Package size={20} className="text-slate-300" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">No recent Inwards</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">New stock inwards will appear here</p>
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          {/* Suggestions footer Banner */}
          {(() => {
            const list = getDynamicSuggestions();
            const active = list[suggestionIndex] || list[0];
            if (!active) return null;

            return (
              <div className="p-3.5 bg-violet-50/70 border border-violet-100 rounded-xl text-violet-800 text-xs flex flex-wrap justify-between items-center gap-2 transition-all duration-300">
                <div className="flex items-center gap-2.5 font-medium flex-1">
                  <Sparkles size={14} className="text-violet-600 shrink-0 animate-pulse" />
                  <span>
                    <strong className="font-bold mr-1">Smart Suggestion:</strong>
                    {active.text}
                  </span>
                </div>
                {active.actionText && active.link && (
                  <button
                    onClick={() => navigate(active.link)}
                    className="text-[10px] font-bold text-violet-700 bg-white hover:bg-violet-100/50 transition-colors px-3 py-1.5 rounded border border-violet-200 cursor-pointer shadow-sm shrink-0"
                  >
                    {active.actionText} &rarr;
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      ) : (
        <Card className="rounded-xl border border-slate-200 shadow-sm text-center py-12 bg-white">
          <Empty description="No dashboard data could be loaded" />
        </Card>
      )}

      <BillDetailsModal
        visible={billModalVisible}
        onClose={() => {
          setBillModalVisible(false);
          setSelectedBillId(null);
          setSelectedBill(null);
        }}
        billId={selectedBillId}
        initialData={selectedBill}
      />
    </div>
  );
};

export default ModernDashboard;
