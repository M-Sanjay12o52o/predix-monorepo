// apps/backend/src/server.mjs
import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const app = express();
const port = 3000;
const prisma = new PrismaClient();
const saltRounds = 10; // For bcrypt

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello from the backend!");
});

// POST /api/auth/signup
app.post("/api/auth/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide name, email, and password." });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // In a real application, you might want to return a token or user info (excluding the password)
    res
      .status(201)
      .json({
        message: "User created successfully.",
        userId: newUser.id,
        email: newUser.email,
      });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ message: "Could not create user." });
  }
});

// POST /api/auth/signin
app.post("/api/auth/signin", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // In a real application, you would generate and return a JWT or session token here
    res
      .status(200)
      .json({
        message: "Sign in successful.",
        userId: user.id,
        email: user.email,
      });
  } catch (error) {
    console.error("Error during signin:", error);
    res.status(500).json({ message: "Could not sign in." });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});

async function main() {
  // You can use Prisma Client here for other database interactions if needed
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
