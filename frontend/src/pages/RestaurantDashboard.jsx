// src/pages/RestaurantDashboard.jsx
import { useEffect, useState } from "react";

// ✅ Reusable Modal
function Modal({ show, onClose, title, message, onConfirm }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-sm p-4">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full">
        <h2 className="text-xl font-semibold mb-3">{title}</h2>
        <p className="text-gray-700 mb-4">{message}</p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
          >
            Cancel
          </button>
          {onConfirm ? (
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700"
            >
              Confirm
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700"
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RestaurantDashboard() {
  const [section, setSection] = useState("orders");
  const [restaurantName, setRestaurantName] = useState("");
  const [orders, setOrders] = useState([]);
  const [report, setReport] = useState(null);
  const [menu, setMenu] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", description: "", price: "" });

  // ✅ Edit state
  const [editItem, setEditItem] = useState(null);

  // ✅ Modal State
  const [modal, setModal] = useState({ show: false, title: "", message: "" });
  const openModal = (title, message) => setModal({ show: true, title, message });
  const closeModal = () => setModal({ show: false, title: "", message: "" });

  const restaurantId = localStorage.getItem("restaurant_id");

  useEffect(() => {
    if (!restaurantId) {
      openModal("Error", "No restaurant linked to this account.");
      setTimeout(() => (window.location.href = "/login"), 1500);
    } else {
      fetch(`/api/restaurant/details/${restaurantId}`)
        .then((res) => res.json())
        .then((data) => setRestaurantName(data.name));
      loadOrders();
    }
  }, []);

  // ✅ Orders
  const loadOrders = async () => {
    setSection("orders");
    const res = await fetch(`/api/restaurant/orders/${restaurantId}`);
    const data = await res.json();
    setOrders(data);
  };

  const updateStatus = async (orderId, newStatus) => {
    if (!newStatus) return;
    const res = await fetch(`/api/restaurant/update-status/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      openModal("Success", "Order status updated!");
      loadOrders();
    } else {
      openModal("Error", "Failed to update status");
    }
  };

  // ✅ Report
  const loadReport = async () => {
    setSection("report");
    const res = await fetch(`/api/restaurant/report/${restaurantId}`);
    const data = await res.json();
    setReport(data);
  };

  // ✅ Menu
  const loadMenu = async () => {
    setSection("menu");
    const res = await fetch(`/api/restaurant/menu/${restaurantId}`);
    const data = await res.json();
    setMenu(data);
  };

  const addItem = async () => {
    if (!newItem.name || isNaN(newItem.price)) {
      return openModal("Warning", "Provide valid name and price.");
    }
    const res = await fetch("/api/restaurant/add-item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurant_id: restaurantId, ...newItem }),
    });
    if (res.ok) {
      openModal("Success", "Item added successfully!");
      setNewItem({ name: "", description: "", price: "" });
      loadMenu();
    } else {
      openModal("Error", "Failed to add item.");
    }
  };

  const deleteItem = async (id) => {
    const res = await fetch(`/api/restaurant/delete-item/${id}`, { method: "DELETE" });
    if (res.ok) {
      openModal("Success", "Item deleted successfully!");
      loadMenu();
    } else {
      openModal("Error", "Failed to delete item.");
    }
  };

  // ✅ Update item
  const updateItem = async () => {
    if (!editItem.name || isNaN(editItem.price)) {
      return openModal("Warning", "Provide valid name and price.");
    }

    const res = await fetch(`/api/restaurant/update-item/${editItem.menu_item_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editItem.name,
        description: editItem.description,
        price: editItem.price,
      }),
    });

    if (res.ok) {
      openModal("Success", "Item updated successfully!");
      setEditItem(null);
      loadMenu();
    } else {
      openModal("Error", "Failed to update item.");
    }
  };

  // ✅ Logout
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const logout = () => setLogoutConfirm(true);
  const confirmLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className="bg-gray-100 min-h-screen text-gray-800">
      {/* Navbar */}
      <header className="bg-orange-600 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            Welcome, {restaurantName || "Restaurant"}!
          </h1>
          <nav className="space-x-3">
            <button
              onClick={loadOrders}
              className="bg-white text-orange-600 px-4 py-2 rounded-lg shadow hover:bg-gray-100"
            >
              📦 Orders
            </button>
            <button
              onClick={loadReport}
              className="bg-white text-orange-600 px-4 py-2 rounded-lg shadow hover:bg-gray-100"
            >
              📊 Report
            </button>
            <button
              onClick={loadMenu}
              className="bg-white text-orange-600 px-4 py-2 rounded-lg shadow hover:bg-gray-100"
            >
              🍴 Menu
            </button>
            <button
              onClick={logout}
              className="bg-white text-orange-600 px-4 py-2 rounded-lg shadow hover:bg-gray-100"
            >
              🚪 Logout
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        <div className="bg-white p-6 rounded-2xl shadow-md">
          {/* Orders Section */}
          {section === "orders" && (
            <>
              <h2 className="text-xl font-semibold mb-4">Orders</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-orange-600 text-white">
                    <tr>
                      <th className="px-4 py-2">ID</th>
                      <th className="px-4 py-2">Customer</th>
                      <th className="px-4 py-2">Items</th>
                      <th className="px-4 py-2">Total</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Time</th>
                      <th className="px-4 py-2">Update</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.order_id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">{order.order_id}</td>
                        <td className="px-4 py-2">{order.customer}</td>
                        <td className="px-4 py-2">
                          {order.items.length > 0 ? order.items.join(", ") : "No items"}
                        </td>
                        <td className="px-4 py-2">₹{order.total_amount}</td>
                        <td className="px-4 py-2">{order.status}</td>
                        <td className="px-4 py-2">
                          {new Date(order.order_time).toLocaleString()}
                        </td>
                        <td className="px-4 py-2">
                          <select
                            onChange={(e) => updateStatus(order.order_id, e.target.value)}
                            className="border rounded px-2 py-1"
                            disabled={order.status === "Delivered"}
                          >
                            <option value="">--Change--</option>
                            <option value="Accepted">Accepted</option>
                            <option value="Preparing">Preparing</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Report Section */}
          {section === "report" && report && (
            <>
              <h2 className="text-xl font-semibold mb-4">Report</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg shadow">
                  <p className="text-gray-500">Total Orders</p>
                  <p className="text-2xl font-bold">{report.total_orders || 0}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg shadow">
                  <p className="text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold">
                    ₹{Number(report.total_revenue || 0).toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg shadow">
                  <p className="text-gray-500">Commission</p>
                  <p className="text-2xl font-bold">
                    ₹{Number(report.total_commission || 0).toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg shadow">
                  <p className="text-gray-500">Net Earnings</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{Number(report.net_earnings || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Menu Section */}
          {section === "menu" && (
            <>
              <h2 className="text-xl font-semibold mb-4">Menu</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden mb-6">
                  <thead className="bg-orange-600 text-white">
                    <tr>
                      <th className="px-4 py-2">Name</th>
                      <th className="px-4 py-2">Description</th>
                      <th className="px-4 py-2">Price</th>
                      <th className="px-4 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {menu.map((it) => (
                      <tr key={it.menu_item_id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">{it.name}</td>
                        <td className="px-4 py-2">{it.description || "-"}</td>
                        <td className="px-4 py-2">₹{it.price}</td>
                        <td className="px-4 py-2 space-x-3">
                          <button
                            onClick={() => setEditItem(it)}
                            className="text-blue-500 hover:underline"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => deleteItem(it.menu_item_id)}
                            className="text-red-500 hover:underline"
                          >
                            ❌ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add new item */}
              <h3 className="text-lg font-semibold mb-2">Add New Item</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Name"
                  className="border rounded px-3 py-2 flex-1"
                />
                <input
                  value={newItem.description}
                  onChange={(e) =>
                    setNewItem({ ...newItem, description: e.target.value })
                  }
                  placeholder="Description"
                  className="border rounded px-3 py-2 flex-1"
                />
                <input
                  type="number"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  placeholder="Price"
                  className="border rounded px-3 py-2 w-32"
                />
                <button
                  onClick={addItem}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700"
                >
                  Add
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Normal info/error modal */}
      <Modal
        show={modal.show}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
      />

      {/* Logout confirmation modal */}
      <Modal
        show={logoutConfirm}
        onClose={() => setLogoutConfirm(false)}
        title="Confirm Logout"
        message="Are you sure you want to logout?"
        onConfirm={confirmLogout}
      />

      {/* Edit item modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full">
            <h2 className="text-xl font-semibold mb-3">Edit Menu Item</h2>

            <input
              value={editItem.name}
              onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
              className="w-full border rounded px-3 py-2 mb-2"
              placeholder="Name"
            />
            <input
              value={editItem.description}
              onChange={(e) =>
                setEditItem({ ...editItem, description: e.target.value })
              }
              className="w-full border rounded px-3 py-2 mb-2"
              placeholder="Description"
            />
            <input
              type="number"
              value={editItem.price}
              onChange={(e) =>
                setEditItem({ ...editItem, price: e.target.value })
              }
              className="w-full border rounded px-3 py-2 mb-4"
              placeholder="Price"
            />

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setEditItem(null)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={updateItem}
                className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
