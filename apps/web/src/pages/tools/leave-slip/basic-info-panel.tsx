import { CheckCircleIcon, UserCircleIcon } from "@phosphor-icons/react";
import type { ChangeEvent, RefObject } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { AutocompleteInput, SlipPanel } from "./controls";
import { isMale } from "./data";
import type { LocalData } from "./data";
import { FieldGuideMenu, FieldLabel } from "./field-guide";
import type { GuideField } from "./field-guide-data";
import {
  ALL_MAJORS,
  COLLEGE_NOTE,
  COLLEGES,
  collegeNameFromRedText,
  getMajorsForCollege,
  RED_COLLEGE_OPTIONS,
} from "./school-data";

const AddressInput = ({
  field,
  value,
  placeholder,
  onChange,
}: {
  field: GuideField;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) => (
  <div className="flex items-center gap-1">
    <div className="min-w-0 flex-1">
      <Input
        onChange={(event) => {
          onChange(event.target.value);
        }}
        placeholder={placeholder}
        value={value}
      />
    </div>
    <FieldGuideMenu compact field={field} variant="basic" />
  </div>
);

export const BasicInfoPanel = ({
  localData,
  setLocal,
  imagePreview,
  imageInputRef,
  handleImageUpload,
  removeImage,
  randomFillLocal,
}: {
  localData: LocalData;
  setLocal: (patch: Partial<LocalData>) => void;
  imagePreview: string;
  imageInputRef: RefObject<HTMLInputElement | null>;
  handleImageUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  removeImage: () => void;
  randomFillLocal: () => void;
}) => (
  <SlipPanel
    id="profile"
    icon={<UserCircleIcon size={22} weight="duotone" />}
    title="基本资料"
    summary="头像、姓名、学号、学院、专业和联系方式。所有内容自动保存在本机浏览器，不会上传。"
    defaultOpen
  >
    <div className="flex flex-wrap items-center justify-between gap-2">
      <FieldGuideMenu variant="basic" />
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="text-muted-foreground flex items-center gap-1 text-xs">
          <CheckCircleIcon size={14} weight="duotone" />
          已自动保存到本机
        </span>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={randomFillLocal}
        >
          🎲 随机填充电话
        </Button>
      </div>
    </div>

    <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
      <div className="md:col-span-2">
        <FieldLabel field="avatar" htmlFor="avatar-upload">
          头像
        </FieldLabel>
        <div className="flex items-center gap-4">
          <div className="border-muted-foreground/30 bg-muted flex size-20 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="预览"
                className="size-full object-cover"
              />
            ) : (
              <span className="text-muted-foreground text-xs">无图片</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              type="button"
              size="sm"
              onClick={() => imageInputRef.current?.click()}
            >
              选择图片
            </Button>
            {imagePreview && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={removeImage}
              >
                删除图片
              </Button>
            )}
          </div>
        </div>
      </div>

      <div>
        <FieldLabel field="name" htmlFor="name">
          姓名
        </FieldLabel>
        <Input
          id="name"
          value={localData.name}
          onChange={(e) => {
            setLocal({ name: e.target.value });
          }}
          placeholder="请输入姓名"
        />
      </div>
      <div>
        <FieldLabel field="male" htmlFor="male">
          性别
        </FieldLabel>
        <select
          id="male"
          value={localData.male}
          onChange={(e) => {
            const { value } = e.target;

            if (isMale(value)) {
              setLocal({ male: value });
            }
          }}
          className="border-input bg-background focus-visible:ring-ring flex h-10 w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2"
        >
          <option value="男">男</option>
          <option value="女">女</option>
        </select>
      </div>
      <div>
        <FieldLabel field="number" htmlFor="number">
          学号
        </FieldLabel>
        <Input
          id="number"
          value={localData.number}
          onChange={(e) => {
            setLocal({ number: e.target.value });
          }}
          placeholder="请输入学号"
        />
      </div>
      <div>
        <FieldLabel field="college1" htmlFor="college">
          学院1（红字）
        </FieldLabel>
        <AutocompleteInput
          id="college"
          value={localData.college}
          options={RED_COLLEGE_OPTIONS}
          onChange={(value) => {
            const nextMajors = getMajorsForCollege(
              collegeNameFromRedText(value)
            );

            const shouldClearMajor =
              localData.major !== "" &&
              nextMajors !== undefined &&
              nextMajors.length > 0 &&
              !nextMajors.includes(localData.major);

            setLocal(
              shouldClearMajor
                ? { college: value, major: "" }
                : { college: value }
            );
          }}
          placeholder="如：河南师范大学 美术学院"
        />
      </div>
      <div>
        <FieldLabel field="college2" htmlFor="college2">
          学院2（院系）
        </FieldLabel>
        <AutocompleteInput
          id="college2"
          value={localData.college2}
          options={COLLEGES}
          onChange={(value) => {
            setLocal({ college2: value });
          }}
          placeholder="假条“院系”位置显示的内容"
        />
      </div>
      <div>
        <FieldLabel field="major" htmlFor="major">
          专业
        </FieldLabel>
        <AutocompleteInput
          id="major"
          value={localData.major}
          options={
            getMajorsForCollege(collegeNameFromRedText(localData.college)) ??
            ALL_MAJORS
          }
          onChange={(value) => {
            setLocal({ major: value });
          }}
          placeholder="输入或搜索专业，可自由填写"
        />
      </div>
      <div>
        <FieldLabel field="grade" htmlFor="grade">
          年级
        </FieldLabel>
        <Input
          id="grade"
          value={localData.grade}
          onChange={(e) => {
            setLocal({ grade: e.target.value });
          }}
          placeholder="如 2023级"
        />
      </div>
      <p className="text-muted-foreground text-xs leading-5 md:col-span-2">
        {COLLEGE_NOTE}
      </p>

      <div className="md:col-span-2">
        <div className="mb-2 block text-sm font-medium">地址信息</div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <AddressInput
            field="province"
            value={localData.province}
            onChange={(value) => {
              setLocal({ province: value });
            }}
            placeholder="省份"
          />
          <AddressInput
            field="city"
            value={localData.city}
            onChange={(value) => {
              setLocal({ city: value });
            }}
            placeholder="城市"
          />
          <AddressInput
            field="district"
            value={localData.district}
            onChange={(value) => {
              setLocal({ district: value });
            }}
            placeholder="区县"
          />
          <AddressInput
            field="county"
            value={localData.county}
            onChange={(value) => {
              setLocal({ county: value });
            }}
            placeholder="详细地址"
          />
        </div>
      </div>

      <div>
        <FieldLabel field="travelWay" htmlFor="travelWay">
          交通方式
        </FieldLabel>
        <Input
          id="travelWay"
          value={localData.travelWay}
          onChange={(e) => {
            setLocal({ travelWay: e.target.value });
          }}
          placeholder="请输入交通方式"
        />
      </div>
      <div>
        <FieldLabel field="phoneNumber1" htmlFor="phone1">
          联系电话1
        </FieldLabel>
        <Input
          id="phone1"
          type="tel"
          value={localData.phoneNumber1}
          onChange={(e) => {
            setLocal({ phoneNumber1: e.target.value });
          }}
          placeholder="请输入联系电话"
        />
      </div>
      <div>
        <FieldLabel field="phoneNumber2" htmlFor="phone2">
          联系电话2
        </FieldLabel>
        <Input
          id="phone2"
          type="tel"
          value={localData.phoneNumber2}
          onChange={(e) => {
            setLocal({ phoneNumber2: e.target.value });
          }}
          placeholder="请输入联系电话（可选）"
        />
      </div>
    </div>
  </SlipPanel>
);
