const scene = document.querySelector("#scene");
const world = document.querySelector("#world");
const playerEl = document.querySelector("#player");
const messageEl = document.querySelector("#message");
const levelSubtitle = document.querySelector("#levelSubtitle");
const levelText = document.querySelector("#levelText");
const energyText = document.querySelector("#energyText");
const soothedText = document.querySelector("#soothedText");
const bagCount = document.querySelector("#bagCount");
const bagGrid = document.querySelector("#bagGrid");
const metricEls = {
  stress: document.querySelector("#stressMetric"),
  anxiety: document.querySelector("#anxietyMetric"),
  lonely: document.querySelector("#lonelyMetric"),
  restore: document.querySelector("#restoreMetric")
};
const metricBars = {
  stress: document.querySelector("#stressBar"),
  anxiety: document.querySelector("#anxietyBar"),
  lonely: document.querySelector("#lonelyBar"),
  restore: document.querySelector("#restoreBar")
};
const demoBtn = document.querySelector("#demoBtn");
const musicBtn = document.querySelector("#musicBtn");
const resetBtn = document.querySelector("#resetBtn");
const portalText = document.querySelector("#portalText");
const startModal = document.querySelector("#startModal");
const rewardModal = document.querySelector("#rewardModal");
const rewardKicker = document.querySelector("#rewardKicker");
const rewardTitle = document.querySelector("#rewardTitle");
const rewardBody = document.querySelector("#rewardBody");
const rewardUse = document.querySelector("#rewardUse");
const nextLevelBtn = document.querySelector("#nextLevelBtn");
const finishModal = document.querySelector("#finishModal");
const finishText = document.querySelector("#finishText");
const finalBag = document.querySelector("#finalBag");
const supportText = document.querySelector("#supportText");
const playAgainBtn = document.querySelector("#playAgainBtn");

const levelWidth = 2100;
const gravity = 0.78;
const keys = new Set();
const audioState = {
  ctx: null,
  master: null,
  drone: null,
  droneGain: null,
  timer: null,
  enabled: false,
  noteIndex: 0
};

const ambientNotes = [261.63, 329.63, 392, 523.25, 587.33, 659.25, 783.99];

function ensureAudio() {
  if (audioState.ctx) return audioState.ctx;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0.32;
  master.connect(ctx.destination);
  audioState.ctx = ctx;
  audioState.master = master;
  return ctx;
}

function playTone(frequency, duration = 0.22, type = "sine", gain = 0.08, delay = 0) {
  if (!audioState.enabled) return;
  const ctx = ensureAudio();
  if (!ctx || !audioState.master) return;

  const oscillator = ctx.createOscillator();
  const toneGain = ctx.createGain();
  const startAt = ctx.currentTime + delay;
  const endAt = startAt + duration;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  toneGain.gain.setValueAtTime(0.0001, startAt);
  toneGain.gain.exponentialRampToValueAtTime(gain, startAt + 0.035);
  toneGain.gain.exponentialRampToValueAtTime(0.0001, endAt);

  oscillator.connect(toneGain);
  toneGain.connect(audioState.master);
  oscillator.start(startAt);
  oscillator.stop(endAt + 0.04);
}

function playUnlockSound() {
  playTone(523.25, 0.12, "sine", 0.11);
  playTone(783.99, 0.18, "triangle", 0.09, 0.1);
}

function playSoftChord(root = 261.63) {
  playTone(root, 0.7, "sine", 0.035, 0);
  playTone(root * 1.25, 0.72, "triangle", 0.03, 0.04);
  playTone(root * 1.5, 0.78, "sine", 0.026, 0.08);
}

function startDrone() {
  const ctx = ensureAudio();
  if (!ctx || !audioState.master || audioState.drone) return;

  const drone = ctx.createOscillator();
  const droneGain = ctx.createGain();
  drone.type = "sine";
  drone.frequency.value = 130.81;
  droneGain.gain.value = 0.0001;
  drone.connect(droneGain);
  droneGain.connect(audioState.master);
  drone.start();
  droneGain.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + 1.4);
  audioState.drone = drone;
  audioState.droneGain = droneGain;
}

