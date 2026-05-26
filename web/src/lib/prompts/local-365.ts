/**
 * 日付ごとに1つだけお題を決定的に生成（365個の配列は作らない＝高速・安全）
 */
export function promptIndexForDate(dateISO: string): number {
  let hash = 0;
  for (let i = 0; i < dateISO.length; i++) {
    hash = (hash * 31 + dateISO.charCodeAt(i)) >>> 0;
  }
  return hash % 365;
}

export function promptTextAtIndex(i: number): string {
  const templates = [
    "{A}な{N}を、{S}と一緒に描いてみよう",
    "二人の{N}を、{A}に描いてみよう",
    "{S}の視点で見る、{N}を描いてみよう",
    "{T}した{N}を、1枚で表してみよう",
    "今日は「{K}」。それを{N}で表現してみよう",
    "{N}を、{A}な色づかいだけで描いてみよう",
    "二人の{N}を、{M}っぽく描いてみよう",
    "{P}にある{N}を描いてみよう",
    "{N}を、{C}で強調して描いてみよう",
    "相手に贈る{N}を、{A}に描いてみよう",
  ] as const;

  const adjectives = [
    "あたたかい",
    "やさしい",
    "キラキラした",
    "懐かしい",
    "ワクワクする",
    "ちょっと照れくさい",
    "おしゃれな",
    "ふわふわの",
    "落ち着く",
    "元気が出る",
    "ロマンチックな",
    "小さくてかわいい",
    "大きくて頼もしい",
    "静かな",
    "にぎやかな",
    "不思議な",
    "未来っぽい",
    "レトロな",
    "ほろ苦い",
    "甘い",
  ] as const;

  const nouns = [
    "思い出の場所",
    "理想のデート",
    "一緒に食べたいごはん",
    "二人の合言葉",
    "今日の気分",
    "明日の楽しみ",
    "ありがとうの気持ち",
    "ごめんねの気持ち",
    "二人の未来の家",
    "行ってみたい街",
    "ふたりの休日",
    "寝る前のひととき",
    "雨の日の過ごし方",
    "春の匂い",
    "夏の音",
    "秋の色",
    "冬のぬくもり",
    "二人のペット",
    "秘密の宝箱",
    "心の充電スポット",
    "初めて会った日の景色",
    "最近の小さな幸せ",
    "今いちばん欲しいもの",
    "お守りみたいな存在",
    "プレゼントしたいもの",
    "次の旅行の計画",
    "記念日ディナー",
    "夜の散歩道",
    "朝のはじまり",
    "二人の好きな香り",
    "未来への手紙",
    "二人だけの星座",
    "笑顔の瞬間",
    "ハグの気持ち",
    "手をつなぐ安心感",
    "待ち合わせの場所",
    "一緒に聴きたい音楽",
    "おそろいのアイテム",
    "二人のルーティン",
    "ほっとする飲み物",
  ] as const;

  const subjects = [
    "あなた",
    "相手",
    "二人",
    "未来の自分たち",
    "今日の気分",
    "小さな妖精",
    "猫",
    "ぬいぐるみ",
    "宇宙飛行士",
    "旅人",
  ] as const;

  const times = ["朝", "昼", "夕方", "夜", "寝る前", "雨の日", "晴れの日"] as const;
  const keywords = ["感謝", "未来", "日常", "恋", "安心", "成長", "挑戦"] as const;
  const moods = ["映画ポスター", "絵本", "雑誌の表紙", "SNSの投稿", "切り絵", "水彩"] as const;
  const places = ["カバンの中", "机の上", "窓の外", "スマホの中", "冷蔵庫の前", "公園"] as const;
  const concepts = ["光", "影", "距離", "音", "匂い", "温度", "時間"] as const;

  const t = templates[i % templates.length];
  const A = adjectives[(i * 7) % adjectives.length];
  const N = nouns[(i * 11) % nouns.length];
  const S = subjects[(i * 13) % subjects.length];
  const T = times[(i * 17) % times.length];
  const K = keywords[(i * 19) % keywords.length];
  const M = moods[(i * 23) % moods.length];
  const P = places[(i * 29) % places.length];
  const C = concepts[(i * 31) % concepts.length];

  let text = t
    .replaceAll("{A}", A)
    .replaceAll("{N}", N)
    .replaceAll("{S}", S)
    .replaceAll("{T}", T)
    .replaceAll("{K}", K)
    .replaceAll("{M}", M)
    .replaceAll("{P}", P)
    .replaceAll("{C}", C)
    .trim();

  if (text.length > 80) text = text.slice(0, 78) + "…";
  return text || "今日の気分を、色だけで表してみよう";
}

export function promptForDate(dateISO: string): string {
  return promptTextAtIndex(promptIndexForDate(dateISO));
}
