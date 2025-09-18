// frontend/src/pages/CustomerDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id");
  const role = localStorage.getItem("role");

  const [customerName, setCustomerName] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [menu, setMenu] = useState([]);
  const [qtys, setQtys] = useState({}); // { menu_item_id: qty }
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [currentRestaurantId, setCurrentRestaurantId] = useState(null);
  const [currentRestaurantName, setCurrentRestaurantName] = useState("");
  const [view, setView] = useState("restaurants"); // restaurants | menu | orders

  // Modals / dialogs
  const [billPreviewOpen, setBillPreviewOpen] = useState(false);
  const [billDetails, setBillDetails] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [successModal, setSuccessModal] = useState({ open: false, text: "" });

  const [orderBillOpen, setOrderBillOpen] = useState(false);
  const [orderBillData, setOrderBillData] = useState(null);

  const [errorDialog, setErrorDialog] = useState({ open: false, title: "", message: "" });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", message: "", onConfirm: null });

  // Helpers
  const formatINR = (amt) => {
    try {
      return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(amt));
    } catch {
      return `₹${Number(amt).toFixed(2)}`;
    }
  };

  // Auth check + load basic data
  useEffect(() => {
    if (!userId || role !== "customer") {
      // not logged in as customer
      navigate("/login");
      return;
    }
    fetch("/api/customer/details/" + userId)
      .then((r) => r.json())
      .then((d) => setCustomerName(d.name || "Customer"))
      .catch(() => setCustomerName("Customer"));

    loadRestaurants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load restaurants
  async function loadRestaurants() {
    try {
      const res = await fetch("/api/customer/restaurants");
      if (!res.ok) throw new Error("Failed to load restaurants");
      const data = await res.json();
      setRestaurants(data || []);
      setMenu([]);
      setCart([]);
      setView("restaurants");
      setCurrentRestaurantId(null);
      setCurrentRestaurantName("");
    } catch (err) {
      showError("Load error", err.message || "Could not load restaurants");
    }
  }

  // Load menu for a restaurant
  async function loadMenu(restaurantId, restaurantName) {
    try {
      const res = await fetch(`/api/customer/menu/${restaurantId}`);
      if (!res.ok) throw new Error("Failed to load menu");
      const items = await res.json();
      setMenu(items || []);
      // default qtys to 1
      const initialQtys = {};
      (items || []).forEach((it) => (initialQtys[it.menu_item_id] = 1));
      setQtys(initialQtys);

      setCurrentRestaurantId(restaurantId);
      setCurrentRestaurantName(restaurantName || "");
      setView("menu");
    } catch (err) {
      showError("Load error", err.message || "Could not load menu");
    }
  }

  // Cart actions
  function addToCart(menuItem) {
    const qty = Number(qtys[menuItem.menu_item_id] || 1);
    if (qty <= 0) return showError("Invalid qty", "Quantity must be at least 1");
    setCart((prev) => {
      const existing = prev.find((c) => c.menu_item_id === menuItem.menu_item_id);
      if (existing) {
        return prev.map((c) =>
          c.menu_item_id === menuItem.menu_item_id ? { ...c, quantity: c.quantity + qty } : c
        );
      }
      return [...prev, { ...menuItem, quantity: qty }];
    });
  }

  function changeCartQty(menu_item_id, delta) {
    setCart((prev) =>
      prev
        .map((c) => (c.menu_item_id === menu_item_id ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  }

  function removeFromCart(menu_item_id) {
    setCart((prev) => prev.filter((c) => c.menu_item_id !== menu_item_id));
  }

  function clearCart() {
    setConfirmDialog({
      open: true,
      title: "Clear cart?",
      message: "Are you sure you want to clear the cart?",
      onConfirm: () => {
        setCart([]);
        setConfirmDialog({ open: false });
      },
    });
  }

  // compute bill details from cart
  function computeBill(cartItems) {
    const subtotal = cartItems.reduce((s, it) => s + Number(it.price) * Number(it.quantity), 0);
    const platformFee = Number((subtotal * 0.05).toFixed(2));
    const taxableBase = subtotal + platformFee;
    const cgst = Number((taxableBase * 0.09).toFixed(2));
    const sgst = Number((taxableBase * 0.09).toFixed(2));
    const grandTotal = Number((taxableBase + cgst + sgst).toFixed(2));
    return { items: cartItems, subtotal, platformFee, cgst, sgst, grandTotal };
  }

  // Open Bill Preview modal
  function openBillPreview() {
    if (!currentRestaurantId) return showError("No restaurant", "Select a restaurant first.");
    if (!cart.length) return showError("Empty cart", "Add items to cart before placing order.");
    const bill = computeBill(cart);
    setBillDetails(bill);
    setBillPreviewOpen(true);
  }

  // Mock payment & confirm order
  async function payAndConfirm() {
    if (!billDetails) return;
    setPaymentProcessing(true);

    try {
      // simulate payment delay
      await new Promise((res) => setTimeout(res, 800));

      // Build payload expected by backend
      const payload = {
        user_id: userId,
        restaurant_id: currentRestaurantId,
        items: cart.map((it) => ({
          menu_item_id: it.menu_item_id,
          quantity: it.quantity,
          price: it.price,
          name: it.name,
        })),
        payment: {
          method: "mock",
          status: "paid",
          amount: billDetails.grandTotal,
        },
      };

      const res = await fetch("/api/customer/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Order failed");

      // success
      setPaymentProcessing(false);
      setBillPreviewOpen(false);
      setCart([]);
      setSuccessModal({ open: true, text: `Order placed successfully (ID: ${data.order_id || "—"})` });
      // refresh orders
      loadOrders();
    } catch (err) {
      setPaymentProcessing(false);
      showError("Payment / Order failed", err.message || "Something went wrong");
    }
  }

  // Orders
  async function loadOrders() {
    try {
      const res = await fetch(`/api/customer/orders/${userId}`);
      if (!res.ok) throw new Error("Failed to load orders");
      const data = await res.json();
      setOrders(data || []);
      setView("orders");
    } catch (err) {
      showError("Load error", err.message || "Could not load orders");
    }
  }

  // View Bill for an order (modal)
  async function viewBill(orderId) {
    try {
      const headRes = await fetch(`/api/customer/order/${orderId}`);
      if (!headRes.ok) throw new Error("Could not load order header");
      const head = await headRes.json();

      const itemsRes = await fetch(`/api/customer/bill/${orderId}`);
      const items = itemsRes.ok ? await itemsRes.json() : [];

      const subtotal = Number(head.total_amount) || 0;
      const platformFee = Number(head.platform_fee) || Number((subtotal * 0.05).toFixed(2));
      const taxableBase = subtotal + platformFee;
      const cgst = Number((taxableBase * 0.09).toFixed(2));
      const sgst = Number((taxableBase * 0.09).toFixed(2));
      const grandTotal = Number((taxableBase + cgst + sgst).toFixed(2));

      setOrderBillData({ head, items, totals: { subtotal, platformFee, cgst, sgst, grandTotal } });
      setOrderBillOpen(true);
    } catch (err) {
      showError("Load error", err.message || "Could not load bill");
    }
  }

  // Logout with confirm
  function confirmLogout() {
    setConfirmDialog({
      open: true,
      title: "Logout",
      message: "Do you want to logout?",
      onConfirm: () => {
        localStorage.clear();
        navigate("/login");
      },
    });
  }

  // Generic error dialog
  function showError(title, message) {
    setErrorDialog({ open: true, title: title || "Error", message: message || "" });
  }

  // UI pieces
  function MenuTable() {
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white rounded-xl shadow">
          <thead className="bg-orange-100 text-orange-700">
            <tr>
              <th className="p-3 text-left">Item</th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3">Price</th>
              <th className="p-3">Qty</th>
              <th className="p-3">Add</th>
            </tr>
          </thead>
          <tbody>
            {menu.map((it) => (
              <tr key={it.menu_item_id} className="border-t">
                <td className="p-3 font-medium text-gray-800">{it.name}</td>
                <td className="p-3 text-gray-600">{it.description || "-"}</td>
                <td className="p-3">₹{it.price}</td>
                <td className="p-3">
                  <input
                    type="number"
                    min="1"
                    value={qtys[it.menu_item_id] ?? 1}
                    onChange={(e) => setQtys((q) => ({ ...q, [it.menu_item_id]: Math.max(1, Number(e.target.value) || 1) }))}
                    className="w-20 border rounded p-1"
                  />
                </td>
                <td className="p-3">
                  <button
                    onClick={() => addToCart(it)}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Add
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function CartPanel() {
    const total = cart.reduce((s, it) => s + Number(it.price) * it.quantity, 0);
    return (
      <div className="mt-6 bg-white rounded-xl shadow p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">🛒 Your Cart</h3>
          <div className="flex gap-2">
            <button onClick={clearCart} className="px-3 py-1 border rounded hover:bg-gray-50">
              Clear
            </button>
            <button
              onClick={openBillPreview}
              disabled={!cart.length}
              className={`px-3 py-1 rounded transition ${
                cart.length
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Preview & Pay
            </button>
          </div>
        </div>

        {cart.length === 0 ? (
          <p className="text-gray-600">Cart is empty</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-green-50 text-green-700">
                  <tr>
                    <th className="p-2 text-left">Item</th>
                    <th className="p-2">Qty</th>
                    <th className="p-2 text-right">Price</th>
                    <th className="p-2 text-right">Total</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((it) => (
                    <tr key={it.menu_item_id} className="border-t">
                      <td className="p-2">{it.name}</td>
                      <td className="p-2 text-center">
                        <div className="inline-flex items-center gap-2">
                          <button onClick={() => changeCartQty(it.menu_item_id, -1)} className="px-2 border rounded">-</button>
                          <span>{it.quantity}</span>
                          <button onClick={() => changeCartQty(it.menu_item_id, 1)} className="px-2 border rounded">+</button>
                        </div>
                      </td>
                      <td className="p-2 text-right">₹{it.price}</td>
                      <td className="p-2 text-right">₹{(it.price * it.quantity).toFixed(2)}</td>
                      <td className="p-2 text-center">
                        <button onClick={() => removeFromCart(it.menu_item_id)} className="text-red-500">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-between items-center">
              <div className="font-semibold">Subtotal: {formatINR(total)}</div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Platform fee + GST applied at checkout</div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-orange-600 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Welcome, {customerName || "Customer"}!</h1>
          <nav className="space-x-3">
            <button onClick={loadRestaurants} className="bg-white text-orange-600 px-4 py-2 rounded-lg shadow hover:bg-gray-100 transition">🍽️ Browse Restaurants</button>
            <button onClick={loadOrders} className="bg-white text-orange-600 px-4 py-2 rounded-lg shadow hover:bg-gray-100 transition">🧾 My Orders</button>
            <button onClick={confirmLogout} className="bg-white text-orange-600 px-4 py-2 rounded-lg shadow hover:bg-gray-100 transition">🚪 Logout</button>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Restaurants */}
        {view === "restaurants" && (
          <section>
            <h3 className="text-2xl font-bold text-gray-700 mb-4">Restaurants</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((r) => (
                <div key={r.restaurant_id} className="bg-white rounded-xl shadow p-5 flex flex-col justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-orange-600">{r.name}</h4>
                    <p className="text-sm text-gray-600 mb-4">{r.address}</p>
                  </div>
                  <button onClick={() => loadMenu(r.restaurant_id, r.name)} className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg transition">
                    View Menu
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Menu + Cart (cart shown below menu) */}
        {view === "menu" && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-700">Menu — {currentRestaurantName}</h3>
              <div className="text-sm text-gray-600">Browsing menu</div>
            </div>

            <MenuTable />

            {/* Cart shown below menu */}
            <CartPanel />
          </section>
        )}

        {/* Orders list with View Bill buttons */}
        {view === "orders" && (
          <section>
            <h3 className="text-2xl font-bold text-gray-700 mb-4">My Orders</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-xl shadow">
                <thead className="bg-orange-100 text-orange-700">
                  <tr>
                    <th className="p-3">Order ID</th>
                    <th className="p-3">Restaurant</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Time</th>
                    <th className="p-3">Bill</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.order_id} className="border-t">
                      <td className="p-3">{o.order_id}</td>
                      <td className="p-3">{o.restaurant}</td>
                      <td className="p-3">₹{o.total_amount}</td>
                      <td className="p-3">{o.status}</td>
                      <td className="p-3">{new Date(o.order_time).toLocaleString()}</td>
                      <td className="p-3">
                        <button onClick={() => viewBill(o.order_id)} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded">View Bill</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* Bill Preview Modal */}
      {billPreviewOpen && billDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Confirm Your Order</h3>
              <button onClick={() => setBillPreviewOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <div className="mb-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">Item</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Price</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {billDetails.items.map((it) => (
                    <tr key={it.menu_item_id}>
                      <td className="p-2">{it.name}</td>
                      <td className="p-2 text-center">{it.quantity}</td>
                      <td className="p-2 text-right">{formatINR(it.price)}</td>
                      <td className="p-2 text-right">{formatINR(it.price * it.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-right space-y-1 mb-4">
              <div>Subtotal: {formatINR(billDetails.subtotal)}</div>
              <div>Platform Fee (5%): {formatINR(billDetails.platformFee)}</div>
              <div>CGST (9%): {formatINR(billDetails.cgst)}</div>
              <div>SGST (9%): {formatINR(billDetails.sgst)}</div>
              <div className="font-bold mt-2">Grand Total: {formatINR(billDetails.grandTotal)}</div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setBillPreviewOpen(false)} className="flex-1 py-2 border rounded hover:bg-gray-50">Cancel</button>
              <button onClick={payAndConfirm} disabled={paymentProcessing} className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                {paymentProcessing ? "Processing..." : "💳 Pay & Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Bill Modal */}
      {orderBillOpen && orderBillData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-sm p-4">

          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Bill — Order #{orderBillData.head.order_id}</h3>
              <button onClick={() => setOrderBillOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <p className="text-sm text-gray-600 mb-3">Restaurant: {orderBillData.head.restaurant} • Placed: {new Date(orderBillData.head.order_time).toLocaleString()}</p>

            <div className="mb-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">Item</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Price</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orderBillData.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2">{it.name}</td>
                      <td className="p-2 text-center">{it.quantity}</td>
                      <td className="p2 text-right">{formatINR(it.price)}</td>
                      <td className="p-2 text-right">{formatINR(Number(it.price) * Number(it.quantity))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-right space-y-1">
              <div>Subtotal: {formatINR(orderBillData.totals.subtotal)}</div>
              <div>Platform Fee: {formatINR(orderBillData.totals.platformFee)}</div>
              <div>CGST (9%): {formatINR(orderBillData.totals.cgst)}</div>
              <div>SGST (9%): {formatINR(orderBillData.totals.sgst)}</div>
              <div className="font-bold mt-2">Grand Total: {formatINR(orderBillData.totals.grandTotal)}</div>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => setOrderBillOpen(false)} className="w-full py-2 border rounded hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm text-center">
            <h4 className="text-lg font-bold mb-2">Success</h4>
            <p className="mb-4">{successModal.text}</p>
            <button onClick={() => setSuccessModal({ open: false, text: "" })} className="px-4 py-2 bg-orange-500 text-white rounded">OK</button>
          </div>
        </div>
      )}

      {/* Error Dialog */}
      {errorDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
            <h4 className="text-lg font-bold mb-2">{errorDialog.title}</h4>
            <p className="mb-4 text-sm text-gray-700">{errorDialog.message}</p>
            <div className="flex justify-end">
              <button onClick={() => setErrorDialog({ open: false })} className="px-4 py-2 border rounded">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
            <h4 className="text-lg font-bold mb-2">{confirmDialog.title}</h4>
            <p className="mb-4 text-sm text-gray-700">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDialog({ open: false })} className="px-4 py-2 border rounded">Cancel</button>
              <button
                onClick={() => {
                  const cb = confirmDialog.onConfirm;
                  setConfirmDialog({ open: false });
                  if (typeof cb === "function") cb();
                }}
                className="px-4 py-2 bg-amber-500 text-white rounded"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
