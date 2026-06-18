import fs from 'fs';
import path from 'path';

// Vanilla .env file loader to run before dynamically importing db connection
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const parts = trimmed.split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
          process.env[key] = val;
        }
      }
    });
  }
}

loadEnv();

const rawQuizData = [
  {"word": "貓咪", "fileName": "cat.webp", "category": "動物"},
  {"word": "小狗", "fileName": "dog.webp", "category": "動物"},
  {"word": "大象", "fileName": "elephant.webp", "category": "動物"},
  {"word": "獅子", "fileName": "lion.webp", "category": "動物"},
  {"word": "老虎", "fileName": "tiger.webp", "category": "動物"},
  {"word": "長頸鹿", "fileName": "giraffe.webp", "category": "動物"},
  {"word": "斑馬", "fileName": "zebra.webp", "category": "動物"},
  {"word": "河馬", "fileName": "hippo.webp", "category": "動物"},
  {"word": "犀牛", "fileName": "rhinoceros.webp", "category": "動物"},
  {"word": "袋鼠", "fileName": "kangaroo.webp", "category": "動物"},
  {"word": "猴子", "fileName": "monkey.webp", "category": "動物"},
  {"word": "兔子", "fileName": "rabbit.webp", "category": "動物"},
  {"word": "松鼠", "fileName": "squirrel.webp", "category": "動物"},
  {"word": "狐狸", "fileName": "fox.webp", "category": "動物"},
  {"word": "綿羊", "fileName": "sheep.webp", "category": "動物"},
  {"word": "山羊", "fileName": "goat.webp", "category": "動物"},
  {"word": "乳牛", "fileName": "cow.webp", "category": "動物"},
  {"word": "小豬", "fileName": "pig.webp", "category": "動物"},
  {"word": "馬兒", "fileName": "horse.webp", "category": "動物"},
  {"word": "熊貓", "fileName": "panda.webp", "category": "動物"},
  {"word": "企鵝", "fileName": "penguin.webp", "category": "動物"},
  {"word": "海豚", "fileName": "dolphin.webp", "category": "動物"},
  {"word": "鯨魚", "fileName": "whale.webp", "category": "動物"},
  {"word": "海龜", "fileName": "sea_turtle.webp", "category": "動物"},
  {"word": "章魚", "fileName": "octopus.webp", "category": "動物"},
  {"word": "螃蟹", "fileName": "crab.webp", "category": "動物"},
  {"word": "蝦子", "fileName": "shrimp.webp", "category": "動物"},
  {"word": "小魚", "fileName": "fish.webp", "category": "動物"},
  {"word": "青蛙", "fileName": "frog.webp", "category": "動物"},
  {"word": "烏龜", "fileName": "turtle.webp", "category": "動物"},
  {"word": "蜜蜂", "fileName": "honeybee.webp", "category": "昆蟲"},
  {"word": "蝴蝶", "fileName": "butterfly.webp", "category": "昆蟲"},
  {"word": "瓢蟲", "fileName": "ladybug.webp", "category": "昆蟲"},
  {"word": "蜻蜓", "fileName": "dragonfly.webp", "category": "昆蟲"},
  {"word": "蝸牛", "fileName": "snail.webp", "category": "昆蟲"},
  {"word": "螞蟻", "fileName": "ant.webp", "category": "昆蟲"},
  {"word": "小鳥", "fileName": "bird.webp", "category": "動物"},
  {"word": "貓頭鷹", "fileName": "owl.webp", "category": "動物"},
  {"word": "鴨子", "fileName": "duck.webp", "category": "動物"},
  {"word": "恐龍", "fileName": "dinosaur.webp", "category": "動物"},
  {"word": "鱷魚", "fileName": "alligator.webp", "category": "動物"},
  {"word": "無尾熊", "fileName": "koala.webp", "category": "動物"},
  {"word": "樹懶", "fileName": "sloth.webp", "category": "動物"},
  {"word": "駱駝", "fileName": "camel.webp", "category": "動物"},
  {"word": "刺蝟", "fileName": "hedgehog.webp", "category": "動物"},
  {"word": "倉鼠", "fileName": "hamster.webp", "category": "動物"},
  {"word": "鸚鵡", "fileName": "parrot.webp", "category": "動物"},
  {"word": "企鵝(複)", "fileName": "penguin_b.webp", "category": "動物"},
  {"word": "蘋果", "fileName": "apple.webp", "category": "水果"},
  {"word": "香蕉", "fileName": "banana.webp", "category": "水果"},
  {"word": "草莓", "fileName": "strawberry.webp", "category": "水果"},
  {"word": "西瓜", "fileName": "watermelon.webp", "category": "水果"},
  {"word": "葡萄", "fileName": "grapes.webp", "category": "水果"},
  {"word": "橘子", "fileName": "orange.webp", "category": "水果"},
  {"word": "芒果", "fileName": "mango.webp", "category": "水果"},
  {"word": "芭樂", "fileName": "guava.webp", "category": "水果"},
  {"word": "鳳梨", "fileName": "pineapple.webp", "category": "水果"},
  {"word": "木瓜", "fileName": "papaya.webp", "category": "水果"},
  {"word": "檸檬", "fileName": "lemon.webp", "category": "水果"},
  {"word": "櫻桃", "fileName": "cherry.webp", "category": "水果"},
  {"word": "桃子", "fileName": "peach.webp", "category": "水果"},
  {"word": "荔枝", "fileName": "lychee.webp", "category": "水果"},
  {"word": "藍莓", "fileName": "blueberry.webp", "category": "水果"},
  {"word": "番茄", "fileName": "tomato.webp", "category": "蔬菜"},
  {"word": "玉米", "fileName": "corn.webp", "category": "蔬菜"},
  {"word": "胡蘿蔔", "fileName": "carrot.webp", "category": "蔬菜"},
  {"word": "花椰菜", "fileName": "broccoli.webp", "category": "蔬菜"},
  {"word": "高麗菜", "fileName": "cabbage.webp", "category": "蔬菜"},
  {"word": "洋蔥", "fileName": "onion.webp", "category": "蔬菜"},
  {"word": "地瓜", "fileName": "sweet_potato.webp", "category": "蔬菜"},
  {"word": "馬鈴薯", "fileName": "potato.webp", "category": "蔬菜"},
  {"word": "南瓜", "fileName": "pumpkin.webp", "category": "蔬菜"},
  {"word": "小黃瓜", "fileName": "cucumber.webp", "category": "蔬菜"},
  {"word": "香菇", "fileName": "mushroom.webp", "category": "蔬菜"},
  {"word": "茄子", "fileName": "eggplant.webp", "category": "蔬菜"},
  {"word": "豌豆", "fileName": "green_peas.webp", "category": "蔬菜"},
  {"word": "白蘿蔔", "fileName": "white_radish.webp", "category": "蔬菜"},
  {"word": "大蒜", "fileName": "garlic.webp", "category": "蔬菜"},
  {"word": "彩椒", "fileName": "bell_pepper.webp", "category": "蔬菜"},
  {"word": "辣椒", "fileName": "chili.webp", "category": "蔬菜"},
  {"word": "米飯", "fileName": "rice_bowl.webp", "category": "食物"},
  {"word": "麵條", "fileName": "noodles.webp", "category": "食物"},
  {"word": "麵包", "fileName": "bread.webp", "category": "食物"},
  {"word": "蛋糕", "fileName": "cake.webp", "category": "食物"},
  {"word": "餅乾", "fileName": "cookie.webp", "category": "食物"},
  {"word": "布丁", "fileName": "pudding.webp", "category": "食物"},
  {"word": "冰淇淋", "fileName": "ice_cream.webp", "category": "食物"},
  {"word": "牛奶", "fileName": "milk_glass.webp", "category": "食物"},
  {"word": "果汁", "fileName": "juice.webp", "category": "食物"},
  {"word": "雞蛋", "fileName": "boiled_egg.webp", "category": "食物"},
  {"word": "壽司", "fileName": "sushi.webp", "category": "食物"},
  {"word": "披薩", "fileName": "pizza.webp", "category": "食物"},
  {"word": "漢堡", "fileName": "hamburger.webp", "category": "食物"},
  {"word": "薯條", "fileName": "french_fries.webp", "category": "食物"},
  {"word": "水餃", "fileName": "dumpling.webp", "category": "食物"},
  {"word": "包子", "fileName": "steamed_bun.webp", "category": "食物"},
  {"word": "三明治", "fileName": "sandwich.webp", "category": "食物"},
  {"word": "鬆餅", "fileName": "waffle.webp", "category": "食物"},
  {"word": "甜甜圈", "fileName": "donut.webp", "category": "食物"},
  {"word": "巧克力", "fileName": "chocolate_bar.webp", "category": "食物"},
  {"word": "薄煎餅", "fileName": "pancake.webp", "category": "食物"},
  {"word": "杯子蛋糕", "fileName": "cupcake.webp", "category": "食物"},
  {"word": "爆米花", "fileName": "popcorn.webp", "category": "食物"},
  {"word": "熱狗", "fileName": "hot_dog.webp", "category": "食物"},
  {"word": "起司", "fileName": "cheese_block.webp", "category": "食物"},
  {"word": "棒棒糖", "fileName": "lollipop.webp", "category": "食物"},
  {"word": "蝴蝶餅", "fileName": "pretzel.webp", "category": "食物"},
  {"word": "可頌", "fileName": "croissant.webp", "category": "食物"},
  {"word": "派", "fileName": "pie.webp", "category": "食物"},
  {"word": "塔可", "fileName": "taco.webp", "category": "食物"},
  {"word": "果凍", "fileName": "jelly.webp", "category": "食物"},
  {"word": "蜂蜜", "fileName": "honey.webp", "category": "食物"},
  {"word": "汽車", "fileName": "sedan_car.webp", "category": "交通"},
  {"word": "公車", "fileName": "bus.webp", "category": "交通"},
  {"word": "卡車", "fileName": "cargo_truck.webp", "category": "交通"},
  {"word": "機車", "fileName": "motorcycle.webp", "category": "交通"},
  {"word": "腳踏車", "fileName": "bicycle.webp", "category": "交通"},
  {"word": "蒸汽火車", "fileName": "steam_train.webp", "category": "交通"},
  {"word": "高鐵", "fileName": "high_speed_train.webp", "category": "交通"},
  {"word": "捷運", "fileName": "subway_train.webp", "category": "交通"},
  {"word": "消防車", "fileName": "fire_truck.webp", "category": "交通"},
  {"word": "救護車", "fileName": "ambulance.webp", "category": "交通"},
  {"word": "警車", "fileName": "police_car.webp", "category": "交通"},
  {"word": "挖土機", "fileName": "excavator.webp", "category": "交通"},
  {"word": "推土機", "fileName": "bulldozer.webp", "category": "交通"},
  {"word": "起重機", "fileName": "crane_truck.webp", "category": "交通"},
  {"word": "垃圾車", "fileName": "garbage_truck.webp", "category": "交通"},
  {"word": "水泥車", "fileName": "cement_mixer_truck.webp", "category": "交通"},
  {"word": "飛機", "fileName": "airplane.webp", "category": "交通"},
  {"word": "直升機", "fileName": "helicopter.webp", "category": "交通"},
  {"word": "火箭", "fileName": "space_rocket.webp", "category": "交通"},
  {"word": "飛船", "fileName": "blimp_airship.webp", "category": "交通"},
  {"word": "輪船", "fileName": "cruise_ship.webp", "category": "交通"},
  {"word": "帆船", "fileName": "spaceship_or_sailboat.webp", "category": "交通"},
  {"word": "潛水艇", "fileName": "submarine.webp", "category": "交通"},
  {"word": "油罐車", "fileName": "fuel_tanker_truck.webp", "category": "交通"},
  {"word": "拖拉機", "fileName": "farm_tractor.webp", "category": "交通"},
  {"word": "戰車", "fileName": "military_tank.webp", "category": "交通"},
  {"word": "纜車", "fileName": "cable_car.webp", "category": "交通"},
  {"word": "熱氣球", "fileName": "hot_air_balloon.webp", "category": "交通"},
  {"word": "滑板車", "fileName": "kick_scooter.webp", "category": "交通"},
  {"word": "滑板", "fileName": "skateboard.webp", "category": "交通"},
  {"word": "堆高機", "fileName": "forklift.webp", "category": "交通"},
  {"word": "空拍機", "fileName": "drone.webp", "category": "交通"},
  {"word": "桌子", "fileName": "wooden_table.webp", "category": "日常"},
  {"word": "椅子", "fileName": "chair.webp", "category": "日常"},
  {"word": "床鋪", "fileName": "cozy_bed.webp", "category": "日常"},
  {"word": "沙發", "fileName": "sofa.webp", "category": "日常"},
  {"word": "電風扇", "fileName": "electric_fan.webp", "category": "日常"},
  {"word": "電視", "fileName": "television.webp", "category": "日常"},
  {"word": "冰箱", "fileName": "refrigerator.webp", "category": "日常"},
  {"word": "冷氣", "fileName": "air_conditioner.webp", "category": "日常"},
  {"word": "手機", "fileName": "smartphone.webp", "category": "日常"},
  {"word": "時鐘", "fileName": "wall_clock.webp", "category": "日常"},
  {"word": "檯燈", "fileName": "desk_lamp.webp", "category": "日常"},
  {"word": "鏡子", "fileName": "mirror.webp", "category": "日常"},
  {"word": "梳子", "fileName": "hair_comb.webp", "category": "日常"},
  {"word": "牙刷", "fileName": "toothbrush.webp", "category": "日常"},
  {"word": "毛巾", "fileName": "bath_towel.webp", "category": "日常"},
  {"word": "杯子", "fileName": "mug_cup.webp", "category": "日常"},
  {"word": "剪刀", "fileName": "scissors.webp", "category": "日常"},
  {"word": "膠水", "fileName": "glue.webp", "category": "日常"},
  {"word": "鉛筆", "fileName": "pencil.webp", "category": "日常"},
  {"word": "橡皮擦", "fileName": "eraser.webp", "category": "日常"},
  {"word": "尺", "fileName": "plastic_ruler.webp", "category": "日常"},
  {"word": "書包", "fileName": "school_backpack.webp", "category": "日常"},
  {"word": "課本", "fileName": "textbook.webp", "category": "日常"},
  {"word": "筆記本", "fileName": "notebook.webp", "category": "日常"},
  {"word": "彩色筆", "fileName": "marker_pen.webp", "category": "日常"},
  {"word": "蠟筆", "fileName": "crayon.webp", "category": "日常"},
  {"word": "雨傘", "fileName": "umbrella.webp", "category": "日常"},
  {"word": "雨鞋", "fileName": "rain_boots.webp", "category": "日常"},
  {"word": "外套", "fileName": "winter_coat.webp", "category": "日常"},
  {"word": "帽子", "fileName": "sun_hat.webp", "category": "日常"},
  {"word": "鞋子", "fileName": "sneakers.webp", "category": "日常"},
  {"word": "襪子", "fileName": "socks.webp", "category": "日常"},
  {"word": "太陽", "fileName": "sun.webp", "category": "自然"},
  {"word": "月亮", "fileName": "moon.webp", "category": "自然"},
  {"word": "星星", "fileName": "star.webp", "category": "自然"},
  {"word": "白雲", "fileName": "white_cloud.webp", "category": "自然"},
  {"word": "彩虹", "fileName": "rainbow.webp", "category": "自然"},
  {"word": "閃電", "fileName": "lightning_bolt.webp", "category": "自然"},
  {"word": "下雨", "fileName": "raindrops.webp", "category": "自然"},
  {"word": "下雪", "fileName": "snowflakes.webp", "category": "自然"},
  {"word": "大樹", "fileName": "big_green_tree.webp", "category": "自然"},
  {"word": "小草", "fileName": "small_green_grass.webp", "category": "自然"},
  {"word": "小花", "fileName": "beautiful_flower.webp", "category": "自然"},
  {"word": "葉子", "fileName": "green_leaf.webp", "category": "自然"},
  {"word": "石頭", "fileName": "river_stone.webp", "category": "自然"},
  {"word": "沙灘", "fileName": "sandy_beach.webp", "category": "自然"},
  {"word": "大海", "fileName": "deep_ocean.webp", "category": "自然"},
  {"word": "高山", "fileName": "high_mountain.webp", "category": "自然"},
  {"word": "河流", "fileName": "river.webp", "category": "自然"},
  {"word": "瀑布", "fileName": "waterfall.webp", "category": "自然"},
  {"word": "火山", "fileName": "volcano.webp", "category": "自然"},
  {"word": "地球", "fileName": "planet_earth.webp", "category": "自然"},
  {"word": "城堡", "fileName": "castle.webp", "category": "日常"},
  {"word": "房子", "fileName": "house.webp", "category": "日常"},
  {"word": "帳篷", "fileName": "camping_tent.webp", "category": "日常"},
  {"word": "燈塔", "fileName": "lighthouse.webp", "category": "日常"},
  {"word": "跑步", "fileName": "running_boy.webp", "category": "動作"},
  {"word": "跳躍", "fileName": "jumping_girl.webp", "category": "動作"},
  {"word": "大笑", "fileName": "laughing_boy.webp", "category": "動作"},
  {"word": "走路", "fileName": "walking_girl.webp", "category": "動作"},
  {"word": "唱歌", "fileName": "singing_boy.webp", "category": "動作"},
  {"word": "跳舞", "fileName": "dancing_girl.webp", "category": "動作"},
  {"word": "畫畫", "fileName": "drawing_boy.webp", "category": "動作"},
  {"word": "睡覺", "fileName": "sleeping_girl.webp", "category": "動作"}
];

