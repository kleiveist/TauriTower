import math
import random
import sys
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

import pygame

# ------------------------------------------------------------
# Tower Defense - Single file Pygame game
# ------------------------------------------------------------
# Controls:
#   1 = Pistolman
#   2 = Scharfschütze
#   3 = Stunner
#   4 = Bombarman
#   5 = Panzer-Tower
#   Linksklick = Turm platzieren / Menüauswahl
#   Rechtsklick oder ESC = Auswahl aufheben
#   LEERTASTE = nächste Welle starten
#   R = zurück ins Menü
# ------------------------------------------------------------

pygame.init()
pygame.font.init()

SCREEN_W = 1760
SCREEN_H = 980
SIDEBAR_W = 560
FIELD_W = SCREEN_W - SIDEBAR_W
FPS = 60
PATH_WIDTH = 58
TOWER_RADIUS = 22
GRID_SIZE = 40

SCREEN = pygame.display.set_mode((SCREEN_W, SCREEN_H))
pygame.display.set_caption("Tower Defense")
CLOCK = pygame.time.Clock()

FONT_XS = pygame.font.SysFont("arial", 14)
FONT_S = pygame.font.SysFont("arial", 18)
FONT_M = pygame.font.SysFont("arial", 24)
FONT_L = pygame.font.SysFont("arial", 36, bold=True)
FONT_XL = pygame.font.SysFont("arial", 54, bold=True)

WHITE = (245, 245, 245)
BLACK = (16, 18, 22)
BG = (19, 26, 34)
FIELD_BG = (31, 48, 41)
SIDEBAR_BG = (28, 33, 42)
CARD_BG = (42, 48, 59)
CARD_BG_ACTIVE = (58, 72, 100)
CARD_BG_LOCKED = (56, 44, 44)
PATH_COLOR = (188, 171, 133)
GRID_COLOR = (49, 68, 56)
RED = (214, 74, 74)
GREEN = (70, 194, 106)
BLUE = (90, 140, 220)
YELLOW = (225, 200, 60)
ORANGE = (232, 141, 63)
PURPLE = (153, 94, 215)
CYAN = (90, 200, 220)
GRAY = (145, 150, 160)
LIGHT = (232, 232, 232)
BOSS_RED = (160, 46, 46)
FAST_YELLOW = (240, 210, 80)
PANEL_LINE = (84, 95, 116)
TANK_GREEN = (96, 158, 92)
STEEL = (122, 130, 150)

PATH_POINTS = [
    (0, 140),
    (210, 140),
    (210, 360),
    (540, 360),
    (540, 205),
    (890, 205),
    (890, 645),
    (280, 645),
    (280, 835),
    (1130, 835),
]

DIFFICULTIES: Dict[str, Dict[str, float]] = {
    "leicht": {
        "max_level": 10,
        "count_mult": 1.0,
        "hp_mult": 1.0,
        "speed_mult": 1.0,
        "reward_mult": 1.0,
        "start_money": 240,
        "lives": 22,
    },
    "mittel": {
        "max_level": 25,
        "count_mult": 1.4,
        "hp_mult": 1.22,
        "speed_mult": 1.08,
        "reward_mult": 1.06,
        "start_money": 225,
        "lives": 19,
    },
    "schwer": {
        "max_level": 50,
        "count_mult": 2.0,
        "hp_mult": 1.58,
        "speed_mult": 1.18,
        "reward_mult": 1.11,
        "start_money": 210,
        "lives": 17,
    },
    "unmöglich": {
        "max_level": 99,
        "count_mult": 2.5,
        "hp_mult": 2.02,
        "speed_mult": 1.31,
        "reward_mult": 1.18,
        "start_money": 195,
        "lives": 14,
    },
}

TOWER_TYPES: Dict[str, Dict[str, float]] = {
    "Pistolman": {
        "unlock": 0,
        "cost": 60,
        "range": 130,
        "damage": 18,
        "cooldown": 0.55,
        "bullet_speed": 520,
        "color": BLUE,
        "kind": "single",
    },
    "Scharfschütze": {
        "unlock": 4,
        "cost": 145,
        "range": 320,
        "damage": 92,
        "cooldown": 1.5,
        "bullet_speed": 920,
        "color": PURPLE,
        "kind": "single",
    },
    "Stunner": {
        "unlock": 6,
        "cost": 112,
        "range": 160,
        "damage": 6,
        "cooldown": 0.8,
        "bullet_speed": 450,
        "color": CYAN,
        "kind": "stun",
        "slow_factor": 0.5,
        "slow_duration": 1.8,
    },
    "Bombarman": {
        "unlock": 8,
        "cost": 180,
        "range": 175,
        "damage": 42,
        "cooldown": 1.15,
        "bullet_speed": 360,
        "color": ORANGE,
        "kind": "splash",
        "splash_radius": 66,
    },
    "Panzer-Tower": {
        "unlock": 10,
        "cost": 420,
        "range": 245,
        "damage": 210,
        "cooldown": 1.0,
        "bullet_speed": 620,
        "color": TANK_GREEN,
        "kind": "cannon",
        "splash_radius": 82,
    },
}

TOWER_ORDER = ["Pistolman", "Scharfschütze", "Stunner", "Bombarman", "Panzer-Tower"]

ENEMY_ARCHETYPES: Dict[str, Dict[str, float]] = {
    "basic": {
        "base_hp": 42,
        "hp_growth": 11.0,
        "base_speed": 72,
        "speed_growth": 2.0,
        "reward_base": 10,
        "reward_growth": 0.7,
        "radius": 14,
        "color": (200, 86, 86),
        "armor": 0.0,
        "slow_resist": 0.0,
        "life_damage": 1,
    },
    "runner": {
        "base_hp": 30,
        "hp_growth": 8.2,
        "base_speed": 108,
        "speed_growth": 2.9,
        "reward_base": 12,
        "reward_growth": 0.75,
        "radius": 11,
        "color": FAST_YELLOW,
        "armor": 0.0,
        "slow_resist": 0.12,
        "life_damage": 1,
    },
    "brute": {
        "base_hp": 96,
        "hp_growth": 22.0,
        "base_speed": 52,
        "speed_growth": 1.4,
        "reward_base": 20,
        "reward_growth": 1.2,
        "radius": 18,
        "color": STEEL,
        "armor": 4.0,
        "slow_resist": 0.3,
        "life_damage": 2,
    },
}

