"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gamepad2, Heart, Volume2, VolumeX } from "lucide-react";
import { submitGameScoreAction } from "@/lib/actions";
import type { GameResult } from "@/lib/actions";
import type { LeaderboardEntry } from "@/lib/data";
import { TOPPINGS } from "@/lib/toppings";
import {
  initAudio,
  playCatch,
  playComplete,
  playGameOver,
  playWrong,
  setSoundEnabled,
  startMusic,
  stopMusic,
} from "@/lib/sounds";

const PLAYER_SPRITE = "/images/toppings/pizzero.png";
const BACKGROUND_SPRITE = "/images/game-background.webp";

const GAME_TOPPINGS = TOPPINGS.map((t) => ({
  key: t.name,
  sprite: t.sprite,
  emoji: t.emoji,
}));

const CANVAS_W = 320;
const CANVAS_H = 480;
const PLAYER_W = 96;
const PLAYER_H = 44;
const PLAYER_Y = CANVAS_H - 84;
const INGREDIENT_SIZE = 36;
const ORDER_SIZE = 3;
const MAX_HEARTS = 3;

// Recorte del sprite del pizzero (contenido dentro del lienzo 512x512)
const PIZZERO_SRC = { x: 80, y: 2, w: 405, h: 506 };
const PIZZERO_H = 100;
const PIZZERO_W = Math.round((PIZZERO_H * PIZZERO_SRC.w) / PIZZERO_SRC.h);

// Ancho del hitbox de captura (más pequeño que la caja visual para poder esquivar)
const CATCH_WIDTH = 56;

// Velocidad con la que el chef se desliza hacia el punto táctil (px/frame)
const POINTER_SPEED = 9;

// Duración (frames) del indicador visual de acierto/error
const FX_LIFE = 28;

interface Falling {
  id: number;
  key: string;
  x: number;
  y: number;
  vy: number;
}

interface Effect {
  id: number;
  x: number;
  y: number;
  type: "good" | "bad";
  life: number;
}

interface GameState {
  playerX: number;
  ingredients: Falling[];
  effects: Effect[];
  currentOrder: string[];
  caught: string[];
  hearts: number;
  score: number;
  spawnTimer: number;
  running: boolean;
  nextId: number;
}

interface Hud {
  hearts: number;
  order: string[];
  caught: string[];
  score: number;
}

function randomOrder(): string[] {
  const pool = [...GAME_TOPPINGS];
  const order: string[] = [];
  while (order.length < ORDER_SIZE && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    order.push(pool.splice(i, 1)[0].key);
  }
  return order;
}

function ToppingIcon({
  topping,
  size = "h-6 w-6",
}: {
  topping: { key: string; sprite: string; emoji: string };
  size?: string;
}) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <span className={`${size} flex items-center justify-center text-lg`}>
        {topping.emoji}
      </span>
    );
  }
  return (
    <img
      src={topping.sprite}
      alt={topping.key}
      className={`${size} object-contain`}
      onError={() => setErr(true)}
      draggable={false}
    />
  );
}

