import { getCurrentUser } from "@/lib/auth";
import { getGamePointsPerPizza } from "@/lib/settings";
import { PizzaCatcherGame } from "@/components/pizza-catcher-game";

export const metadata = { title: "Pizza Catcher" };

export default async function JuegoPage() {
  const user = await getCurrentUser();
  const pointsPerPizza = await getGamePointsPerPizza();

  return <PizzaCatcherGame loggedIn={!!user} pointsPerPizza={pointsPerPizza} />;
}
