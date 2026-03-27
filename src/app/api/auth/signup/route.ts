import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, username, password } = body;

    // Validate required fields
    if (!email || !username || !password) {
      return NextResponse.json(
        { error: "Email, username, and password are required." },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    // Validate username: 3+ characters, alphanumeric (underscores allowed)
    const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        {
          error:
            "Username must be at least 3 characters and contain only letters, numbers, and underscores.",
        },
        { status: 400 }
      );
    }

    // Validate password: 8+ characters
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    // Check if email or username already exists
    const existingUser = await db.query.users.findFirst({
      where: or(eq(users.email, email), eq(users.username, username)),
    });

    if (existingUser) {
      const field =
        existingUser.email === email ? "email" : "username";
      return NextResponse.json(
        { error: `A user with that ${field} already exists.` },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hash(password, 10);

    // Insert new user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        username,
        passwordHash,
      })
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
      });

    return NextResponse.json(
      { success: true, user: newUser },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "An internal error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
