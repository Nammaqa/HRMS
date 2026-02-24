import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get yesterday, today, and tomorrow
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch all users with dateOfBirth, dateOfMarriage, or dateOfJoining
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { dateOfBirth: { not: null } },
          { dateOfMarriage: { not: null } },
          { dateOfJoining: { not: null } },
        ],
      },
      select: {
        id: true,
        name: true,
        designation: true,
        dateOfBirth: true,
        dateOfMarriage: true,
        dateOfJoining: true,
        profileImageUrl: true,
      },
    });

    // Filter and categorize special occasions by day
    const specialOccasions = {
      yesterday: [] as any[],
      today: [] as any[],
      tomorrow: [] as any[],
    };

    const checkDateMatch = (date: Date | null, targetDate: Date) => {
      if (!date) return false;
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return (
        d.getDate() === targetDate.getDate() &&
        d.getMonth() === targetDate.getMonth()
      );
    };

    users.forEach((user) => {
      // Check Birthday
      if (user.dateOfBirth) {
        if (checkDateMatch(user.dateOfBirth, yesterday)) {
          specialOccasions.yesterday.push({
            id: user.id,
            name: user.name,
            designation: user.designation,
            type: "birthday",
            displayDate: "🎂 Birthday Yesterday",
            profileImageUrl: user.profileImageUrl,
          });
        } else if (checkDateMatch(user.dateOfBirth, today)) {
          specialOccasions.today.push({
            id: user.id,
            name: user.name,
            designation: user.designation,
            type: "birthday",
            displayDate: "🎂 Birthday Today",
            profileImageUrl: user.profileImageUrl,
          });
        } else if (checkDateMatch(user.dateOfBirth, tomorrow)) {
          specialOccasions.tomorrow.push({
            id: user.id,
            name: user.name,
            designation: user.designation,
            type: "birthday",
            displayDate: "🎂 Birthday Tomorrow",
            profileImageUrl: user.profileImageUrl,
          });
        }
      }

      // Check Anniversary (Marriage Date)
      if (user.dateOfMarriage) {
        if (checkDateMatch(user.dateOfMarriage, yesterday)) {
          specialOccasions.yesterday.push({
            id: user.id,
            name: user.name,
            designation: user.designation,
            type: "anniversary",
            displayDate: "💍 Anniversary Yesterday",
            profileImageUrl: user.profileImageUrl,
          });
        } else if (checkDateMatch(user.dateOfMarriage, today)) {
          specialOccasions.today.push({
            id: user.id,
            name: user.name,
            designation: user.designation,
            type: "anniversary",
            displayDate: "💍 Anniversary Today",
            profileImageUrl: user.profileImageUrl,
          });
        } else if (checkDateMatch(user.dateOfMarriage, tomorrow)) {
          specialOccasions.tomorrow.push({
            id: user.id,
            name: user.name,
            designation: user.designation,
            type: "anniversary",
            displayDate: "💍 Anniversary Tomorrow",
            profileImageUrl: user.profileImageUrl,
          });
        }
      }

      // Check Work Anniversary (Date of Joining)
      if (user.dateOfJoining) {
        if (checkDateMatch(user.dateOfJoining, yesterday)) {
          specialOccasions.yesterday.push({
            id: user.id,
            name: user.name,
            designation: user.designation,
            type: "joining",
            displayDate: "🎊 Work Anniversary Yesterday",
            profileImageUrl: user.profileImageUrl,
          });
        } else if (checkDateMatch(user.dateOfJoining, today)) {
          specialOccasions.today.push({
            id: user.id,
            name: user.name,
            designation: user.designation,
            type: "joining",
            displayDate: "🎊 Work Anniversary Today",
            profileImageUrl: user.profileImageUrl,
          });
        } else if (checkDateMatch(user.dateOfJoining, tomorrow)) {
          specialOccasions.tomorrow.push({
            id: user.id,
            name: user.name,
            designation: user.designation,
            type: "joining",
            displayDate: "🎊 Work Anniversary Tomorrow",
            profileImageUrl: user.profileImageUrl,
          });
        }
      }
    });

    return NextResponse.json(specialOccasions);
  } catch (error) {
    console.error("Error fetching special occasions:", error);
    return NextResponse.json(
      { error: "Failed to fetch special occasions" },
      { status: 500 }
    );
  }
}
