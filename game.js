// Hora Pico: Metro de Caracas — Platanus Hack 26: Caracas
// Llega al tren antes de que cierren las puertas: empuja, patea y abrete paso entre la gente.
// Cada estacion se arma distinta: escaleras mecanicas (algunas danadas), pasillos con buhoneros,
// piso mojado, transbordos y el piso de Cruz-Diez.

const W = 800;
const H = 600;
const PS = 3; // tamano del pixel de los personajes
const TY = 150; // borde del anden (donde empieza el tren)
const PLAT = 620; // fin del anden
const STORE_KEY = 'hora-pico-metro-v1';

// DO NOT replace existing keys — they match the physical arcade cabinet wiring.
// To add local testing shortcuts, append extra keys to any array.
const CABINET_KEYS = {
  P1_U: ['w'],
  P1_D: ['s'],
  P1_L: ['a'],
  P1_R: ['d'],
  P1_1: ['u'],
  P1_2: ['i'],
  P1_3: ['o'],
  P1_4: ['j'],
  P1_5: ['k'],
  P1_6: ['l'],
  P2_U: ['ArrowUp'],
  P2_D: ['ArrowDown'],
  P2_L: ['ArrowLeft'],
  P2_R: ['ArrowRight'],
  P2_1: ['r'],
  P2_2: ['t'],
  P2_3: ['y'],
  P2_4: ['f'],
  P2_5: ['g'],
  P2_6: ['h'],
  START1: ['Enter'],
  START2: ['2'],
};

const norm = (k) => (k.length === 1 ? k.toLowerCase() : k);
const K2A = {};
for (const [c, ks] of Object.entries(CABINET_KEYS)) for (const k of ks) K2A[norm(k)] = c;

const held = {};
const prs = {};
window.addEventListener('keydown', (e) => {
  au();
  const c = K2A[norm(e.key)];
  if (!c) return;
  if (!held[c]) prs[c] = 1;
  held[c] = 1;
});
window.addEventListener('keyup', (e) => {
  const c = K2A[norm(e.key)];
  if (c) held[c] = 0;
});
// cualquiera de los dos joysticks controla al chamo
const hold = (c) => (held['P1_' + c] || held['P2_' + c] ? 1 : 0);
const tap = (...cs) => cs.some((c) => prs['P1_' + c] || prs['P2_' + c] || prs[c]);
const tapGo = () => tap('START1', 'START2', '1');

// ---------- Storage ----------
function st() {
  if (window.platanusArcadeStorage) return window.platanusArcadeStorage;
  return {
    async get(k) {
      try {
        const r = localStorage.getItem(k);
        return r === null ? { found: false, value: null } : { found: true, value: JSON.parse(r) };
      } catch (e) {
        return { found: false, value: null };
      }
    },
    async set(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch (e) {}
    },
  };
}
const DEF_BEST = [
  { n: 'VIV', s: 5000 },
  { n: 'PAN', s: 3000 },
  { n: 'CHA', s: 1800 },
  { n: 'MO.', s: 900 },
  { n: 'PIL', s: 300 },
];
function cleanBest(v) {
  const a = Array.isArray(v) ? v : [];
  const ok = a
    .filter((e) => e && typeof e.n === 'string' && Number.isFinite(e.s))
    .map((e) => ({ n: e.n.slice(0, 3).toUpperCase(), s: Math.floor(e.s) }));
  return ok
    .concat(DEF_BEST.slice(0, Math.max(0, 5 - ok.length)))
    .sort((x, y) => y.s - x.s)
    .slice(0, 5);
}

// ---------- Audio (Web Audio generado) ----------
let AC = null;
let MG = null;
let NB = null;
function au() {
  if (!AC) {
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      MG = AC.createGain();
      MG.gain.value = 0.5;
      MG.connect(AC.destination);
      NB = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
      const d = NB.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) {
      AC = null;
    }
  }
  if (AC && AC.state === 'suspended') AC.resume();
}
const mf = (m) => 440 * Math.pow(2, (m - 69) / 12);
function tone(f, d, ty, v, w = 0, f2) {
  if (!AC) return;
  const t = AC.currentTime + w;
  const o = AC.createOscillator();
  const g = AC.createGain();
  o.type = ty;
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + d);
  o.connect(g);
  g.connect(MG);
  o.start(t);
  o.stop(t + d + 0.02);
}
function noise(d, v, w = 0) {
  if (!AC) return;
  const t = AC.currentTime + w;
  const s = AC.createBufferSource();
  const g = AC.createGain();
  s.buffer = NB;
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + d);
  s.connect(g);
  g.connect(MG);
  s.start(t, Math.random() * 0.5, d + 0.05);
}
const arp = (ns, step, ty, v) => ns.forEach((n, i) => tone(mf(n), step * 1.3, ty, v, i * step));
const sPush = () => {
  noise(0.08, 0.25);
  tone(170, 0.1, 'square', 0.08, 0, 80);
};
const sKick = () => {
  noise(0.2, 0.15);
  tone(250, 0.22, 'sawtooth', 0.06, 0, 900);
};
const sChuza = () => arp([72, 76, 79, 84, 88], 0.05, 'square', 0.07);
const sWhistle = () => [0, 0.12, 0.24].forEach((w, i) => tone(i % 2 ? 2400 : 2200, 0.12, 'square', 0.05, w));
const sChime = () => {
  tone(mf(79), 0.6, 'sine', 0.18);
  tone(mf(76), 0.6, 'sine', 0.18, 0.35);
  tone(mf(72), 0.9, 'sine', 0.18, 0.7);
};
const sBeep = () => tone(1050, 0.12, 'square', 0.06);
const sDoor = () => {
  noise(0.4, 0.2);
  tone(110, 0.4, 'square', 0.08, 0, 60);
};
const sTrain = () => {
  noise(1.2, 0.12);
  tone(70, 1.2, 'sawtooth', 0.06, 0, 140);
};
const sWin = () => arp([74, 78, 81, 86, 81, 86, 90], 0.08, 'square', 0.08);
const sFail = () => arp([67, 64, 60, 55, 52, 48], 0.16, 'square', 0.08);
const sBlip = () => tone(990, 0.05, 'square', 0.05);
const sGood = () => arp([79, 83, 86, 91], 0.05, 'triangle', 0.12);
const sBuzz = () => {
  tone(120, 1.2, 'sawtooth', 0.04);
  tone(241, 1.2, 'square', 0.02);
};
const sOff = () => tone(500, 0.6, 'square', 0.08, 0, 40);
const sOn = () => tone(60, 0.5, 'square', 0.06, 0, 600);

// Musica original con aire de joropo (3/4): arpa arpegiada, bajo, cuatro y maracas
const CH = [
  [62, 66, 69],
  [62, 67, 71],
  [61, 64, 67],
  [62, 66, 69],
  [62, 66, 69],
  [62, 67, 71],
  [61, 64, 69],
  [61, 64, 67],
];
let mOn = false;
let mT = 0;
let mI = 0;
function music(bpm) {
  if (!AC || !mOn) return;
  const sd = 30 / bpm;
  if (mT < AC.currentTime) mT = AC.currentTime + 0.05;
  while (mT < AC.currentTime + 0.2) {
    const w = mT - AC.currentTime;
    const s = mI % 6;
    const c = CH[((mI / 6) | 0) % 8];
    const harp = [c[2] + 12, c[1] + 12, c[0] + 12, c[2], c[1] + 12, c[0] + 12];
    tone(mf(harp[s]), sd * 0.9, 'triangle', 0.08, w);
    if (s === 0) tone(mf(c[0] - 24), sd * 2.5, 'triangle', 0.15, w);
    if (s === 3) tone(mf(c[2] - 24), sd * 1.5, 'triangle', 0.11, w);
    if (s === 2 || s === 5) c.forEach((n) => tone(mf(n), sd * 0.5, 'square', 0.012, w));
    noise(0.04, s % 3 === 0 ? 0.06 : 0.03, w);
    mI++;
    mT += sd;
  }
}

// ---------- Pixel art ----------
const PAL = {
  k: '#111111', w: '#f8f8f8', l: '#bcbcbc', g: '#7c7c7c', d: '#3c3c3c',
  r: '#d82800', R: '#881400', y: '#f8b800', Y: '#fce0a8', o: '#e45c10',
  b: '#0058f8', B: '#0000a8', c: '#3cbcfc', C: '#a4e4fc', s: '#fca044',
  S: '#ac7c00', n: '#503000', G: '#00a800', H: '#005800', p: '#f878f8', m: '#6844fc',
};
const HEADF = ['..NNN..', '.NNNNN.', '.NkskN.', '..sss..'];
const HEADB = ['..NNN..', '.NNNNN.', '.NNNNN.', '..sss..'];
const CAPF = ['..rrr..', '.rrrrrr', '.sksks.', '..sss..'];
const CAPB = ['..rrr..', '.rrrrr.', '.rrrrr.', '..sss..'];
const TOR = ['.XXXXX.', 'sXXXXXs', 'sXXXXXs', '..XXX..'];
const TORB = ['.XRRRX.', 'sXRRRXs', 'sXRRRXs', '..XXX..'];
const LEG = [
  ['..BBB..', '..B.B..', '..B.B..', '.kk.kk.'],
  ['..BBB..', '.B...B.', '.B...B.', 'kk...kk'],
];
const HEAVY = [
  '...NNN...',
  '..NNNNN..',
  '..NkskN..',
  '...sss...',
  '.XXXXXXX.',
  'sXXXXXXXs',
  'sXXXXXXXs',
  'lXXXXXXXl',
  'll.BBB.ll',
  '...B.B...',
  '...B.B...',
  '..kk.kk..',
];
const VIG = [
  '..BBB..',
  '.BBBBBB',
  '.sksks.',
  '..sss..',
  '.BByBB.',
  'sBBBBBs',
  'sBBBBBs',
  '..kkk..',
  '..ddd..',
  '..d.d..',
  '..d.d..',
  '.kk.kk.',
];
const SPR = {
  star: ['y..y..y', '.y.y.y.', '..yyy..', 'yyywyyy', '..yyy..', '.y.y.y.', 'y..y..y'],
  arrow: ['yyyyy', '.yyy.', '..y..'],
  ticket: ['kkkkkkkk', 'kooooook', 'kowwwwok', 'kooooook', 'kkkkkkkk'],
  shoe: ['nn...', 'nnnnn', 'kkkkk'],
  phone: ['kkk', 'kck', 'kck', 'kkk'],
  bagi: ['.gg.', 'gllg', 'gllg', 'gggg'],
  dust: ['.ll.', 'llll', '.ll.'],
  cafe: ['.l.l.', '..l..', 'wwwww', 'wnnnw', 'wwwww', '.www.'],
  teque: ['.YYYYYY.', 'YSYSYSYY', '.YYYYYY.'],
  drop: ['.c.', 'ccc', '.c.'],
  rata: ['l.ggg..', '.ggggkk', '..g.g..'],
};
const ITEMS = ['shoe', 'phone', 'bagi'];
const PPL = [
  { X: 'r', N: 'n', B: 'b' },
  { X: 'G', N: 'k', B: 'd' },
  { X: 'p', N: 'l', B: 'b' },
  { X: 'w', N: 'n', B: 'd' },
  { X: 'o', N: 'k', B: 'B' },
  { X: 'm', N: 'S', B: 'g' },
];

// Fuente pixel 5x5: cada glifo son 5 filas en base 32 (16 = izq ... 1 = der)
const FC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?.,:-+$'/ ¡<>Ñ%^";
const FD = (
  'ehvhh uhuhu fgggf uhhhu vgugv vgugg fgjhf hhvhh e444e 722ic ikoki ggggv hrlhh hpljh ehhhe uhugg ' +
  'ehlid uhuki fge1u v4444 hhhhe hhha4 hhlrh ha4ah ha444 v248v ejlpe 4c44e u1egv u1e1u iiv22 vgu1u ' +
  'eguhe v1244 ehehe ehf1e 44404 eh604 00004 00048 04040 00e00 04e40 fke5u 44000 1248g 00000 40444 ' +
  '24842 84248 e0plj pq4bj 4ah00'
).split(' ');

