/** 字段位置示意用的字段、文案与高亮区域。 */

export type GuideVariant = "basic" | "leave" | "export";

export type GuideField =
  | "avatar"
  | "name"
  | "male"
  | "number"
  | "college1"
  | "college2"
  | "major"
  | "grade"
  | "province"
  | "city"
  | "district"
  | "county"
  | "travelWay"
  | "phoneNumber1"
  | "phoneNumber2"
  | "startTime"
  | "endTime"
  | "leaveRange"
  | "category"
  | "subtype"
  | "reason"
  | "reviewer"
  | "reviewMessage"
  | "approveTime"
  | "submitTime"
  | "reviewTime";

export interface GuideRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const META_REGION: GuideRect = { x: 118, y: 126, width: 140, height: 44 };
const TIME_REGION: GuideRect = { x: 42, y: 184, width: 216, height: 58 };
const TYPE_REGION: GuideRect = { x: 90, y: 246, width: 120, height: 20 };
const APPROVAL_REGION: GuideRect = { x: 88, y: 276, width: 150, height: 36 };

export const FIELD_REGIONS: Partial<Record<GuideField, GuideRect[]>> = {
  avatar: [{ x: 42, y: 108, width: 66, height: 46 }],
  name: [{ x: 118, y: 110, width: 140, height: 14 }],
  male: [META_REGION],
  number: [META_REGION],
  college1: [{ x: 42, y: 84, width: 216, height: 12 }],
  college2: [META_REGION],
  major: [META_REGION],
  grade: [META_REGION],
  startTime: [TIME_REGION],
  endTime: [TIME_REGION],
  leaveRange: [TIME_REGION],
  category: [TYPE_REGION],
  subtype: [TYPE_REGION],
  reason: [TYPE_REGION],
  reviewer: [APPROVAL_REGION],
  approveTime: [APPROVAL_REGION],
  submitTime: [APPROVAL_REGION],
  reviewTime: [APPROVAL_REGION],
  phoneNumber1: [APPROVAL_REGION],
  phoneNumber2: [APPROVAL_REGION],
};

export const FIELD_COPY: Record<
  GuideField,
  { title: string; description: string }
> = {
  avatar: { title: "头像", description: "假条左侧的证件照。" },
  name: {
    title: "姓名",
    description: "假条中的“姓名”以及详情/审批页的请假人。",
  },
  male: { title: "性别", description: "假条中的“性别”。" },
  number: { title: "学号", description: "假条、详情和审批页中的学号。" },
  college1: {
    title: "学院1（红字）",
    description: "假条顶部红字会原样显示学院1，例如「河南师范大学 美术学院」。",
  },
  college2: {
    title: "学院2（院系）",
    description: "假条个人信息中的“院系”。",
  },
  major: {
    title: "专业",
    description: "详情页的班级和审批表单中的专业信息。",
  },
  grade: {
    title: "年级",
    description: "审批页发起人信息中的年级。",
  },
  province: {
    title: "省份",
    description: "地址信息只保存在本机，当前复刻页面不展示。",
  },
  city: {
    title: "城市",
    description: "地址信息只保存在本机，当前复刻页面不展示。",
  },
  district: {
    title: "区县",
    description: "地址信息只保存在本机，当前复刻页面不展示。",
  },
  county: {
    title: "详细地址",
    description: "地址信息只保存在本机，当前复刻页面不展示。",
  },
  travelWay: {
    title: "交通方式",
    description: "交通方式只保存在本机，当前复刻页面不展示。",
  },
  phoneNumber1: {
    title: "联系电话1",
    description: "审批页“联系电话”位置。",
  },
  phoneNumber2: {
    title: "联系电话2",
    description: "备用号码只保存在本机，当前页面不展示。",
  },
  startTime: {
    title: "开始时间",
    description: "假条、详情和审批页中的请假起始时间。",
  },
  endTime: {
    title: "结束时间",
    description: "假条、详情和审批页中的请假结束时间。",
  },
  leaveRange: {
    title: "离校范围",
    description: "假条中间的离校类型文字（不离校为绿色，离校为红色）。",
  },
  category: {
    title: "请假类型",
    description: "详情和审批表单中的“请假类型”。",
  },
  subtype: {
    title: "请假子类型",
    description: "详情和审批表单中的事假/病假类型。",
  },
  reason: {
    title: "请假原因",
    description: "详情页的事由说明、审批表单和核验码内容。",
  },
  reviewer: { title: "审批人", description: "假条和详情页的审批人。" },
  reviewMessage: {
    title: "审批意见",
    description: "审批意见只保存在本机，当前复刻页面不展示具体文字。",
  },
  approveTime: { title: "审批时间", description: "假条和详情页的批准时间。" },
  submitTime: { title: "提交时间", description: "详情页的提交时间。" },
  reviewTime: { title: "审核时间", description: "审批页的审核时间。" },
};

export const FIELD_PAGE: Record<GuideField, "pass" | "detail"> = {
  avatar: "pass",
  name: "pass",
  male: "pass",
  number: "pass",
  college1: "pass",
  college2: "pass",
  major: "detail",
  grade: "detail",
  province: "detail",
  city: "detail",
  district: "detail",
  county: "detail",
  travelWay: "detail",
  phoneNumber1: "detail",
  phoneNumber2: "detail",
  startTime: "detail",
  endTime: "detail",
  leaveRange: "pass",
  category: "detail",
  subtype: "detail",
  reason: "detail",
  reviewer: "pass",
  reviewMessage: "detail",
  approveTime: "pass",
  submitTime: "detail",
  reviewTime: "detail",
};

/** 详情页会高亮的字段。 */
export const DETAIL_HIGHLIGHT_FIELDS: GuideField[] = [
  "name",
  "number",
  "major",
  "submitTime",
  "reviewer",
  "category",
  "subtype",
  "startTime",
  "endTime",
  "reason",
  "phoneNumber1",
];