export function PizzaCatcherGame({
  loggedIn,
  pointsPerPizza,
  personalBest,
  leaderboard,
}: {
  loggedIn: boolean;
  pointsPerPizza: number;
  personalBest: number;
  leaderboard: LeaderboardEntry[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "playing" | "over">("idle");
  const [hud, setHud] = useState<Hud>({
    hearts: MAX_HEARTS,
    order: [],
    caught: [],
    score: 0,
  });
  const [result, setResult] = useState<GameResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [showLegend, setShowLegend] = useState(false);
  const [bestRecord, setBestRecord] = useState(personalBest);
  const [isNewRecord, setIsNewRecord] = useState(false);

  const gsRef = useRef<GameState | null>(null);
  const imagesRef = useRef<Record<string, HTMLImageElement | null>>({});
  const playerImgRef = useRef<HTMLImageElement | null>(null);
  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const keysRef = useRef<{ left: boolean; right: boolean }>({
    left: false,
    right: false,
  });
  const pointerXRef = useRef<number | null>(null);
  const rafRef = useRef(0);

  const syncHud = useCallback((gs: GameState) => {
    setHud({
      hearts: gs.hearts,
      order: gs.currentOrder,
      caught: gs.caught,
      score: gs.score,
    });
  }, []);

  // Precargar sprites
  useEffect(() => {
    for (const t of GAME_TOPPINGS) {
      const img = new Image();
      img.src = t.sprite;
      img.onerror = () => {
        imagesRef.current[t.key] = null;
      };
      imagesRef.current[t.key] = img;
    }
    const p = new Image();
    p.src = PLAYER_SPRITE;
    p.onerror = () => {
      playerImgRef.current = null;
    };
    playerImgRef.current = p;

    const bg = new Image();
    bg.src = BACKGROUND_SPRITE;
    bg.onerror = () => {
      bgImgRef.current = null;
    };
    bgImgRef.current = bg;

    return () => {
      cancelAnimationFrame(rafRef.current);
      stopMusic();
    };
  }, []);

  useEffect(() => {
    setSoundEnabled(soundOn);
  }, [soundOn]);

  const draw = useCallback((gs: GameState, ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // fondo
    const bg = bgImgRef.current;
    if (bg) {
      ctx.drawImage(bg, 0, 0, CANVAS_W, CANVAS_H);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      grad.addColorStop(0, "#2a1c14");
      grad.addColorStop(1, "#1a110d");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }

    // ingredientes cayendo
    ctx.imageSmoothingEnabled = false;
    for (const ing of gs.ingredients) {
      const img = imagesRef.current[ing.key];
      if (img) {
        const s = INGREDIENT_SIZE;
        ctx.drawImage(img, ing.x - s / 2, ing.y - s / 2, s, s);
      } else {
        const meta = GAME_TOPPINGS.find((t) => t.key === ing.key);
        ctx.font = "26px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(meta?.emoji ?? "🍕", ing.x, ing.y);
      }
    }

    // jugador (pizzero + caja)
    const cx = gs.playerX;
    const boxX = cx - PLAYER_W / 2;
    const boxTop = PLAYER_Y;
    if (playerImgRef.current) {
      const img = playerImgRef.current;
      const dx = cx - PIZZERO_W / 2;
      const dy = PLAYER_Y + PLAYER_H - PIZZERO_H;
      ctx.drawImage(
        img,
        PIZZERO_SRC.x,
        PIZZERO_SRC.y,
        PIZZERO_SRC.w,
        PIZZERO_SRC.h,
        dx,
        dy,
        PIZZERO_W,
        PIZZERO_H
      );
    } else {
      ctx.fillStyle = "#b5651d";
      ctx.beginPath();
      const r = 8;
      const bw = PLAYER_W;
      const bh = PLAYER_H - 8;
      ctx.roundRect(boxX, boxTop, bw, bh, r);
      ctx.fill();
      ctx.fillStyle = "#8a4b1d";
      ctx.fillRect(boxX, boxTop + bh - 6, bw, 6);
      ctx.font = "28px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🍕", cx, boxTop + bh / 2);
    }

    // efectos de colisión (✓ correcto / ✗ incorrecto)
    for (const fx of gs.effects) {
      const alpha = Math.max(0, fx.life / FX_LIFE);
      ctx.globalAlpha = alpha;
      ctx.font = "bold 26px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = fx.type === "good" ? "#22c55e" : "#ef4444";
      ctx.fillText(fx.type === "good" ? "✓" : "✗", fx.x, fx.y);
    }
    ctx.globalAlpha = 1;
  }, []);

  const submitResult = useCallback(
    async (finalScore: number) => {
      if (!loggedIn) return;
      setSubmitting(true);
      const isNewBest = finalScore > bestRecord && finalScore > 0;
      try {
        const res = await submitGameScoreAction(finalScore);
        setResult(res);
        if (res.personalBest != null) {
          const newBest = res.personalBest;
          setBestRecord((prev) => Math.max(prev, newBest));
        }
        setIsNewRecord(isNewBest);
        router.refresh();
      } catch {
        setResult({ error: "No se pudo registrar tu puntaje" });
        setIsNewRecord(false);
      } finally {
        setSubmitting(false);
      }
    },
    [loggedIn, bestRecord]
  );

  const loop = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const gs = gsRef.current;
      if (!gs || !gs.running) return;

      const speed = 2 + gs.score * 0.35;
      const spawnInterval = Math.max(280, 720 - gs.score * 45);

      // movimiento del jugador (suave hacia el dedo, sin teletransporte)
      if (pointerXRef.current !== null) {
        const dx = pointerXRef.current - gs.playerX;
        if (Math.abs(dx) <= POINTER_SPEED) {
          gs.playerX = pointerXRef.current;
        } else {
          gs.playerX += Math.sign(dx) * POINTER_SPEED;
        }
      } else {
        if (keysRef.current.left) gs.playerX -= 7;
        if (keysRef.current.right) gs.playerX += 7;
      }
      gs.playerX = Math.max(PLAYER_W / 2, Math.min(CANVAS_W - PLAYER_W / 2, gs.playerX));

      // spawn
      gs.spawnTimer += 1000 / 60;
      if (gs.spawnTimer >= spawnInterval) {
        gs.spawnTimer = 0;
        const needed = gs.currentOrder.filter((t) => !gs.caught.includes(t));
        const correctChance = Math.max(0.35, 0.6 - gs.score * 0.03);
        let key: string;
        if (needed.length > 0 && Math.random() < correctChance) {
          key = needed[Math.floor(Math.random() * needed.length)];
        } else {
          key = GAME_TOPPINGS[Math.floor(Math.random() * GAME_TOPPINGS.length)].key;
        }
        gs.ingredients.push({
          id: gs.nextId++,
          key,
          x: Math.random() * (CANVAS_W - 60) + 30,
          y: -INGREDIENT_SIZE,
          vy: speed,
        });
      }

      // mover y detectar captura
      const catchHalf = CATCH_WIDTH / 2;
      const boxLeft = gs.playerX - catchHalf;
      const boxRight = gs.playerX + catchHalf;
      const remaining = gs.ingredients.filter((ing) => {
        ing.y += ing.vy;
        if (ing.y < CANVAS_H + INGREDIENT_SIZE) return true;
        return false; // cayó fuera, sin penalización
      });

      let changed = false;
      gs.ingredients = remaining.filter((ing) => {
        if (ing.y + INGREDIENT_SIZE / 2 >= PLAYER_Y && ing.x >= boxLeft && ing.x <= boxRight) {
          // capturado
          if (gs.currentOrder.includes(ing.key) && !gs.caught.includes(ing.key)) {
            gs.caught.push(ing.key);
            gs.effects.push({
              id: gs.nextId++,
              x: ing.x,
              y: PLAYER_Y - 24,
              type: "good",
              life: FX_LIFE,
            });
            playCatch();
            changed = true;
          } else {
            gs.hearts -= 1;
            gs.effects.push({
              id: gs.nextId++,
              x: ing.x,
              y: PLAYER_Y - 24,
              type: "bad",
              life: FX_LIFE,
            });
            playWrong();
            changed = true;
          }
          return false;
        }
        return true;
      });

      // actualizar efectos (flotar y desvanecer)
      gs.effects = gs.effects.filter((fx) => {
        fx.life -= 1;
        fx.y -= 1.2;
        return fx.life > 0;
      });

      // orden completada
      if (gs.currentOrder.every((t) => gs.caught.includes(t))) {
        gs.score += 1;
        gs.currentOrder = randomOrder();
        gs.caught = [];
        playComplete();
        changed = true;
      }

      // game over
      if (gs.hearts <= 0) {
        gs.running = false;
        draw(gs, ctx);
        syncHud(gs);
        cancelAnimationFrame(rafRef.current);
        stopMusic();
        playGameOver();
        setPhase("over");
        void submitResult(gs.score);
        return;
      }

      if (changed) syncHud(gs);
      draw(gs, ctx);
      rafRef.current = requestAnimationFrame(() => loop(ctx));
    },
    [draw, syncHud, submitResult]
  );

  const start = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    initAudio();
    startMusic();

    const gs: GameState = {
      playerX: CANVAS_W / 2,
      ingredients: [],
      effects: [],
      currentOrder: randomOrder(),
      caught: [],
      hearts: MAX_HEARTS,
      score: 0,
      spawnTimer: 0,
      running: true,
      nextId: 1,
    };
    gsRef.current = gs;
    setResult(null);
    setSubmitting(false);
    setIsNewRecord(false);
    setPhase("playing");
    syncHud(gs);

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => loop(ctx));
  }, [loop, syncHud]);

  // Teclado
  useEffect(() => {
    if (phase !== "playing") return;
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keysRef.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keysRef.current.right = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keysRef.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keysRef.current.right = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [phase]);

  // Puntero (móvil/ratón)
  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const setX = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scale = CANVAS_W / rect.width;
      pointerXRef.current = (e.clientX - rect.left) * scale;
    };
    const clear = () => {
      pointerXRef.current = null;
    };
    canvas.addEventListener("pointerdown", setX);
    canvas.addEventListener("pointermove", setX);
    canvas.addEventListener("pointerup", clear);
    canvas.addEventListener("pointerleave", clear);
    return () => {
      canvas.removeEventListener("pointerdown", setX);
      canvas.removeEventListener("pointermove", setX);
      canvas.removeEventListener("pointerup", clear);
      canvas.removeEventListener("pointerleave", clear);
    };
  }, [phase]);

  return (
    <div className="mx-auto max-w-md px-4 py-4 sm:px-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Pizza Catcher
        </h1>
        <p className="mt-1 text-sm text-muted">
          Atrapa los ingredientes correctos y completa pizzas. ¡Gana puntos!
        </p>
      </div>

      {/* HUD */}
      <div className="mt-5 flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3">
        <div>
          <p className="text-xs text-muted">Pedido actual</p>
          <div className="mt-1 flex items-center gap-2">
            {hud.order.map((key) => {
              const meta = GAME_TOPPINGS.find((t) => t.key === key);
              const done = hud.caught.includes(key);
              return (
                <span
                  key={key}
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    done
                      ? "bg-green-100 ring-2 ring-green-500"
                      : "bg-background ring-1 ring-line"
                  }`}
                  title={key}
                >
                  {meta ? <ToppingIcon topping={meta} size="h-6 w-6" /> : "🍕"}
                </span>
              );
            })}
          </div>
        </div>
        <div className="text-right">
          <div className="flex gap-0.5">
            {Array.from({ length: MAX_HEARTS }).map((_, i) => (
              <Heart
                key={i}
                className={`h-5 w-5 ${
                  i < hud.hearts ? "fill-red-500 text-red-500" : "text-line"
                }`}
              />
            ))}
          </div>
          <p className="mt-1 text-sm font-semibold">
            {hud.score} {hud.score === 1 ? "pizza" : "pizzas"}
          </p>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative mt-4 overflow-hidden rounded-2xl border border-line bg-black">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="mx-auto h-auto w-full max-w-[320px] touch-none"
          style={{ imageRendering: "pixelated" }}
        />

        {phase === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 px-6 text-center">
            <Gamepad2 className="h-12 w-12 text-accent" />
            <div>
              <p className="font-display text-xl font-semibold text-white">
                ¿Listo para atrapar?
              </p>
              <p className="mt-2 text-sm text-white/70">
                Mueve al pizzero con las flechas o arrastrando el dedo. Atrapa
                solo los ingredientes del pedido.
              </p>
            </div>
            <button
              type="button"
              onClick={start}
              className="rounded-full bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Jugar
            </button>
            <button
              type="button"
              onClick={() => setShowLegend(true)}
              className="rounded-full border border-white/40 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Ver ingredientes
            </button>

            {loggedIn && (
              <p className="text-xs text-white/70">
                🏆 Tu récord: <strong>{bestRecord}</strong>{" "}
                {bestRecord === 1 ? "pizza" : "pizzas"}
              </p>
            )}

            {loggedIn ? (
              <p className="text-xs text-white/60">
                🎁 Solo ganas puntos en tu primera partida del día.
              </p>
            ) : (
              <p className="text-xs text-white/60">
                <Link href="/ingresar" className="underline underline-offset-2">
                  Inicia sesión
                </Link>{" "}
                para ganar puntos (solo en tu primera partida del día).
              </p>
            )}
          </div>
        )}

        {phase === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 px-6 text-center">
            <p className="font-display text-2xl font-semibold text-white">
              ¡Fin de la partida!
            </p>
            <p className="text-white/80">
              Completaste{" "}
              <strong className="text-accent">{hud.score}</strong>{" "}
              {hud.score === 1 ? "pizza" : "pizzas"} 🍕
            </p>

            {isNewRecord && (
              <p className="rounded-xl bg-yellow-500/20 px-4 py-2 text-sm font-semibold text-yellow-300">
                🏆 ¡Nuevo récord personal!
              </p>
            )}

            {loggedIn ? (
              <div className="text-sm">
                {submitting ? (
                  <p className="text-white/70">Registrando tu puntaje…</p>
                ) : result?.error ? (
                  <p className="text-red-400">{result.error}</p>
                ) : result?.firstPlay ? (
                  <p className="rounded-xl bg-accent-soft px-4 py-2 text-accent">
                    🎉 Ganaste <strong>{result.pointsEarned}</strong> puntos
                  </p>
                ) : result ? (
                  <p className="text-white/70">
                    Ya jugaste hoy; ¡vuelve mañana por más puntos!
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-white/70">
                <Link href="/ingresar" className="text-accent underline underline-offset-2">
                  Inicia sesión
                </Link>{" "}
                para ganar {pointsPerPizza} pts por pizza.
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={start}
                className="rounded-full bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Jugar de nuevo
              </button>
              <Link
                href="/recompensas"
                className="rounded-full border border-white/30 px-6 py-3 font-medium text-white transition-colors hover:bg-white/10"
              >
                Mis puntos
              </Link>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setSoundOn((v) => !v)}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60"
          aria-label={soundOn ? "Silenciar" : "Activar sonido"}
        >
          {soundOn ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4" />
          )}
        </button>

        {showLegend && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/90 px-6 text-center">
            <p className="font-display text-lg font-semibold text-white">
              Ingredientes del juego
            </p>
            <div className="grid w-full max-w-sm grid-cols-2 gap-2">
              {GAME_TOPPINGS.map((t) => (
                <div
                  key={t.key}
                  className="flex items-center gap-2 rounded-xl bg-white/10 p-2"
                >
                  <ToppingIcon topping={t} size="h-8 w-8" />
                  <span className="text-base leading-none">{t.emoji}</span>
                  <span className="min-w-0 text-left text-xs leading-tight text-white/90">
                    {t.key}
                  </span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowLegend(false)}
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Entendido
            </button>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-muted">
        Controles: flechas ← → o arrastra con el dedo. Pierdes un corazón al
        atrapar un ingrediente equivocado.
      </p>

      {/* Top 10 */}
      {leaderboard.length > 0 && (
        <div className="mt-6 rounded-2xl border border-line bg-card p-4">
          <h2 className="font-display text-lg font-semibold">
            🏆 Top 10 jugadores
          </h2>
          <p className="text-xs text-muted">
            Mejores récords de todos los jugadores
          </p>
          <ol className="mt-3 space-y-1">
            {leaderboard.map((entry, i) => {
              const medal =
                i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
              return (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-lg px-3 py-1.5 odd:bg-black/[0.03]"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-6 text-center text-sm font-semibold text-muted">
                      {medal ?? i + 1}
                    </span>
                    <span className="truncate font-medium">{entry.name}</span>
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-accent">
                    {entry.best}
                    <span className="text-sm">🍕</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