// ---------- Textos criollos ----------
const STATIONS = [
  'PROPATRIA', 'PEREZ BONALDE', 'PLAZA SUCRE', 'GATO NEGRO', 'AGUA SALUD', 'CAÑO AMARILLO', 'CAPITOLIO',
  'LA HOYADA', 'PARQUE CARABOBO', 'BELLAS ARTES', 'COLEGIO DE INGENIEROS', 'PLAZA VENEZUELA', 'SABANA GRANDE',
  'CHACAITO', 'CHACAO', 'ALTAMIRA', 'PARQUE DEL ESTE', 'LOS DOS CAMINOS', 'LOS CORTIJOS', 'LA CALIFORNIA',
  'PETARE', 'PALO VERDE',
];
const PUSH = [
  '¡PERMISO, MI PANA!',
  '¡TOY APURAO!',
  '¡PA LANTE ES PA ALLA!',
  '¡VOY TARDE A LA CHAMBA!',
  '¡ECHALE PICHON!',
  '¡A UN LADO, CHAMO!',
  '¡MAS RAPIDO QUE INMEDIATAMENTE!',
  '¡PONTE PILAS!',
  '¡ABRAN PASO, PUES!',
];
const AY = [
  '¡AY, MI MADRE!',
  '¡EPALE!',
  '¡NO VALE!',
  '¡ABUSADOR!',
  '¡SE ME CAYO LA AREPA!',
  '¡MI JUANETE!',
  '¡QUE FALTA DE RESPETO!',
  '¡CHAMO, CALMATE!',
  '¡AY PAPA!',
  '¡QUE VAINA!',
  '¡MIS COROTOS!',
  '¡NAGUARA!',
  '¡RESPETA LA COLA!',
  '¡MI CELULAR!',
  '¡NIÑO, RESPETA!',
  '¡CONCHALE, VALE!',
  '¡AY, MIJO!',
  '¡NA QUE VER!',
  '¡TAS LOCO, CHAMO!',
  '¡AJA, Y ENTONCES!',
];
const BRAVO = [
  '¡QUITATE DEL MEDIO, MANITO!',
  '¡TU NO SABE QUIEN SOY YO!',
  '¡ESTE PUESTO E MIO!',
  '¡MOSCA CONMIGO, MI LOCO!',
  '¡ARRANCATE, PUE!',
  '¡FUERA, BICHO!',
  '¡ABRETE, PUE!',
  '¡TA BIEN, PUE!',
  '¡TU SI ERE RARO!',
  '¡QUE LO QUE, MI LOCO!',
];
const OUCH = [
  '¡ME TUMBARON!',
  '¡AY, MI MAMA!',
  '¡QUE CHIMBO!',
  '¡NOOO, VALE!',
  '¡QUE VAINA!',
  '¡QUE RABIA!',
  '¡QUE BROMA!',
  '¡CONCHALE!',
];
const VIGS = [
  '¡EPA, CIUDADANO!',
  '¡QUIETO AHI, CHAMO!',
  '¡DOCUMENTOS!',
  '¡CALMAO, CALMAO!',
  '¡RESPETE LA COLA!',
  '¡NO OBSTRUYA LAS PUERTAS!',
];
const BAM = ['¡PAF!', '¡POW!', '¡ZAS!', '¡PUM!', '¡TRAS!', '¡CATAPLUM!'];
const COMBO = [
  '¡CHUZA!',
  '¡FINO!',
  '¡BRUTAL!',
  '¡QUE NOTA!',
  '¡CHEVERE!',
  '¡NAGUARA!',
  '¡BURDA DE FINO!',
];
const DARK = [
  '¡SE FUE LA LUZ!',
  '¡PRENDAN LOS CELULARES!',
  '¡CUIDADO CON LA CARTERA!',
  '¡OTRA VEZ, VALE!',
  '¡NO VEO NADA!',
  '¡AGARREN SUS COROTOS!',
  '¡QUIEN APAGO LA LUZ!',
];
const RATA = ['¡UNA RATA!', '¡AAAY, UNA RATA!', '¡QUE ASCO, VALE!'];
// puestos de buhoneros: color del toldo y lo que pregonan
const VENTAS = [
  [0x503000, '¡CIGARRO, CAFE!', '¡CIGARRO, CAFE, CARAMELO!', '¡EL CAFECITO CALIENTE, MI AMOR!'],
  [0xd82800, '¡CIGARRO, CAFE!', '¡CIGARRO, CAFE, CARAMELO!'],
  [0xf8b800, '¡TEQUEÑOS CALIENTICOS!', '¡A DOS POR UNO, MI AMOR!'],
  [0xf8f8f8, '¡CHICHA, CHICHA!', '¡AGUA, AGUA, AGUA!'],
  [0xe45c10, '¡EMPANADAS DE CARNE Y QUESO!'],
  [0xf878f8, '¡CHUPETAS A UNO!', '¡CHUCHERIAS, CHUCHERIAS!'],
  [0x0058f8, '¡LLEVA TU CARGADOR!'],
];
const pick = (a) => a[(Math.random() * a.length) | 0];
const rnd = (a, b) => a + Math.random() * (b - a);
const pad = (n, l = 6) => String(Math.max(0, Math.floor(n))).padStart(l, '0');
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const near = (arr, x) => arr.reduce((b, g) => (Math.abs(g.x - x) < Math.abs(b.x - x) ? g : b));

// ---------- Estado ----------
const DOORS = [130, 310, 490, 670];
const FLOORPAL = [
  [0xb4a890, 0xa09478],
  [0xa8a8a8, 0x949494],
  [0xc8b47c, 0xb09c64],
  [0x9cacb4, 0x8898a0],
];
let S;
let ph = 'load';
let pl;
let arrowS;
let ppl = [];
const AL = [];
let dirty = false;
let doors = [];
let train;
let hud;
let tc;
let recC;
let howC;
let perC;
let tStart;
let tTitle;
let tT = 0;
let best = DEF_BEST.slice();
let WH = 1800;
let BARS = [];
let WALLS = [];
let FLOORS = [];
let WET = []; // charcos [x1, y1, x2, y2]
let HOLES = []; // huecos en el piso [x, y, r]
let TAPON = []; // grupos de gente parada estorbando {x, y, n}
let power = 1; // 0 = se fue la luz
let blkAt = -1;
let blkT = 0;
let blkP = 0;
let darkImg;
let ratT = 0;
let STALLS = [];
let ESCS = [];
let pks = [];
let lvlImg = null;
let lvlObjs = [];
let lvlN = 0;
let sc, lives, lvl, T, comboN, comboT, knocks, salQ, salT, runT, pushCd, kickCd, warned, beepS, pT, cleared, lvT;
let heavyP = 0.15;
let hs = 0; // hit-stop: congela un instante en los golpes fuertes
let spinCd = 0;
let oleT = 0;
let gapW = 24; // media apertura de las puertas (se cierran al final)
let fxN = 0; // efectos vivos, con tope para no trabar el juego
let fxF = 0; // efectos creados en este frame
let sndT = 0;
let bubs = []; // globos de dialogo
let ovG = [];
let oT = 0;
let ovCont;
let nm = null;

new Phaser.Game({
  type: Phaser.AUTO,
  width: W,
  height: H,
  parent: 'game-root',
  backgroundColor: '#000000',
  pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: W, height: H },
  scene: { create, update },
});

function mk(key, rows, sub) {
  const h = rows.length;
  const w = rows[0].length;
  const t = S.textures.createCanvas(key, w, h);
  const x = t.getContext();
  rows.forEach((r, j) => {
    for (let i = 0; i < w; i++) {
      let ch = r[i];
      if (sub && sub[ch]) ch = sub[ch];
      if (ch !== '.') {
        x.fillStyle = PAL[ch];
        x.fillRect(i, j, 1, 1);
      }
    }
  });
  t.refresh();
}

function mkFont() {
  const t = S.textures.createCanvas('font', FC.length * 6, 6);
  const x = t.getContext();
  x.fillStyle = '#ffffff';
  FD.forEach((g, i) => {
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) if (parseInt(g[r], 32) & (16 >> c)) x.fillRect(i * 6 + c, r, 1, 1);
  });
  t.refresh();
  S.cache.bitmapFont.add(
    'f',
    Phaser.GameObjects.RetroFont.Parse(S, {
      image: 'font',
      width: 6,
      height: 6,
      chars: FC,
      charsPerRow: FC.length,
      spacing: { x: 0, y: 0 },
      offset: { x: 0, y: 0 },
      lineSpacing: 2,
    })
  );
}

function tx(x, y, s, sz, col = 0xffffff, ox = 0.5, oy = 0.5, sh = 1) {
  const t = S.add.bitmapText(x, y, 'f', String(s).toUpperCase()).setScale(sz).setOrigin(ox, oy).setTint(col);
  if (sh && t.setDropShadow) t.setDropShadow(0.5, 0.5, 0x000000, 1);
  return t;
}
// texto fijo en pantalla (no se mueve con la camara)
const hx = (...a) => tx(...a).setScrollFactor(0);

