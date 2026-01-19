import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

interface PaymentRequest {
  firstName: string;
  lastName: string;
  course: string;
  email: string;
  amount: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentRequest = await request.json();

    // Validate required fields
    if (!body.firstName || !body.lastName || !body.email) {
      return NextResponse.json(
        { message: "First name, last name, and email are required" },
        { status: 400 }
      );
    }

    // Validate amount
    if (!body.amount || body.amount < 100) {
      return NextResponse.json(
        { message: "Amount must be at least ₦100" },
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

    // Prepare Paystack payload
    const paystackPayload = {
      email: body.email,
      amount: Math.round(body.amount * 100), // Convert to kobo (Paystack uses kobo)
      metadata: {
        firstName: body.firstName,
        lastName: body.lastName,
        course: body.course || "Course",
      },
    };

    // Initialize payment with Paystack
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      paystackPayload,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.status) {
      return NextResponse.json(response.data);
    } else {
      return NextResponse.json(
        { message: "Failed to initialize payment" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Payment initialization error:", error);

    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          message:
            error.response?.data?.message || "Payment initialization failed",
        },
        { status: error.response?.status || 500 }
      );
    }

    return NextResponse.json(
      { message: "An error occurred during payment initialization" },
      { status: 500 }
    );
  }
}
