export interface VerificationQuestion {
  id: string;
  text: string;
  options: string[];
  /** 正确选项在 options 里的下标。 */
  answer: number;
}

/**
 * 新成员验证题库。题目围绕河南师范大学。
 * 发送时会按 token 旋转选项顺序，避免正确答案永远在第一个。
 */
export const QUESTIONS: VerificationQuestion[] = [
  {
    id: "htu-city",
    text: "河南师范大学位于河南省的哪座城市？",
    options: ["新乡市", "郑州市", "开封市", "洛阳市"],
    answer: 0,
  },
  {
    id: "htu-name",
    text: "河南师范大学的英文名称是？",
    options: [
      "Henan Normal University",
      "Henan Shifan University",
      "Xinxiang Normal University",
      "Henan Shifan College",
    ],
    answer: 0,
  },
  {
    id: "htu-abbr",
    text: "河南师范大学的官方英文缩写（域名）是？",
    options: ["HTU", "HSU", "HBNU", "HEBNU"],
    answer: 0,
  },
  {
    id: "htu-tier",
    text: "河南师范大学在河南省的招生批次通常属于？",
    options: ["本科一批（一本）", "本科二批（二本）", "专科批", "高职单招"],
    answer: 0,
  },
  {
    id: "htu-campus-real",
    text: "以下哪个是河南师范大学的校区？",
    options: ["平原湖校区", "明伦校区", "金明校区", "龙子湖校区"],
    answer: 0,
  },
  {
    id: "htu-campus-not",
    text: "以下哪个不是河南师范大学的校区？",
    options: ["龙子湖校区", "建设路校区", "平原湖校区", "科技创新港校区"],
    answer: 0,
  },
  {
    id: "htu-111",
    text: "河南师范大学入选了下列哪个国家级计划？",
    options: ["111计划", "211工程", "985工程", "清北计划"],
    answer: 0,
  },
];

export const pickQuestion = (): VerificationQuestion => {
  const index = Math.floor(Math.random() * QUESTIONS.length);

  return QUESTIONS[index] ?? QUESTIONS[0];
};

/**
 * 用 token 的前两位十六进制决定选项旋转量，
 * 这样同一条验证记录每次打开看到的选项顺序都一致。
 */
export const optionsForToken = (
  question: VerificationQuestion,
  token: string
): string[] => {
  const shift =
    Number.parseInt(token.slice(0, 2), 16) % question.options.length;

  return [
    ...question.options.slice(shift),
    ...question.options.slice(0, shift),
  ];
};