function create() {
  S = this;
  mkFont();
  PPL.forEach((c, v) =>
    [0, 1].forEach((fr) => {
      mk('nf' + v + fr, HEADF.concat(TOR, LEG[fr]), c);
      mk('nb' + v + fr, HEADB.concat(TOR, LEG[fr]), c);
    })
  );
  [0, 1].forEach((fr) => {
    mk('plf' + fr, CAPF.concat(TOR, LEG[fr]), { X: 'y', B: 'b' });
    mk('plb' + fr, CAPB.concat(TORB, LEG[fr]), { X: 'y', B: 'b' });
    mk('bf' + fr, CAPF.concat(TOR, LEG[fr]), { r: 'k', X: 'R', B: 'd' });
    mk('bb' + fr, CAPB.concat(TOR, LEG[fr]), { r: 'k', X: 'R', B: 'd' });
  });
  [0, 1, 2].forEach((v) => mk('hv' + v, HEAVY, PPL[v]));
  mk('vg', VIG);
  Object.keys(SPR).forEach((k) => mk(k, SPR[k]));
  const et = S.textures.createCanvas('esc', 112, 24);
  const ex = et.getContext();
  [
    ['#4c4c4c', 0, 0, 112, 24],
    ['#9c9c9c', 0, 0, 112, 4],
    ['#222222', 0, 0, 8, 24],
    ['#222222', 104, 0, 8, 24],
  ].forEach((r) => {
    ex.fillStyle = r[0];
    ex.fillRect(r[1], r[2], r[3], r[4]);
  });
  et.refresh();
  mkTrain();
  const dk = S.textures.createCanvas('dark', 200, 150);
  const dc = dk.getContext();
  dc.fillStyle = 'rgba(2,2,14,0.96)';
  dc.fillRect(0, 0, 200, 150);
  dc.globalCompositeOperation = 'destination-out';
  const gr = dc.createRadialGradient(100, 75, 5, 100, 75, 17);
  gr.addColorStop(0, 'rgba(0,0,0,1)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  dc.fillStyle = gr;
  dc.fillRect(70, 45, 60, 60);
  dk.refresh();
  darkImg = S.add.image(0, 0, 'dark').setScale(8).setDepth(6900).setVisible(false);

  pl = { x: 400, y: 1700, vx: 0, vy: 0, r: 11, m: 1.6, face: { x: 0, y: -1 }, dash: 0, stun: 0, kb: 0, ph: 0, tw: 0, boost: 0 };
  pl.s = S.add.image(0, 0, 'plb0').setScale(PS).setOrigin(0.5, 0.9).setVisible(false);
  arrowS = S.add.image(0, 0, 'arrow').setScale(PS).setDepth(5000).setVisible(false);
  mkHud();
  mkTitle();
  toTitle();

  st()
    .get(STORE_KEY)
    .then((r) => {
      best = cleanBest(r && r.found ? r.value : []);
      fillRecords();
    })
    .catch(() => {});
}

// ---------- Tren ----------
function mkTrain() {
  const t = S.textures.createCanvas('trainT', W, TY);
  const x = t.getContext();
  const f = (c, a, b, w, h) => {
    x.fillStyle = c;
    x.fillRect(a, b, w, h);
  };
  f('#e8e8e8', 0, 8, W, 140);
  f('#bcbcbc', 0, 8, W, 12);
  f('#e45c10', 0, 110, W, 10);
  f('#5c5c5c', 0, 140, W, 8);
  [258, 540].forEach((a) => f('#3c3c3c', a, 8, 4, 140));
  const segs = [0].concat(...DOORS.map((d) => [d - 28, d + 28]), [W]);
  for (let i = 0; i < segs.length; i += 2) {
    const a = segs[i] + 10;
    const b = segs[i + 1] - 10;
    for (let p = a; p < b - 20; p += 64) {
      const w = Math.min(54, b - p);
      f('#24345c', p, 38, w, 50);
      f('#4c6c9c', p + 4, 42, w - 24, 6);
    }
  }
  DOORS.forEach((d) => f('#101020', d - 28, 56, 56, 86));
  t.refresh();
  train = S.add.container(0, 0, [S.add.image(0, 0, 'trainT').setOrigin(0)]).setDepth(2);
  doors = DOORS.map((d) => {
    const pa = S.add.rectangle(d - 14, 99, 28, 86, 0xd0d0d0).setStrokeStyle(2, 0x7c7c7c);
    const pb = S.add.rectangle(d + 14, 99, 28, 86, 0xd0d0d0).setStrokeStyle(2, 0x7c7c7c);
    const lb = tx(d, 30, '', 2, 0x00e000);
    train.add([pa, pb, lb]);
    return { x: d, n: 0, cap: 99, open: 0, full: 0, cool: 0, pa, pb, lb };
  });
}

function setDoors(open) {
  doors.forEach((d) => {
    d.open = open;
    S.tweens.add({ targets: d.pa, x: d.x - (open ? 42 : 14), duration: 350 });
    S.tweens.add({ targets: d.pb, x: d.x + (open ? 42 : 14), duration: 350 });
  });
}
function doorLabel(d) {
  d.lb.setText(d.full ? 'LLENO' : d.cap > 50 ? '' : d.n + '/' + d.cap).setTint(d.full ? 0xd82800 : 0x00e000);
}

// ---------- Estacion generada: anden arriba, secciones al azar, torniquetes y entrada abajo ----------
function genLevel(L) {
  lvlObjs.forEach((o) => o.destroy());
  lvlObjs = [];
  pks = [];
  BARS = [];
  WALLS = [];
  FLOORS = [];
  WET = [];
  HOLES = [];
  TAPON = [];
  STALLS = [];
  const DET = [];
  const DRIPS = [];
  const RS = [];
  const TXS = [];
  const ESC = [];
  const F = (c, x, y, w, h) => RS.push([c, x, y, w, h]);
  const pal = FLOORPAL[L % FLOORPAL.length];
  const floor = (y, h, c = pal) => {
    F(c[0], 0, y, W, h);
    for (let yy = y; yy < y + h; yy += 40) F(c[1], 0, yy, W, 2);
    for (let x = 0; x < W; x += 40) F(c[1], x, y, 2, h);
    FLOORS.push([y + 24, y + h - 24]);
    DET.push([y, h]);
  };
  const box = (x1, y1, x2, y2, c) => {
    WALLS.push([x1, y1, x2, y2]);
    F(0x3c3c4c, x1, y1, x2 - x1, y2 - y1);
    F(c, x1 + 2, y1 + 2, x2 - x1 - 4, y2 - y1 - 6);
    F(0xe45c10, x1 + 2, y1 + 2, x2 - x1 - 4, 4);
    // grafitis en las paredes grandes
    if (y2 - y1 > 120 && x2 - x1 > 50 && Math.random() < 0.3) {
      const gc = pick([0xf878f8, 0x3cbcfc, 0x00e000, 0xf8b800, 0xd82800]);
      let gx = x1 + 10;
      let gy = y1 + rnd(30, y2 - y1 - 40);
      while (gx < x2 - 14) {
        F(gc, gx | 0, gy | 0, 6, 6);
        gx += 5;
        gy += rnd(-6, 6);
      }
    }
  };
  const puddle = (x, y, rx, ry) => {
    WET.push([x, y, rx * 0.9, ry * 0.9]);
    RS.push([0x4c74b0, x, y, rx, ry, 1], [0x6890c8, x, y - 2, rx - 6, ry - 5, 1], [0xa4c8f0, x - rx * 0.35, y - ry * 0.35, rx * 0.25, 3, 1]);
  };
  const obra = (bx, by) => {
    if (inWall(bx, by, 70)) return;
    box(bx - 60, by - 10, bx + 60, by + 10, 0xf8f8f8);
    for (let a = 0; a < 120; a += 20) F(0xe45c10, bx - 60 + a, by - 8, 10, 16);
    [-80, 68].forEach((a) => {
      F(0xe45c10, bx + a, by - 10, 12, 18);
      F(0xf8f8f8, bx + a, by - 4, 12, 4);
    });
  };
  const hole = (x, y, r) => {
    HOLES.push([x, y, r]);
    F(0x5c5c5c, x - r - 4, (y - r * 0.6 - 3) | 0, 2 * r + 8, (r * 1.2 + 6) | 0);
    F(0x141414, x - r, (y - r * 0.6) | 0, 2 * r, (r * 1.2) | 0);
    F(0x141414, (x - r * 0.6) | 0, (y - r * 0.9) | 0, (r * 1.2) | 0, (r * 1.8) | 0);
    F(0x2c2c2c, (x - r * 0.5) | 0, (y - r * 0.3) | 0, r, (r * 0.6) | 0);
  };
  // barrera horizontal con huecos por donde se pasa
  const bar = (y1, y2, gaps, c) => {
    BARS.push({ y1, y2, gaps });
    let s = 0;
    gaps
      .slice()
      .sort((a, b) => a.x - b.x)
      .forEach((g) => {
        if (g.x - g.hw > s) box(s, y1, g.x - g.hw, y2, c);
        s = g.x + g.hw;
      });
    if (s < W) box(s, y1, W, y2, c);
  };

  // tunel y anden
  F(0x141414, 0, 0, W, TY);
  F(0x5c5c5c, 0, 58, W, 4);
  F(0x5c5c5c, 0, 98, W, 4);
  floor(TY, PLAT - TY);
  FLOORS.pop();
  F(0xf8b800, 0, TY + 4, W, 14);
  for (let x = 4; x < W; x += 12) F(0xc89000, x, TY + 8, 6, 6);
  box(90, 400, 120, 430, 0x6c6c7c);
  box(680, 400, 710, 430, 0x6c6c7c);
  F(0xf8f8f8, 188, PLAT - 42, 424, 34);
  F(0x0058f8, 190, PLAT - 40, 420, 30);
  TXS.push([400, PLAT - 25, 'ESTACION ' + STATIONS[L % STATIONS.length], 2, 0xffffff]);

  let y = PLAT;
  const n = 3 + Math.min(4, L >> 1);
  let last = '';
  for (let i = 0; i < n; i++) {
    let t = i ? pick(['esc', 'hall', 'hall', 'trans', 'cruz', 'wet']) : 'esc';
    if (t === last) t = t === 'hall' ? 'cruz' : 'hall';
    last = t;
    if (t === 'esc') {
      const h = rnd(230, 300) | 0;
      const k = pick([2, 3, 3, 4]);
      const ty = [];
      for (let j = 0; j < k; j++) ty.push(pick(['up', 'down', 'fix', 'fix', 'broken', 'broken']));
      if (L >= 2 && Math.random() < 0.5) ty[(Math.random() * k) | 0] = 'broken';
      if (ty.every((q) => q === 'broken')) ty[(Math.random() * k) | 0] = 'fix';
      if (L < 2 && !ty.includes('up')) ty[ty.indexOf('broken') >= 0 ? ty.indexOf('broken') : 0] = 'up';
      const lanes = ty.map((q, j) => ({ q, x: 400 + (j - (k - 1) / 2) * 170 }));
      bar(
        y,
        y + h,
        lanes.filter((l) => l.q !== 'broken').map((l) => ({ x: l.x, hw: 56, ey: l.q === 'up' ? -75 : l.q === 'down' ? 60 : 0, sm: l.q === 'fix' ? 0.7 : 1 })),
        0x2c2c3c
      );
      lanes.forEach((l) => {
        if (l.q === 'up' || l.q === 'down') ESC.push({ x: l.x, y: y + h / 2, h, d: l.q === 'up' ? 75 : -60 });
        else
          for (let yy = y; yy < y + h; yy += 12) {
            F(l.q === 'fix' ? 0x8c8c8c : 0x5c5c5c, l.x - 56, yy, 112, 8);
            F(0x4c4c4c, l.x - 56, yy + 8, 112, 4);
          }
        if (l.q === 'broken') {
          for (let yy = y + 20; yy < y + h; yy += 60) {
            F(0xf8b800, l.x - 56, yy, 112, 8);
            for (let a = -40; a < 56; a += 32) F(0x111111, l.x + a, yy, 16, 8);
          }
          TXS.push([l.x, y + h / 2, 'DAÑADA', 2, 0xf8b800]);
        }
        // gente reunida al pie de la escalera y parada en la escalera fija
        if (l.q !== 'broken') TAPON.push({ x: l.x, y: y + h + 50, n: 3 + Math.min(L, 4) });
        if (l.q === 'fix') TAPON.push({ x: l.x, y: y + h * 0.55, n: 2 + Math.min(L, 3) });
      });
      floor(y + h, 150);
      if (Math.random() < 0.4) obra(rnd(150, 650) | 0, y + h + 105);
      y += h + 150;
    } else if (t === 'trans') {
      const xs = pick([
        [180, 520],
        [260, 620],
        [150, 650],
        [330, 470],
      ]);
      const shut = L >= 1 && Math.random() < 0.5 ? xs.splice((Math.random() * 2) | 0, 1)[0] : 0;
      bar(
        y,
        y + 30,
        xs.map((x) => ({ x, hw: 34, ey: 0, sm: 1 })),
        0x8c5c3c
      );
      if (shut) {
        F(0xd82800, shut - 34, y + 2, 68, 24);
        TXS.push([shut, y + 14, 'CERRADO', 2, 0xffffff]);
      }
      xs.forEach((x) => TAPON.push({ x, y: y + 70, n: 2 + Math.min(L, 3) }));
      floor(y + 30, 180);
      y += 210;
    } else {
      const h = rnd(300, 420) | 0;
      floor(y, h);
      if (t === 'cruz') {
        // homenaje al piso de Carlos Cruz-Diez
        const cs = [0xd82800, 0x0058f8, 0x111111, 0xf8f8f8, 0xf8b800, 0x00a800];
        for (let x = 0, j = 0; x < W; x += 10, j++) F(cs[j % cs.length], x, y, 6, h);
        TXS.push([400, y + 24, 'HOMENAJE A CRUZ-DIEZ', 2, 0xffffff]);
      } else if (t === 'wet') {
        for (let j = 0; j < 5; j++) puddle(rnd(90, 710) | 0, rnd(y + 60, y + h - 40) | 0, rnd(45, 85) | 0, rnd(16, 26) | 0);
        for (let j = 0; j < 2; j++) DRIPS.push({ x: rnd(80, 720), y: rnd(y + 70, y + h - 40) });
      } else {
        // columnas y buhoneros
        const k = 2 + ((Math.random() * 3) | 0);
        for (let j = 0; j < k; j++) {
          const px = (110 + (j + 0.5) * (580 / k) + rnd(-40, 40)) | 0;
          const py = rnd(y + 90, y + h - 90) | 0;
          if (Math.random() < 0.55) {
            const v = pick(VENTAS);
            box(px - 36, py - 16, px + 36, py + 16, 0x8c5c2c);
            for (let a = 0; a < 72; a += 12) F(a % 24 ? 0xf8f8f8 : v[0], px - 36 + a, py - 26, 12, 12);
            STALLS.push({ x: px, y: py, cd: rnd(0, 3), g: v.slice(1) });
          } else box(px - 20, py - 20, px + 20, py + 20, 0x6c6c7c);
        }
        if (Math.random() < 0.5) obra(rnd(150, 650) | 0, rnd(y + 60, y + h - 60) | 0);
      }
      // huecos en el piso
      const nh = (Math.random() * (1.5 + Math.min(L, 3) * 0.4)) | 0;
      for (let j = 0; j < nh; j++) {
        const qx = rnd(60, 740) | 0;
        const qy = rnd(y + 50, y + h - 50) | 0;
        if (!inWall(qx, qy, 34)) hole(qx, qy, rnd(16, 24) | 0);
      }
      y += h;
    }
  }
  // torniquetes y entrada
  const tq = [120, 260, 400, 540, 680];
  const bad = [];
  for (let j = 0; j < 1 + (L > 2) + (L > 5); j++) bad.push(pick(tq));
  const okq = tq.filter((x) => !bad.includes(x));
  bar(
    y,
    y + 25,
    okq.map((x) => ({ x, hw: 22, ey: 0, sm: 1 })),
    0xbcbcbc
  );
  tq.forEach((x) => {
    const c = bad.includes(x) ? 0xd82800 : 0x00e000;
    F(c, x - 26, y + 6, 4, 6);
    F(c, x + 22, y + 6, 4, 6);
    if (c === 0xd82800) TXS.push([x, y + 12, 'DAÑADO', 2, 0xff6040]);
    else TAPON.push({ x, y: y + 70, n: 2 + Math.min(L, 2) });
  });
  floor(y + 25, 170, [0x6c6c6c, 0x5c5c5c]);
  for (let yy = y + 60; yy < y + 160; yy += 40) {
    F(0xf8b800, 392, yy, 16, 6);
    F(0xf8b800, 380, yy + 6, 40, 6);
  }
  WH = y + 195;
  TXS.push([400, WH - 14, 'ENTRADA', 3, 0xf8b800]);

  // deterioro: charcos sueltos, grietas, baldosas rotas, basura y manchas
  DET.forEach(([fy, fh], i) => {
    if (i && Math.random() < 0.15) {
      const px = rnd(80, 720) | 0;
      const py = rnd(fy + 40, fy + fh - 40) | 0;
      if (!inWall(px, py, 50)) puddle(px, py, rnd(30, 50) | 0, rnd(11, 16) | 0);
    }
    for (let j = 0; j < fh / 160; j++) {
      let cx = rnd(10, W - 10);
      let cy = rnd(fy + 24, fy + fh - 6);
      for (let k = 0; k < 9; k++) {
        if (!inWall(cx, cy, 3)) F(0x3c3c3c, cx | 0, cy | 0, 4, 4);
        cx += rnd(-6, 6) + 3;
        cy += rnd(-4, 6);
      }
      const bx = ((rnd(0, 19) | 0) * 40) + 2;
      const by = fy + (1 + (rnd(0, fh / 40 - 2) | 0)) * 40 + 2;
      if (!inWall(bx + 19, by + 19, 22)) F(Math.random() < 0.5 ? 0x5c5448 : 0x6c6c6c, bx, by, 38, 38);
      F(pick([0xf8f8f8, 0xd82800, 0x00a800, 0xf8b800, 0x7c7c7c]), rnd(10, W - 10) | 0, rnd(fy + 20, fy + fh) | 0, 6, 4);
      F(0x6c5c3c, rnd(10, W - 40) | 0, rnd(fy + 20, fy + fh - 20) | 0, rnd(14, 30) | 0, rnd(8, 16) | 0);
    }
  });

  // placa oscura detras de cada letrero para que se lea sobre cualquier piso
  TXS.forEach((a) => {
    const w = a[2].length * 6 * a[3] + 10;
    const h = 6 * a[3] + 8;
    F(0x111111, (a[0] - w / 2) | 0, (a[1] - h / 2) | 0, w, h);
  });

  // se pinta todo una sola vez en una textura (mucho mas liviano que dibujar cada frame)
  if (lvlImg) lvlImg.destroy();
  const old = 'lvl' + lvlN;
  lvlN++;
  const key = 'lvl' + lvlN;
  const tex = S.textures.createCanvas(key, W, WH);
  const cx = tex.getContext();
  RS.forEach((r) => {
    cx.fillStyle = '#' + r[0].toString(16).padStart(6, '0');
    if (r[5]) {
      cx.beginPath();
      cx.ellipse(r[1], r[2], r[3], r[4], 0, 0, Math.PI * 2);
      cx.fill();
    } else cx.fillRect(r[1], r[2], r[3], r[4]);
  });
  tex.refresh();
  if (S.textures.exists(old)) S.textures.remove(old);
  lvlImg = S.add.image(0, 0, key).setOrigin(0).setDepth(0);
  TXS.forEach((a) => lvlObjs.push(tx(a[0], a[1], a[2], a[3], a[4]).setDepth(1)));
  ESCS = ESC.map((e) => {
    const ts = S.add.tileSprite(e.x, e.y, 112, e.h, 'esc').setDepth(0.5);
    ts.d = e.d;
    lvlObjs.push(ts);
    return ts;
  });
  // goteras del techo
  DRIPS.forEach((d) => {
    const g = S.add.image(d.x, d.y - 70, 'drop').setScale(PS).setDepth(d.y);
    S.tweens.add({ targets: g, y: d.y, alpha: 0.3, duration: 600, repeat: -1, repeatDelay: rnd(200, 900), delay: rnd(0, 800) });
    lvlObjs.push(g);
  });
  S.cameras.main.setBounds(0, 0, W, WH);
}
const inWet = (o) => WET.some((r) => Math.abs(o.y - r[1]) < r[3] && ((o.x - r[0]) / r[2]) ** 2 + ((o.y - r[1]) / r[3]) ** 2 < 1);

const inWall = (x, y, r) => WALLS.some((w) => x > w[0] - r && x < w[2] + r && y > w[1] - r && y < w[3] + r);
function fpt() {
  for (let i = 0; i < 8; i++) {
    const f = pick(FLOORS);
    const p = { x: rnd(30, 770), y: rnd(f[0], f[1]) };
    if (!inWall(p.x, p.y, 18)) return p;
  }
  return { x: 400, y: WH - 80 };
}

// ---------- HUD ----------
function mkHud() {
  hud = {};
  const a = [];
  a.push(S.add.rectangle(W / 2, 18, W, 36, 0x000000, 0.8));
  a.push(S.add.rectangle(W / 2, H - 18, W, 36, 0x000000, 0.8));
  a.push(S.add.rectangle(W - 10, 300, 6, 460, 0x000000, 0.6).setStrokeStyle(2, 0xf8b800));
  hud.sc = tx(12, 19, 'BS 000000', 3, 0xf8b800, 0);
  hud.st = tx(W / 2, 19, '', 2, 0xffffff);
  hud.t = tx(W - 12, 19, '00', 4, 0xffffff, 1);
  hud.lv = [];
  for (let i = 0; i < 5; i++) hud.lv.push(S.add.image(20 + i * 30, H - 18, 'ticket').setScale(PS));
  hud.push = tx(270, H - 17, '1:EMPUJON', 2);
  hud.kick = tx(440, H - 17, '2:PATADA', 2);
  hud.spin = tx(640, H - 17, '3:MOCHILAZO', 2);
  hud.combo = tx(W - 24, 52, '', 3, 0xf878f8, 1);
  hud.up = tx(W / 2, 70, '^ TREN ^', 3, 0xf8b800);
  hud.dot = S.add.rectangle(W - 10, 300, 14, 10, 0xf8b800).setStrokeStyle(2, 0x111111);
  hud.all = a.concat([hud.sc, hud.st, hud.t, hud.push, hud.kick, hud.spin, hud.combo, hud.up, hud.dot], hud.lv);
  hud.all.forEach((o) => o.setDepth(9000).setScrollFactor(0).setVisible(false));
}
function showHud(v) {
  hud.all.forEach((o) => o.setVisible(v));
}
function drawHud(time) {
  hud.sc.setText('BS ' + pad(sc));
  const s = Math.ceil(Math.max(0, T));
  hud.t.setText(String(s).padStart(2, '0')).setTint(s <= 10 ? (Math.floor(time / 200) % 2 ? 0xd82800 : 0xf8b800) : 0xffffff);
  hud.lv.forEach((h, i) => h.setVisible(i < lives));
  hud.push.setTint(pushCd > 0 ? 0x555555 : 0xffffff);
  hud.kick.setTint(kickCd > 0 ? 0x555555 : 0x00e000);
  hud.spin.setTint(spinCd > 0 ? 0x555555 : 0xf878f8);
  hud.combo.setText(comboN > 1 && comboT > 0 ? 'COMBO X' + comboN : '');
  hud.up.setVisible(S.cameras.main.scrollY > 120 && Math.floor(time / 300) % 2 === 0);
  hud.dot.y = 72 + clamp((pl.y - TY) / (WH - TY), 0, 1) * 456;
}

// ---------- Pantalla de titulo ----------
function mkTitle() {
  const bg = S.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.45);
  const pan = S.add.rectangle(W / 2, 525, W, 150, 0x000000, 0.85);
  tTitle = [tx(W / 2, 250, 'HORA PICO', 13, 0xf8b800), tx(W / 2, 318, 'METRO DE CARACAS', 4, 0xffffff)];
  if (tTitle[0].setDropShadow) tTitle[0].setDropShadow(0.5, 0.5, 0xd82800, 1);
  const sub = tx(W / 2, 356, '¡ECHALE PIERNA, QUE SE VA EL TREN!', 2, 0xf8b800);
  tStart = tx(W / 2, 404, 'PRESIONA START', 4, 0xffffff);
  const foot = tx(W / 2, 590, '2026 PLATANUS HACK 26 - CARACAS', 2, 0x7c7c7c);
  recC = S.add.container(0, 0);
  howC = S.add.container(0, 0, [
    tx(W / 2, 470, 'COMO JUGAR', 3, 0xf8b800),
    tx(W / 2, 496, 'TODO CARACAS QUIERE MONTARSE. ¡LLEGA A UNA PUERTA!', 2),
    tx(W / 2, 514, '1: EMPUJON   2: PATADA VOLADORA   3: MOCHILAZO', 2, 0x00e000),
    tx(W / 2, 532, 'TUMBA A VARIOS EN CADENA = ¡CHUZA!', 2, 0xf878f8),
    tx(W / 2, 550, 'CAFECITO = VELOCIDAD   TEQUEÑO = +4 SEGUNDOS', 2, 0xf8b800),
    tx(W / 2, 568, 'PUERTA LLENA: ¡PATEALA Y SACA A ALGUIEN!', 2, 0x3cbcfc),
  ]);
  // quien es quien
  const P = [
    ['plf0', 'TU', 0xe45c10, 'EL CHAMO'],
    ['bf0', 'MALANDRO', 0xd82800, 'TE TUMBA'],
    ['hv0', 'SEÑORA', 0x0058f8, 'NO SE MUEVE'],
    ['nf10', 'PASAJERO', 0x0058f8, 'TE EMPUJA'],
    ['vg', 'VIGILANTE', 0x3cbcfc, 'TE PARA'],
  ];
  perC = S.add.container(0, 0, [tx(W / 2, 466, 'LOS PERSONAJES', 3, 0xf8b800)]);
  P.forEach((q, i) => {
    const x = 80 + i * 160;
    perC.add([S.add.image(x, 530, q[0]).setScale(4), tx(x, 556, q[1], 2, q[2]), tx(x, 574, q[3], 2, 0xffffff)]);
  });
  tc = S.add.container(0, 0, [bg, pan, ...tTitle, sub, tStart, foot, recC, howC, perC]).setDepth(9500).setScrollFactor(0);
  fillRecords();
}