BOSS_PROFILES: Dict[int, Dict[str, object]] = {
    1: {
        "name": "Eisenkoloss",
        "shape": "square",
        "color": (156, 62, 62),
        "hp_mult": 1.0,
        "speed_mult": 0.95,
        "armor": 3.0,
        "slow_resist": 0.12,
        "regen": 0.0,
        "reward_mult": 1.0,
        "radius": 26,
        "life_damage": 3,
    },
    2: {
        "name": "Klingenwurm",
        "shape": "diamond",
        "color": (192, 112, 70),
        "hp_mult": 1.12,
        "speed_mult": 1.08,
        "armor": 2.0,
        "slow_resist": 0.18,
        "regen": 0.0,
        "reward_mult": 1.1,
        "radius": 27,
        "life_damage": 3,
    },
    3: {
        "name": "Frostbrut",
        "shape": "triangle",
        "color": (88, 158, 220),
        "hp_mult": 1.26,
        "speed_mult": 1.0,
        "armor": 4.0,
        "slow_resist": 0.35,
        "regen": 1.2,
        "reward_mult": 1.2,
        "radius": 28,
        "life_damage": 4,
    },
    4: {
        "name": "Aschentitan",
        "shape": "hex",
        "color": (224, 114, 63),
        "hp_mult": 1.42,
        "speed_mult": 1.04,
        "armor": 5.0,
        "slow_resist": 0.28,
        "regen": 1.8,
        "reward_mult": 1.32,
        "radius": 29,
        "life_damage": 4,
    },
    5: {
        "name": "Schattenfürst",
        "shape": "star",
        "color": (124, 90, 192),
        "hp_mult": 1.62,
        "speed_mult": 1.12,
        "armor": 6.0,
        "slow_resist": 0.4,
        "regen": 2.3,
        "reward_mult": 1.48,
        "radius": 30,
        "life_damage": 5,
    },
    6: {
        "name": "Donnerbestie",
        "shape": "spikes",
        "color": (232, 200, 76),
        "hp_mult": 1.82,
        "speed_mult": 1.18,
        "armor": 6.0,
        "slow_resist": 0.48,
        "regen": 2.8,
        "reward_mult": 1.65,
        "radius": 31,
        "life_damage": 5,
    },
    7: {
        "name": "Obsidianhydra",
        "shape": "crown",
        "color": (96, 96, 110),
        "hp_mult": 2.04,
        "speed_mult": 1.1,
        "armor": 8.0,
        "slow_resist": 0.55,
        "regen": 3.6,
        "reward_mult": 1.85,
        "radius": 32,
        "life_damage": 6,
    },
    8: {
        "name": "Chronogolem",
        "shape": "orb",
        "color": (84, 198, 188),
        "hp_mult": 2.28,
        "speed_mult": 1.2,
        "armor": 8.0,
        "slow_resist": 0.65,
        "regen": 4.1,
        "reward_mult": 2.1,
        "radius": 33,
        "life_damage": 6,
    },
    9: {
        "name": "Weltenbrecher",
        "shape": "skull",
        "color": (214, 58, 104),
        "hp_mult": 2.6,
        "speed_mult": 1.28,
        "armor": 10.0,
        "slow_resist": 0.72,
        "regen": 5.2,
        "reward_mult": 2.45,
        "radius": 35,
        "life_damage": 7,
    },
}


