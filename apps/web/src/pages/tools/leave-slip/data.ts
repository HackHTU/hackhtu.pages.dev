import { z } from "zod";

import { normalizeRedCollege } from "./school-data";

/** 源站请假申请只保留事假和病假两类。 */
export const LEAVE_CATEGORIES = ["事假", "病假"] as const;

export type LeaveCategory = (typeof LEAVE_CATEGORIES)[number];

export const PERSONAL_LEAVE_TYPES = [
  "自主见习（个人自行安排的单位实践）",
  "返乡回家、探亲（因事回家、红白事、探亲，照顾生病亲属等）",
  "外出游玩",
  "参加考试、培训等",
  "个人找工作、兼职工作",
  "参加非学校统一组织的比赛、竞赛",
  "修牙、补牙、接种疫苗",
  "其他",
] as const;

export const SICK_LEAVE_TYPES = ["看病", "住院治疗"] as const;

export const isLeaveCategory = (value: string): value is LeaveCategory =>
  value === "事假" || value === "病假";

/** 切换请假类型时，把子类型收敛到合法的选项。 */
export const normalizeLeaveSubtype = (
  category: LeaveCategory,
  subtype: string
): string => {
  if (category === "病假") {
    return SICK_LEAVE_TYPES.some((item) => item === subtype) ? subtype : "看病";
  }

  return PERSONAL_LEAVE_TYPES.some((item) => item === subtype)
    ? subtype
    : "个人找工作、兼职工作";
};

export const LOCAL_STORAGE_KEY = "leave-slip-local-data";
export const SESSION_STORAGE_KEY = "leave-slip-session-data";
export const TEMPLATE_STORAGE_KEY = "leave-slip-template";

const storedSessionSchema = z.looseObject({
  type: z.string().optional(),
  leaveCategory: z.string().optional(),
  leaveSubtype: z.string().optional(),
  leaveCampus: z.string().optional(),
  leaveCity: z.string().optional(),
  reason: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  approvetime: z.string().optional(),
  reviewPeople: z.string().optional(),
  reviewMessage: z.string().optional(),
  submitTime: z.string().optional(),
  reviewTime: z.string().optional(),
});

const storedDataSchema = z.looseObject({
  college: z.string().optional(),
  college2: z.string().optional(),
  grade: z.string().optional(),
  leaveCampus: z.string().optional(),
  leaveCity: z.string().optional(),
  type: z.string().optional(),
  major: z.string().optional(),
  series1: z.string().optional(),
  series2: z.string().optional(),
});

export interface LocalData {
  img: string;
  name: string;
  male: "男" | "女";
  number: string;
  college: string;
  college2: string;
  major: string;
  grade: string;
  province: string;
  city: string;
  district: string;
  county: string;
  travelWay: string;
  phoneNumber1: string;
  phoneNumber2: string;
}

export interface SessionData {
  type: "离校不出市" | "离校";
  leaveCategory: LeaveCategory;
  leaveSubtype: string;
  leaveCampus: "离校" | "不离校";
  leaveCity: "是" | "否";
  reason: string;
  // datetime-local 格式
  startTime: string;
  endTime: string;
  approvetime: string;
  reviewPeople: string;
  reviewMessage: string;
  submitTime: string;
  reviewTime: string;
}

export const isMale = (value: string): value is LocalData["male"] =>
  value === "男" || value === "女";

export const isLeaveType = (value: string): value is SessionData["type"] =>
  value === "离校" || value === "离校不出市";

export const TEMPLATE_LABELS = {
  pass: "出示假条",
  request: "请假详情",
  approval: "审批流程",
} as const;

export type TemplateType = keyof typeof TEMPLATE_LABELS;

export const isTemplateType = (value: string): value is TemplateType =>
  value === "pass" || value === "request" || value === "approval";

const LEGACY_COLLEGE = "河南师范大学 计算机与信息工程学院（人工智能学院）";
const LEGACY_COLLEGE2 = "计算机与信息工程学院（人工智能学院）";
const LEGACY_MAJOR = "人工智能";

const defaultLocal: LocalData = {
  img: "",
  name: "",
  male: "男",
  number: "",
  college: "",
  college2: "",
  major: "",
  grade: "2023级",
  province: "河南省",
  city: "新乡市",
  district: "牧野区",
  county: "河南师范大学",
  travelWay: "公交车",
  phoneNumber1: "",
  phoneNumber2: "",
};