function fillRecords() {
  if (!recC) return;
  recC.removeAll(true);
  recC.add(tx(W / 2, 470, 'LOS MAS VIVOS DEL METRO', 3, 0xf8b800));
  best.forEach((b, i) =>
    recC.add(tx(W / 2, 496 + i * 17, i + 1 + '.  ' + b.n.padEnd(3, ' ') + '   BS ' + pad(b.s), 2, i ? 0xffffff : 0x3cbcfc))
  );
}

function toTitle() {
  clearPpl();
  ph = 'title';
  tT = 0;
  mOn = false;
  showHud(false);
  pl.s.setVisible(false);
  arrowS.setVisible(false);
  tc.setVisible(true);
  genLevel(0);
  lightsOn();
  S.cameras.main.stopFollow();
  S.cameras.main.setScroll(0, 0);
  train.x = 0;
  gapW = 24;
  heavyP = 0.15;
  doors.forEach((d) => {
    d.n = 0;
    d.cap = 99;
    d.full = 0;
    doorLabel(d);
  });
  setDoors(1);
  for (let i = 0; i < 24; i++) waiter();
  salT = 0;
}

function updTitle(dt, time) {
  tT += dt;
  tStart.setVisible(Math.floor(tT * 2.5) % 2 === 0);
  tTitle[0].y = 250 + Math.sin(tT * 3) * 5;
  const pi = Math.floor(tT / 5) % 3;
  recC.setVisible(pi === 0);
  howC.setVisible(pi === 1);
  perC.setVisible(pi === 2);
  salT -= dt;
  if (salT <= 0) {
    salT = 1.3;
    npc('o', pick(DOORS) + rnd(-12, 12), TY + 14);
  }
  sim(dt, time, false);
  if (tapGo()) {
    au();
    sBlip();
    startGame();
  }
}

