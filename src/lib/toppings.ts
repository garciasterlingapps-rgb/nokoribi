// Configuración visual del "Arma tu propia pizza".
// Los sprites de pixel art (generados con Codex) van en public/images/toppings/.
// Si el sprite no existe todavía, se muestra el emoji de respaldo automáticamente.

export interface ToppingVisual {
  name: string; // nombre exacto del ingrediente (tabla ingredients)
  sprite: string; // ruta al sprite (public/images/toppings/...)
  emoji: string; // respaldo mientras no exista el sprite
  x: number; // posición horizontal (% desde el centro, -50..50)
  y: number; // posición vertical (% desde el centro, -50..50)
  size: number; // tamaño relativo (% del ancho de la pizza)
}

export const BASE_PIZZA_SPRITE = "/images/toppings/pizza-base.png";

export const TOPPINGS: ToppingVisual[] = [
  { name: "Queso mozzarella", sprite: "/images/toppings/queso.png", emoji: "🧀", x: 0, y: 6, size: 44 },
  { name: "Pepperoni", sprite: "/images/toppings/pepperoni.png", emoji: "🍕", x: -22, y: -14, size: 20 },
  { name: "Champiñones", sprite: "/images/toppings/champinones.png", emoji: "🍄", x: 20, y: -18, size: 20 },
  { name: "Aceitunas", sprite: "/images/toppings/aceitunas.png", emoji: "🫒", x: -28, y: 14, size: 16 },
  { name: "Cebolla caramelizada", sprite: "/images/toppings/cebolla.png", emoji: "🧅", x: 14, y: 22, size: 18 },
  { name: "Maíz dulce", sprite: "/images/toppings/maiz.png", emoji: "🌽", x: 0, y: -24, size: 18 },
  { name: "Lomo curado", sprite: "/images/toppings/lomo.png", emoji: "🥩", x: 26, y: -2, size: 18 },
  { name: "Rúcula", sprite: "/images/toppings/rucula.png", emoji: "🥬", x: -8, y: -6, size: 22 },
  { name: "Jamón serrano", sprite: "/images/toppings/jamon.png", emoji: "🍖", x: -18, y: 24, size: 16 },
  { name: "Tocino", sprite: "/images/toppings/tocino.png", emoji: "🥓", x: 8, y: -22, size: 16 },
  { name: "Pimentón asado", sprite: "/images/toppings/pimenton.png", emoji: "🫑", x: -4, y: 18, size: 16 },
];

export function getToppingVisual(name: string): ToppingVisual | undefined {
  return TOPPINGS.find((t) => t.name === name);
}