function stopDrone() {
  if (!audioState.ctx || !audioState.drone || !audioState.droneGain) return;
  const ctx = audioState.ctx;
  audioState.droneGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
  audioState.drone.stop(ctx.currentTime + 0.52);
  audioState.drone = null;
  audioState.droneGain = null;
}

function scheduleAmbient() {
  if (audioState.timer) window.clearInterval(audioState.timer);
  audioState.timer = window.setInterval(() => {
    if (!audioState.enabled) return;
    const base = ambientNotes[audioState.noteIndex % ambientNotes.length];
    audioState.noteIndex += 1;
    playTone(base * 2, 0.42, "sine", 0.032);
    if (audioState.noteIndex % 4 === 0) playSoftChord(base);
  }, 1450);
}

async function startAudio() {
  const ctx = ensureAudio();
  if (!ctx) {
    setMessage("当前浏览器暂不支持背景音乐，但游戏可以正常体验。");
    return;
  }
  if (ctx.state === "suspended") await ctx.resume();
  audioState.enabled = true;
  musicBtn.classList.add("is-on");
  musicBtn.textContent = "音乐开";
  musicBtn.setAttribute("aria-pressed", "true");
  startDrone();
  scheduleAmbient();
  playUnlockSound();
  playSoftChord(261.63);
}

function stopAudio() {
  audioState.enabled = false;
  musicBtn.classList.remove("is-on");
  musicBtn.textContent = "音乐";
  musicBtn.setAttribute("aria-pressed", "false");
  if (audioState.timer) window.clearInterval(audioState.timer);
  audioState.timer = null;
  stopDrone();
}

function toggleMusic() {
  if (audioState.enabled) {
    stopAudio();
  } else {
    startAudio();
  }
}

function playCollectSound() {
  playTone(880, 0.12, "sine", 0.07);
  playTone(1174.66, 0.16, "sine", 0.055, 0.08);
}

function playSootheSound() {
  playSoftChord(329.63);
}

function playHitSound() {
  playTone(196, 0.14, "sawtooth", 0.045);
  playTone(146.83, 0.18, "triangle", 0.035, 0.08);
}

function playRewardSound() {
  playTone(523.25, 0.16, "sine", 0.06);
  playTone(659.25, 0.18, "sine", 0.055, 0.1);
  playTone(783.99, 0.32, "triangle", 0.05, 0.22);
}

const platforms = [
  { x: 0, y: 0, width: 2100, height: 74 },
  { x: 330, y: 172, width: 230, height: 28 },
  { x: 850, y: 218, width: 260, height: 28 },
  { x: 1360, y: 168, width: 250, height: 28 }
];

