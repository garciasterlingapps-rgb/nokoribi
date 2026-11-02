"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart-provider";

// Se monta en la página de confirmación de un pedido recién hecho para vaciar
// el carrito del navegador.
export function ClearCart() {
  const { clear } = useCart();

  useEffect(() => {
    clear();
  }, [clear]);

  return null;
}