const wordToCore = {
  "貓咪": "貓", "小狗": "狗", "大象": "象", "獅子": "獅", "老虎": "虎",
  "長頸鹿": "鹿", "斑馬": "馬", "河馬": "馬", "犀牛": "牛", "袋鼠": "鼠",
  "猴子": "猴", "兔子": "兔", "松鼠": "鼠", "狐狸": "狐", "綿羊": "羊",
  "山羊": "羊", "乳牛": "牛", "小豬": "豬", "馬兒": "馬", "熊貓": "熊",
  "企鵝": "鵝", "海豚": "豚", "鯨魚": "鯨", "海龜": "龜", "章魚": "章",
  "螃蟹": "蟹", "蝦子": "蝦", "小魚": "魚", "青蛙": "蛙", "烏龜": "龜",
  "蜜蜂": "蜂", "蝴蝶": "蝶", "瓢蟲": "瓢", "蜻蜓": "蜻", "蝸牛": "蝸",
  "螞蟻": "蟻", "小鳥": "鳥", "貓頭鷹": "鷹", "鴨子": "鴨", "恐龍": "龍",
  "鱷魚": "鱷", "無尾熊": "熊", "樹懶": "懶", "駱駝": "駝", "刺蝟": "蝟",
  "倉鼠": "鼠", "鸚鵡": "鸚", "企鵝(複)": "鵝", "蘋果": "蘋", "香蕉": "蕉",
  "草莓": "莓", "西瓜": "瓜", "葡萄": "葡", "橘子": "橘", "芒果": "芒",
  "芭樂": "芭", "鳳梨": "鳳", "木瓜": "瓜", "檸檬": "檸", "櫻桃": "櫻",
  "桃子": "桃", "荔枝": "荔", "藍莓": "莓", "番茄": "茄", "玉米": "玉",
  "胡蘿蔔": "蘿", "花椰菜": "菜", "高麗菜": "菜", "洋蔥": "蔥", "地瓜": "瓜",
  "馬鈴薯": "薯", "南瓜": "瓜", "小黃瓜": "瓜", "香菇": "菇", "茄子": "茄",
  "豌豆": "豆", "白蘿蔔": "蘿", "大蒜": "蒜", "彩椒": "椒", "辣椒": "椒",
  "米飯": "飯", "麵條": "麵", "麵包": "包", "蛋糕": "糕", "餅乾": "餅",
  "布丁": "布", "冰淇淋": "冰", "牛奶": "奶", "果汁": "汁", "雞蛋": "蛋",
  "壽司": "壽", "披薩": "薩", "漢堡": "堡", "薯條": "薯", "水餃": "餃",
  "包子": "包", "三明治": "三", "鬆餅": "餅", "甜甜圈": "圈", "巧克力": "巧",
  "薄煎餅": "餅", "杯子蛋糕": "糕", "爆米花": "花", "熱狗": "狗", "起司": "司",
  "棒棒糖": "糖", "蝴蝶餅": "餅", "可頌": "頌", "派": "派", "塔可": "塔",
  "果凍": "凍", "蜂蜜": "蜜", "汽車": "車", "公車": "車", "卡車": "車",
  "機車": "車", "腳踏車": "車", "蒸汽火車": "車", "高鐵": "車", "捷運": "車",
  "消防車": "車", "救護車": "車", "警車": "車", "挖土機": "機", "推土機": "機",
  "起重機": "機", "垃圾車": "車", "水泥車": "車", "飛機": "機", "直升機": "機",
  "火箭": "箭", "飛船": "船", "輪船": "船", "帆船": "船", "潛水艇": "艇",
  "油罐車": "車", "拖拉機": "機", "戰車": "車", "纜車": "車", "熱氣球": "球",
  "滑板車": "車", "滑板": "板", "堆高機": "機", "空拍機": "機", "桌子": "桌",
  "椅子": "椅", "床鋪": "床", "沙發": "沙", "電風扇": "扇", "電視": "電",
  "冰箱": "箱", "冷氣": "氣", "手機": "機", "時鐘": "鐘", "檯燈": "燈",
  "鏡子": "鏡", "梳子": "梳", "牙刷": "刷", "毛巾": "巾", "杯子": "杯",
  "剪刀": "刀", "膠水": "膠", "鉛筆": "筆", "橡皮擦": "擦", "尺": "尺",
  "書包": "包", "課本": "書", "筆記本": "本", "彩色筆": "筆", "蠟筆": "筆",
  "雨傘": "傘", "雨鞋": "鞋", "外套": "套", "帽子": "帽", "鞋子": "鞋",
  "襪子": "襪", "太陽": "陽", "月亮": "月", "星星": "星", "白雲": "雲",
  "彩虹": "虹", "閃電": "電", "下雨": "雨", "下雪": "雪", "大樹": "樹",
  "小草": "草", "小花": "花", "葉子": "葉", "石頭": "石", "沙灘": "沙",
  "大海": "海", "高山": "山", "河流": "河", "瀑布": "瀑", "火山": "山",
  "地球": "球", "城堡": "堡", "房子": "房", "帳篷": "篷", "燈塔": "塔",
  "跑步": "跑", "跳躍": "跳", "大笑": "笑", "走路": "走", "唱歌": "唱",
  "跳舞": "舞", "畫畫": "畫", "睡劇": "睡", "睡覺": "睡"
};

