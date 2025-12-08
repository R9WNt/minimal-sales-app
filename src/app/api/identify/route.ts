import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request:Request) {
    try {
        const body = await request.json();
        const { phone } = body;

        if (!phone) {
            return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
        }

        // 1. Try to find the customer first

        let customer = await prisma.customer.findUnique({
            where: { phone_number: phone },
            include: {
                _count: { 
                    select: { 
                        receipts: true 
                    } 
                }
            }
        });

        let isNewUser =false;

        // 2. If NOT found, AUTO-CREATE them (Silent Onboarding)

        if (!customer) {
            customer = await prisma.customer.create({
                data: {
                    phone_number: phone,
                    name: "Guest",
                    receipts: { create: [] }
                },
                include: { 
                    _count: { 
                        select: { 
                            receipts: true 
                        } } 
                }
            });
            isNewUser = true;
        }

        // 3. Return the session data (Uniform for both Old and New)

        return NextResponse.json({
            exists: true,
            isNewUser: isNewUser,
            receipts: customer._count.receipts,
            name: customer.name
        });
    
    }   catch (error) {
        return NextResponse.json({ error:'Identification failed' }, { status: 500 });
    }
}