const defaultSession: SessionData = {
  type: "离校不出市",
  leaveCategory: "事假",
  leaveSubtype: "个人找工作、兼职工作",
  leaveCampus: "离校",
  leaveCity: "否",
  reason: "",
  startTime: "",
  endTime: "",
  approvetime: "",
  reviewPeople: "",
  reviewMessage: "",
  submitTime: "",
  reviewTime: "",
};

export const loadLocal = (): LocalData => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);

    if (raw !== null) {
      const parsed = storedDataSchema.parse(JSON.parse(raw));
      const { college, college2, series1, series2, ...rest } = parsed;

      const result: LocalData = {
        ...defaultLocal,
        ...rest,
        college: normalizeRedCollege(
          college ?? series1 ?? defaultLocal.college
        ),
        college2: college2 ?? series2 ?? defaultLocal.college2,
      };

      // 旧版本会把示例学院/专业写进本机存储；三项都还是示例值时清空。
      if (
        result.college === LEGACY_COLLEGE &&
        result.college2 === LEGACY_COLLEGE2 &&
        result.major === LEGACY_MAJOR
      ) {
        return { ...result, college: "", college2: "", major: "" };
      }

      return result;
    }
  } catch {
    /* 忽略损坏的存储 */
  }

  return defaultLocal;
};

export const loadSession = (): SessionData => {
  try {
    let raw = localStorage.getItem(SESSION_STORAGE_KEY);

    // 旧版本把请假信息放在 sessionStorage，首次读取时迁移到 localStorage。
    if (raw === null) {
      const legacy = sessionStorage.getItem(SESSION_STORAGE_KEY);

      if (legacy !== null) {
        localStorage.setItem(SESSION_STORAGE_KEY, legacy);
        raw = legacy;
      }
    }

    if (raw !== null) {
      const parsed = storedSessionSchema.parse(JSON.parse(raw));
      const leaveCategory = parsed.leaveCategory === "病假" ? "病假" : "事假";
      const { leaveCity: storedCity } = parsed;
      let leaveCity: "是" | "否";

      if (storedCity === "是" || storedCity === "否") {
        leaveCity = storedCity;
      } else {
        leaveCity = parsed.type === "离校" ? "是" : "否";
      }

      return {
        type: parsed.type === "离校" ? "离校" : "离校不出市",
        leaveCategory,
        leaveSubtype: normalizeLeaveSubtype(
          leaveCategory,
          parsed.leaveSubtype ?? ""
        ),
        leaveCampus: parsed.leaveCampus === "不离校" ? "不离校" : "离校",
        leaveCity,
        reason: parsed.reason ?? "",
        startTime: parsed.startTime ?? "",
        endTime: parsed.endTime ?? "",
        approvetime: parsed.approvetime ?? "",
        reviewPeople: parsed.reviewPeople ?? "",
        reviewMessage: parsed.reviewMessage ?? "",
        submitTime: parsed.submitTime ?? "",
        reviewTime: parsed.reviewTime ?? "",
      };
    }
  } catch {
    /* 忽略损坏的存储 */
  }

  return defaultSession;
};

export const loadTemplate = (): TemplateType => {
  try {
    const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY);

    if (raw !== null && isTemplateType(raw)) {
      return raw;
    }
  } catch {
    /* 忽略损坏的存储 */
  }

  return "pass";
};

