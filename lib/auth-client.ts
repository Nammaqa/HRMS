export async function getCurrentUserRole(): Promise<string | null> {
  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user?.role || null;
  } catch (error) {
    console.error("Failed to get current user:", error);
    return null;
  }
}
