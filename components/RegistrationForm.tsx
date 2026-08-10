"use client";

import { useRef, useState } from "react";
import { Check, Copy, FileText, Landmark, Upload, X } from "lucide-react";
import {
  nlsCourses,
  NLS_CAMPUS,
  NLS_COURSE_PRICE,
} from "@/lib/registration-options";

interface RegistrationFormData {
  fullName: string;
  whatsappPhone: string;
  email: string;
  matricNumber: string;
  courses: string[];
  totalAmountPaid: string;
  paymentReference: string;
}

const ACCOUNT_NUMBER = "3004141504";

const initialFormData: RegistrationFormData = {
  fullName: "",
  whatsappPhone: "",
  email: "",
  matricNumber: "",
  courses: [],
  totalAmountPaid: "",
  paymentReference: "",
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function RegistrationForm() {
  const [formData, setFormData] = useState<RegistrationFormData>(initialFormData);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(ACCOUNT_NUMBER);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be blocked (e.g. insecure context); ignore.
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCourseToggle = (option: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      courses: checked
        ? [...prev.courses, option]
        : prev.courses.filter((c) => c !== option),
    }));
  };

  const handleFileSelect = (file: File | null) => {
    if (file) setReceiptFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files?.[0] ?? null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (formData.courses.length === 0) {
      setSubmitError("Please select at least one course.");
      return;
    }

    const amount = Number(formData.totalAmountPaid);
    if (!Number.isFinite(amount) || amount <= 0) {
      setSubmitError("Please enter a valid amount paid.");
      return;
    }

    if (!receiptFile) {
      setSubmitError("Please attach your payment evidence.");
      return;
    }

    const payload = new FormData();
    payload.append("fullName", formData.fullName);
    payload.append("whatsappPhone", formData.whatsappPhone);
    payload.append("email", formData.email);
    payload.append("matricNumber", formData.matricNumber);
    payload.append("campus", NLS_CAMPUS);
    formData.courses.forEach((course) => payload.append("courses", course));
    payload.append("totalAmountPaid", formData.totalAmountPaid);
    payload.append("paymentReference", formData.paymentReference);
    payload.append("receiptFile", receiptFile);

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        body: payload,
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        setSubmitError(
          body?.message ?? "Something went wrong. Please try again.",
        );
        return;
      }

      setSubmitted(true);
      setRegistrationId(body?.id ?? null);
      setFormData(initialFormData);
      setReceiptFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setSubmitError(
        "Network error — please check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative overflow-hidden">
      {/* Brand blue swoosh accent */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-blue/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-brand-orange/10 blur-3xl" />

      <div className="relative w-full max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="relative overflow-hidden border-b border-brand-orange bg-linear-to-br from-orange-50 via-white to-orange-50 p-8">
          <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-brand-orange/15 blur-2xl" />

          <span className="relative inline-flex items-center gap-1.5 rounded-full bg-brand-orange-dark px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
            Nigeria Law School × ETSCROC Tech
          </span>

          <h1 className="relative text-3xl font-extrabold text-gray-900 tracking-tight mt-3">
            Nigeria Law School × ETSCROC Tech Training Registration
          </h1>
          <p className="relative text-sm text-gray-600 leading-relaxed mt-3 max-w-md">
            Welcome to the Nigeria Law School × ETSCROC Tech Training
            Programme. Please complete this form after making payment.
            Ensure that the information provided matches your payment
            details.
          </p>
          <p className="relative text-sm font-semibold text-gray-800 mt-3">
            Course fee: ₦{NLS_COURSE_PRICE.toLocaleString()} per course.
          </p>
          <p className="relative text-xs font-semibold uppercase tracking-wide text-gray-500 mt-4">
            Available courses
          </p>
          <div className="relative flex flex-wrap gap-2 mt-2">
            {nlsCourses.map((course) => (
              <span
                key={course}
                className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-brand-orange-dark"
              >
                {course}
              </span>
            ))}
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <Field label="Full Name" htmlFor="fullName">
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                placeholder="John Doe"
                className={inputClass}
              />
            </Field>

            <Field label="WhatsApp Phone Number" htmlFor="whatsappPhone">
              <input
                type="tel"
                id="whatsappPhone"
                name="whatsappPhone"
                value={formData.whatsappPhone}
                onChange={handleChange}
                required
                placeholder="0800 000 0000"
                className={inputClass}
              />
            </Field>

            <Field label="Email Address" htmlFor="email">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="john@example.com"
                className={inputClass}
              />
            </Field>

            <Field
              label="Nigeria Law School Student ID / Matriculation Number"
              htmlFor="matricNumber"
            >
              <input
                type="text"
                id="matricNumber"
                name="matricNumber"
                value={formData.matricNumber}
                onChange={handleChange}
                required
                placeholder="e.g. NLS/2024/00123"
                className={inputClass}
              />
            </Field>

            <div>
              <p className="block text-sm font-semibold text-gray-800 mb-2">
                Campus
              </p>
              <div className={`${inputClass} bg-gray-50 text-gray-600`}>
                {NLS_CAMPUS}
              </div>
            </div>

            {/* Course selection */}
            <CheckboxGroup
              label="Which course(s) are you registering for?"
              name="courses"
              options={nlsCourses}
              value={formData.courses}
              onChange={handleCourseToggle}
              hint="₦50,000 per course. If you registered for multiple courses, select all applicable courses."
            />

            {/* Bank transfer details */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-brand-orange bg-linear-to-br from-orange-50 via-white to-orange-50 p-6 shadow-md">
              <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-brand-orange/15 blur-2xl" />

              <span className="relative inline-flex items-center gap-1.5 rounded-full bg-brand-orange-dark px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                <Landmark className="h-3.5 w-3.5" />
                Payment Required
              </span>

              {formData.courses.length > 0 ? (
                <>
                  <p className="relative text-sm font-medium text-gray-600 mt-4">
                    Amount to pay for {formData.courses.length}{" "}
                    {formData.courses.length === 1 ? "course" : "courses"}
                  </p>
                  <p className="relative text-4xl font-extrabold text-brand-orange-dark tracking-tight mt-1">
                    ₦
                    {(
                      formData.courses.length * NLS_COURSE_PRICE
                    ).toLocaleString()}
                  </p>
                </>
              ) : (
                <p className="relative text-sm font-medium text-gray-600 mt-4">
                  Select your course(s) above to see the amount to pay.
                </p>
              )}
              <p className="relative text-sm text-gray-600 mt-3">
                ₦{NLS_COURSE_PRICE.toLocaleString()} per course. Pay the total
                for all courses you&apos;re registering for to the account
                below, then upload your proof of payment.
              </p>

              <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-orange-200">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Bank
                  </p>
                  <p className="text-base font-bold text-gray-900 mt-0.5">
                    Kuda Bank
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Account Number
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-base font-bold text-gray-900 font-mono tracking-wide">
                      {ACCOUNT_NUMBER}
                    </p>
                    <button
                      type="button"
                      onClick={handleCopyAccountNumber}
                      className="p-1 rounded-md text-brand-orange-dark hover:bg-orange-100 transition"
                      aria-label="Copy account number"
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Account Name
                  </p>
                  <p className="text-base font-bold text-gray-900 mt-0.5">
                    Etscroc Tech and Business Agency Ltd
                  </p>
                </div>
              </div>

              <p className="relative text-xs text-gray-500 mt-4">
                Upload your proof of payment below after making the transfer.
              </p>
            </div>

            <Field label="Total Amount Paid" htmlFor="totalAmountPaid">
              <input
                type="number"
                id="totalAmountPaid"
                name="totalAmountPaid"
                value={formData.totalAmountPaid}
                onChange={handleChange}
                required
                min={NLS_COURSE_PRICE}
                step={NLS_COURSE_PRICE}
                inputMode="numeric"
                placeholder="Example: 50000, 100000 or 150000"
                className={inputClass}
              />
            </Field>

            <Field
              label="Payment Transaction Reference"
              htmlFor="paymentReference"
            >
              <input
                type="text"
                id="paymentReference"
                name="paymentReference"
                value={formData.paymentReference}
                onChange={handleChange}
                required
                placeholder="Enter the transaction/reference number on your receipt"
                className={inputClass}
              />
            </Field>

            {/* Payment evidence upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Upload Payment Evidence
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`cursor-pointer rounded-lg border-2 border-dashed transition p-6 text-center ${
                  isDragging
                    ? "border-brand-orange bg-orange-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                {receiptFile ? (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-between gap-3 text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-8 w-8 text-brand-orange shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-800 truncate">
                          {receiptFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(receiptFile.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <Upload className="h-8 w-8 text-brand-orange" />
                    <p className="text-sm">
                      <span className="text-brand-orange-dark font-medium">
                        Click to upload
                      </span>{" "}
                      or drag and drop your proof of payment
                    </p>
                    <p className="text-xs">PNG, JPG or PDF</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) =>
                    handleFileSelect(e.target.files?.[0] ?? null)
                  }
                />
              </div>
            </div>

            {submitted && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-brand-orange-dark font-medium">
                  Thanks! Your registration has been submitted successfully.
                </p>
                {registrationId && (
                  <>
                    <p className="text-xs text-gray-600 mt-2">
                      Your Registration ID is
                    </p>
                    <p className="text-lg font-mono font-bold text-brand-orange-dark">
                      {registrationId}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Please save this ID for your records.
                    </p>
                  </>
                )}
              </div>
            )}

            {submitError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-medium">
                  {submitError}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-linear-to-r from-brand-orange-dark to-brand-orange hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-300 transform hover:scale-105 disabled:hover:scale-100"
            >
              {isSubmitting ? "Submitting…" : "Submit"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full px-4 py-3 bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none transition";

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-semibold text-gray-800 mb-2"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function CheckboxGroup({
  label,
  name,
  options,
  value,
  onChange,
  hint,
}: {
  label: string;
  name: string;
  options: string[];
  value: string[];
  onChange: (option: string, checked: boolean) => void;
  hint?: string;
}) {
  return (
    <div>
      <p className="block text-sm font-semibold text-gray-800 mb-2">
        {label}
      </p>
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition ${
              value.includes(option)
                ? "border-brand-orange bg-orange-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <input
              type="checkbox"
              name={name}
              value={option}
              checked={value.includes(option)}
              onChange={(e) => onChange(option, e.target.checked)}
              className="h-4 w-4 accent-orange-500"
            />
            <span className="text-sm text-gray-800">{option}</span>
          </label>
        ))}
      </div>
      {hint && <p className="text-xs text-gray-500 mt-2">{hint}</p>}
    </div>
  );
}