// ---------- Gente ----------
function npc(t, x, y) {
  if (ppl.length >= 140 && (t === 'w' || t === 'r')) return null; // tope para que no se trabe
  const hv = t !== 'v' && t !== 'a' && Math.random() < heavyP;
  const v = (Math.random() * PPL.length) | 0;
  const n = {
    t,
    x,
    y,
    vx: 0,
    vy: 0,
    hv,
    r: hv ? 15 : t === 'a' ? 13 : 11,
    m: t === 'v' ? 99 : hv ? 3 : t === 'a' ? 2.5 : 1,
    v: hv ? v % 3 : v,
    kb: 0,
    down: 0,
    spd: t === 'o' ? rnd(70, 100) : t === 'r' ? rnd(95, 140) : t === 'a' ? rnd(120, 145) : 30,
    ph: Math.random() * 9,
    hx: x,
    hy: y,
    door: -1,
    spin: 1,
    cd: 0,
    tk: '',
  };
  n.s = S.add.image(x, y, 'nf00').setScale(t === 'a' ? PS * 1.25 : PS).setOrigin(0.5, 0.9);
  ppl.push(n);
  return n;
}
function waiter() {
  const d = pick(DOORS);
  // apinados frente a las puertas
  npc('w', clamp(d + rnd(-60, 60), 20, 780), TY + 22 + Math.pow(Math.random(), 1.5) * 220);
}
function clearPpl() {
  clearBubs();
  ppl.forEach((o) => o.s.destroy());
  ppl = [];
}

// ruta hacia el tren y hacia la salida, por los huecos de cada barrera
function goUp(o) {
  for (let i = BARS.length - 1; i >= 0; i--) {
    const b = BARS[i];
    if (b.y1 >= o.y) continue;
    const g = near(b.gaps, o.x);
    if (o.y <= b.y2 + 4) return { x: g.x, y: b.y1 - 40 };
    if (Math.abs(o.x - g.x) > g.hw - 10) return { x: g.x, y: b.y2 + 30 };
    return { x: g.x, y: b.y1 - 40 };
  }
  if (o.door < 0 || doors[o.door].full) {
    let bi = -1;
    let bd = 1e9;
    doors.forEach((d, i) => {
      const dd = Math.abs(d.x - o.x);
      if (!d.full && dd < bd) {
        bd = dd;
        bi = i;
      }
    });
    o.door = bi;
  }
  if (o.door < 0) return { x: o.x, y: TY + 40 };
  const d = doors[o.door];
  return { x: d.x, y: o.y < TY + 40 || Math.abs(o.x - d.x) < 30 ? TY - 30 : TY + 30 };
}
function goDown(o) {
  for (const b of BARS) {
    if (b.y2 <= o.y) continue;
    const g = near(b.gaps, o.x);
    if (o.y >= b.y1 - 4) return { x: g.x, y: b.y2 + 40 };
    if (Math.abs(o.x - g.x) > g.hw - 10) return { x: g.x, y: b.y1 - 30 };
    return { x: g.x, y: b.y2 + 40 };
  }
  return { x: o.x, y: WH + 60 };
}

function ai(o, dt, time) {
  let g;
  let sp = o.spd;
  if (o.t === 'w') {
    const a = (time / 1000) * 0.7 + o.ph;
    g = { x: o.hx + Math.cos(a) * 10, y: o.hy + Math.sin(a * 1.3) * 6 };
  } else if (o.t === 'v') {
    g = { x: o.hx + Math.sin((time / 1000) * 0.5 + o.ph) * 120, y: o.hy };
    sp = 45;
  } else if (o.t === 'a' && ph === 'play' && !pl.dead && Math.abs(pl.y - o.y) < 240 && Math.abs(pl.x - o.x) < 260) {
    g = { x: pl.x, y: pl.y }; // el malandro te busca
  } else g = o.t === 'o' ? goDown(o) : goUp(o);
  const dx = g.x - o.x;
  const dy = g.y - o.y;
  const d = Math.hypot(dx, dy);
  let tvx = 0;
  let tvy = 0;
  if (d > 3) {
    const k = Math.min(sp, d * 4) / d;
    tvx = dx * k;
    tvy = dy * k;
  }
  const a = Math.min(1, dt * 8);
  o.vx += (tvx - o.vx) * a;
  o.vy += (tvy - o.vy) * a;
}

function onScreen(y) {
  const c = S.cameras.main.scrollY;
  return y > c - 40 && y < c + H + 40;
}

function knock(o, vx, vy, quiet) {
  const k = 1 / Math.sqrt(o.m);
  o.vx = vx * k;
  o.vy = vy * k;
  o.kb = 0.6;
  o.down = 0;
  o.spin = Math.random() < 0.5 ? -1 : 1;
  o.door = -1;
  if (Math.random() < 0.3) flyItem(o.x, o.y, o.vx, o.vy);
  if (ph !== 'play' || quiet) return;
  if (Math.random() < 0.2) bam(o.x, o.y - 30);
  comboN = comboT > 0 ? comboN + 1 : 1;
  comboT = 1.2;
  const p = 10 * comboN;
  sc += p;
  knocks++;
  if (AC && AC.currentTime - sndT > 0.06) {
    sndT = AC.currentTime;
    tone(200 + Math.min(comboN, 12) * 60, 0.08, 'square', 0.06, 0, 100 + comboN * 30);
  }
  if (comboN === 3 || comboN === 6 || comboN === 10) {
    hs = 0.06;
    pop(o.x, o.y - 75, (comboN >= 10 ? '¡CHUZA TOTAL!' : pick(COMBO)) + ' X' + comboN, 0xf878f8, 3, 1);
    sChuza();
  }
  if (Math.random() < 0.12) say(o, pick(AY), o.hv ? 'SEÑORA' : 'PASAJERO', 0x0058f8);
}

function bam(x, y) {
  if (fxN > 14 || fxF > 2 || !onScreen(y)) return;
  fxN++;
  fxF++;
  const t = S.add.image(x, y, 'star').setScale(2).setDepth(6500);
  S.tweens.add({
    targets: t,
    scale: 7,
    alpha: 0,
    angle: 90,
    duration: 280,
    onComplete: () => {
      t.destroy();
      fxN--;
    },
  });
}

// zapatos, telefonos y bolsos saliendo volando
function flyItem(x, y, vx, vy) {
  if (fxN > 14 || fxF > 2 || !onScreen(y)) return;
  fxN++;
  fxF++;
  const it = S.add.image(x, y - 20, pick(ITEMS)).setScale(PS).setDepth(y);
  S.tweens.add({ targets: it, x: x + vx * 0.4 + rnd(-30, 30), y: y + vy * 0.4 + rnd(-10, 20), angle: rnd(-720, 720), duration: 450 });
  S.tweens.add({
    targets: it,
    alpha: 0,
    delay: 1500,
    duration: 400,
    onComplete: () => {
      it.destroy();
      fxN--;
    },
  });
}

function dust(x, y) {
  if (fxN > 12 || fxF > 2 || !onScreen(y)) return;
  fxF++;
  for (let i = 0; i < 2; i++) {
    fxN++;
    const p = S.add.image(x, y, 'dust').setScale(PS).setDepth(y + 1);
    S.tweens.add({
      targets: p,
      x: x + rnd(-30, 30),
      y: y + rnd(-12, 6),
      alpha: 0,
      scale: PS * 2,
      duration: 400,
      onComplete: () => {
        p.destroy();
        fxN--;
      },
    });
  }
}

// globo de dialogo que sigue al personaje, con su nombre
function say(o, msg, who, col, must) {
  if (!o || !onScreen(o.y) || bubs.some((b) => b.o === o)) return;
  if (bubs.length >= 2) {
    if (!must) return;
    bubs.shift().c.destroy();
  }
  const w = Math.max(msg.length, who.length) * 12 + 16;
  const c = S.add
    .container(o.x, o.y, [
      S.add.rectangle(0, -20, w, 44, 0xffffff).setStrokeStyle(3, 0x111111),
      S.add.triangle(0, 6, 0, 0, 14, 0, 4, 12, 0xffffff),
      tx(0, -32, who + ':', 2, col, 0.5, 0.5, 0),
      tx(0, -12, msg, 2, 0x111111, 0.5, 0.5, 0),
    ])
    .setDepth(7000);
  bubs.push({ c, o, w, t: must ? 2.8 : 2.3 });
  updBubs(0);
}
function updBubs(dt) {
  for (let i = bubs.length - 1; i >= 0; i--) {
    const b = bubs[i];
    b.t -= dt;
    b.c.x = clamp(b.o.x, b.w / 2 + 6, W - b.w / 2 - 20);
    b.c.y = b.o.y - (b.o.t === 'a' || b.o.hv ? 62 : 52);
    b.c.alpha = Math.min(1, b.t * 4);
    if (b.t <= 0) {
      b.c.destroy();
      bubs.splice(i, 1);
    }
  }
  for (let i = 1; i < bubs.length; i++)
    for (let j = 0; j < i; j++) {
      const a = bubs[j];
      const b = bubs[i];
      if (Math.abs(a.c.x - b.c.x) < (a.w + b.w) / 2 + 6 && Math.abs(a.c.y - b.c.y) < 54) b.c.y = a.c.y - 56;
    }
}
function clearBubs() {
  bubs.forEach((b) => b.c.destroy());
  bubs = [];
}

