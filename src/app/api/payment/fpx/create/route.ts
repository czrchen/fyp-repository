import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
export async function POST(req: Request) {
    try {
        const { amount } = await req.json();

        if (!amount) {
            return NextResponse.json(
                { error: "Missing amount" },
                { status: 400 }
            );
        }

        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["fpx"],
            line_items: [
                {
                    price_data: {
                        currency: "myr",
                        product_data: { name: "ShopHub Order Payment" },
                        unit_amount: Math.round(amount * 100),
                    },
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancelled`,
        });

        return NextResponse.json({ redirectUrl: session.url });
    } catch (err) {
        console.error("FPX Create Session Error:", err);
        return NextResponse.json(
            { error: "Failed to create FPX session" },
            { status: 500 }
        );
    }
}