const levelPool = {
  breath: {
    name: "安全呼吸林",
    theme: "default",
    intro: "先让身体安全下来。这里有可以跳过的惊慌石，也有需要钻过的压力云。",
    reward: {
      title: "呼吸锦囊",
      body: "轻轻吸一口，不要吸满；再把气慢慢呼长一点。重复 3 轮，让身体先知道：现在是安全的。",
      use: "艺术疗愈练习：用一条线画出你的呼气，越慢越长，不追求好看。"
    },
    monsters: [
      { x: 420, y: 246, label: "心跳快", color: "#cdb9ff", line: "心跳快被看见了：身体在保护你，不是在证明你不行。" },
      { x: 880, y: 74, label: "发紧", color: "#ffd98f", line: "发紧松了一点：慢慢呼气，肩膀可以先放下来。" },
      { x: 1420, y: 242, label: "想逃", color: "#a9e7c1", line: "想逃被理解了：逃跑冲动只是安全系统在工作。" }
    ],
    obstacles: [
      { x: 610, y: 74, type: "jump", label: "惊慌石" },
      { x: 1180, y: 74, type: "duck", label: "压力云" }
    ]
  },
  boundary: {
    name: "边界花园",
    theme: "tender",
    intro: "有些感受需要被分清：哪些是事实，哪些是我的受伤。",
    reward: {
      title: "边界锦囊",
      body: "把事实和感受分开：发生了什么？我感到了什么？我需要什么？",
      use: "艺术疗愈练习：画一个保护圈，把你想保留的能量放在圈内。"
    },
    monsters: [
      { x: 380, y: 172, label: "被误会", color: "#f6b8c9", line: "被误会被接住了：你可以难过，也可以慢慢说明。" },
      { x: 910, y: 292, label: "没被看见", color: "#ffd2e2", line: "没被看见亮了起来：你的努力不会因为无人看见就消失。" },
      { x: 1510, y: 242, label: "忍住哭", color: "#cdb9ff", line: "忍住哭松开了：眼泪不是脆弱，是心在排水。" }
    ],
    obstacles: [
      { x: 700, y: 74, type: "duck", label: "评价藤" },
      { x: 1280, y: 74, type: "jump", label: "刺耳话" }
    ]
  },
  nextStep: {
    name: "下一步风谷",
    theme: "storm",
    intro: "焦虑会把所有任务一起吹过来。你只需要找到下一小步。",
    reward: {
      title: "下一步锦囊",
      body: "把脑中的事情全部倒出来，只圈一个 5 分钟能启动的动作。",
      use: "艺术疗愈练习：把脑中的任务画成小石头，只给其中一颗上色。"
    },
    monsters: [
      { x: 430, y: 74, label: "来不及", color: "#ffcc75", line: "来不及慢下来了：真正重要的事，可以被排序。" },
      { x: 940, y: 292, label: "脑子乱", color: "#b9c8ff", line: "脑子乱被整理了：写下来，别让它们全挤在心里。" },
      { x: 1460, y: 74, label: "怕失败", color: "#f6b8c9", line: "怕失败被抱住了：失败不是结论，只是反馈。" }
    ],
    obstacles: [
      { x: 650, y: 74, type: "jump", label: "任务山" },
      { x: 1210, y: 74, type: "duck", label: "念头风" },
      { x: 1660, y: 74, type: "jump", label: "截止线" }
    ]
  },
  courage: {
    name: "勇气洞穴",
    theme: "night",
    intro: "恐惧会让路变窄。别急着冲过去，先点亮一小段安全感。",
    reward: {
      title: "勇气锦囊",
      body: "把恐惧说具体：我怕的是什么？最小的安全动作是什么？",
      use: "艺术疗愈练习：画一个小小火把，写下它能照亮的下一步。"
    },
    monsters: [
      { x: 390, y: 74, label: "不敢", color: "#b8b7f2", line: "不敢被看见了：害怕不代表停住，它只是提醒你要慢一点。" },
      { x: 850, y: 292, label: "会受伤", color: "#f6b8c9", line: "会受伤被照顾了：你可以先给自己一个边界。" },
      { x: 1440, y: 242, label: "未知", color: "#a9e7c1", line: "未知亮起灯：先照亮脚下这一小格就够。" }
    ],
    obstacles: [
      { x: 620, y: 74, type: "duck", label: "低矮洞" },
      { x: 1180, y: 74, type: "jump", label: "恐惧坎" }
    ]
  },
  rest: {
    name: "恢复温泉",
    theme: "rest",
    intro: "疲惫不是敌人。这里的任务不是硬撑，是把能量接回来。",
    reward: {
      title: "休息锦囊",
      body: "给自己 10 分钟无任务区：喝水、闭眼、伸展，不用证明什么。",
      use: "艺术疗愈练习：选一种舒服的颜色，涂满一小块安静区域。"
    },
    monsters: [
      { x: 395, y: 246, label: "没力气", color: "#8fc7ee", line: "没力气被允许了：你不是懒，你是真的需要补给。" },
      { x: 860, y: 74, label: "硬撑", color: "#a9e7c1", line: "硬撑放下了：休息不是退后，是恢复系统。" },
      { x: 1510, y: 242, label: "耗尽", color: "#ffd98f", line: "耗尽被照顾了：今天可以只做必要的事。" }
    ],
    obstacles: [
      { x: 650, y: 74, type: "duck", label: "低电量" },
      { x: 1300, y: 74, type: "jump", label: "硬撑墙" }
    ]
  },
  connection: {
    name: "连接星夜",
    theme: "night",
    intro: "孤独不一定要马上被解决。先让自己知道：我没有被丢下。",
    reward: {
      title: "连接锦囊",
      body: "给一个安全的人发一句很小的话：我今天有点低落，不需要解决，只想被知道。",
      use: "艺术疗愈练习：画两颗小星星，用一条细线把它们连起来。"
    },
    monsters: [
      { x: 390, y: 74, label: "不想说", color: "#b8b7f2", line: "不想说被尊重了：沉默也可以是一种照顾。" },
      { x: 920, y: 292, label: "没人懂", color: "#a9e7c1", line: "没人懂点起灯：先懂自己一点点，也很重要。" },
      { x: 1450, y: 74, label: "被落下", color: "#f6b8c9", line: "被落下被牵住了：你还在路上，我们慢慢走。" }
    ],
    obstacles: [
      { x: 680, y: 74, type: "jump", label: "沉默河" },
      { x: 1220, y: 74, type: "duck", label: "人群雾" }
    ]
  }
};