// al chamo tambien lo tumban
function knockPl(vx, vy, by, who, msg) {
  if (pl.kb > 0 || pl.dash > 0 || pl.dead || ph !== 'play') return;
  pl.vx = vx;
  pl.vy = vy;
  pl.kb = 0.55;
  pl.spin = vx < 0 ? -1 : 1;
  hs = 0.07;
  if (by) say(by, msg, who, who === 'MALANDRO' ? 0xd82800 : 0x0058f8, 1);
  S.cameras.main.shake(180, 0.012);
  S.cameras.main.flash(90, 216, 40, 0);
  noise(0.15, 0.3);
  tone(300, 0.25, 'square', 0.08, 0, 90);
  bam(pl.x, pl.y - 40);
  say(pl, !by && msg ? msg : pick(OUCH), 'TU', 0xe45c10, 1);
  dust(pl.x, pl.y);
}

// un cuerpo que vuela tumba a los que toca (efecto bowling)
function hitT(a, b, nx, ny) {
  if (b === pl) {
    const sp = Math.hypot(a.vx, a.vy);
    if (a.kb > 0 && sp > 260) knockPl(nx * sp * 0.5, ny * sp * 0.5);
    return;
  }
  if (b.t === 'v' || b.kb > 0) return;
  if (a === pl) {
    if (pl.dash > 0) knock(b, nx * 620, ny * 620);
    return;
  }
  if (a.kb > 0) {
    const sp = Math.hypot(a.vx, a.vy);
    if (sp > 150) {
      knock(b, nx * sp * 0.85, ny * sp * 0.85);
      a.vx *= 0.5;
      a.vy *= 0.5;
    }
  }
}

function wall(o) {
  for (const w of WALLS) {
    if (o.y + o.r < w[1] || o.y - o.r > w[3]) continue;
    const cx = clamp(o.x, w[0], w[2]);
    const cy = clamp(o.y, w[1], w[3]);
    const dx = o.x - cx;
    const dy = o.y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 >= o.r * o.r) continue;
    if (d2 > 0.0001) {
      const d = Math.sqrt(d2);
      const p = (o.r - d) / d;
      o.x += dx * p;
      o.y += dy * p;
    } else {
      const l = o.x - w[0];
      const r = w[2] - o.x;
      const t = o.y - w[1];
      const b = w[3] - o.y;
      const m = Math.min(l, r, t, b);
      if (m === l) o.x = w[0] - o.r;
      else if (m === r) o.x = w[2] + o.r;
      else if (m === t) o.y = w[1] - o.r;
      else o.y = w[3] + o.r;
    }
  }
}

function laneFx(o) {
  for (const b of BARS) {
    if (o.y < b.y1 || o.y > b.y2) continue;
    for (const g of b.gaps) if (Math.abs(o.x - g.x) < g.hw) return g;
    return null;
  }
  return null;
}

function trainEdge(o) {
  if (o.y - o.r >= TY) return;
  const d = doors.find((dd) => Math.abs(dd.x - o.x) < (o === pl ? gapW + 12 : gapW));
  // la puerta deja pasar de a uno: el resto se tranca y empuja.
  // el chamo siempre se cuela, aunque este llena
  if (d && d.open && o.kb <= 0 && (o === pl || (!d.full && d.cool <= 0))) {
    if (o.y < TY - 6) enter(o, d);
  } else o.y = TY + o.r;
}

function enter(o, d) {
  if (o === pl) {
    if (d.full) say(pl, '¡ME COLIE!', 'TU', 0xe45c10, 1);
    return win();
  }
  o.dead = 1;
  dirty = true;
  d.cool = 0.5;
  d.n++;
  if (d.n >= d.cap) d.full = 1;
  doorLabel(d);
  S.tweens.add({ targets: o.s, y: TY - 40, alpha: 0, duration: 250, onComplete: () => o.s.destroy() });
}

function playerCtl(dt) {
  if (pl.kb > 0) return;
  if (pl.stun > 0) {
    pl.stun -= dt;
    pl.vx *= 0.85;
    pl.vy *= 0.85;
    return;
  }
  if (pl.dash > 0) {
    pl.dash -= dt;
    return;
  }
  let jx = hold('R') - hold('L');
  let jy = hold('D') - hold('U');
  if (jx || jy) {
    const l = Math.hypot(jx, jy);
    jx /= l;
    jy /= l;
    pl.face = { x: jx, y: jy };
  }
  const sp = pl.boost > 0 ? 240 : 175;
  // en el piso mojado se resbala
  const wet = inWet(pl);
  const k = wet ? Math.min(1, dt * 1.5) : 1;
  pl.vx += (jx * sp - pl.vx) * k;
  pl.vy += (jy * sp - pl.vy) * k;
  if (wet && Math.abs(pl.vx) + Math.abs(pl.vy) > 150 && Math.random() < dt * 0.5) {
    knockPl(pl.vx * 1.6, pl.vy * 1.6, null, '', '¡ME RESBALE!');
    return;
  }
  if (tap('1') && pushCd <= 0) shove();
  else if (tap('2') && kickCd <= 0) kick();
  else if (tap('3') && spinCd <= 0) spin();
}

// puerta llena: le das y sacas a alguien del vagon
function eject() {
  const d = doors.find((dd) => dd.full && dd.open && Math.abs(dd.x - pl.x) < 40 && pl.y < TY + 55);
  if (!d) return;
  d.n--;
  d.full = 0;
  doorLabel(d);
  const o = npc('o', d.x + rnd(-8, 8), TY + 6);
  knock(o, rnd(-200, 200), 560);
  sc += 50;
  pop(d.x, TY + 60, '+50', 0xf8b800, 3, 1);
  say(pl, '¡EL QUE SE FUE A BARLOVENTO PERDIO SU PUESTO!', 'TU', 0xe45c10, 1);
  say(o, '¡EPA, YO IBA PRIMERO!', 'PASAJERO', 0x0058f8, 1);
}

function shove() {
  pushCd = 0.28;
  sPush();
  const fx = S.add.image(pl.x + pl.face.x * 22, pl.y - 18 + pl.face.y * 18, 'star').setScale(PS).setDepth(5000);
  S.tweens.add({ targets: fx, scale: PS * 1.8, alpha: 0, duration: 200, onComplete: () => fx.destroy() });
  let n = 0;
  for (const o of ppl) {
    if (o.dead || o.kb > 0 || o.t === 'v') continue;
    const dx = o.x - pl.x;
    const dy = o.y - pl.y;
    if (dy > 62 || dy < -62) continue;
    const d = Math.hypot(dx, dy) || 1;
    if (d > 62 || ((dx * pl.face.x + dy * pl.face.y) / d < 0.25 && d > 26)) continue;
    knock(o, (dx / d) * 470, (dy / d) * 470);
    n++;
  }
  if (n) {
    S.cameras.main.shake(80, 0.004);
    if (Math.random() < 0.15) say(pl, pick(PUSH), 'TU', 0xe45c10);
  }
  eject();
  vigCheck();
}

function kick() {
  kickCd = 1.4;
  pl.dash = 0.24;
  pl.vx = pl.face.x * 580;
  pl.vy = pl.face.y * 580;
  sKick();
  dust(pl.x, pl.y);
  eject();
  vigCheck();
}

function spin() {
  spinCd = 4;
  noise(0.3, 0.2);
  tone(200, 0.35, 'sawtooth', 0.07, 0, 700);
  pop(pl.x, pl.y - 60, '¡MOCHILAZO!', 0xf878f8, 3, 1);
  pl.tw = 0.3;
  const ring = S.add.circle(pl.x, pl.y - 14, 20).setStrokeStyle(6, 0xf878f8).setDepth(5000);
  S.tweens.add({ targets: ring, scale: 4.5, alpha: 0, duration: 300, onComplete: () => ring.destroy() });
  for (const o of ppl) {
    const dx = o.x - pl.x;
    const dy = o.y - pl.y;
    if (o.dead || o.t === 'v' || dy > 90 || dy < -90) continue;
    const d = Math.hypot(dx, dy) || 1;
    if (d < 90) knock(o, (dx / d) * 560, (dy / d) * 560);
  }
  S.cameras.main.shake(150, 0.008);
  eject();
  vigCheck();
}

function vigCheck() {
  const v = ppl.find((o) => o.t === 'v' && !o.dead && o.cd <= 0 && Math.hypot(o.x - pl.x, o.y - pl.y) < 170);
  if (!v) return;
  v.cd = 3;
  pl.stun = 1.4;
  pl.dash = 0;
  sWhistle();
  say(v, pick(VIGS), 'VIGILANTE', 0x0058f8, 1);
  pop(pl.x, pl.y - 20, '¡TE AGARRARON!', 0xd82800, 2, 1);
}

