import { useState, useEffect, useCallback } from "react";
import { message, Spin } from "antd";
import { LogIn, LogOut, Plus, User } from "lucide-react";
import dayjs from "dayjs";
import empApi from "../../api/employeeApi";
import { useEmployeeAuth } from "../../context/EmployeeAuthContext";
import { useNavigate } from "react-router-dom";

export default function EmployeeOverview() {
  const { employee, logout } = useEmployeeAuth();
  const navigate = useNavigate();
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchToday = useCallback(async () => {
    try {
      const now = dayjs();
      const res = await empApi.get(`/employee/attendance?month=${now.month() + 1}&year=${now.year()}&limit=31`);
      const rows = res.data.data || [];
      const today = now.format("YYYY-MM-DD");
      setTodayRecord(rows.find(r => r.date === today) || null);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchToday(); }, []);

  const handleSignIn = async () => {
    setActionLoading(true);
    try {
      await empApi.post("/employee/attendance/sign-in");
      message.success("Signed in successfully");
      fetchToday();
    } catch (err) { message.error(err.response?.data?.message || "Sign in failed"); }
    finally { setActionLoading(false); }
  };

  const handleSignOut = async () => {
    setActionLoading(true);
    try {
      await empApi.post("/employee/attendance/sign-out");
      message.success("Signed out successfully");
      fetchToday();
    } catch (err) { message.error(err.response?.data?.message || "Sign out failed"); }
    finally { setActionLoading(false); }
  };

  if (loading) return <div className="flex justify-center py-16"><Spin size="large" /></div>;

  const statusColor = { present: "bg-green-100 text-green-600", absent: "bg-red-100 text-red-600", half_day: "bg-yellow-100 text-yellow-600", holiday: "bg-blue-100 text-blue-600", leave: "bg-purple-100 text-purple-600" };

  return (
    <div className="p-2">
      {/* Employee Info */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <User size={22} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-[#0f172a]">{employee?.name}</h1>
            <p className="text-[13px] text-[#64748b]">{employee?.designation || "Employee"} · {employee?.employee_code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSignIn}
            disabled={actionLoading || !!todayRecord?.sign_in}
            className="flex items-center gap-2 bg-[#6bc58b] text-white px-4 py-2 rounded-xl text-[13px] font-medium disabled:opacity-50"
          >
            <LogIn size={14} />
            {todayRecord?.sign_in ? `In: ${todayRecord.sign_in}` : "Sign In"}
          </button>
          <button
            onClick={handleSignOut}
            disabled={actionLoading || !todayRecord?.sign_in || !!todayRecord?.sign_out}
            className="flex items-center gap-2 bg-[#f0a76d] text-white px-4 py-2 rounded-xl text-[13px] font-medium disabled:opacity-50"
          >
            <LogOut size={14} />
            {todayRecord?.sign_out ? `Out: ${todayRecord.sign_out}` : "Sign Out"}
          </button>
          <button
            onClick={() => navigate("/employee-dashboard/leaves")}
            className="flex items-center gap-2 bg-[#4f6ee8] text-white px-4 py-2 rounded-xl text-[13px] font-medium"
          >
            <Plus size={14} />
            Apply Leave
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <p className="text-[11px] text-gray-400">TODAY</p>
          <h2 className="text-[14px] font-semibold mt-2">{dayjs().format("DD MMM YYYY")}</h2>
          <span className={`text-[11px] px-2 py-1 rounded-full mt-2 inline-block ${todayRecord ? statusColor[todayRecord.status] : "bg-gray-100 text-gray-500"}`}>
            {todayRecord?.status ? todayRecord.status.replace("_", " ") : "Not marked"}
          </span>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <p className="text-[11px] text-gray-400">SIGN IN</p>
          <h2 className="text-[14px] font-semibold mt-2">{todayRecord?.sign_in || "--"}</h2>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <p className="text-[11px] text-gray-400">SIGN OUT</p>
          <h2 className="text-[14px] font-semibold mt-2">{todayRecord?.sign_out || "--"}</h2>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <p className="text-[11px] text-gray-400">HOURS TODAY</p>
          <h2 className="text-[14px] font-semibold mt-2">{todayRecord?.hours_worked ? `${todayRecord.hours_worked}h` : "0.00h"}</h2>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div onClick={() => navigate("/employee-dashboard/attendance")} className="bg-blue-50 border border-blue-100 rounded-xl p-5 cursor-pointer hover:shadow-md transition-all">
          <p className="font-semibold text-blue-700">View Attendance</p>
          <p className="text-sm text-blue-500 mt-1">Check your monthly attendance records</p>
        </div>
        <div onClick={() => navigate("/employee-dashboard/balance")} className="bg-green-50 border border-green-100 rounded-xl p-5 cursor-pointer hover:shadow-md transition-all">
          <p className="font-semibold text-green-700">Leave Balance</p>
          <p className="text-sm text-green-500 mt-1">View your remaining leave days</p>
        </div>
      </div>
    </div>
  );
}
