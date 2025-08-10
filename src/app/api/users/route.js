import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/api-auth";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';


export async function GET(request) {
  try {
    const token = cookies().get("token")?.value;
    const user = await verifyToken(token);

    if (!user || !["ADMIN", "MANAGER"].includes(user.role)) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role");
    const status = searchParams.get("status");

    const skip = (page - 1) * limit;

    const where = {
      OR: search ? [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ] : undefined,
      role: role || undefined,
      status: status || undefined
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          customer: {
            select: {
              id: true,
              address: true,
              phone: true
            }
          },
          employee: {
            select: {
              id: true,
              phone: true,
              serviceAreas: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      prisma.user.count({ where })
    ]);

    return NextResponse.json({
      users,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });

  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const token = cookies().get("token")?.value;
    const currentUser = await verifyToken(token);

    if (!currentUser || !["ADMIN", "MANAGER"].includes(currentUser.role)) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email, password, role, phone, address, serviceAreas } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and associated profile in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          status: "ACTIVE"
        }
      });

      if (role === "CUSTOMER" && (phone || address)) {
        await tx.customer.create({
          data: {
            userId: newUser.id,
            phone,
            address
          }
        });
      }

      if (role === "EMPLOYEE" && (phone || serviceAreas)) {
        await tx.employee.create({
          data: {
            userId: newUser.id,
            phone,
            serviceAreas
          }
        });
      }

      return newUser;
    });

    return NextResponse.json({
      message: "User created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 