const routes = {
  anxiety: {
    name: "焦虑路线",
    levels: ["breath", "nextStep", "rest"],
    variants: ["任务太多的一天", "身体很紧的一天", "担心评价的一天"],
    summary: "你从混乱里找到了呼吸、排序和恢复。"
  },
  fear: {
    name: "恐惧路线",
    levels: ["breath", "courage", "connection"],
    variants: ["不确定很多的一天", "想后退的一天", "需要安全感的一天"],
    summary: "你没有逼自己勇敢，而是一步步找回安全感。"
  },
  hurt: {
    name: "委屈路线",
    levels: ["boundary", "connection", "nextStep"],
    variants: ["很想被听见的一天", "有点受伤的一天", "需要边界的一天"],
    summary: "你把受伤的地方看清，也把自己的需要带了回来。"
  },
  tired: {
    name: "疲惫路线",
    levels: ["rest", "breath", "boundary"],
    variants: ["电量很低的一天", "硬撑太久的一天", "需要慢下来的一天"],
    summary: "你停止硬撑，把恢复、呼吸和边界重新放回身体里。"
  },
  lonely: {
    name: "孤独路线",
    levels: ["connection", "boundary", "rest"],
    variants: ["不想解释的一天", "想被知道的一天", "需要温柔连接的一天"],
    summary: "你允许自己安静，也慢慢找回了可以连接的路。"
  }
};

const rewardQualities = [
  { min: 0, name: "微光", line: "你已经完成这一关了。星星不用收集满，也值得获得锦囊。" },
  { min: 3, name: "暖光", line: "你收集到足够的呼吸星星，锦囊变得更稳定。" },
  { min: 5, name: "满星", line: "你把很多照顾能量带了回来，这个锦囊闪闪发亮。" }
];

const starData = [
  { x: 250, y: 156 },
  { x: 535, y: 260 },
  { x: 900, y: 304 },
  { x: 1120, y: 146 },
  { x: 1410, y: 254 },
  { x: 1730, y: 172 }
];

const state = {
  routeKey: "",
  activeLevels: [],
  levelIndex: 0,
  player: { x: 90, y: 74, width: 58, height: 74, vx: 0, vy: 0, grounded: true, direction: 1, crouching: false },
  cameraX: 0,
  energy: 55,
  soothed: 0,
  paused: true,
  finished: false,
  hitCooldown: 0,
  monsters: [],
  stars: [],
  obstacles: [],
  rewards: [],
  starsCollected: 0,
  routeVariant: "",
  metrics: { stress: 42, anxiety: 48, lonely: 34, restore: 40 }
};