const charToZhuyin = {
  "貓": "ㄇㄠ1",
  "小": "ㄒㄧㄠ3",
  "大": "ㄉㄚ4",
  "獅": "開1", // Fallback standard representation, but here correctly matched in sequence
  "老": "ㄌㄠ3",
  "長": "ㄔㄤ2",
  "斑": "ㄅㄢ1",
  "河": "ㄏㄜ2",
  "犀": "ㄒㄧ1",
  "袋": "ㄉㄞ4",
  "猴": "ㄏㄡ2",
  "兔": "ㄊㄨ4",
  "松": "ㄙㄨㄥ1",
  "狐": "ㄏㄨ2",
  "綿": "ㄇㄧㄢ2",
  "山": "ㄕㄢ1",
  "乳": "ㄖㄨ3",
  "馬": "ㄇㄚ3",
  "熊": "ㄒㄩㄥ2",
  "企": "ㄑㄧ4",
  "海": "ㄏㄞ3",
  "鯨": "ㄐㄧㄥ1",
  "章": "ㄓㄤ1",
  "螃": "ㄆㄤ2",
  "蝦": "ㄒㄧㄚ1",
  "青": "ㄑㄧㄥ1",
  "烏": "ㄨ1",
  "蜜": "ㄇㄧ4",
  "蝴": "ㄏㄨ2",
  "瓢": "ㄆㄧㄠ2",
  "蜻": "ㄑㄧㄥ1",
  "蝸": "ㄍㄨ1",
  "螞": "ㄇㄚ3",
  "鴨": "ㄧㄚ1",
  "恐": "ㄎㄨㄥ3",
  "鱷": "ㄜ4",
  "無": "ㄨ2",
  "樹": "... (truncated representation mapped dynamically via complete merged dictionary)"
};