@dataclass
class Enemy:
    pos: pygame.Vector2
    path_index: int
    hp: float
    max_hp: float
    speed: float
    reward: int
    enemy_type: str = "basic"
    radius: int = 14
    color: Tuple[int, int, int] = field(default_factory=lambda: (195, 85, 85))
    slow_factor: float = 1.0
    slow_timer: float = 0.0
    reached_end: bool = False
    dead: bool = False
    armor: float = 0.0
    slow_resistance: float = 0.0
    regen_per_sec: float = 0.0
    life_damage: int = 1
    boss_name: str = ""
    boss_shape: str = "circle"

    def update(self, dt: float) -> None:
        if self.dead or self.reached_end:
            return

        if self.regen_per_sec > 0 and self.hp > 0:
            self.hp = min(self.max_hp, self.hp + self.regen_per_sec * dt)

        if self.slow_timer > 0:
            self.slow_timer -= dt
            if self.slow_timer <= 0:
                self.slow_factor = 1.0

        if self.path_index >= len(PATH_POINTS) - 1:
            self.reached_end = True
            return

        target = pygame.Vector2(PATH_POINTS[self.path_index + 1])
        direction = target - self.pos
        distance = direction.length()
        if distance == 0:
            self.path_index += 1
            return

        direction.normalize_ip()
        movement = self.speed * self.slow_factor * dt
        if movement >= distance:
            self.pos = target
            self.path_index += 1
            if self.path_index >= len(PATH_POINTS) - 1:
                self.reached_end = True
        else:
            self.pos += direction * movement

    def take_damage(self, amount: float) -> bool:
        effective_damage = max(1.0, amount - self.armor)
        self.hp -= effective_damage
        if self.hp <= 0 and not self.dead:
            self.dead = True
            return True
        return False

    def apply_slow(self, factor: float, duration: float) -> None:
        effective_factor = 1.0 - (1.0 - factor) * (1.0 - self.slow_resistance)
        self.slow_factor = min(self.slow_factor, effective_factor)
        self.slow_timer = max(self.slow_timer, duration)

    def draw(self, surface: pygame.Surface) -> None:
        if self.dead:
            return

        pygame.draw.circle(surface, self.color, self.pos, self.radius)
        border_color = CYAN if self.slow_timer > 0 else BLACK
        pygame.draw.circle(surface, border_color, self.pos, self.radius + 2, 2)

        if self.enemy_type == "runner":
            pygame.draw.circle(surface, BLACK, (int(self.pos.x + 4), int(self.pos.y - 4)), 2)
        elif self.enemy_type == "brute":
            pygame.draw.rect(surface, BLACK, (self.pos.x - 8, self.pos.y - 8, 16, 16), 2, border_radius=3)

        if self.enemy_type == "boss":
            self.draw_boss_overlay(surface)
            bar_w = 82
            bar_h = 9
            y_offset = 20
        else:
            bar_w = 34
            bar_h = 5
            y_offset = 11

        x = self.pos.x - bar_w / 2
        y = self.pos.y - self.radius - y_offset
        pygame.draw.rect(surface, (60, 20, 20), (x, y, bar_w, bar_h), border_radius=2)
        ratio = max(0.0, self.hp / self.max_hp)
        pygame.draw.rect(surface, GREEN, (x, y, bar_w * ratio, bar_h), border_radius=2)

        if self.enemy_type == "boss":
            label = FONT_XS.render(self.boss_name, True, WHITE)
            surface.blit(label, (self.pos.x - label.get_width() / 2, y - 17))

    def draw_boss_overlay(self, surface: pygame.Surface) -> None:
        x = int(self.pos.x)
        y = int(self.pos.y)
        r = self.radius + 6

        if self.boss_shape == "square":
            pygame.draw.rect(surface, WHITE, (x - r, y - r, r * 2, r * 2), 2, border_radius=4)
        elif self.boss_shape == "diamond":
            points = [(x, y - r), (x + r, y), (x, y + r), (x - r, y)]
            pygame.draw.polygon(surface, WHITE, points, 2)
        elif self.boss_shape == "triangle":
            points = [(x, y - r), (x + r, y + r - 2), (x - r, y + r - 2)]
            pygame.draw.polygon(surface, WHITE, points, 2)
        elif self.boss_shape == "hex":
            points = [
                (x - r // 2, y - r),
                (x + r // 2, y - r),
                (x + r, y),
                (x + r // 2, y + r),
                (x - r // 2, y + r),
                (x - r, y),
            ]
            pygame.draw.polygon(surface, WHITE, points, 2)
        elif self.boss_shape == "star":
            points = [
                (x, y - r),
                (x + r // 3, y - r // 3),
                (x + r, y - r // 3),
                (x + r // 2, y + r // 4),
                (x + 2 * r // 3, y + r),
                (x, y + r // 2),
                (x - 2 * r // 3, y + r),
                (x - r // 2, y + r // 4),
                (x - r, y - r // 3),
                (x - r // 3, y - r // 3),
            ]
            pygame.draw.polygon(surface, WHITE, points, 2)
        elif self.boss_shape == "spikes":
            for i in range(8):
                angle = i * math.pi / 4
                inner = pygame.Vector2(x, y) + pygame.Vector2(math.cos(angle), math.sin(angle)) * (r - 6)
                outer = pygame.Vector2(x, y) + pygame.Vector2(math.cos(angle), math.sin(angle)) * (r + 6)
                pygame.draw.line(surface, WHITE, inner, outer, 2)
        elif self.boss_shape == "crown":
            points = [
                (x - r, y + r // 2),
                (x - r // 2, y - r),
                (x, y - r // 4),
                (x + r // 2, y - r),
                (x + r, y + r // 2),
            ]
            pygame.draw.polygon(surface, WHITE, points, 2)
        elif self.boss_shape == "orb":
            pygame.draw.circle(surface, WHITE, (x, y), r, 2)
            pygame.draw.circle(surface, WHITE, (x, y), r - 8, 2)
        elif self.boss_shape == "skull":
            pygame.draw.circle(surface, WHITE, (x, y - 3), r, 2)
            pygame.draw.rect(surface, WHITE, (x - r + 6, y + 2, (r - 6) * 2, r), 2, border_radius=4)
            pygame.draw.circle(surface, WHITE, (x - 8, y - 4), 4, 1)
            pygame.draw.circle(surface, WHITE, (x + 8, y - 4), 4, 1)
        else:
            pygame.draw.circle(surface, WHITE, (x, y), r, 2)


@dataclass
class Bullet:
    pos: pygame.Vector2
    target: Enemy
    damage: float
    speed: float
    color: Tuple[int, int, int]
    bullet_type: str
    splash_radius: float = 0.0
    slow_factor: float = 1.0
    slow_duration: float = 0.0
    radius: int = 5
    dead: bool = False

    def update(self, dt: float, enemies: List[Enemy]) -> List[Enemy]:
        killed: List[Enemy] = []
        if self.dead:
            return killed
        if self.target.dead or self.target.reached_end:
            self.dead = True
            return killed

        direction = self.target.pos - self.pos
        distance = direction.length()
        if distance == 0:
            distance = 0.001
        direction.normalize_ip()
        movement = self.speed * dt

        if movement >= distance or self.pos.distance_to(self.target.pos) <= self.target.radius + self.radius:
            killed.extend(self.hit(enemies))
            self.dead = True
        else:
            self.pos += direction * movement
        return killed

    def hit(self, enemies: List[Enemy]) -> List[Enemy]:
        killed: List[Enemy] = []
        if self.bullet_type == "single":
            if not self.target.dead and not self.target.reached_end:
                if self.target.take_damage(self.damage):
                    killed.append(self.target)
        elif self.bullet_type == "stun":
            if not self.target.dead and not self.target.reached_end:
                if self.target.take_damage(self.damage):
                    killed.append(self.target)
                self.target.apply_slow(self.slow_factor, self.slow_duration)
        elif self.bullet_type in {"splash", "cannon"}:
            center = pygame.Vector2(self.target.pos)
            for enemy in enemies:
                if enemy.dead or enemy.reached_end:
                    continue
                if enemy.pos.distance_to(center) <= self.splash_radius:
                    damage = self.damage
                    if self.bullet_type == "cannon" and enemy is self.target:
                        damage *= 1.2
                    elif self.bullet_type == "cannon":
                        damage *= 0.7
                    if enemy.take_damage(damage):
                        killed.append(enemy)
        return killed

    def draw(self, surface: pygame.Surface) -> None:
        if self.dead:
            return
        pygame.draw.circle(surface, self.color, self.pos, self.radius)


@dataclass
class Tower:
    pos: pygame.Vector2
    tower_type: str
    cooldown_left: float = 0.0

    @property
    def stats(self) -> Dict[str, float]:
        return TOWER_TYPES[self.tower_type]

    def update(self, dt: float, enemies: List[Enemy], bullets: List[Bullet]) -> None:
        if self.cooldown_left > 0:
            self.cooldown_left -= dt
        if self.cooldown_left > 0:
            return

        target = self.acquire_target(enemies)
        if not target:
            return

        stats = self.stats
        bullet_radius = 4
        if self.tower_type == "Bombarman":
            bullet_radius = 6
        elif self.tower_type == "Panzer-Tower":
            bullet_radius = 8

        bullets.append(
            Bullet(
                pos=pygame.Vector2(self.pos),
                target=target,
                damage=stats["damage"],
                speed=stats["bullet_speed"],
                color=stats["color"],
                bullet_type=str(stats["kind"]),
                splash_radius=float(stats.get("splash_radius", 0.0)),
                slow_factor=float(stats.get("slow_factor", 1.0)),
                slow_duration=float(stats.get("slow_duration", 0.0)),
                radius=bullet_radius,
            )
        )
        self.cooldown_left = stats["cooldown"]

    def acquire_target(self, enemies: List[Enemy]) -> Optional[Enemy]:
        in_range: List[Enemy] = []
        for enemy in enemies:
            if enemy.dead or enemy.reached_end:
                continue
            if self.pos.distance_to(enemy.pos) <= self.stats["range"]:
                in_range.append(enemy)
        if not in_range:
            return None
        return max(in_range, key=lambda enemy: (enemy.path_index, enemy.pos.x + enemy.pos.y, enemy.enemy_type == "boss"))

    def draw(self, surface: pygame.Surface, selected: bool = False) -> None:
        stats = self.stats
        base_color = stats["color"]
        pygame.draw.circle(surface, (20, 20, 25), self.pos, TOWER_RADIUS + 3)
        pygame.draw.circle(surface, base_color, self.pos, TOWER_RADIUS)

        if self.tower_type == "Pistolman":
            pygame.draw.rect(surface, LIGHT, (self.pos.x - 5, self.pos.y - 16, 10, 24), border_radius=3)
        elif self.tower_type == "Scharfschütze":
            pygame.draw.rect(surface, LIGHT, (self.pos.x - 3, self.pos.y - 18, 6, 28), border_radius=3)
            pygame.draw.line(surface, BLACK, (self.pos.x, self.pos.y - 18), (self.pos.x + 16, self.pos.y - 22), 3)
        elif self.tower_type == "Bombarman":
            pygame.draw.circle(surface, YELLOW, (int(self.pos.x), int(self.pos.y - 6)), 8)
            pygame.draw.line(surface, BLACK, (self.pos.x + 4, self.pos.y - 11), (self.pos.x + 9, self.pos.y - 16), 2)
        elif self.tower_type == "Stunner":
            pygame.draw.circle(surface, LIGHT, self.pos, 10, 3)
            pygame.draw.line(surface, CYAN, (self.pos.x - 12, self.pos.y), (self.pos.x + 12, self.pos.y), 2)
            pygame.draw.line(surface, CYAN, (self.pos.x, self.pos.y - 12), (self.pos.x, self.pos.y + 12), 2)
        elif self.tower_type == "Panzer-Tower":
            pygame.draw.rect(surface, LIGHT, (self.pos.x - 12, self.pos.y - 9, 24, 18), border_radius=5)
            pygame.draw.rect(surface, TANK_GREEN, (self.pos.x - 7, self.pos.y - 14, 14, 10), border_radius=4)
            pygame.draw.line(surface, BLACK, (self.pos.x, self.pos.y - 9), (self.pos.x + 20, self.pos.y - 16), 4)

        if selected:
            pygame.draw.circle(surface, WHITE, self.pos, int(stats["range"]), 1)
            pygame.draw.circle(surface, WHITE, self.pos, TOWER_RADIUS + 5, 2)


class Game:
    def __init__(self) -> None:
        self.state = "menu"
        self.running = True
        self.difficulty_name = "leicht"
        self.difficulty = DIFFICULTIES[self.difficulty_name]
        self.level = 1
        self.max_level = int(self.difficulty["max_level"])
        self.money = int(self.difficulty["start_money"])
        self.lives = int(self.difficulty["lives"])
        self.towers: List[Tower] = []
        self.enemies: List[Enemy] = []
        self.bullets: List[Bullet] = []
        self.selected_tower_name: Optional[str] = None
        self.wave_active = False
        self.wave_plan: List[str] = []
        self.spawn_timer = 0.0
        self.spawn_interval = 0.52
        self.spawned_this_wave = 0
        self.total_wave_enemies = 0
        self.current_wave_boss_name = ""
        self.menu_buttons = self.create_menu_buttons()
        self.message = ""
        self.message_timer = 0.0

    def create_menu_buttons(self) -> List[Tuple[pygame.Rect, str]]:
        names = ["leicht", "mittel", "schwer", "unmöglich"]
        buttons: List[Tuple[pygame.Rect, str]] = []
        x = SCREEN_W // 2 - 230
        start_y = 250
        for i, name in enumerate(names):
            rect = pygame.Rect(x, start_y + i * 96, 460, 70)
            buttons.append((rect, name))
        return buttons

    def reset_for_difficulty(self, difficulty_name: str) -> None:
        self.difficulty_name = difficulty_name
        self.difficulty = DIFFICULTIES[difficulty_name]
        self.level = 1
        self.max_level = int(self.difficulty["max_level"])
        self.money = int(self.difficulty["start_money"])
        self.lives = int(self.difficulty["lives"])
        self.towers.clear()
        self.enemies.clear()
        self.bullets.clear()
        self.selected_tower_name = None
        self.wave_active = False
        self.wave_plan = []
        self.spawn_timer = 0.0
        self.spawned_this_wave = 0
        self.total_wave_enemies = 0
        self.current_wave_boss_name = ""
        self.message = "Leertaste startet die erste Welle"
        self.message_timer = 4.0
        self.state = "playing"

    def show_message(self, text: str, seconds: float = 2.0) -> None:
        self.message = text
        self.message_timer = seconds

    def enemy_count_for_level(self, level: int) -> int:
        return max(1, int(math.ceil(level * self.difficulty["count_mult"])))

    def boss_stage_for_level(self, level: int) -> int:
        return max(1, min(level // 10, 9))

    def boss_key_for_level(self, level: int) -> str:
        return f"boss_{self.boss_stage_for_level(level)}"

    def build_wave_plan(self, level: int) -> List[str]:
        regular_count = self.enemy_count_for_level(level)
        runner_count = 0
        brute_count = 0

        if level >= 6:
            runner_ratio = min(0.18 + level * 0.008, 0.36)
            runner_count = max(1, int(round(regular_count * runner_ratio)))
        if level >= 12:
            brute_ratio = min(0.10 + (level - 12) * 0.005, 0.24)
            brute_count = max(1, int(round(regular_count * brute_ratio)))

        if runner_count + brute_count >= regular_count:
            overflow = runner_count + brute_count - (regular_count - 1)
            if brute_count >= overflow:
                brute_count -= overflow
            else:
                overflow -= brute_count
                brute_count = 0
                runner_count = max(0, runner_count - overflow)

        basic_count = max(1, regular_count - runner_count - brute_count)

        counts = {
            "basic": basic_count,
            "runner": runner_count,
            "brute": brute_count,
        }
        order = ["basic", "runner", "basic", "brute", "basic", "runner"]
        plan: List[str] = []
        while sum(counts.values()) > 0:
            for enemy_type in order:
                if counts.get(enemy_type, 0) > 0:
                    plan.append(enemy_type)
                    counts[enemy_type] -= 1

        if level % 10 == 0:
            plan.append(self.boss_key_for_level(level))
        return plan

    def preview_wave_info(self, level: int) -> Dict[str, object]:
        plan = self.build_wave_plan(level)
        boss_name = "-"
        for enemy_type in plan:
            if enemy_type.startswith("boss_"):
                stage = int(enemy_type.split("_")[1])
                boss_name = str(BOSS_PROFILES[stage]["name"])
                break
        return {
            "count": len(plan),
            "boss": boss_name != "-",
            "boss_name": boss_name,
            "basic": sum(1 for enemy_type in plan if enemy_type == "basic"),
            "runner": sum(1 for enemy_type in plan if enemy_type == "runner"),
            "brute": sum(1 for enemy_type in plan if enemy_type == "brute"),
        }

    def start_wave(self) -> None:
        if self.wave_active or self.wave_plan:
            return
        if self.level > self.max_level:
            return

        self.wave_plan = self.build_wave_plan(self.level)
        self.total_wave_enemies = len(self.wave_plan)
        self.spawned_this_wave = 0
        self.current_wave_boss_name = ""
        for enemy_type in self.wave_plan:
            if enemy_type.startswith("boss_"):
                stage = int(enemy_type.split("_")[1])
                self.current_wave_boss_name = str(BOSS_PROFILES[stage]["name"])
                break
        self.wave_active = True
        self.spawn_interval = max(0.11, 0.48 - min(self.level, 90) * 0.0024)
        self.spawn_timer = 0.08
        extra = f" + Boss: {self.current_wave_boss_name}" if self.current_wave_boss_name else ""
        self.show_message(f"Level {self.level} gestartet: {self.total_wave_enemies} Gegner{extra}", 2.2)

    def spawn_enemy(self, enemy_type: str) -> None:
        diff_hp = self.difficulty["hp_mult"]
        diff_speed = self.difficulty["speed_mult"]
        diff_reward = self.difficulty["reward_mult"]
        level_factor = self.level

        if enemy_type.startswith("boss_"):
            stage = int(enemy_type.split("_")[1])
            profile = BOSS_PROFILES[stage]
            hp = (540 + level_factor * 130) * diff_hp * float(profile["hp_mult"]) * random.uniform(0.98, 1.04)
            speed = (48 + level_factor * 1.15) * diff_speed * float(profile["speed_mult"]) * random.uniform(0.98, 1.03)
            reward = int((88 + level_factor * 10) * diff_reward * float(profile["reward_mult"]))
            self.enemies.append(
                Enemy(
                    pos=pygame.Vector2(PATH_POINTS[0]),
                    path_index=0,
                    hp=hp,
                    max_hp=hp,
                    speed=speed,
                    reward=reward,
                    enemy_type="boss",
                    radius=int(profile["radius"]),
                    color=profile["color"],
                    armor=float(profile["armor"]) + level_factor * 0.05,
                    slow_resistance=float(profile["slow_resist"]),
                    regen_per_sec=float(profile["regen"]),
                    life_damage=int(profile["life_damage"]),
                    boss_name=str(profile["name"]),
                    boss_shape=str(profile["shape"]),
                )
            )
            return

        archetype = ENEMY_ARCHETYPES[enemy_type]
        hp = (archetype["base_hp"] + level_factor * archetype["hp_growth"]) * diff_hp * random.uniform(0.96, 1.08)
        speed = (archetype["base_speed"] + level_factor * archetype["speed_growth"]) * diff_speed * random.uniform(0.97, 1.04)
        reward = int((archetype["reward_base"] + level_factor * archetype["reward_growth"]) * diff_reward)
        armor = float(archetype.get("armor", 0.0)) + level_factor * (0.03 if enemy_type == "brute" else 0.0)

        self.enemies.append(
            Enemy(
                pos=pygame.Vector2(PATH_POINTS[0]),
                path_index=0,
                hp=hp,
                max_hp=hp,
                speed=speed,
                reward=reward,
                enemy_type=enemy_type,
                radius=int(archetype["radius"]),
                color=archetype["color"],
                armor=armor,
                slow_resistance=float(archetype.get("slow_resist", 0.0)),
                life_damage=int(archetype.get("life_damage", 1)),
            )
        )

    def update(self, dt: float) -> None:
        if self.state != "playing":
            if self.message_timer > 0:
                self.message_timer -= dt
            return

        if self.message_timer > 0:
            self.message_timer -= dt
            if self.message_timer <= 0:
                self.message = ""

        if self.wave_active and self.wave_plan:
            self.spawn_timer -= dt
            if self.spawn_timer <= 0:
                enemy_type = self.wave_plan.pop(0)
                self.spawn_enemy(enemy_type)
                self.spawned_this_wave += 1
                self.spawn_timer = self.spawn_interval * (1.6 if enemy_type.startswith("boss_") else 1.0)

        for enemy in self.enemies:
            enemy.update(dt)
            if enemy.reached_end and not enemy.dead:
                enemy.dead = True
                self.lives -= enemy.life_damage

        for tower in self.towers:
            tower.update(dt, self.enemies, self.bullets)

        for bullet in self.bullets:
            killed = bullet.update(dt, self.enemies)
            if killed:
                unique_kills = {id(enemy): enemy for enemy in killed}.values()
                for enemy in unique_kills:
                    self.money += enemy.reward

        self.enemies = [enemy for enemy in self.enemies if not enemy.dead]
        self.bullets = [bullet for bullet in self.bullets if not bullet.dead]

        if self.wave_active and not self.wave_plan and not self.enemies:
            self.wave_active = False
            self.level += 1
            if self.level > self.max_level:
                self.state = "victory"
                self.show_message("Sieg! Alle Level abgeschlossen.", 5)
            else:
                self.money += 28 + self.level * 2
                self.show_message(f"Level geschafft. Nächstes Level: {self.level}", 3)

        if self.lives <= 0:
            self.state = "game_over"
            self.show_message("Game Over", 5)

    def handle_event(self, event: pygame.event.Event) -> None:
        if event.type == pygame.QUIT:
            self.running = False
            return

        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_r:
                self.state = "menu"
                self.selected_tower_name = None
                self.show_message("", 0)
                return

        if self.state == "menu":
            self.handle_menu_event(event)
        elif self.state == "playing":
            self.handle_play_event(event)
        elif self.state in {"game_over", "victory"}:
            self.handle_end_event(event)

    def handle_menu_event(self, event: pygame.event.Event) -> None:
        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            for rect, name in self.menu_buttons:
                if rect.collidepoint(event.pos):
                    self.reset_for_difficulty(name)
                    return
        if event.type == pygame.KEYDOWN:
            key_map = {
                pygame.K_1: "leicht",
                pygame.K_2: "mittel",
                pygame.K_3: "schwer",
                pygame.K_4: "unmöglich",
            }
            if event.key in key_map:
                self.reset_for_difficulty(key_map[event.key])

    def handle_end_event(self, event: pygame.event.Event) -> None:
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_RETURN:
                self.reset_for_difficulty(self.difficulty_name)
            elif event.key == pygame.K_r:
                self.state = "menu"

    def handle_play_event(self, event: pygame.event.Event) -> None:
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_SPACE:
                self.start_wave()
            elif event.key == pygame.K_ESCAPE:
                self.selected_tower_name = None
            elif event.key == pygame.K_1:
                self.try_select_tower("Pistolman")
            elif event.key == pygame.K_2:
                self.try_select_tower("Scharfschütze")
            elif event.key == pygame.K_3:
                self.try_select_tower("Stunner")
            elif event.key == pygame.K_4:
                self.try_select_tower("Bombarman")
            elif event.key == pygame.K_5:
                self.try_select_tower("Panzer-Tower")

        if event.type == pygame.MOUSEBUTTONDOWN:
            if event.button == 3:
                self.selected_tower_name = None
                return
            if event.button == 1:
                mx, my = event.pos
                if mx >= FIELD_W:
                    tower_name = self.sidebar_click_to_tower(event.pos)
                    if tower_name:
                        self.try_select_tower(tower_name)
                    return
                if self.selected_tower_name:
                    self.place_tower(event.pos)

    def try_select_tower(self, tower_name: str) -> None:
        unlock = int(TOWER_TYPES[tower_name]["unlock"])
        if self.level < unlock:
            self.show_message(f"{tower_name} ab Level {unlock}", 2.0)
            return
        cost = int(TOWER_TYPES[tower_name]["cost"])
        if self.money < cost:
            self.show_message("Nicht genug Geld", 1.6)
            return
        self.selected_tower_name = tower_name

    def tower_card_rect(self, index: int) -> pygame.Rect:
        start_y = 360
        gap = 14
        inner_x = FIELD_W + 18
        inner_w = SIDEBAR_W - 36
        card_w = (inner_w - gap) // 2
        card_h = 112
        col = index % 2
        row = index // 2
        x = inner_x + col * (card_w + gap)
        y = start_y + row * (card_h + gap)
        if index == len(TOWER_ORDER) - 1:
            x = inner_x + (inner_w - card_w) // 2
        return pygame.Rect(x, y, card_w, card_h)

    def sidebar_click_to_tower(self, pos: Tuple[int, int]) -> Optional[str]:
        x, y = pos
        if x < FIELD_W:
            return None
        for i, name in enumerate(TOWER_ORDER):
            if self.tower_card_rect(i).collidepoint((x, y)):
                return name
        return None

    def place_tower(self, pos: Tuple[int, int]) -> None:
        if not self.selected_tower_name:
            return
        tower_name = self.selected_tower_name
        cost = int(TOWER_TYPES[tower_name]["cost"])

        if self.money < cost:
            self.show_message("Nicht genug Geld", 1.6)
            return
        if not self.valid_tower_position(pos):
            self.show_message("Turm kann dort nicht platziert werden", 1.6)
            return

        self.money -= cost
        self.towers.append(Tower(pos=pygame.Vector2(pos), tower_type=tower_name))
        self.show_message(f"{tower_name} platziert", 1.2)

    def valid_tower_position(self, pos: Tuple[int, int]) -> bool:
        x, y = pos
        if x < TOWER_RADIUS + 6 or x > FIELD_W - TOWER_RADIUS - 6:
            return False
        if y < TOWER_RADIUS + 6 or y > SCREEN_H - TOWER_RADIUS - 6:
            return False

        p = pygame.Vector2(pos)
        for tower in self.towers:
            if tower.pos.distance_to(p) < TOWER_RADIUS * 2 + 8:
                return False

        for i in range(len(PATH_POINTS) - 1):
            a = pygame.Vector2(PATH_POINTS[i])
            b = pygame.Vector2(PATH_POINTS[i + 1])
            if distance_point_to_segment(p, a, b) <= PATH_WIDTH / 2 + TOWER_RADIUS + 4:
                return False
        return True

    def draw(self) -> None:
        SCREEN.fill(BG)
        if self.state == "menu":
            self.draw_menu()
        elif self.state == "playing":
            self.draw_field()
            self.draw_sidebar()
            self.draw_hud_message()
        elif self.state == "game_over":
            self.draw_field(dim=True)
            self.draw_sidebar(dim=True)
            self.draw_end_screen("Game Over", RED)
        elif self.state == "victory":
            self.draw_field(dim=True)
            self.draw_sidebar(dim=True)
            self.draw_end_screen("Sieg", GREEN)
        pygame.display.flip()

    def draw_grid(self, surface: pygame.Surface) -> None:
        for x in range(0, FIELD_W, GRID_SIZE):
            pygame.draw.line(surface, GRID_COLOR, (x, 0), (x, SCREEN_H), 1)
        for y in range(0, SCREEN_H, GRID_SIZE):
            pygame.draw.line(surface, GRID_COLOR, (0, y), (FIELD_W, y), 1)

    def draw_path(self, surface: pygame.Surface) -> None:
        if len(PATH_POINTS) < 2:
            return
        pygame.draw.lines(surface, PATH_COLOR, False, PATH_POINTS, PATH_WIDTH)
        pygame.draw.lines(surface, (120, 103, 70), False, PATH_POINTS, 4)
        start_label = FONT_S.render("Start", True, BLACK)
        end_label = FONT_S.render("Ziel", True, BLACK)
        surface.blit(start_label, (PATH_POINTS[0][0] + 16, PATH_POINTS[0][1] - 28))
        surface.blit(end_label, (PATH_POINTS[-1][0] - 12, PATH_POINTS[-1][1] - 32))

    def draw_field(self, dim: bool = False) -> None:
        field_surface = pygame.Surface((FIELD_W, SCREEN_H))
        field_surface.fill(FIELD_BG)
        self.draw_grid(field_surface)
        self.draw_path(field_surface)

        selected = self.selected_tower_name
        mouse_pos = pygame.mouse.get_pos()
        if self.state == "playing" and selected and mouse_pos[0] < FIELD_W:
            preview_color = TOWER_TYPES[selected]["color"]
            preview_pos = pygame.Vector2(mouse_pos)
            valid = self.valid_tower_position(mouse_pos)
            pygame.draw.circle(field_surface, WHITE, preview_pos, int(TOWER_TYPES[selected]["range"]), 1)
            pygame.draw.circle(field_surface, preview_color if valid else RED, preview_pos, TOWER_RADIUS, 2)

        for tower in self.towers:
            tower.draw(field_surface, selected=False)
        for enemy in self.enemies:
            enemy.draw(field_surface)
        for bullet in self.bullets:
            bullet.draw(field_surface)

        if dim:
            overlay = pygame.Surface((FIELD_W, SCREEN_H), pygame.SRCALPHA)
            overlay.fill((0, 0, 0, 120))
            field_surface.blit(overlay, (0, 0))

        SCREEN.blit(field_surface, (0, 0))

    def draw_sidebar(self, dim: bool = False) -> None:
        panel = pygame.Rect(FIELD_W, 0, SIDEBAR_W, SCREEN_H)
        pygame.draw.rect(SCREEN, SIDEBAR_BG, panel)
        pygame.draw.line(SCREEN, PANEL_LINE, (FIELD_W, 0), (FIELD_W, SCREEN_H), 2)

        title = FONT_L.render("Tower Defense", True, WHITE)
        SCREEN.blit(title, (FIELD_W + 22, 16))

        stats_box = pygame.Rect(FIELD_W + 18, 68, SIDEBAR_W - 36, 128)
        pygame.draw.rect(SCREEN, CARD_BG, stats_box, border_radius=12)
        pygame.draw.rect(SCREEN, PANEL_LINE, stats_box, 2, border_radius=12)
        self.draw_label_pair("Schwierigkeit", self.difficulty_name.title(), 82)
        self.draw_label_pair("Level", f"{min(self.level, self.max_level)}/{self.max_level}", 110)
        self.draw_label_pair("Geld", str(self.money), 138)
        self.draw_label_pair("Leben", str(self.lives), 166)

        preview = self.preview_wave_info(self.level)
        wave_box = pygame.Rect(FIELD_W + 18, 212, SIDEBAR_W - 36, 128)
        pygame.draw.rect(SCREEN, CARD_BG, wave_box, border_radius=12)
        pygame.draw.rect(SCREEN, PANEL_LINE, wave_box, 2, border_radius=12)
        wave_title = FONT_M.render("Wellen-Statistik", True, WHITE)
        SCREEN.blit(wave_title, (wave_box.x + 12, wave_box.y + 8))

        if self.wave_active:
            remaining = len(self.wave_plan) + len(self.enemies)
            boss_text = self.current_wave_boss_name if self.current_wave_boss_name else "-"
            lines = [
                f"Aktive Welle: {self.spawned_this_wave}/{self.total_wave_enemies}",
                f"Offene Gegner: {remaining}",
                f"Multiplikator: x{self.difficulty['count_mult']}",
                f"Boss: {boss_text}",
            ]
        else:
            lines = [
                f"Nächste Welle: {preview['count']} Gegner",
                f"Normale/Schnelle: {preview['basic']}/{preview['runner']}",
                f"Panzergegner: {preview['brute']}",
                f"Boss: {preview['boss_name']}",
            ]
        for idx, line in enumerate(lines):
            txt = FONT_S.render(line, True, LIGHT)
            SCREEN.blit(txt, (wave_box.x + 12, wave_box.y + 42 + idx * 20))

        section = FONT_M.render("Türme", True, WHITE)
        SCREEN.blit(section, (FIELD_W + 18, 330))

        for i, name in enumerate(TOWER_ORDER):
            rect = self.tower_card_rect(i)
            stats = TOWER_TYPES[name]
            unlock = int(stats["unlock"])
            unlocked = self.level >= unlock
            affordable = self.money >= int(stats["cost"])
            is_selected = self.selected_tower_name == name

            fill = CARD_BG
            if is_selected:
                fill = CARD_BG_ACTIVE
            elif unlocked and not affordable:
                fill = CARD_BG_LOCKED

            pygame.draw.rect(SCREEN, fill, rect, border_radius=12)
            pygame.draw.rect(SCREEN, stats["color"], rect, 2, border_radius=12)

            name_text = FONT_M.render(name, True, WHITE if unlocked else GRAY)
            SCREEN.blit(name_text, (rect.x + 10, rect.y + 8))

            cost_text = FONT_S.render(f"Kosten: {int(stats['cost'])}", True, WHITE if affordable else RED)
            range_text = FONT_S.render(f"Range: {int(stats['range'])}", True, LIGHT)
            damage_text = FONT_S.render(f"DMG: {int(stats['damage'])}", True, LIGHT)
            SCREEN.blit(cost_text, (rect.x + 10, rect.y + 40))
            SCREEN.blit(range_text, (rect.x + 10, rect.y + 62))
            SCREEN.blit(damage_text, (rect.x + rect.width - damage_text.get_width() - 10, rect.y + 62))

            if not unlocked:
                unlock_text = FONT_S.render(f"Ab Level {unlock}", True, YELLOW)
                SCREEN.blit(unlock_text, (rect.x + 10, rect.y + 86))
            else:
                hotkey = FONT_S.render(f"Taste {i + 1}", True, LIGHT)
                SCREEN.blit(hotkey, (rect.x + 10, rect.y + 86))

            if name == "Scharfschütze":
                tag = "sehr weite Reichweite"
            elif name == "Bombarman":
                tag = "Flächenschaden"
            elif name == "Stunner":
                tag = "verlangsamt Gegner"
            elif name == "Panzer-Tower":
                tag = "teuer, aber extrem stark"
            else:
                tag = "Standard-Tower"
            tag_text = FONT_XS.render(tag, True, GRAY)
            SCREEN.blit(tag_text, (rect.x + rect.width - tag_text.get_width() - 10, rect.y + 88))

        help_box = pygame.Rect(FIELD_W + 18, 780, SIDEBAR_W - 36, 170)
        pygame.draw.rect(SCREEN, CARD_BG, help_box, border_radius=12)
        pygame.draw.rect(SCREEN, PANEL_LINE, help_box, 2, border_radius=12)
        help_lines = [
            "Leertaste: Welle starten",
            "Linksklick: Tower platzieren",
            "Rechtsklick / ESC: Auswahl löschen",
            "R: Zurück ins Menü",
            "Gegnerzahl = ceil(Level × Schwierigkeits-Multiplikator)",
            "Alle 10 Level erscheint ein anderer Boss",
        ]
        for idx, line in enumerate(help_lines):
            text = FONT_S.render(line, True, LIGHT)
            SCREEN.blit(text, (help_box.x + 12, help_box.y + 16 + idx * 24))

        if dim:
            overlay = pygame.Surface((SIDEBAR_W, SCREEN_H), pygame.SRCALPHA)
            overlay.fill((0, 0, 0, 120))
            SCREEN.blit(overlay, (FIELD_W, 0))

    def draw_label_pair(self, label: str, value: str, y: int) -> None:
        label_text = FONT_S.render(label, True, GRAY)
        value_text = FONT_M.render(value, True, WHITE)
        SCREEN.blit(label_text, (FIELD_W + 32, y))
        SCREEN.blit(value_text, (FIELD_W + 220, y - 4))

    def draw_hud_message(self) -> None:
        if not self.message:
            return
        box = pygame.Rect(24, 18, 760, 44)
        pygame.draw.rect(SCREEN, (15, 20, 25), box, border_radius=10)
        pygame.draw.rect(SCREEN, WHITE, box, 2, border_radius=10)
        text = FONT_S.render(self.message, True, WHITE)
        SCREEN.blit(text, (box.x + 14, box.y + 12))

    def draw_menu(self) -> None:
        SCREEN.fill((18, 24, 32))
        title = FONT_XL.render("Tower Defense", True, WHITE)
        subtitle = FONT_M.render("Schwierigkeit wählen", True, LIGHT)
        desc = FONT_S.render("1-4 oder Klick. Max-Level: 10 / 25 / 50 / 99", True, GRAY)
        SCREEN.blit(title, (SCREEN_W // 2 - title.get_width() // 2, 102))
        SCREEN.blit(subtitle, (SCREEN_W // 2 - subtitle.get_width() // 2, 170))
        SCREEN.blit(desc, (SCREEN_W // 2 - desc.get_width() // 2, 205))

        mouse = pygame.mouse.get_pos()
        for rect, name in self.menu_buttons:
            hovered = rect.collidepoint(mouse)
            color = (50, 60, 80) if hovered else (38, 45, 58)
            pygame.draw.rect(SCREEN, color, rect, border_radius=14)
            pygame.draw.rect(SCREEN, WHITE, rect, 2, border_radius=14)
            label = FONT_L.render(name.title(), True, WHITE)
            info = FONT_S.render(
                f"Max Level: {int(DIFFICULTIES[name]['max_level'])} | Gegner x{DIFFICULTIES[name]['count_mult']}",
                True,
                LIGHT,
            )
            SCREEN.blit(label, (rect.centerx - label.get_width() // 2, rect.y + 7))
            SCREEN.blit(info, (rect.centerx - info.get_width() // 2, rect.y + 44))

        info_lines = [
            "Gegnerzahl pro Welle: ceil(Level × Schwierigkeits-Multiplikator)",
            "Ab Level 6 erscheinen schnelle Gegner, ab Level 12 Panzergegner",
            "Jedes 10. Level hat einen eigenen Boss mit anderer Optik und anderen Stats",
            "Pistolman 0 | Scharfschütze 4 | Stunner 6 | Bombarman 8 | Panzer-Tower 10",
            "Panzer-Tower: sehr teuer, dafür massiver Schaden mit Kanonensplash",
        ]
        y = 730
        for line in info_lines:
            txt = FONT_S.render(line, True, LIGHT)
            SCREEN.blit(txt, (SCREEN_W // 2 - txt.get_width() // 2, y))
            y += 26

    def draw_end_screen(self, title_text: str, color: Tuple[int, int, int]) -> None:
        title = FONT_XL.render(title_text, True, color)
        line1 = FONT_M.render(f"Schwierigkeit: {self.difficulty_name.title()}", True, WHITE)
        line2 = FONT_M.render(f"Erreichtes Level: {min(self.level, self.max_level)}/{self.max_level}", True, WHITE)
        line3 = FONT_S.render("ENTER = gleiche Schwierigkeit neu starten | R = Menü", True, LIGHT)

        cx = SCREEN_W // 2
        SCREEN.blit(title, (cx - title.get_width() // 2, 260))
        SCREEN.blit(line1, (cx - line1.get_width() // 2, 345))
        SCREEN.blit(line2, (cx - line2.get_width() // 2, 380))
        SCREEN.blit(line3, (cx - line3.get_width() // 2, 430))


def distance_point_to_segment(p: pygame.Vector2, a: pygame.Vector2, b: pygame.Vector2) -> float:
    ab = b - a
    if ab.length_squared() == 0:
        return p.distance_to(a)
    t = max(0.0, min(1.0, (p - a).dot(ab) / ab.length_squared()))
    projection = a + ab * t
    return p.distance_to(projection)


def main() -> None:
    game = Game()
    while game.running:
        dt = CLOCK.tick(FPS) / 1000.0
        for event in pygame.event.get():
            game.handle_event(event)
        game.update(dt)
        game.draw()

    pygame.quit()
    sys.exit()


if __name__ == "__main__":
    main()