function currentLevel() {
  return state.activeLevels[state.levelIndex];
}

function createLevel() {
  const level = currentLevel();
  document.querySelectorAll(".monster, .star, .obstacle").forEach((node) => node.remove());

  scene.dataset.theme = level.theme;
  levelSubtitle.textContent = `${routes[state.routeKey].name} · ${state.routeVariant} · 第 ${state.levelIndex + 1} 关：${level.name}`;
  portalText.textContent = state.levelIndex === state.activeLevels.length - 1 ? "终点" : "锦囊";

  state.player = { x: 90, y: 74, width: 58, height: 74, vx: 0, vy: 0, grounded: true, direction: 1, crouching: false };
  state.cameraX = 0;
  state.soothed = 0;
  state.starsCollected = 0;
  state.paused = false;
  state.hitCooldown = 0;
  keys.clear();

  state.monsters = level.monsters.map((item) => {
    const el = document.createElement("div");
    el.className = "monster";
    el.style.left = `${item.x}px`;
    el.style.bottom = `${item.y}px`;
    el.style.background = item.color;
    el.innerHTML = `<span>${item.label}</span>`;
    world.appendChild(el);
    return { ...item, width: 76, height: 70, calm: false, el };
  });

  state.obstacles = level.obstacles.map((item) => {
    const el = document.createElement("div");
    el.className = `obstacle ${item.type}`;
    el.style.left = `${item.x}px`;
    el.style.bottom = `${item.y}px`;
    el.textContent = item.label;
    world.appendChild(el);
    return { ...item, width: item.type === "duck" ? 120 : 72, height: item.type === "duck" ? 82 : 74, touched: false, el };
  });

  state.stars = starData.map((item, index) => {
    const el = document.createElement("div");
    el.className = "star";
    const jitter = ((state.levelIndex + index) % 3 - 1) * 18;
    const y = item.y + (index % 2 === state.levelIndex % 2 ? 0 : 18);
    el.style.left = `${item.x + jitter}px`;
    el.style.bottom = `${y}px`;
    world.appendChild(el);
    return { ...item, x: item.x + jitter, y, width: 42, height: 42, collected: false, el };
  });

  setMessage(level.intro);
  updateHud();
  renderBag();
  render();
}

function chooseRoute(routeKey) {
  state.routeKey = routeKey;
  const route = routes[routeKey];
  state.activeLevels = route.levels.map((key) => levelPool[key]);
  state.routeVariant = route.variants[Math.floor(Math.random() * route.variants.length)];
  state.levelIndex = 0;
  state.energy = 55;
  state.rewards = [];
  state.metrics = startingMetrics(routeKey);
  state.finished = false;
  startModal.classList.remove("show");
  rewardModal.classList.remove("show");
  finishModal.classList.remove("show");
  playSoftChord(392);
  createLevel();
}

function resetGame() {
  state.paused = true;
  state.finished = false;
  state.rewards = [];
  state.metrics = { stress: 42, anxiety: 48, lonely: 34, restore: 40 };
  rewardModal.classList.remove("show");
  finishModal.classList.remove("show");
  startModal.classList.add("show");
  levelSubtitle.textContent = "选择今天的情绪，进入对应旅程";
  levelText.textContent = "0/3";
  energyText.textContent = "55";
  soothedText.textContent = "0/3";
  bagCount.textContent = "0/3";
  bagGrid.innerHTML = "";
  renderMetrics();
}

function setMessage(text) {
  messageEl.textContent = text;
}

function updateHud() {
  const level = currentLevel();
  levelText.textContent = `${state.levelIndex + 1}/${state.activeLevels.length}`;
  energyText.textContent = state.energy;
  soothedText.textContent = `${state.soothed}/${level.monsters.length}`;
  bagCount.textContent = `${state.rewards.length}/${state.activeLevels.length}`;
  document.body.dataset.energy = state.energy < 25 ? "low" : state.energy > 80 ? "high" : "steady";
  renderMetrics();
}

