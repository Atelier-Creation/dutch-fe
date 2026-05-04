import React, { useState } from "react";
import {
  LogIn,
  LogOut,
  Plus,
  CalendarDays,
  FileText,
  CheckCircle,
  FolderOpen,
} from "lucide-react";
import dayjs from "dayjs";

export default function EmployeeDashboard() {
  const [tab, setTab] = useState("attendance");
  const [signInTime, setSignInTime] = useState(null);
  const [signOutTime, setSignOutTime] = useState(null);

  const handleSignIn = () => {
    setSignInTime(dayjs().format("hh:mm:ss"));
  };

  const handleSignOut = () => {
    setSignOutTime(dayjs().format("hh:mm:ss"));
  };

  const tabs = [
    { key: "attendance", label: "Attendance", icon: CalendarDays },
    { key: "leaves", label: "My Leaves", icon: FileText },
    { key: "balance", label: "Leave Balance", icon: CheckCircle },
    { key: "documents", label: "My Documents", icon: FolderOpen },
  ];

  return (
    <div className="p-4 bg-[#f8fafc] min-h-screen">

      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-[18px] font-bold text-[#0f172a]">
            Employee 
          </h1>

          <p className="text-[13px] text-[#64748b]">
            Employee · EMP-1003
          </p>
        </div>

        <div className="flex gap-2">

          <button
            onClick={handleSignIn}
            className="flex items-center gap-2 bg-[#6bc58b] text-white px-4 py-2 rounded-xl text-[13px] font-medium"
          >
            <LogIn size={14} />
            {signInTime ? `In: ${signInTime}` : "Sign In"}
          </button>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 bg-[#f0a76d] text-white px-4 py-2 rounded-xl text-[13px] font-medium"
          >
            <LogOut size={14} />
            {signOutTime ? `Out: ${signOutTime}` : "Sign Out"}
          </button>

          <button
            className="flex items-center gap-2 bg-[#4f6ee8] text-white px-4 py-2 rounded-xl text-[13px] font-medium"
          >
            <Plus size={14} />
            Apply Leave
          </button>

        </div>
      </div>

      {/* Small Cards */}
      <div className="grid grid-cols-4 gap-3 mb-5">

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm 
transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:scale-[1.02]">
          <p className="text-[11px] text-gray-400">TODAY</p>
          <h2 className="text-[14px] font-semibold mt-2">
            {dayjs().format("DD MMM YYYY")}
          </h2>
          <span className="text-[11px] bg-green-100 text-green-600 px-2 py-1 rounded-full mt-2 inline-block">
            Present
          </span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm 
transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:scale-[1.02]">
          <p className="text-[11px] text-gray-400">SIGN IN</p>
          <h2 className="text-[14px] font-semibold mt-2">
            {signInTime || "--"}
          </h2>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm 
transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:scale-[1.02]">
          <p className="text-[11px] text-gray-400">SIGN OUT</p>
          <h2 className="text-[14px] font-semibold mt-2">
            {signOutTime || "--"}
          </h2>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm 
transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:scale-[1.02]">
          <p className="text-[11px] text-gray-400">HOURS TODAY</p>
          <h2 className="text-[14px] font-semibold mt-2">
            0.00h
          </h2>
        </div>

      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 pb-3 mb-4">

        {tabs.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`flex items-center gap-2 text-[14px] ${
                tab === item.key
                  ? "text-blue-600 font-semibold"
                  : "text-gray-500"
              }`}
            >
              <Icon size={15} />
              {item.label}
            </button>
          );
        })}

      </div>

      {/* Table */}
      {/* Dynamic Content */}

{tab === "attendance" && (
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr className="text-left text-gray-500 text-[13px]">
          <th className="p-4">Date</th>
          <th className="p-4">Sign In</th>
          <th className="p-4">Sign Out</th>
          <th className="p-4">Hours</th>
          <th className="p-4">Status</th>
        </tr>
      </thead>

      <tbody>
        <tr>
          <td className="p-4">{dayjs().format("DD MMM YYYY")}</td>
          <td className="p-4">{signInTime || "--"}</td>
          <td className="p-4">{signOutTime || "--"}</td>
          <td className="p-4">0.00h</td>
          <td className="p-4">
            <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[12px]">
              Present
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
)}

{tab === "leaves" && (
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr className="text-left text-gray-500 text-[13px]">
          <th className="p-4">Type</th>
          <th className="p-4">From</th>
          <th className="p-4">To</th>
          <th className="p-4">Days</th>
          <th className="p-4">Reason</th>
          <th className="p-4">Status</th>
        </tr>
      </thead>

      <tbody>
        <tr>
          <td className="p-4">Paid</td>
          <td className="p-4">09 Apr 2026</td>
          <td className="p-4">09 Apr 2026</td>
          <td className="p-4">1.00</td>
          <td className="p-4">Fever</td>
          <td className="p-4">
            <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[12px]">
              HR Approved
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
)}

{tab === "balance" && (
  <div className="w-[420px] bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
    <h2 className="font-semibold text-[18px] mb-4">
      Paid Leave
    </h2>

    <div className="space-y-3">
      <div className="flex justify-between">
        <span>Entitled</span>
        <span>12 days</span>
      </div>

      <div className="flex justify-between">
        <span>Used</span>
        <span className="text-red-500">1 days</span>
      </div>

      <div className="flex justify-between font-semibold">
        <span>Balance</span>
        <span className="text-green-600">11 days</span>
      </div>
    </div>

    <div className="mt-4 h-2 bg-gray-100 rounded-full">
      <div className="h-2 w-[10%] bg-blue-500 rounded-full"></div>
    </div>
  </div>
)}

{tab === "documents" && (
  <div className="flex justify-between">

    <div className="w-[420px] bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <h2 className="font-semibold text-[18px]">
        Aadhar
      </h2>

      <p className="text-gray-400 text-[13px] mt-1">
        document.jpg
      </p>

      <span className="inline-block mt-3 bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[12px]">
        ID Proof
      </span>

      <p className="text-gray-400 text-[13px] mt-3">
        09 Apr 2026
      </p>

      <p className="text-blue-600 mt-3 cursor-pointer">
        View / Download
      </p>
    </div>

    <button className="bg-[#4f6ee8] text-white px-5 py-3 rounded-xl h-fit">
      Upload Document
    </button>

  </div>
)}

    </div>
  );
}