// simulacion de la multitud (y del jugador si ctl)
function sim(dt, time, ctl) {
  ESCS.forEach((e) => (e.tilePositionY += e.d * dt * power));
  AL.length = 0;
  if (ctl && !pl.dead) AL.push(pl);
  for (const o of ppl) if (!o.dead) AL.push(o);
  pl.m = pl.dash > 0 ? 8 : 1.6;
  if (pl.tw > 0) pl.tw -= dt;
  if (pl.boost > 0) pl.boost -= dt;
  for (const o of AL) {
    if (o === pl) playerCtl(dt);
    else if (o.down > 0) {
      // tirado en el piso un ratico
      o.down -= dt;
      o.vx = 0;
      o.vy = 0;
    } else if (o.kb <= 0) ai(o, dt, time);
    if (o.kb > 0) {
      o.kb -= dt;
      const f = Math.max(0, 1 - dt * (inWet(o) ? 0.9 : 3.5)); // en lo mojado se patina lejos
      o.vx *= f;
      o.vy *= f;
      if (o.kb <= 0 && o !== pl) {
        o.down = rnd(0.5, 1);
        if (ph === 'play') dust(o.x, o.y);
      }
    }
    if (o.cd > 0) o.cd -= dt;
    // escaleras: la mecanica sube o baja sola, la fija cansa
    const g = o.y > PLAT - 20 ? laneFx(o) : null;
    const sm = g ? g.sm : 1;
    o.x += o.vx * sm * dt;
    o.y += (o.vy * sm + (g ? g.ey * power : 0)) * dt;
  }
  // choques entre cuerpos: ordenados por altura, solo se comparan los cercanos
  AL.sort((a, b) => a.y - b.y);
  const n = AL.length;
  // cerca de una puerta abierta el chamo se cuela entre la gente y se alinea con el hueco
  const dn = ctl && !pl.dead && pl.y < TY + 90 && pl.kb <= 0 ? doors.find((dd) => dd.open && Math.abs(dd.x - pl.x) < 56) : null;
  if (dn) pl.x += (dn.x - pl.x) * Math.min(1, dt * 10);
  const sq = !!dn;
  for (let i = 0; i < n; i++) {
    const a = AL[i];
    for (let j = i + 1; j < n; j++) {
      const b = AL[j];
      const dy = b.y - a.y;
      if (dy >= 30) break;
      if (sq && (a === pl || b === pl)) continue;
      const rr = a.r + b.r;
      const dx = b.x - a.x;
      if (dy >= rr || dx >= rr || dx <= -rr) continue;
      const d2 = dx * dx + dy * dy;
      if (d2 >= rr * rr) continue;
      const d = Math.sqrt(d2) || 0.01;
      const nx = dx / d;
      const ny = dy / d;
      const ia = 1 / a.m;
      const ib = 1 / b.m;
      const s = (rr - d) / (ia + ib);
      a.x -= nx * s * ia;
      a.y -= ny * s * ia;
      b.x += nx * s * ib;
      b.y += ny * s * ib;
      hitT(a, b, nx, ny);
      hitT(b, a, -nx, -ny);
    }
  }
  for (const o of ppl) {
    if (o.dead || o.kb > 0 || o.down > 0 || o.t === 'w' || o.t === 'v') continue;
    if (Math.abs(o.vx) + Math.abs(o.vy) > 70 && Math.random() < dt * 0.6 && inWet(o)) {
      knock(o, o.vx * 2.4, o.vy * 2.4, 1);
      if (Math.random() < 0.15) say(o, pick(['¡ME RESBALE!', '¡AY, EL PISO!', '¡QUE RESBALOSO!']), 'PASAJERO', 0x0058f8);
      continue;
    }
    if (ctl && !pl.dead && Math.abs(pl.y - o.y) < 40) {
      const dx = pl.x - o.x;
      const dy = pl.y - o.y;
      const d = Math.hypot(dx, dy) || 1;
      if (o.t === 'a' && o.cd <= 0 && d < o.r + pl.r + 8) {
        o.cd = 1.6;
        knockPl((dx / d) * 480, (dy / d) * 480, o, 'MALANDRO', pick(BRAVO));
        continue;
      }
      if (o.t === 'r' && d < 30 && Math.random() < dt * 0.9) {
        knockPl((dx / d) * 300, (dy / d) * 300, o, 'PASAJERO', pick(['¡MUEVETE, CHAMO!', '¡YO VOY PRIMERO!', '¡ABRETE, PUES!', '¡NO TE COLEES!']));
        continue;
      }
    }
    // la gente tambien se empuja entre ella
    if (Math.random() < dt * 0.1 && onScreen(o.y)) {
      const q = ppl.find((p) => p !== o && !p.dead && p.kb <= 0 && p.t !== 'v' && Math.abs(p.x - o.x) < 28 && Math.abs(p.y - o.y) < 28);
      if (q) knock(q, (q.x - o.x) * 12, (q.y - o.y) * 12, 1);
    }
  }
  for (const o of AL) {
    if (o.dead) continue;
    wall(o);
    o.x = clamp(o.x, 14, W - 14);
    if (o.t !== 'o') o.y = Math.min(o.y, WH - 12);
    trainEdge(o);
    if (o.dead) continue;
    if (o.hc > 0) o.hc -= dt;
    else if (o.kb <= 0)
      for (const q of HOLES) {
        if (Math.abs(o.y - q[1]) > q[2] * 0.6 || Math.abs(o.x - q[0]) > q[2]) continue;
        o.hc = 1.5;
        if (o === pl) {
          pl.stun = 0.7;
          pl.vx *= 0.2;
          pl.vy *= 0.2;
          tone(150, 0.2, 'square', 0.08, 0, 60);
          say(pl, pick(['¡ESE HUECO!', '¡AY, MI TOBILLO!']), 'TU', 0xe45c10, 1);
        } else if (o.t !== 'v') {
          knock(o, o.vx * 1.5, o.vy * 1.5, 1);
          if (o.t === 'w') o.hx += 40;
        }
        break;
      }
    if (o.y > WH + 20) {
      o.dead = 1;
      dirty = true;
      o.s.destroy();
      continue;
    }
    const mv = Math.abs(o.vx) + Math.abs(o.vy) > 18;
    const fr = mv ? Math.floor(time / 140 + o.ph) % 2 : 0;
    const s = o.s;
    let k;
    if (o === pl) k = 'pl' + (pl.face.y > 0.3 ? 'f' : 'b') + fr;
    else if (o.t === 'v') k = 'vg';
    else if (o.t === 'a') k = 'b' + (o.vy < -10 ? 'b' : 'f') + fr;
    else if (o.hv) k = 'hv' + o.v;
    else k = 'n' + (o.vy < -10 ? 'b' : 'f') + o.v + fr;
    if (o.tk !== k) {
      o.tk = k;
      s.setTexture(k);
    }
    if (o.vx > 10) s.flipX = false;
    else if (o.vx < -10) s.flipX = true;
    s.x = o.x;
    s.y = o.y;
    if (s.depth !== o.y) s.setDepth(o.y);
    if (o.kb > 0) s.angle += o.spin * dt * 700;
    else if (o.down > 0) s.angle = 90 * o.spin;
    else if (o === pl) s.angle = pl.tw > 0 ? (1 - pl.tw / 0.3) * 360 : pl.dash > 0 ? pl.face.x * 30 : pl.stun > 0 ? Math.sin(time / 50) * 15 : 0;
    else if (s.angle) s.angle = 0;
  }
  if (dirty) {
    ppl = ppl.filter((o) => !o.dead);
    dirty = false;
  }
  updBubs(dt);
}

// ---------- Flujo del juego ----------
function startGame() {
  sc = 0;
  lives = 3;
  lvl = 0;
  knocks = 0;
  cleared = 0;
  tc.setVisible(false);
  showHud(true);
  startLevel('PRIMERA PARADA');
}

function startLevel(pre) {
  clearPpl();
  ovG.forEach((o) => o.destroy());
  ovG = [];
  const L = lvl;
  genLevel(L);
  heavyP = Math.min(0.15 + L * 0.02, 0.35);
  // tiempo justo: hay que correr de verdad
  T = Math.round(((WH - TY) / 175) * Math.max(1.05, 1.32 - L * 0.03) + 2);
  comboN = 0;
  comboT = 0;
  pushCd = 0;
  kickCd = 0;
  spinCd = 0;
  warned = 0;
  beepS = 99;
  salQ = Math.min(12 + L * 3, 30);
  salT = 0.6;
  runT = 1;
  lvT = 0;
  oleT = 6;
  gapW = 24;
  hs = 0;
  const cap = Math.max(5, 11 - L);
  lightsOn();
  blkAt = Math.random() < (L ? 0.75 : 0.5) ? T * rnd(0.35, 0.7) : -1;
  ratT = rnd(3, 6);
  doors.forEach((d) => {
    d.cool = 0;
    d.n = 0;
    d.cap = cap;
    d.full = 0;
    doorLabel(d);
  });
  setDoors(0);
  for (let i = 0; i < Math.min(26 + L * 4, 50); i++) waiter();
  // algunos del anden ya se estan montando desde el principio
  ppl.forEach((o) => {
    if (Math.random() < 0.3) {
      o.t = 'r';
      o.spd = rnd(60, 100);
    }
  });
  FLOORS.forEach((f) => {
    for (let i = 0; i < 3 + Math.min(L, 4); i++) {
      const x = rnd(30, 770);
      const y = rnd(f[0], f[1]);
      if (!inWall(x, y, 16)) npc(Math.random() < 0.3 ? 'w' : 'r', x, y);
    }
  });
  TAPON.forEach((t) => {
    for (let i = 0; i < t.n; i++) {
      const x = t.x + rnd(-48, 48);
      const y = t.y + rnd(-28, 28);
      if (!inWall(x, y, 13)) npc('w', x, y);
    }
  });
  BARS.forEach((b) => {
    if (b.y2 - b.y1 > 60) b.gaps.forEach((g) => Math.random() < 0.6 && npc('r', g.x + rnd(-20, 20), rnd(b.y1 + 20, b.y2 - 20)));
  });
  for (let i = 0; i < Math.min(2 + L, 7); i++) {
    const p = fpt();
    npc('a', p.x, p.y);
  }
  if (L >= 1)
    for (let i = 0; i < Math.min(1 + (L >> 2), 3); i++) {
      const p = fpt();
      npc('v', clamp(p.x, 140, 660), p.y);
    }
  for (let i = 0; i < 2 + (L > 2); i++) {
    const p = fpt();
    const k = i % 2 ? 'teque' : 'cafe';
    const s = S.add.image(p.x, p.y, k).setScale(PS).setDepth(p.y);
    S.tweens.add({ targets: s, y: p.y - 8, yoyo: true, repeat: -1, duration: 400 });
    lvlObjs.push(s);
    pks.push({ k, x: p.x, y: p.y, s });
  }
  Object.assign(pl, { x: 400, y: WH - 60, vx: 0, vy: 0, face: { x: 0, y: -1 }, dash: 0, stun: 0, kb: 0, tw: 0, boost: 0, dead: 0 });
  pl.s.setVisible(true).setAlpha(1).setAngle(0).setTexture('plb0').setPosition(pl.x, pl.y).setDepth(pl.y);
  S.cameras.main.startFollow(pl.s, true, 0.12, 0.12);
  S.cameras.main.setScroll(0, WH - H);
  train.x = -900;
  S.tweens.add({ targets: train, x: 0, duration: 1100, ease: 'Cubic.easeOut' });
  sTrain();
  const name = STATIONS[L % STATIONS.length];
  hud.st.setText(name);
  banner(name, pre);
  mOn = false;
  pT = 1.6;
  ph = 'ready';
}

function updReady(dt, time) {
  pT -= dt;
  sim(dt, time, false);
  drawHud(time);
  if (pT <= 0) {
    setDoors(1);
    sChime();
    pop(400, WH - 120, '¡ECHALE PIERNA!', 0xf8b800, 4, 1);
    mOn = true;
    mI = 0;
    ph = 'play';
  }
}

