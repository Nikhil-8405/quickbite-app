// frontend/src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import {Chart as ChartJS, ArcElement, Tooltip, Legend, Title, CategoryScale, LinearScale, BarElement,} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend, Title,CategoryScale,LinearScale,BarElement);

export default function AdminDashboard() {
  const [view, setView] = useState("report");
  const [restaurants, setRestaurants] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [report, setReport] = useState([]);

  // Logout modal state
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  const fmtINR = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(Number(value || 0));

  useEffect(() => {
    if (view === "restaurants") fetchRestaurants();
    if (view === "users") fetchUsers();
    if (view === "orders") fetchOrders();
    if (view === "report") fetchReport();
  }, [view]);

  async function fetchRestaurants() {
    const res = await fetch("/api/admin/restaurants");
    setRestaurants(await res.json());
  }

  async function fetchUsers() {
    const res = await fetch("/api/admin/users");
    setUsers(await res.json());
  }

  async function fetchOrders() {
    const res = await fetch("/api/admin/orders");
    setOrders(await res.json());
  }

  async function fetchReport() {
    const res = await fetch("/api/admin/report");
    setReport(await res.json());
  }

  async function updateStatus(orderId, newStatus) {
    if (!newStatus) return;
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      fetchOrders();
    }
  }

  function confirmLogout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/login";
  }

  const orderStatusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const reportTotals = report.reduce(
    (acc, r) => {
      acc.totalOrders += Number(r.total_orders) || 0;
      acc.totalRevenue += parseFloat(r.total_revenue) || 0;
      acc.totalPlatform += parseFloat(r.total_platform_fee) || 0;
      acc.totalCommission += parseFloat(r.total_restaurant_commission) || 0;
      acc.totalAdminEarnings += parseFloat(r.admin_earnings) || 0;
      return acc;
    },
    {
      totalOrders: 0,
      totalRevenue: 0,
      totalPlatform: 0,
      totalCommission: 0,
      totalAdminEarnings: 0,
    }
  );

  return (
    <div className="bg-gray-100 min-h-screen text-gray-800">
      {/* Navbar */}
      <header className="bg-gray-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold"> Admin Dashboard</h1>
          <nav className="space-x-3">
            <button
              onClick={() => setView("restaurants")}
              className="bg-white text-gray-900 px-4 py-2 rounded-lg shadow hover:bg-gray-100"
            >
              🏢 Restaurants
            </button>
            <button
              onClick={() => setView("users")}
              className="bg-white text-gray-900 px-4 py-2 rounded-lg shadow hover:bg-gray-100"
            >
              👥 Users
            </button>
            <button
              onClick={() => setView("orders")}
              className="bg-white text-gray-900 px-4 py-2 rounded-lg shadow hover:bg-gray-100"
            >
              📦 Orders
            </button>
            <button
              onClick={() => setView("report")}
              className="bg-white text-gray-900 px-4 py-2 rounded-lg shadow hover:bg-gray-100"
            >
              📊 Report
            </button>
            <button
              onClick={() => setLogoutConfirm(true)}
              className="bg-white text-gray-900 px-4 py-2 rounded-lg shadow hover:bg-gray-100"
            >
              🚪 Logout
            </button>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="bg-white p-6 rounded-2xl shadow-md min-h-[400px]">
          {/* Restaurants */}
          {view === "restaurants" && (
            <>
              <h2 className="text-xl font-semibold mb-6">Restaurants</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {restaurants.map((r) => (
                  <div
                    key={r.restaurant_id}
                    className="border rounded-lg p-4 shadow hover:shadow-lg transition"
                  >
                    <h3 className="font-bold text-lg mb-2">{r.name}</h3>
                    <p className="text-gray-700">
                      <strong>ID:</strong> {r.restaurant_id}
                    </p>
                    <p className="text-gray-600">{r.address}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Users */}
          {view === "users" && (
            <>
              <h2 className="text-xl font-semibold mb-6">Users</h2>
              <ul className="space-y-4">
                {users.map((u) => (
                  <li
                    key={u.user_id}
                    className="border rounded-lg p-4 shadow hover:shadow-lg transition flex flex-col sm:flex-row sm:justify-between"
                  >
                    <div>
                      <p>
                        <strong>ID:</strong> {u.user_id}
                      </p>
                      <p>
                        <strong>Name:</strong> {u.name}
                      </p>
                      <p>
                        <strong>Email:</strong> {u.email}
                      </p>
                    </div>
                    <div className="mt-2 sm:mt-0 text-right">
                      <p>
                        <strong>Role:</strong> {u.role}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
          {/* Orders */}
          {view === "orders" && (
            <>
              <h2 className="text-xl font-semibold mb-6">All Orders</h2>

              {/* Doughnut chart (slightly smaller, centered) */}
              <div className="flex justify-center mb-8">
                <div className="w-full max-w-md">
                  <Doughnut
                    data={{
                      labels: Object.keys(orderStatusCounts),
                      datasets: [
                        {
                          label: "Order Status",
                          data: Object.values(orderStatusCounts),
                          backgroundColor: [
                            "#3b82f6",
                            "#facc15",
                            "#10b981",
                            "#ef4444",
                          ],
                          hoverOffset: 30,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      animation: { animateRotate: true, animateScale: true },
                      plugins: {
                        legend: { position: "bottom" },
                        title: {
                          display: true,
                          text: "Order Status Distribution",
                        },
                      },
                    }}
                  />
                </div>
              </div>

              {/* Orders grid - 3 cards per row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {orders.map((order) => (
                  <div
                    key={order.order_id}
                    className="border rounded-lg p-4 shadow hover:shadow-lg transition"
                  >
                    <p><strong>Order ID:</strong> {order.order_id}</p>
                    <p><strong>Customer:</strong> {order.customer}</p>
                    <p><strong>Restaurant:</strong> {order.restaurant}</p>
                    <p><strong>Items:</strong> {order.items.length > 0 ? order.items.join(", ") : "No items"}</p>
                    <p><strong>Total:</strong> {fmtINR(order.total_amount)}</p>
                    <p><strong>Status:</strong> <span className="font-semibold">{order.status}</span></p>
                    <p><strong>Time:</strong> {new Date(order.order_time).toLocaleString()}</p>

                    <select
                      onChange={(e) => updateStatus(order.order_id, e.target.value)}
                      className="border rounded px-2 py-1 w-full mt-2"
                      disabled={order.status === "Delivered"}
                    >
                      <option value="">--Change Status--</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Preparing">Preparing</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Report */}
          {view === "report" && (
            <>
              <h2 className="text-xl font-semibold mb-6">System Report</h2>

              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-blue-100 p-4 rounded-lg shadow text-center">
                  <p className="text-sm font-semibold">Total Orders</p>
                  <p className="text-2xl font-bold">
                    {reportTotals.totalOrders}
                  </p>
                </div>
                <div className="bg-green-100 p-4 rounded-lg shadow text-center">
                  <p className="text-sm font-semibold">Total Revenue</p>
                  <p className="text-2xl font-bold">
                    {fmtINR(reportTotals.totalRevenue)}
                  </p>
                </div>
                <div className="bg-yellow-100 p-4 rounded-lg shadow text-center">
                  <p className="text-sm font-semibold">Platform Fee</p>
                  <p className="text-2xl font-bold">
                    {fmtINR(reportTotals.totalPlatform)}
                  </p>
                </div>
                <div className="bg-purple-100 p-4 rounded-lg shadow text-center">
                  <p className="text-sm font-semibold">Commission</p>
                  <p className="text-2xl font-bold">
                    {fmtINR(reportTotals.totalCommission)}
                  </p>
                </div>
                <div className="bg-pink-100 p-4 rounded-lg shadow text-center">
                  <p className="text-sm font-semibold">Admin Earnings</p>
                  <p className="text-2xl font-bold">
                    {fmtINR(reportTotals.totalAdminEarnings)}
                  </p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="w-full h-80 bg-white p-4 rounded-xl shadow">
                  <Bar
                    data={{
                      labels: report.map((r) => r.restaurant),
                      datasets: [
                        {
                          label: "Total Orders",
                          data: report.map(
                            (r) => Number(r.total_orders) || 0
                          ),
                          backgroundColor: "#3b82f6",
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        title: {
                          display: true,
                          text: "Total Orders per Restaurant",
                        },
                      },
                      scales: { y: { beginAtZero: true } },
                    }}
                  />
                </div>

                <div className="w-full h-80 bg-white p-4 rounded-xl shadow">
                  <Bar
                    data={{
                      labels: report.map((r) => r.restaurant),
                      datasets: [
                        {
                          label: "Revenue",
                          data: report.map(
                            (r) => parseFloat(r.total_revenue) || 0
                          ),
                          backgroundColor: "#10b981",
                        },
                        {
                          label: "Platform Fee",
                          data: report.map(
                            (r) => parseFloat(r.total_platform_fee) || 0
                          ),
                          backgroundColor: "#f59e0b",
                        },
                        {
                          label: "Commission",
                          data: report.map(
                            (r) => parseFloat(r.total_restaurant_commission) ||
                              0
                          ),
                          backgroundColor: "#8b5cf6",
                        },
                        {
                          label: "Admin Earnings",
                          data: report.map(
                            (r) => parseFloat(r.admin_earnings) || 0
                          ),
                          backgroundColor: "#ec4899",
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        title: {
                          display: true,
                          text: "Financials per Restaurant (₹)",
                        },
                      },
                      scales: { x: { stacked: true }, y: { stacked: true } },
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Logout confirm modal */}
      {logoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full">
            <h2 className="text-xl font-semibold mb-3">Confirm Logout</h2>
            <p className="text-gray-700 mb-4">
              Are you sure you want to logout?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setLogoutConfirm(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
