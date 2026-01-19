import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get("reference");

    if (!reference) {
      return NextResponse.json(
        { message: "Reference is required" },
        { status: 400 }
      );
    }

    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

    if (!PAYSTACK_SECRET_KEY) {
      console.error("PAYSTACK_SECRET_KEY is not set");
      return NextResponse.json(
        { message: "Payment service is not configured" },
        { status: 500 }
      );
    }

    // Verify payment with Paystack
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (response.data.status && response.data.data.status === "success") {
      // Payment was successful
      const paymentData = response.data.data;

      // Here you can save the payment details to your database
      console.log("Payment successful:", {
        reference: paymentData.reference,
        amount: paymentData.amount / 100, // Convert from kobo to naira
        email: paymentData.customer.email,
        metadata: paymentData.metadata,
      });

      return NextResponse.json({
        status: true,
        message: "Payment verified successfully",
        data: paymentData,
      });
    } else {
      return NextResponse.json(
        {
          status: false,
          message: "Payment verification failed",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Payment verification error:", error);

    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          message:
            error.response?.data?.message || "Payment verification failed",
        },
        { status: error.response?.status || 500 }
      );
    }

    return NextResponse.json(
      { message: "An error occurred during payment verification" },
      { status: 500 }
    );
  }
}
