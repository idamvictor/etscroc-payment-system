"use client";

import { useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import {
  courses,
  genderOptions,
  countryOptions,
  employmentOptions,
  educationOptions,
  experienceOptions,
  jobSupportOptions,
  nigerianStates,
} from "@/lib/registration-options";

interface RegistrationFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  country: string;
  countryOther: string;
  stateCity: string;
  employmentStatus: string;
  employmentStatusOther: string;
  educationLevel: string;
  educationLevelOther: string;
  course: string;
  techExperience: string;
  jobSupport: string;
  referralCode: string;
  agreeTerms: boolean;
}

const FIXED_AMOUNT = 35675;

const initialFormData: RegistrationFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  gender: "",
  country: "",
  countryOther: "",
  stateCity: "",
  employmentStatus: "",
  employmentStatusOther: "",
  educationLevel: "",
  educationLevelOther: "",
  course: "",
  techExperience: "",
  jobSupport: "",
  referralCode: "",
  agreeTerms: false,
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

    if (!receiptFile) {
      setSubmitError("Please attach your payment receipt.");
      return;
    }

    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      payload.append(key, String(value));
    });
    payload.append("receiptFile", receiptFile);

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        body: payload,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setSubmitError(
          body?.message ?? "Something went wrong. Please try again.",
        );
        return;
      }

      setSubmitted(true);
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
        <div className="bg-linear-to-r from-brand-orange-dark to-brand-orange p-8 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
            Etscroc Tech and Business Agency
          </p>
          <h1 className="text-3xl font-bold mt-1">
            The Etscroc Virtual Tech Cohort August 2026
          </h1>
          <p className="text-white/90 mt-3 text-sm leading-relaxed">
            Learn beginner-friendly tech and digital skills, go from zero to
            job-ready, get internship/job placement support and join a
            community that supports your growth.
          </p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="First Name" htmlFor="firstName">
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="John"
                  className={inputClass}
                />
              </Field>
              <Field label="Last Name" htmlFor="lastName">
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Doe"
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
              <Field label="Phone Number" htmlFor="phone">
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="0800 000 0000"
                  className={inputClass}
                />
              </Field>
            </div>

            {/* Gender */}
            <RadioGroup
              label="Gender"
              name="gender"
              options={genderOptions}
              value={formData.gender}
              onChange={handleChange}
            />

            {/* Country */}
            <RadioGroup
              label="Country"
              name="country"
              options={countryOptions}
              value={formData.country}
              onChange={handleChange}
            >
              {formData.country === "Other" && (
                <input
                  type="text"
                  name="countryOther"
                  value={formData.countryOther}
                  onChange={handleChange}
                  placeholder="Enter your country"
                  className={`${inputClass} mt-2`}
                />
              )}
            </RadioGroup>

            {/* State/City */}
            <Field label="State/City" htmlFor="stateCity">
              <select
                id="stateCity"
                name="stateCity"
                value={formData.stateCity}
                onChange={handleChange}
                required
                className={inputClass}
              >
                <option value="">Choose a state</option>
                {nigerianStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </Field>

            {/* Employment status */}
            <RadioGroup
              label="Current Employment/Study Status"
              name="employmentStatus"
              options={employmentOptions}
              value={formData.employmentStatus}
              onChange={handleChange}
            >
              {formData.employmentStatus === "Other" && (
                <input
                  type="text"
                  name="employmentStatusOther"
                  value={formData.employmentStatusOther}
                  onChange={handleChange}
                  placeholder="Please specify"
                  className={`${inputClass} mt-2`}
                />
              )}
            </RadioGroup>

            {/* Education level */}
            <RadioGroup
              label="Educational Level"
              name="educationLevel"
              options={educationOptions}
              value={formData.educationLevel}
              onChange={handleChange}
            >
              {formData.educationLevel === "Other" && (
                <input
                  type="text"
                  name="educationLevelOther"
                  value={formData.educationLevelOther}
                  onChange={handleChange}
                  placeholder="Please specify"
                  className={`${inputClass} mt-2`}
                />
              )}
            </RadioGroup>

            {/* Course */}
            <RadioGroup
              label="Which course would you like to apply for?"
              name="course"
              options={courses}
              value={formData.course}
              onChange={handleChange}
            />

            {/* Price display */}
            {formData.course && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-gray-600">Course Price:</p>
                <p className="text-2xl font-bold text-brand-orange-dark">
                  ₦{FIXED_AMOUNT.toLocaleString()}
                </p>
              </div>
            )}

            {/* Tech experience */}
            <RadioGroup
              label="Do you have any prior tech experience?"
              name="techExperience"
              options={experienceOptions}
              value={formData.techExperience}
              onChange={handleChange}
            />

            {/* Job support */}
            <RadioGroup
              label="Would you like Etscroc Tech to support you with job platforms and opportunities after completing your course?"
              name="jobSupport"
              options={jobSupportOptions}
              value={formData.jobSupport}
              onChange={handleChange}
            />

            {/* Referral code */}
            <Field label="Referral code (optional)" htmlFor="referralCode">
              <input
                type="text"
                id="referralCode"
                name="referralCode"
                value={formData.referralCode}
                onChange={handleChange}
                placeholder="Your answer"
                className={inputClass}
              />
            </Field>

            {/* Payment receipt upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Payment Receipt
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
                      or drag and drop your payment receipt
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

            {/* Terms */}
            <label className="flex items-start gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    agreeTerms: e.target.checked,
                  }))
                }
                required
                className="mt-1 h-4 w-4 accent-orange-500"
              />
              <span>
                By submitting this form, you confirm that you have read and
                accepted Etscroc{" "}
                <a
                  href="https://docs.google.com/document/d/153mB0eeOU6KjKKPgy0aiEQGjhZmRJA_MMavgfp12m9w/edit?tab=t.0#heading=h.6deqo0fhwjv9"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-brand-orange-dark underline underline-offset-2 hover:text-brand-orange"
                >
                  Terms and Conditions
                </a>
                .
              </span>
            </label>

            {submitted && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-brand-orange-dark font-medium">
                  Thanks! Your registration and receipt have been submitted
                  successfully. We&apos;ll be in touch soon.
                </p>
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

function RadioGroup({
  label,
  name,
  options,
  value,
  onChange,
  children,
}: {
  label: string;
  name: string;
  options: string[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  children?: React.ReactNode;
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
              value === option
                ? "border-brand-orange bg-orange-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={onChange}
              required
              className="h-4 w-4 accent-orange-500"
            />
            <span className="text-sm text-gray-800">{option}</span>
          </label>
        ))}
      </div>
      {children}
    </div>
  );
}
