const VW=480,VH=640;
const SCALE={player:2,shot:1,bullet:2,enemy:2,enemy2:1,enemy3:2,enemy4:2,laser:1,boss:0.5};
const BOSS_AT=4*60,WARN_DUR=9;
const BOSS_BATTLE_BG_SPEED=9.0;
const BOSS_MOUTH_Y_FRAC=0.22;
const BULLET_MISSILE_HITS=2;
const BOSS_LASER_DEATH_LINGER=2.0;
const BOSS_WARNING_BGM_DELAY=5.5;
const WARN_SIREN_FADE_DUR=0.45;
const TITLE_LOGO_W=480,TITLE_LOGO_H=200;
const TITLE_LOGO_ZOOM_DUR=0.38;
const TITLE_LOGO_ZOOM_START=2.5;
const COMBO_DUR=2.5;
const COMBO_THRESHOLDS=[0,0,3,8,15,24,35,48,63,80,99];
const TITLE_GP_MSG_DUR=4.0;
const SCREEN_FADE_SPEED=2.6;
const LASER_MAX=4.0,LASER_COOLDOWN=10.0;
const MEDAL_GRAVITY=320;
const DEAD_ZONE=0.22;
const HUD_MARGIN=16;
const HUD_BAR_W=108;
const HUD_BAR_H=5;

// Velocidade padrão por movementPattern (px/s ou taxa) se o template não definir moveSpeed
const MOVE_SPEED_DEFAULT={
  zigzag:100,
  sine:105,
  enter_hover_exit:100,
  lemniscate:65
};

const WARN_HEADER="C:\\\\SYS> Mission Control transmission... To all federation ships...";
const WARN_LINES=[
  "Incoming message: WARNING, WARNING, WARNING!",
  "A huge battleship class: <GRACIOLI> is approaching fast!"
];
const BOSS_BGM_DEATH_VOL=0.5;
const BOSS_BGM_FADE_RATE=0.25;
const LASER_SPARK_HIT_LIFT=6;

// Bezels 16:9 — coordenadas do recorte no PNG nativo (1920×1080)
const BEZEL_NAT_W=1920,BEZEL_NAT_H=1080;
const BEZEL_CUTOUT={x:660,y:140,w:600,h:800};

const BEZELS=[
  {id:"none",label:"Nenhum",src:null},
  {id:"arcade01",label:"Arcade Oficial",src:"assets/bezels1080/arcade_bezel01.png"}
];
const BEZEL_PAN_STEP=8;
const BEZEL_PAN_MAX=600;
const BEZEL_STRETCH_MIN=0.25;
const BEZEL_STRETCH_MAX=3;
const BEZEL_STRETCH_STEP=0.02;

const COLOR_FILTERS=[
  {id:"normal",label:"Normal"},
  {id:"dmg",label:"Game Boy DMG"},
  {id:"vboy",label:"Virtual Boy"},
  {id:"bw",label:"Preto e Branco"},
  {id:"nes",label:"Paleta NES"}
];
const WARN_TYPE_CPS=44;
const WARN_DIM_MAX=0.62;
const WARN_DIM_SPEED=0.48;

// Colunas compartilhadas (small + miniboss)
const PLAY_COLUMNS=[
  {id:"A",cx:VW/6},
  {id:"B",cx:VW/2},
  {id:"C",cx:(VW*5)/6}
];

// Miniboss — coordenadas no sprite nativo (Enemy2.gif)
const MEDB_SHOT_AIM={x:71,y:118};
const MEDB_SHOT_BURST={x:71,y:105};
const MEDB_ROT_FACE_PLAYER=0;
const MEDB_ROT_FACE_UP=Math.PI;

// Boss laser enrage — rotação suave (rad)
const BOSS_LASER_ANG_L=-0.75;
const BOSS_LASER_ANG_R=0.75;
const BOSS_LASER_WIND_D=0.75;
const BOSS_LASER_SWEEP_D=2.6;
const BOSS_LASER_RET_D=0.75;
const BOSS_LASER_CHARGE_DUR=1.55;
const BOSS_LASER_CHARGE_ORB_INTERVAL=0.065;

// Boss — coordenadas no sprite nativo (Boss1.gif)
const BOSS_SHOT_SPOTS=[
  {x:164,y:222},{x:188,y:194},{x:215,y:180},{x:328,y:180},
  {x:365,y:194},{x:385,y:222},{x:239,y:360},{x:300,y:260}
];
const BOSS_BURST_SPOTS=[
  {x:60,y:164},{x:483,y:164},{x:162,y:372},{x:378,y:372}
];
// Hitboxes no espaço do sprite nativo (2 retângulos)
const BOSS_HITBOXES_NAT=[
  {x:92,y:72,w:268,h:138},
  {x:158,y:198,w:148,h:168}
];