/** 随机请假原因列表 */
export const leaveReasons = [
  "发烧 需要就医休息",
  "感冒头痛 需要在家休息",
  "腹痛 就医检查",
  "牙疼 预约拔牙治疗",
  "家庭突发紧急情况 需回家处理",
  "父母身体不适 需陪同就医",
  "亲属丧事 需回家奔丧",
  "个人情绪低落 需短期调整",
  "食物中毒 需就医观察",
  "过敏反应 需治疗观察",
  "睡眠不足 无法正常上课",
  "交通事故 需处理车辆和伤情",
  "学校手续办理 需整日外出",
  "实习面试 安排冲突",
  "必要的宗教活动 需请假参加",
  "视力模糊 需就医检查",
  "牙科手术 后期康复休息",
  "重要证件补办 需等待办理进度",
  "室友突发意外 需陪伴处理",
  "疫苗接种 需观察副作用",
  "心脏不适 医生建议休息",
  "胃肠炎 需在家休养",
  "经期不适 无法正常上课",
  "复诊随访 需按时到医院",
  "参加学校代表队比赛 需请假外出",
  "参加学术会议 需外出汇报",
  "家庭搬迁 需协助处理事务",
  "银行或公证必须面签 需外出",
  "电脑设备故障 无法完成在线任务",
  "重要实验设备故障 需现场处理",
  "学校安排体检 需请假配合",
  "心理咨询预约 需参加面谈",
  "重大天气影响 无法安全出行",
  "航班或火车延误 影响返校行程",
  "校园施工影响 需临时安置解决",
  "需要参加志愿服务 影响上课时间",
  "家庭陪护任务 需暂时回家照顾",
  "需要办理入学或毕业材料 需外出",
  "配偶或伴侣突发事件 需支援",
  "需要参加重要考试冲刺 需自习调整",
  "医生建议休假 康复观察",
  "术后复查 需请假前往医院",
  "疲劳过度 需要短期休息",
  "居住地停电无法完成作业",
  "水管破裂需要在家等维修",
  "宠物生病 需带宠物就医",
  "遗失重要证件 需补办处理",
  "参加国家或地方级竞赛 需外出",
  "临时家庭聚会 需回家处理事务",
  "参加导师安排的外出调研 需请假",
];

/** 医疗相关关键词，用于给病假挑更贴切的原因。 */
const MEDICAL_REASON =
  /医|病|疼|发烧|感冒|过敏|术后|复查|门诊|牙|胃肠|睡眠|心|康复|呕吐|腹泻|骨折|受伤|疫苗|经期|疲劳|不适/u;

/** 随机请假原因；病假优先使用医疗相关的原因。 */
export const leaveReason = (category?: "事假" | "病假"): string => {
  if (category === undefined) {
    return leaveReasons[Math.floor(Math.random() * leaveReasons.length)] ?? "";
  }

  const matched = leaveReasons.filter((reason) => MEDICAL_REASON.test(reason));

  const pool =
    category === "病假"
      ? matched
      : leaveReasons.filter((reason) => !MEDICAL_REASON.test(reason));

  const usable = pool.length > 0 ? pool : leaveReasons;

  return usable[Math.floor(Math.random() * usable.length)] ?? "";
};

/** 常见姓氏 */
const surnames = [
  "赵",
  "钱",
  "孙",
  "李",
  "周",
  "吴",
  "郑",
  "王",
  "冯",
  "陈",
  "褚",
  "卫",
  "蒋",
  "沈",
  "韩",
  "杨",
  "朱",
  "秦",
  "许",
  "何",
  "吕",
  "施",
  "张",
  "孔",
  "曹",
  "严",
  "华",
  "金",
  "魏",
  "陶",
  "姜",
  "戚",
  "谢",
  "邹",
  "喻",
  "柏",
  "窦",
  "章",
  "苏",
  "潘",
  "葛",
  "范",
  "彭",
  "黄",
  "刘",
  "邓",
  "萧",
  "董",
  "梁",
  "杜",
  "阮",
  "罗",
  "郭",
  "林",
  "徐",
  "高",
  "夏",
  "蔡",
  "田",
  "樊",
  "胡",
  "霍",
  "万",
  "柯",
  "管",
  "卢",
  "莫",
  "解",
  "应",
  "宗",
  "丁",
  "宣",
  "石",
  "崔",
  "吉",
  "程",
  "欧阳",
  "上官",
];

const givenPool =
  "伟刚勇毅俊峰强军平保东文辉力明永健世广志义兴良海山仁波宁贵福生龙元全国学祥才发武新利清飞彬富顺信子杰涛成康星光天达安岩中茂进林有坚和彪博诚先敬震振壮会思群豪心邦承乐绍功松善厚庆磊民友裕河哲江超浩亮政谦珍玲娟英华慧巧娜静淑惠珠翠雅玉萍红芳燕春菊勤贞莉桂璐晶妍雪雯月";

/** 随机中文姓名 */
export const randomName = (): string => {
  const surname = surnames[Math.floor(Math.random() * surnames.length)];
  const givenLen = Math.random() < 0.85 ? 2 : 1;
  let given = "";

  for (let i = 0; i < givenLen; i += 1) {
    given += givenPool[Math.floor(Math.random() * givenPool.length)];
  }

  return surname + given;
};

/** 格式化 Date 为 datetime-local 需要的本地格式 `YYYY-MM-DDTHH:mm` */
export const formatDateTimeLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};
