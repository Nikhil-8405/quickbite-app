
export default function HomePage() {
  return (
    <div className="bg-orange-50 text-gray-800 min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="w-full flex justify-between items-center py-6 px-14">
        {/* Logo */}
        <div
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => (window.location.href = "/")}
        >
          <div className="bg-orange-500 text-white px-2 py-1 rounded text-lg font-bold">
            🍴
          </div>
          <span className="text-2xl font-bold text-gray-900">QuickBite</span>
        </div>

        {/* Auth Buttons */}
        <div className="space-x-4">
          <button
            onClick={() => (window.location.href = "/login")}
            className="text-gray-700 hover:text-orange-500 font-medium transition"
          >
            Login
          </button>
          <button
            onClick={() => (window.location.href = "/register")}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium shadow transition"
          >
            Register
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="text-center py-24 px-6 -mt-10">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">
          Delicious Food,{" "}
          <span className="text-orange-500">Delivered Fast</span>
        </h1>
        <p className="text-lg md:text-xl mb-10 text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Discover amazing restaurants near you and get your favorite meals
          delivered to your doorstep in minutes.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => (window.location.href = "/login")}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl text-lg font-semibold shadow-md transition"
          >
            Order Now
          </button>
        </div>
      </section>

      {/* Why QuickBite Section */}
      <section className="w-full px-14 py-6 -mt-10">
        <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">
          Why Choose QuickBite?
        </h2>
        <p className="text-center text-gray-700 text-lg mb-12">
          We make food delivery simple, fast, and delicious with our amazing
          features.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Lightning Fast */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-orange-100 hover:shadow-lg transition text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-orange-100 p-4 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-orange-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6l4 2m4-2a8 8 0 11-16 0 8 8 0 0116 0z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">
              Lightning Fast
            </h3>
            <p className="text-gray-600">
              Get your food delivered in 30 minutes or less with our efficient
              delivery network.
            </p>
          </div>

          {/* Top Quality */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-orange-100 hover:shadow-lg transition text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-orange-100 p-4 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-orange-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.042 6.29h6.615c.969 0 1.371 1.24.588 1.81l-5.354 3.89 2.042 6.29c.3.921-.755 1.688-1.538 1.118L12 17.75l-5.346 3.575c-.783.57-1.838-.197-1.538-1.118l2.042-6.29-5.354-3.89c-.783-.57-.38-1.81.588-1.81h6.615l2.042-6.29z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">
              Top Quality
            </h3>
            <p className="text-gray-600">
              Fresh ingredients and top-quality food from trusted restaurant
              partners.
            </p>
          </div>

          {/* Easy Ordering */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-orange-100 hover:shadow-lg transition text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-orange-100 p-4 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-orange-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <rect
                    x="8"
                    y="3"
                    width="8"
                    height="14"
                    rx="2"
                    ry="2"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="20"
                    r="1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">
              Easy Ordering
            </h3>
            <p className="text-gray-600">
              Simple and intuitive ordering process for a seamless experience
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-orange-500 text-white py-6 text-center mt-auto">
        <p>&copy; 2025 QuickBite. Delivering happiness, one meal at a time.</p>
      </footer>
    </div>
  );
}
