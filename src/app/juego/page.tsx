import { getCurrentUser } from "@/lib/auth";
import { getGamePointsPerPizza } from "@/lib/settings";
import { getGameLeaderboard, getUserBestScore } from "@/lib/data";
import { PizzaCatcherGame } from "@/components/pizza-catcher-game";

export const metadata = { title: "Pizza Catcher" };

export default async function JuegoPage() {
  const user = await getCurrentUser();
  const pointsPerPizza = await getGamePointsPerPizza();
  const leaderboard = await getGameLeaderboard();
  const personalBest = user ? await getUserBestScore(user.id) : 0;

  return (
    <PizzaCatcherGame
      loggedIn={!!user}
      pointsPerPizza={pointsPerPizza}
      personalBest={personalBest}
      leaderboard={leaderboard}
    />
  );
}