function startingMetrics(routeKey) {
  const presets = {
    anxiety: { stress: 68, anxiety: 76, lonely: 32, restore: 28 },
    fear: { stress: 62, anxiety: 66, lonely: 42, restore: 30 },
    hurt: { stress: 58, anxiety: 46, lonely: 52, restore: 34 },
    tired: { stress: 54, anxiety: 38, lonely: 36, restore: 18 },
    lonely: { stress: 44, anxiety: 42, lonely: 76, restore: 30 }
  };
  return { ...presets[routeKey] };
}

function adjustMetrics(delta) {
  Object.entries(delta).forEach(([key, value]) => {
    state.metrics[key] = Math.max(0, Math.min(100, state.metrics[key] + value));
  });
  renderMetrics();
}

function renderMetrics() {
  Object.entries(state.metrics).forEach(([key, value]) => {
    if (!metricEls[key]) return;
    metricEls[key].textContent = value;
    metricBars[key].style.width = `${value}%`;
  });
}

function renderBag() {
  bagGrid.innerHTML = state.activeLevels
    .map((level, index) => {
      const reward = state.rewards[index];
      const className = reward ? "bag-slot earned" : "bag-slot";
      const label = reward ? `第 ${index + 1} 关锦囊` : level.name;
      const title = reward ? reward.title : "等待发现";
      return `<div class="${className}"><span>${label}</span><strong>${title}</strong></div>`;
    })
    .join("");
}