// Replace charToZhuyin with the full static merged output
const fullCharToZhuyin = {
  "貓": "ㄇㄠ1",
  "小": "ㄒㄧㄠ3",
  "大": "ㄉㄚ4",
  "獅": "ㄕ1",
  "老": "ㄌㄠ3",
  "長": "ㄔㄤ2",
  "斑": "ㄅㄢ1",
  "河": "ㄏㄜ2",
  "犀": "ㄒㄧ1",
  "袋": "ㄉㄞ4",
  "猴": "ㄏㄡ2",
  "兔": "ㄊㄨ4",
  "松": "ㄙㄨㄥ1",
  "狐": "ㄏㄨ2",
  "綿": "ㄇㄧㄢ2",
  "山": "ㄕㄢ1",
  "乳": "ㄖㄨ3",
  "馬": "ㄇㄚ3",
  "熊": "ㄒㄩㄥ2",
  "企": "ㄑㄧ4",
  "海": "ㄏㄞ3",
  "鯨": "ㄐㄧㄥ1",
  "章": "ㄓㄤ1",
  "螃": "ㄆㄤ2",
  "蝦": "ㄒㄧㄚ1",
  "青": "ㄑㄧㄥ1",
  "烏": "ㄨ1",
  "蜜": "ㄇㄧ4",
  "蝴": "ㄏㄨ2",
  "瓢": "ㄆㄧㄠ2",
  "蜻": "ㄑㄧㄥ1",
  "蝸": "ㄍㄨㄚ1",
  "螞": "ㄇㄚ3",
  "鴨": "ㄧㄚ1",
  "恐": "ㄎㄨㄥ3",
  "鱷": "ㄜ4",
  "無": "ㄨ2",
  "樹": "開4", // Fallback for safety, let's list standard
  "樹": "ㄕㄨ4",
  "駱": "ㄌㄨㄛ4",
  "刺": "ㄘ4",
  "倉": "ㄘㄤ1",
  "鸚": "ㄧㄥ1",
  "蘋": "ㄆㄧㄥ2",
  "香": "ㄒㄧㄤ1",
  "草": "ㄘㄠ3",
  "西": "ㄒㄧ1",
  "葡": "ㄆㄨ2",
  "橘": "ㄐㄩ2",
  "芒": "ㄇㄤ2",
  "芭": "ㄅㄚ1",
  "鳳": "ㄈㄥ4",
  "木": "ㄇㄨ4",
  "檸": "ㄋㄧㄥ2",
  "櫻": "ㄧㄥ1",
  "桃": "ㄊㄠ2",
  "荔": "ㄌㄧ4",
  "藍": "ㄌㄢ2",
  "番": "ㄈㄢ1",
  "玉": "ㄩ4",
  "胡": "ㄏㄨ2",
  "花": "ㄏㄨㄚ1",
  "高": "ㄍㄠ1",
  "洋": "ㄧㄤ2",
  "地": "ㄉㄧ4",
  "南": "ㄋㄢ2",
  "茄": "ㄑㄧㄝ2",
  "豌": "ㄨㄢ1",
  "白": "ㄅㄞ2",
  "彩": "ㄘㄞ3",
  "米": "ㄇㄧ3",
  "麵": "ㄇㄧㄢ4",
  "蛋": "ㄉㄢ4",
  "餅": "ㄅㄧㄥ3",
  "布": "ㄅㄨ4",
  "冰": "ㄅㄧㄥ1",
  "牛": "ㄋㄧㄡ2",
  "果": "ㄍㄨㄛ3",
  "雞": "ㄐㄧ1",
  "壽": "ㄕㄡ4",
  "披": "ㄆㄧ1",
  "漢": "ㄏㄢ4",
  "薯": "ㄕㄨ3",
  "水": "開3",
  "水": "ㄕㄨㄟ3",
  "包": "ㄅㄠ1",
  "三": "ㄙㄢ1",
  "鬆": "ㄙㄨㄥ1",
  "甜": "ㄊㄧㄢ2",
  "巧": "ㄑㄧㄠ3",
  "薄": "ㄅㄛ2",
  "杯": "ㄅㄟ1",
  "爆": "ㄅㄠ4",
  "熱": "ㄖㄜ4",
  "起": "ㄑㄧ3",
  "棒": "ㄅㄤ4",
  "可": "ㄎㄜ3",
  "派": "ㄆㄞ4",
  "塔": "ㄊㄚ3",
  "汽": "ㄑㄧ4",
  "公": "ㄍㄨㄥ1",
  "卡": "ㄎㄚ3",
  "機": "ㄐㄧ1",
  "腳": "ㄐㄧㄠ3",
  "蒸": "ㄓㄥ1",
  "捷": "ㄐㄧㄝ2",
  "消": "ㄒㄧㄠ1",
  "救": "ㄐㄧㄡ4",
  "警": "ㄐㄧㄥ3",
  "挖": "ㄨㄚ1",
  "推": "ㄊㄨㄟ1",
  "垃": "ㄌㄜ4",
  "直": "ㄓ2",
  "火": "ㄏㄨㄛ3",
  "輪": "ㄌㄨㄣ2",
  "帆": "ㄈㄢ1",
  "潛": "ㄑㄧㄢ2",
  "油": "ㄧㄡ2",
  "拖": "ㄊㄨㄛ1",
  "戰": "ㄓㄢ4",
  "纜": "ㄌㄢ3",
  "滑": "ㄏㄨㄚ2",
  "堆": "ㄉㄨㄟ1",
  "空": "ㄎㄨㄥ1",
  "桌": "ㄓㄨㄛ1",
  "椅": "ㄧ3",
  "床": "ㄔㄨㄤ2",
  "沙": "ㄕㄚ1",
  "電": "ㄉㄧㄢ4",
  "冷": "ㄌㄥ3",
  "手": "ㄕㄡ3",
  "時": "ㄕ2",
  "檯": "ㄊㄞ2",
  "鏡": "ㄐㄧㄥ4",
  "梳": "ㄕㄨ1",
  "牙": "ㄧㄚ2",
  "毛": "ㄇㄠ2",
  "剪": "ㄐㄧㄢ3",
  "膠": "ㄐㄧㄠ1",
  "鉛": "ㄑㄧㄢ1",
  "橡": "ㄒㄧㄤ4",
  "尺": "ㄔ3",
  "書": "ㄕㄨ1",
  "課": "ㄎㄜ4",
  "筆": "ㄅㄧ3",
  "蠟": "ㄌㄚ4",
  "雨": "ㄩ3",
  "外": "ㄨㄞ4",
  "帽": "ㄇㄠ4",
  "鞋": "ㄒㄧㄝ2",
  "襪": "ㄨㄚ4",
  "太": "ㄊㄞ4",
  "月": "ㄩㄝ4",
  "星": "ㄒㄧㄥ1",
  "閃": "ㄕㄢ3",
  "下": "ㄒㄧㄚ4",
  "葉": "ㄧㄝ4",
  "石": "ㄕ2",
  "瀑": "ㄆㄨ4",
  "城": "ㄔㄥ2",
  "房": "ㄈㄤ2",
  "帳": "ㄓㄤ4",
  "燈": "ㄉㄥ1",
  "跑": "ㄆㄠ3",
  "跳": "ㄊㄧㄠ4",
  "走": "ㄗㄡ3",
  "唱": "ㄔㄤ4",
  "畫": "ㄏㄨㄚ4",
  "睡": "ㄕㄨㄟ4",
  "蜂": "ㄈㄥ1",
  "飛": "ㄈㄟ1",
  "辣": "ㄌㄚ4",
  "鼠": "開3",
  "鼠": "ㄕㄨ3",
  "羊": "ㄧㄤ2",
  "豬": "ㄓㄨ1",
  "司": "ㄙ1",
  "本": "ㄅㄣ3",
  "狗": "ㄍㄡ3",
  "象": "ㄒㄧㄤ4",
  "虎": "ㄏㄨ3",
  "鹿": "ㄌㄨ4",
  "鵝": "ㄜ2",
  "豚": "ㄊㄨㄣ2",
  "龜": "ㄍㄨㄟ1",
  "蟹": "ㄒㄧㄝ4",
  "魚": "ㄩ2",
  "蛙": "ㄨㄚ1",
  "蝶": "ㄉㄧㄝ2",
  "蟻": "ㄧ3",
  "鳥": "ㄋㄧㄠ3",
  "鷹": "ㄧㄥ1",
  "龍": "ㄌㄨㄥ2",
  "懶": "ㄌㄢ3",
  "駝": "ㄊㄨㄛ2",
  "蝟": "ㄨㄟ4",
  "蕉": "ㄐㄧㄠ1",
  "莓": "ㄇㄟ2",
  "瓜": "ㄍㄨㄚ1",
  "蘿": "ㄌㄨㄛ2",
  "菜": "ㄘㄞ4",
  "蔥": "ㄘㄨㄥ1",
  "菇": "ㄍㄨ1",
  "豆": "ㄉㄡ4",
  "蒜": "ㄙㄨㄢ4",
  "椒": "ㄐㄧㄠ1",
  "飯": "ㄈㄢ4",
  "糕": "ㄍㄠ1",
  "奶": "ㄋㄞ3",
  "汁": "ㄓ1",
  "薩": "ㄙㄚ4",
  "堡": "ㄅㄠ3",
  "餃": "ㄐㄧㄠ3",
  "圈": "ㄑㄩㄢ1",
  "糖": "ㄊㄤ2",
  "頌": "ㄙㄨㄥ4",
  "凍": "ㄉㄨㄥ4",
  "車": "ㄔㄜ1",
  "箭": "ㄐㄧㄢ4",
  "船": "ㄔㄨㄢ2",
  "艇": "ㄊㄧㄥ3",
  "球": "ㄑㄧㄡ2",
  "板": "ㄅㄢ3",
  "扇": "ㄕㄢ4",
  "箱": "ㄒㄧㄤ1",
  "氣": "ㄑㄧ4",
  "鐘": "ㄓㄨㄥ1",
  "刷": "ㄕㄨㄚ1",
  "巾": "ㄐㄧㄣ1",
  "刀": "ㄉㄠ1",
  "擦": "ㄘㄚ1",
  "傘": "ㄙㄢ3",
  "套": "ㄊㄠ4",
  "陽": "ㄧㄤ2",
  "雲": "ㄩㄣ2",
  "虹": "ㄏㄨㄥ2",
  "雪": "ㄒㄩㄝ3",
  "篷": "ㄆㄥ2",
  "笑": "ㄒㄧㄠ4",
  "舞": "ㄨ3"
};

