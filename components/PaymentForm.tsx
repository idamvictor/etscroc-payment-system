"use client";

import { useState } from "react";
import { courses } from "@/lib/registration-options";

interface PaymentFormData {
  firstName: string;
  lastName: string;
  course: string;
  email: string;
}

const FIXED_AMOUNT = 35675;

export default function PaymentForm() {
  const [formData, setFormData] = useState<PaymentFormData>({
    firstName: "",
    lastName: "",
    course: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/initialize-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, amount: FIXED_AMOUNT }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Payment initialization failed");
      }

      // Redirect to Paystack payment page
      if (data.data && data.data.authorization_url) {
        window.location.href = data.data.authorization_url;
      } else {
        throw new Error("Invalid response from payment service");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-blue/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-brand-orange/10 blur-3xl" />

      <div className="relative w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="relative overflow-hidden border-b border-brand-orange bg-linear-to-br from-orange-50 via-white to-orange-50 p-8">
          <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-brand-orange/15 blur-2xl" />

          <span className="relative inline-flex items-center gap-1.5 rounded-full bg-brand-orange-dark px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
            Etscroc Tech and Business Agency
          </span>

          <h1 className="relative text-3xl font-extrabold text-gray-900 tracking-tight mt-3">
            Pay for Course
          </h1>
          <p className="relative text-sm text-gray-600 leading-relaxed mt-3">
            Complete your enrollment securely
          </p>
        </div>

        {/* Form Container */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* First Name */}
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-semibold text-gray-800 mb-2"
              >
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="John"
              />
            </div>

            {/* Last Name */}
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-semibold text-gray-800 mb-2"
              >
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="Doe"
              />
            </div>

            {/* Course Selection */}
            <div>
              <label
                htmlFor="course"
                className="block text-sm font-semibold text-gray-800 mb-2"
              >
                Select Course
              </label>
              <select
                id="course"
                name="course"
                value={formData.course}
                onChange={handleChange}
                required
                className={inputClass}
              >
                <option value="">Choose a course</option>
                {courses.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-800 mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="john@example.com"
              />
            </div>

            {/* Price Display */}
            {formData.course && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-gray-600">Course Price:</p>
                <p className="text-2xl font-bold text-brand-orange-dark">
                  ₦{FIXED_AMOUNT.toLocaleString()}
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm text-emerald-700 font-medium">
                  {success}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-brand-orange-dark to-brand-orange hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-300 transform hover:scale-105 disabled:hover:scale-100 mt-6"
            >
              {loading ? "Processing…" : "Pay"}
            </button>

            {/* Secured By Paystack */}
            <div className="text-center mt-6 text-xs text-gray-500">
              <p>
                🔒 Secured by{" "}
                <span className="font-semibold text-gray-700">Paystack</span>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full px-4 py-3 bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none transition";