function isColliding(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function playerBox() {
  const height = state.player.crouching ? 46 : 74;
  return { x: state.player.x, y: state.player.y, width: state.player.width, height };
}

function movePlayer() {
  const player = state.player;
  const movingLeft = keys.has("ArrowLeft") || keys.has("a");
  const movingRight = keys.has("ArrowRight") || keys.has("d");
  const jumping = keys.has(" ") || keys.has("ArrowUp") || keys.has("w");
  const energyFactor = state.energy < 25 ? 0.78 : state.energy > 80 ? 1.08 : 1;
  const maxSpeed = 6 * energyFactor;
  const accel = 0.9 * energyFactor;
  player.crouching = (keys.has("ArrowDown") || keys.has("s")) && player.grounded;

  if (movingLeft) {
    player.vx = Math.max(player.vx - accel, -maxSpeed);
    player.direction = -1;
  } else if (movingRight) {
    player.vx = Math.min(player.vx + accel, maxSpeed);
    player.direction = 1;
  } else {
    player.vx *= 0.78;
    if (Math.abs(player.vx) < 0.08) player.vx = 0;
  }

  if (player.crouching) {
    player.vx *= 0.88;
  }

  if (jumping && player.grounded && !player.crouching) {
    player.vy = state.energy < 25 ? 14.2 : state.energy > 80 ? 17.3 : 16.5;
    player.grounded = false;
  }

  player.vy -= gravity;
  player.x += player.vx;
  player.y += player.vy;
  player.x = Math.max(0, Math.min(levelWidth - player.width, player.x));

  landOnPlatforms();
  if (player.y < 74) {
    player.y = 74;
    player.vy = 0;
    player.grounded = true;
  }
}

function landOnPlatforms() {
  const player = state.player;
  let landed = false;

  platforms.forEach((platform) => {
    const wasAbove = player.y - player.vy >= platform.y + platform.height - 8;
    const horizontalOverlap = player.x + player.width > platform.x && player.x < platform.x + platform.width;
    const fallingOnto = player.vy <= 0 && player.y <= platform.y + platform.height && player.y + player.height > platform.y;

    if (wasAbove && horizontalOverlap && fallingOnto) {
      player.y = platform.y + platform.height;
      player.vy = 0;
      player.grounded = true;
      landed = true;
    }
  });

  if (!landed && player.y > 74) {
    player.grounded = false;
  }
}

function spawnFeedback(text, x, y, type = "") {
  const feedback = document.createElement("div");
  feedback.className = `feedback ${type}`;
  feedback.style.left = `${x}px`;
  feedback.style.bottom = `${y}px`;
  feedback.textContent = text;
  world.appendChild(feedback);
  window.setTimeout(() => feedback.remove(), 900);
}

function rewardQuality() {
  return rewardQualities.reduce((best, item) => (state.starsCollected >= item.min ? item : best), rewardQualities[0]);
}

function loseEnergy(reason, obstacle) {
  if (state.hitCooldown > 0) return;
  state.hitCooldown = 45;
  state.energy = Math.max(0, state.energy - 10);
  adjustMetrics({ stress: 5, anxiety: 3, restore: -4 });
  playerEl.classList.add("hit");
  scene.classList.add("shake");
  playHitSound();
  if (obstacle) {
    obstacle.el.classList.add("bumped");
    spawnFeedback("-10 能量", obstacle.x, obstacle.y + obstacle.height, "ouch");
    window.setTimeout(() => obstacle.el.classList.remove("bumped"), 520);
  }
  window.setTimeout(() => playerEl.classList.remove("hit"), 480);
  window.setTimeout(() => scene.classList.remove("shake"), 360);
  setMessage(reason);
  updateHud();
}

function collectThings() {
  const box = playerBox();
  const level = currentLevel();

  if (state.hitCooldown > 0) {
    state.hitCooldown -= 1;
  }

  state.stars.forEach((star) => {
    if (!star.collected && isColliding(box, star)) {
      star.collected = true;
      star.el.classList.add("collected");
      state.starsCollected += 1;
      state.energy = Math.min(100, state.energy + 10);
      adjustMetrics({ stress: -2, anxiety: -2, restore: 4 });
      playCollectSound();
      spawnFeedback("+1 星星", star.x, star.y + 42, "spark");
      setMessage("收集到一颗呼吸星星。能量回来了，一点点就够。");
      updateHud();
    }
  });

  state.obstacles.forEach((obstacle) => {
    if (!isColliding(box, obstacle)) return;
    if (obstacle.type === "duck" && state.player.crouching) {
      setMessage(`你钻过了${obstacle.label}：不是所有困难都要硬碰硬。`);
      return;
    }
    if (obstacle.type === "jump") {
      loseEnergy(`撞到了${obstacle.label}。可以跳过去，也可以慢一点重新来。`, obstacle);
    } else {
      loseEnergy(`${obstacle.label}压过来了。按下方向键可以低一点钻过去。`, obstacle);
    }
  });

  state.monsters.forEach((monster) => {
    if (!monster.calm && isColliding(box, monster)) {
      monster.calm = true;
      monster.el.classList.add("calm");
      state.soothed += 1;
      state.energy = Math.min(100, state.energy + 12);
      adjustMetrics({ stress: -4, anxiety: -3, lonely: -2, restore: 5 });
      playSootheSound();
      spawnFeedback("抱一下", monster.x, monster.y + 78, "hug");
      setMessage(monster.line);
      updateHud();
    }
  });

  if (!state.paused && state.player.x > 1900 && state.soothed >= level.monsters.length) {
    completeLevel();
  } else if (!state.paused && state.player.x > 1900) {
    setMessage("出口在发光，但还有情绪没有被看见。回去找找它。");
  }
}

function completeLevel() {
  const level = currentLevel();
  const quality = rewardQuality();
  const earnedReward = {
    ...level.reward,
    title: `${quality.name}${level.reward.title}`,
    body: `${quality.line} ${level.reward.body}`,
    stars: state.starsCollected,
    quality: quality.name
  };
  state.paused = true;
  state.rewards[state.levelIndex] = earnedReward;
  playRewardSound();
  renderBag();
  updateHud();

  rewardKicker.textContent = state.levelIndex === state.activeLevels.length - 1 ? "最后一个锦囊" : `第 ${state.levelIndex + 1} 关完成`;
  rewardTitle.textContent = earnedReward.title;
  rewardBody.textContent = earnedReward.body;
  rewardUse.textContent = `${level.reward.use} 本关收集 ${state.starsCollected}/6 颗星星。`;
  nextLevelBtn.textContent = state.levelIndex === state.activeLevels.length - 1 ? "查看我的情绪旅程" : "带着锦囊进入下一关";
  rewardModal.classList.add("show");
}

function previewReward() {
  if (!state.routeKey) return;
  state.monsters.forEach((monster) => {
    if (!monster.calm) {
      monster.calm = true;
      monster.el.classList.add("calm");
    }
  });
  state.soothed = currentLevel().monsters.length;
  state.energy = Math.min(100, state.energy + 24);
  adjustMetrics({ stress: -10, anxiety: -8, lonely: -5, restore: 14 });
  state.player.x = 1910;
  setMessage("演示模式：这一关的情绪都被看见了，锦囊正在出现。");
  updateHud();
  render();
  completeLevel();
}

function nextLevel() {
  rewardModal.classList.remove("show");
  if (state.levelIndex >= state.activeLevels.length - 1) {
    finishGame();
    return;
  }

  state.levelIndex += 1;
  state.energy = Math.max(45, Math.min(100, state.energy - 10));
  adjustMetrics({ stress: 3, anxiety: 2, restore: -2 });
  createLevel();
}

function finishGame() {
  state.finished = true;
  state.paused = true;
  finalBag.innerHTML = state.rewards.map((reward) => `<span>${reward.title}</span>`).join("");
  finishText.textContent = `${routes[state.routeKey].summary} 你没有打败情绪，而是学会了和它们一起走到出口。`;
  const highNeed = state.metrics.stress > 62 || state.metrics.anxiety > 62 || state.metrics.lonely > 62 || state.metrics.restore < 32;
  supportText.textContent = highNeed
    ? "你的情绪数值提示：这段时间可能需要更具体的支持。你可以把今天的路线保存下来，作为继续自我照顾或后续艺术疗愈探索的入口。"
    : "你的情绪数值正在回稳。你可以把今天获得的锦囊保存下来，作为下一次情绪波动时的温柔提醒。";
  finishModal.classList.add("show");
}

function render() {
  if (!state.routeKey) return;
  const player = state.player;
  const sceneWidth = scene.clientWidth;
  state.cameraX = Math.max(0, Math.min(levelWidth - sceneWidth, player.x - sceneWidth * 0.38));

  world.style.transform = `translateX(${-state.cameraX}px)`;
  playerEl.style.left = `${player.x}px`;
  playerEl.style.bottom = `${player.y}px`;
  playerEl.style.transform = `scaleX(${player.direction})`;
  playerEl.classList.toggle("walking", Math.abs(player.vx) > 0.8 && player.grounded && !player.crouching);
  playerEl.classList.toggle("crouching", player.crouching);
}

function loop() {
  if (!state.paused && !state.finished) {
    movePlayer();
    collectThings();
    render();
  }
  requestAnimationFrame(loop);
}

function pressControl(control, active) {
  const map = { left: "ArrowLeft", right: "ArrowRight", jump: " ", down: "ArrowDown" };
  if (active) {
    keys.add(map[control]);
  } else {
    keys.delete(map[control]);
  }
}

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "a", "d", "w", "s"].includes(event.key)) {
    event.preventDefault();
    keys.add(event.key);
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key);
});

document.querySelectorAll("[data-control]").forEach((button) => {
  const control = button.dataset.control;
  button.addEventListener("pointerdown", () => pressControl(control, true));
  button.addEventListener("pointerup", () => pressControl(control, false));
  button.addEventListener("pointerleave", () => pressControl(control, false));
});

document.querySelectorAll("[data-route]").forEach((button) => {
  button.addEventListener("click", () => chooseRoute(button.dataset.route));
});

resetBtn.addEventListener("click", resetGame);
demoBtn.addEventListener("click", previewReward);
musicBtn.addEventListener("click", toggleMusic);
nextLevelBtn.addEventListener("click", nextLevel);
playAgainBtn.addEventListener("click", resetGame);

resetGame();
loop();