function decomposeZhuyin(zhuyinStr) {
  const INITIALS = ['ㄅ', 'ㄆ', 'ㄇ', 'ㄈ', 'ㄉ', 'ㄊ', 'ㄋ', 'ㄌ', 'ㄍ', 'ㄎ', 'ㄏ', 'ㄐ', 'ㄑ', 'ㄒ', 'ㄓ', 'ㄔ', 'ㄕ', 'ㄖ', 'ㄗ', 'ㄘ', 'ㄙ'];
  const MEDIALS = ['ㄧ', 'ㄨ', 'ㄩ'];
  const FINALS = ['ㄚ', 'ㄛ', 'ㄜ', 'ㄝ', 'ㄞ', 'ㄟ', 'ㄠ', 'ㄡ', 'ㄢ', 'ㄣ', 'ㄤ', 'ㄥ', 'ㄦ'];

  let initial = "";
  let medial = "";
  let final = "";
  let tone = "1";

  let temp = zhuyinStr;

  const toneMatch = temp.match(/[1-5]$/);
  if (toneMatch) {
    tone = toneMatch[0];
    temp = temp.slice(0, -1);
  }

  if (temp.length > 0 && INITIALS.includes(temp[0])) {
    initial = temp[0];
    temp = temp.slice(1);
  }

  if (temp.length > 0 && MEDIALS.includes(temp[0])) {
    medial = temp[0];
    temp = temp.slice(1);
  }

  if (temp.length > 0 && FINALS.includes(temp[0])) {
    final = temp[0];
    temp = temp.slice(1);
  }

  if (final === "" && medial !== "") {
    final = medial;
    medial = "";
  }

  return { initial, medial, final, tone };
}

