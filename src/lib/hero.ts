// Configuración del carrusel de la portada.
// Las imágenes viven en public/hero/ (1.jpg, 2.jpg, 3.jpg, 4.jpg).

export interface HeroSlide {
  image: string;
  title: string;
  subtitle: string;
  cta: { label: string; href: string };
}

export const heroSlides: HeroSlide[] = [
  {
    image: "/hero/1.jpg",
    title: "Pizzas de masa madre",
    subtitle: "Congeladas y empacadas al vacío, listas cuando quieras.",
    cta: { label: "Ver pizzas", href: "/productos?categoria=PIZZA" },
  },
  {
    image: "/hero/4.jpg",
    title: "Pizza Catcher 🎮",
    subtitle: "Atrapa ingredientes, completa pizzas y gana puntos de recompensa. ¡Juega una vez al día!",
    cta: { label: "Jugar ahora", href: "/juego" },
  },
  {
    image: "/hero/2.jpg",
    title: "Panadería artesanal",
    subtitle: "Churros, cinnamon rolls y más, congelados para disfrutar cuando quieras.",
    cta: { label: "Ver panadería", href: "/productos?categoria=PANADERIA" },
  },
  {
    image: "/hero/untables.jpg",
    title: "Untables artesanales",
    subtitle: "Humus, pestos y mezcla de quesos para untar. El acompañamiento perfecto para tu pizza.",
    cta: { label: "Ver untables", href: "/productos?categoria=UNTABLES" },
  },
  {
    image: "/hero/3.jpg",
    title: "Gana puntos en cada pedido",
    subtitle: "Canjéalos por descuentos, envío gratis y más recompensas.",
    cta: { label: "Ver recompensas", href: "/recompensas" },
  },
];
