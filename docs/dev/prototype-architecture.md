<!-- AUTO-GENERATED:backlink START -->
[← Back](dev.md)
<!-- AUTO-GENERATED:backlink END -->
# Prototype Architecture (Headless)

Diese Seite dokumentiert die portierte Prototypstruktur unter
`apps/tauritwoer-desktop/src/dev/prototype`.

## Ziel

Die fachliche Spiellogik aus `prototype/PyTowerDefensev.py` wird als
UI-unabhaengige TypeScript-Simulation ausgefuehrt.
Pygame-Runtime-Code wird nicht uebernommen.

## Systemaufteilung

- `data/`
  - Schwierigkeit, Tower-Stats, Gegner-Archetypen, Boss-Profile, Spielfeld-/Pfadkonstanten.
  - Balancing-Werte und Spawn-Formeln entsprechen der Python-Referenz.
- `math/`
  - Vektor- und Geometriehilfen (`distancePointToSegment`, Distanz/Normalisierung, Kollision).
- `domain/`
  - Reine Fachlogik fuer Gegner, Tower, Projektile, Platzierungsvalidierung und Wellenplanung.
- `engine/`
  - Session-Orchestrierung, Tick-Reihenfolge, Wave-Spawn, Economy/Lives/Level-Progression,
    State-Machine (`menu|playing|game_over|victory`) und Nachrichtenzustand.
- `index.ts`
  - Oeffentliche Headless-API (`createGameSession`) und relevante Type-Exports.

## Headless API

- `createGameSession(options?) -> GameSession`
- `GameSession.tick(dtSeconds)`
- `GameSession.applyAction(action)`
- `GameSession.getSnapshot()`
- `GameSession.reset(difficulty, options?)`

Unterstuetzte Actions:

- `chooseDifficulty`
- `startWave`
- `selectTower`
- `clearSelection`
- `placeTower`
- `restart`
- `returnToMenu`

## Portierungsstand

Portierungsstatus: **fachlich vollstaendig fuer den Gameplay-Kern**.

Abgedeckte Systeme:

- Gegnerbewegung inkl. Slow/Resist, Armor, Regen, Lebensschaden.
- Tower-Zielwahl und Cooldown-Logik.
- Projektiltypen `single|stun|splash|cannon` inkl. Splash-/Cannon-Multiplikatoren.
- Wellenplanung mit Runner-/Brute-Verteilung und Boss bei jedem 10. Level.
- Schwierigkeit, Startwerte, Geld-/Leben-/Level-Fortschritt, Victory/Game-Over.
- Platzierungsregeln (Spielfeldgrenzen, Tower-Abstand, Path-Korridor-Abstand).

## Tests

Automatisierte Vitest-Tests liegen unter `src/dev/prototype/*.test.ts` und decken ab:

- deterministisches Verhalten mit Seed-RNG,
- Wellen- und Bossplanung,
- Enemy-Logik,
- Tower-/Bullet-Interaktion,
- Platzierungsvalidierung,
- Session-Progression inkl. Game-Over/Victory.

## Abweichungen zur Python-Referenz

Nur Infrastrukturabweichungen, keine beabsichtigte Gameplay-Regelaenderung:

- Keine Pygame-Render-, Font-, Display- oder Event-Infrastruktur.
- Action-getriebene API statt direkter Keyboard-/Mouse-Eventbehandlung.
- Seedbarer RNG fuer reproduzierbare Tests; Laufzeit-Default bleibt random.
- Einige interne Identifier sind ASCII-normalisiert (z. B. `unmoeglich`, `Scharfschuetze`),
  die Spielmechanik bleibt unveraendert.
