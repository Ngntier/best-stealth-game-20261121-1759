// SHADOW LANE — the three museum floors. Each level is an ASCII map plus the
// patrol route of every guard on it. Legend: # wall, C crate (blocks sight
// and movement), B bush (hides the thief), E exit, * moon-gem, P thief start.
// Guards spawn on their first waypoint; every waypoint is a walkable tile.
export const LEVELS = [
  {
    name: 'THE GALLERY',
    tip: 'Crates block a guard\u2019s sight. Bushes hide you completely.',
    map: [
      '########################',
      '#P....C........*.......#',
      '#......................#',
      '#..B.....##......B.....#',
      '#......................#',
      '#..C.....##....C.......#',
      '#......................#',
      '#......................#',
      '#......................#',
      '#..B.....C.......B.....#',
      '#........*.............#',
      '#....C.........C.......#',
      '#......................#',
      '#..B...........B..E....#',
      '#........*.............#',
      '########################',
    ],
    guards: [
      { waypoints: [[5, 7], [18, 7]] },
      { waypoints: [[13, 2], [13, 13]] },
    ],
  },
  {
    name: 'THE VAULT WING',
    tip: 'Running is loud — guards hear footsteps. Hold SHIFT to sneak.',
    map: [
      '########################',
      '#P...#......C......*...#',
      '#......................#',
      '#.B..#..####..C...B....#',
      '#....#..#..#...........#',
      '#....#..#..#..####.....#',
      '#.C.....#..#..#........#',
      '#.......#..#..#........#',
      '#......C#..#..#........#',
      '#....#.....#..#..B.....#',
      '#.B..#..C..#..#........#',
      '#....#.....#..#..C.....#',
      '#....#.....#..#........#',
      '#..*....#.....#..*.E...#',
      '#....C..#..B..#........#',
      '########################',
    ],
    guards: [
      { waypoints: [[2, 7], [2, 13]] },
      { waypoints: [[18, 2], [18, 13]] },
      { waypoints: [[20, 3], [20, 12]] },
    ],
  },
  {
    name: 'THE MOON PEARL',
    tip: 'Four guards, one pearl. Patience beats speed — learn the patrols.',
    map: [
      '########################',
      '#P..C....#.....*....#..#',
      '#.......#......#....#..#',
      '#..B....#..C...#..B.#..#',
      '#.......#......#....#..#',
      '#.......####...#....#..#',
      '#.......#......#....#..#',
      '#..C.....B...#..C......#',
      '#.......#......#....#..#',
      '#.......#......#....#..#',
      '#..B....#......#.B..#..#',
      '#.......#..C...#....#..#',
      '#.......#......#....#..#',
      '#.......#..*...#..*.E..#',
      '#..C....#......#....#..#',
      '########################',
    ],
    guards: [
      { waypoints: [[2, 5], [2, 12]] },
      { waypoints: [[13, 2], [13, 9]] },
      { waypoints: [[19, 2], [19, 13]] },
      { waypoints: [[10, 6], [14, 6]] },
    ],
  },
];

/** Turn a level's ASCII map into tiles, gems, exit and player start. */
export function parseLevel(level) {
  const rows = level.map.length;
  const cols = level.map[0].length;
  const walls = [];
  const crates = [];
  const bushes = [];
  const gems = [];
  let exit = null;
  let playerStart = null;
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const ch = level.map[y][x];
      if (ch === '#') walls.push([x, y]);
      else if (ch === 'C') crates.push([x, y]);
      else if (ch === 'B') bushes.push([x, y]);
      else if (ch === '*') gems.push({ x, y, taken: false });
      else if (ch === 'E') exit = { x, y };
      else if (ch === 'P') playerStart = { x, y };
    }
  }
  return { rows, cols, walls, crates, bushes, gems, exit, playerStart };
}

/** True when tile (x, y) blocks movement or sight. */
export function isSolidTile(parsed, x, y) {
  if (x < 0 || y < 0 || x >= parsed.cols || y >= parsed.rows) return true;
  for (const [wx, wy] of parsed.walls) if (wx === x && wy === y) return true;
  for (const [cx, cy] of parsed.crates) if (cx === x && cy === y) return true;
  return false;
}

/** True when the thief standing on tile (x, y) is hidden inside a bush. */
export function isBushTile(parsed, x, y) {
  for (const [bx, by] of parsed.bushes) if (bx === x && by === y) return true;
  return false;
}