function updPlay(dt, time) {
  if (hs > 0) {
    hs -= dt;
    return;
  }
  T -= dt;
  lvT += dt;
  pushCd -= dt;
  kickCd -= dt;
  spinCd -= dt;
  comboT -= dt;
  music(170 + Math.max(0, 10 - T) * 8);
  // en los ultimos 3 segundos las puertas se van cerrando
  gapW = T < 3 ? Math.max(3, (24 * T) / 3) : 24;
  doors.forEach((d) => {
    d.cool -= dt;
    if (T < 3 && d.open) {
      d.pa.x = d.x - 14 - (28 * T) / 3;
      d.pb.x = d.x + 14 + (28 * T) / 3;
    }
  });
  // gente que sale del tren
  salT -= dt;
  if (salQ > 0 && salT <= 0) {
    salT = 0.2;
    salQ--;
    npc('o', pick(DOORS) + rnd(-12, 12), TY + 14);
    if (salQ === 6) say(ppl[ppl.length - 1], '¡DEJEN SALIR, PUES!', 'PASAJERO', 0x0058f8, 1);
  }
  // gente que llega corriendo detras de ti
  const crowd = ppl.length < 120;
  runT -= dt;
  if (runT <= 0) {
    runT = Math.max(0.35, 1 - lvl * 0.07) * rnd(0.7, 1.3);
    if (crowd) npc('r', rnd(80, 720), WH - 15);
  }
  // oleadas de gente entrando a la estacion
  oleT -= dt;
  if (oleT <= 0) {
    oleT = rnd(5, 7);
    if (crowd) for (let i = 0; i < 6 + Math.min(lvl, 6); i++) npc('r', rnd(80, 720), WH - 15 - i * 6);
    noise(0.6, 0.1);
    if (pl.y > WH - 500) pop(pl.x, pl.y - 90, '¡BURDA DE GENTE!', 0xd82800, 3, 1);
  }
  // apagon: parpadeo, oscuridad y vuelve la luz
  if (blkAt > 0 && T <= blkAt) {
    blkAt = -1;
    blkP = 1;
    blkT = 1.3;
    sBuzz();
  }
  if (blkP === 1) {
    blkT -= dt;
    darkImg.setVisible(Math.random() < 0.45);
    if (blkT <= 0) {
      blkP = 2;
      blkT = rnd(6, 9);
      power = 0;
      darkImg.setVisible(true);
      sOff();
      banner('¡SE FUE LA LUZ!', pick(['¡OTRA VEZ, VALE!', '¡AY NO, CHAMO!', '¡QUE VAINA!', '¡CONCHALE!']), 0xf8b800);
      let k = 0;
      for (const o of ppl) if (k < 2 && onScreen(o.y) && o.t !== 'w' && Math.random() < 0.5) say(o, pick(DARK), 'PASAJERO', 0x0058f8, ++k);
    }
  } else if (blkP === 2) {
    blkT -= dt;
    if (blkT <= 0) lightsOn(1);
  }
  if (darkImg.visible) darkImg.setPosition(pl.x, pl.y - 20);
  // ratas cruzando
  ratT -= dt;
  if (ratT <= 0) {
    ratT = rnd(5, 9);
    const ry = S.cameras.main.scrollY + rnd(120, 480);
    const lr = Math.random() < 0.5;
    const r = S.add.image(lr ? -20 : W + 20, ry, 'rata').setScale(PS).setDepth(ry).setFlipX(!lr);
    S.tweens.add({ targets: r, x: lr ? W + 20 : -20, duration: 1500, onComplete: () => r.destroy() });
    tone(2200, 0.05, 'square', 0.03);
    tone(2600, 0.05, 'square', 0.03, 0.08);
    let k = 0;
    for (const o of ppl)
      if (k < 2 && o.kb <= 0 && o.t !== 'v' && Math.abs(o.y - ry) < 50 && onScreen(o.y)) {
        knock(o, 0, o.y < ry ? -260 : 260, 1);
        if (!k++) say(o, pick(RATA), o.hv ? 'SEÑORA' : 'PASAJERO', 0x0058f8);
      }
  }
  // buhoneros pregonando
  for (const s of STALLS) {
    s.cd -= dt;
    if (s.cd <= 0 && Math.abs(pl.x - s.x) < 170 && Math.abs(pl.y - s.y) < 150) {
      s.cd = rnd(10, 15);
      say(s, pick(s.g), 'BUHONERO', 0x00a800, 1);
    }
  }
  // cafecito y tequeños
  for (const p of pks) {
    if (p.got || Math.abs(pl.x - p.x) > 24 || Math.abs(pl.y - p.y) > 24) continue;
    p.got = 1;
    p.s.setVisible(false);
    sGood();
    if (p.k === 'cafe') {
      pl.boost = 5;
      pop(pl.x, pl.y - 70, '¡CAFECITO! ¡A MILLON!', 0xf8b800, 3, 1);
    } else {
      T += 4;
      pop(pl.x, pl.y - 70, '¡TEQUEÑO! +4 SEG', 0xf8b800, 3, 1);
    }
  }
  if (T <= 10 && !warned) {
    warned = 1;
    sChime();
    banner('¡LAS PUERTAS SE VAN A CERRAR!', 'ATENCION', 0xd82800);
    ppl.forEach((o) => {
      if (o.t === 'w' && o.y < PLAT) {
        o.t = 'r';
        o.spd = rnd(110, 160);
      }
    });
    pop(400, TY + 120, pick(['¡SE FORMO EL ZAPEROCO!', '¡PONTE LAS ALPARGATAS QUE LO QUE VIENE ES JOROPO!']), 0xd82800, 2, 1);
  }
  const sNow = Math.ceil(T);
  if (sNow <= 5 && sNow < beepS) {
    beepS = sNow;
    sBeep();
  }
  sim(dt, time, true);
  if (ph !== 'play') return;
  arrowS.setVisible(lvT < 3 && Math.floor(lvT * 5) % 2 === 0).setPosition(pl.x, pl.y - 52);
  pl.s.setAlpha(pl.stun > 0 && Math.floor(time / 80) % 2 ? 0.4 : 1);
  if (pl.boost > 0 && Math.random() < 0.3) dust(pl.x, pl.y);
  drawHud(time);
  if (T <= 0) return fail();
  if (tap('START1', 'START2')) {
    ph = 'pause';
    mOn = false;
    ovG.push(
      S.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setDepth(9600).setScrollFactor(0),
      hx(W / 2, H / 2, 'PAUSA', 8, 0xf8b800).setDepth(9601)
    );
  }
}

function lightsOn(msg) {
  if (blkP === 2 && msg) {
    sOn();
    banner('¡VOLVIO LA LUZ!', '', 0x00e000);
  }
  blkP = 0;
  power = 1;
  darkImg.setVisible(false);
}

function departTrain(delay) {
  S.time.delayedCall(delay, () => {
    sTrain();
    S.tweens.add({ targets: train, x: 950, duration: 1500, ease: 'Cubic.easeIn' });
  });
}

function win() {
  lightsOn();
  ph = 'win';
  pT = 3;
  mOn = false;
  pl.dead = 1;
  arrowS.setVisible(false);
  S.tweens.add({ targets: pl.s, y: TY - 40, alpha: 0, duration: 300 });
  const pelo = T < 2;
  const b = Math.ceil(T) * 25 + (lvl + 1) * 100 + (pelo ? 300 : 0);
  sc += b;
  cleared++;
  sWin();
  banner(pelo ? '¡POR UN PELO, MI PANA!' : '¡TE MONTASTE, MI PANA!', '+BS ' + b, 0x00e000);
  S.time.delayedCall(600, () => {
    setDoors(0);
    sDoor();
  });
  departTrain(1200);
}

function fail() {
  lightsOn();
  ph = 'fail';
  pT = 3.2;
  mOn = false;
  lives--;
  arrowS.setVisible(false);
  setDoors(0);
  sDoor();
  sFail();
  S.cameras.main.shake(300, 0.01);
  banner('¡SE TE FUE EL METRO!', lives > 0 ? '¡QUE BROMA! TE QUEDAN ' + lives + ' BOLETOS' : '¡SIN BOLETOS, CHAMO!', 0xd82800);
  departTrain(900);
}

function updEnd(dt, time) {
  pT -= dt;
  sim(dt, time, false);
  if (ph === 'fail') pl.s.setPosition(pl.x, pl.y);
  drawHud(time);
  if (pT > 0) return;
  if (ph === 'win') {
    lvl++;
    startLevel('PROXIMA ESTACION');
  } else if (lives > 0) startLevel('ESPERA EL OTRO TREN EN');
  else over();
}

function pop(x, y, s, c, sz = 3, must) {
  if (!must && (fxN > 14 || fxF > 2 || !onScreen(y))) return;
  fxN++;
  fxF++;
  const w = s.length * 6 * sz + 12;
  x = clamp(x, w / 2 + 4, W - w / 2 - 24);
  const t = S.add.container(x, y, [S.add.rectangle(0, 0, w, 6 * sz + 10, 0x000000, 0.8), tx(0, 1, s, sz, c)]).setDepth(6000);
  S.tweens.add({
    targets: t,
    y: y - 40,
    alpha: 0,
    delay: must ? 900 : 300,
    duration: 900,
    ease: 'Cubic.easeIn',
    onComplete: () => {
      t.destroy();
      fxN--;
    },
  });
}

let bnr = [];
function banner(s, pre, col = 0xf8b800) {
  bnr.forEach((o) => o.destroy());
  const sz = s.length > 18 ? 3 : 5;
  const pw = Math.max(s.length * 6 * sz, (pre || '').length * 18) + 40;
  const pa = S.add.rectangle(W / 2, 172, pw, 6 * sz + 60, 0x000000, 0.8).setStrokeStyle(3, col).setScrollFactor(0).setDepth(9099).setAlpha(0);
  const a = hx(W / 2, 150, pre || '', 3, 0xffffff).setDepth(9100).setAlpha(0);
  const b = hx(W / 2, 192, s, sz, col).setDepth(9100).setAlpha(0);
  S.tweens.add({ targets: [pa, a, b], alpha: 1, y: '-=20', duration: 300, ease: 'Back.easeOut' });
  S.tweens.add({ targets: [pa, a, b], alpha: 0, delay: 2600, duration: 400, onComplete: () => (pa.destroy(), a.destroy(), b.destroy()) });
  bnr = [pa, a, b];
}

function over() {
  ph = 'over';
  mOn = false;
  oT = 0;
  const D = 9601;
  ovG.push(
    S.add.rectangle(W / 2, H / 2, 680, 330, 0x000000, 0.9).setStrokeStyle(4, 0xf8b800).setDepth(9600).setScrollFactor(0),
    hx(W / 2, 180, '¡FIN DEL VIAJE!', 6, 0xd82800).setDepth(D),
    hx(W / 2, 240, 'BS ' + pad(sc), 5, 0xf8b800).setDepth(D),
    hx(W / 2, 290, 'ESTACIONES: ' + cleared + '    EMPUJADOS: ' + knocks, 2).setDepth(D),
    hx(W / 2, 315, 'TE QUEDASTE EN ' + STATIONS[lvl % STATIONS.length], 2).setDepth(D),
    hx(W / 2, 345, 'CAMARON QUE SE DUERME SE LO LLEVA LA CORRIENTE', 2, 0x7c7c7c).setDepth(D)
  );
  ovCont = hx(W / 2, 410, 'PRESIONA START', 3).setDepth(D).setVisible(false);
  ovG.push(ovCont);
}

function updOver(dt) {
  oT += dt;
  if (oT < 1.5) return;
  ovCont.setVisible(Math.floor(oT * 2.5) % 2 === 0);
  if (!tapGo()) return;
  sBlip();
  ovG.forEach((o) => o.destroy());
  ovG = [];
  if (sc > best[best.length - 1].s) startName();
  else toTitle();
}

// ---------- Iniciales para el record ----------
const LET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function startName() {
  ph = 'name';
  nm = { c: [0, 0, 0], p: 0, t: 0, o: [] };
  nm.o.push(
    S.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.92).setDepth(9600).setScrollFactor(0),
    hx(W / 2, 140, '¡NUEVO RECORD!', 7, 0xf8b800).setDepth(9601),
    hx(W / 2, 200, 'BS ' + pad(sc), 4).setDepth(9601),
    hx(W / 2, 470, 'ARRIBA/ABAJO: LETRA   BOTON 1: SIGUIENTE', 2, 0x7c7c7c).setDepth(9601)
  );
  nm.l = [0, 1, 2].map((i) => hx(320 + i * 80, 320, 'A', 10, 0xffffff).setDepth(9601));
  nm.cur = S.add.rectangle(320, 360, 56, 8, 0xf8b800).setDepth(9601).setScrollFactor(0);
  nm.o.push(...nm.l, nm.cur);
}

function updName(dt) {
  nm.t += dt;
  const d = (tap('U') ? 1 : 0) - (tap('D') ? 1 : 0);
  if (d) {
    nm.c[nm.p] = (nm.c[nm.p] + d + LET.length) % LET.length;
    sBlip();
  }
  if (tap('L') && nm.p > 0) nm.p--;
  if (tap('R') && nm.p < 2) nm.p++;
  nm.l.forEach((t, i) => t.setText(LET[nm.c[i]]).setTint(i === nm.p ? 0xf8b800 : 0xffffff));
  nm.cur.x = 320 + nm.p * 80;
  nm.cur.setVisible(Math.floor(nm.t * 4) % 2 === 0);
  if (tapGo()) {
    sWin();
    if (nm.p < 2) nm.p++;
    else {
      best = cleanBest(best.concat([{ n: nm.c.map((c) => LET[c]).join(''), s: Math.floor(sc) }]));
      st().set(STORE_KEY, best).catch(() => {});
      fillRecords();
      nm.o.forEach((o) => o.destroy());
      nm = null;
      toTitle();
    }
  }
}

function update(time, delta) {
  const dt = Math.min(delta, 50) / 1000;
  if (ph === 'title') updTitle(dt, time);
  else if (ph === 'ready') updReady(dt, time);
  else if (ph === 'play') updPlay(dt, time);
  else if (ph === 'win' || ph === 'fail') updEnd(dt, time);
  else if (ph === 'over') updOver(dt);
  else if (ph === 'name') updName(dt);
  else if (ph === 'pause' && tap('START1', 'START2')) {
    ovG.forEach((o) => o.destroy());
    ovG = [];
    ph = 'play';
    mOn = true;
  }
  fxF = 0;
  for (const k in prs) delete prs[k];
}