async function runSeeding() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.warn("DATABASE_URL is not configured in .env file.");
    console.warn("Skipping PostgreSQL seeding. Backup file quizzes_seed.json is available in root.");
    return;
  }

  console.log("Connecting to PostgreSQL database...");
  
  let pool;
  try {
    const dbModule = await import('./db.js');
    pool = dbModule.default;
  } catch (importError) {
    console.error("Failed to import database connection module.", importError);
    return;
  }

  const client = await pool.connect();
  try {
    console.log("Starting transactional seed operation...");
    await client.query("BEGIN");

    console.log('Clearing old "ZhuyinQuiz" table data...');
    await client.query('TRUNCATE TABLE "ZhuyinQuiz" RESTART IDENTITY CASCADE;');

    const processedData = rawQuizData.map((item, index) => {
      const coreChar = wordToCore[item.word];
      if (!coreChar) {
        throw new Error(`Core character mapping not found for word: ${item.word}`);
      }

      const zhuyinStr = fullCharToZhuyin[coreChar];
      if (!zhuyinStr) {
        throw new Error(`Zhuyin not found for character: ${coreChar} (word: ${item.word})`);
      }

      const decomp = decomposeZhuyin(zhuyinStr);

      return {
        id: index + 1,
        word: coreChar,
        image: item.fileName,
        zhuyin: zhuyinStr,
        initial: decomp.initial,
        medial: decomp.medial,
        final: decomp.final,
        tone: decomp.tone,
        difficulty: 1,
        category: item.category
      };
    });

    console.log(`Inserting ${processedData.length} structured flat records into "ZhuyinQuiz"...`);
    const insertQuery = `
      INSERT INTO "ZhuyinQuiz" ("id", "word", "image", "zhuyin", "initial", "medial", "final", "tone", "difficulty", "category")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
    `;

    for (const row of processedData) {
      await client.query(insertQuery, [
        row.id,
        row.word,
        row.image,
        row.zhuyin,
        row.initial,
        row.medial,
        row.final,
        row.tone,
        row.difficulty,
        row.category
      ]);
    }

    await client.query("COMMIT");
    console.log("成功匯入 208 道注音題目到資料庫！");

    // Also export backup to quizzes_seed.json
    const backupPath = path.join(process.cwd(), 'quizzes_seed.json');
    const backupData = processedData.map(row => ({
      id: row.id,
      wordText: row.word,
      imageUrl: `/images/${row.image}`,
      audioUrl: "",
      correctAnswer: {
        initial: row.initial,
        medial: row.medial,
        final: row.final,
        tone: row.tone
      }
    }));
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf8');
    console.log(`Backup file exported successfully at: ${backupPath}`);
  } catch (dbError) {
    await client.query("ROLLBACK");
    console.error("Database seed transaction failed and was rolled back.", dbError);
  } finally {
    client.release();
    await pool.end();
  }
}

runSeeding();
