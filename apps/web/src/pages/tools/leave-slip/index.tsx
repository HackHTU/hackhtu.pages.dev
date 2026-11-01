import { snapdom } from "@zumer/snapdom";
import type { ChangeEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";

import { BasicInfoPanel } from "./basic-info-panel";
import type { LocalData, SessionData, TemplateType } from "./data";
import {
  formatDateTimeLocal,
  leaveReason,
  LOCAL_STORAGE_KEY,
  loadLocal,
  loadSession,
  loadTemplate,
  PERSONAL_LEAVE_TYPES,
  randomName,
  SESSION_STORAGE_KEY,
  SICK_LEAVE_TYPES,
  TEMPLATE_STORAGE_KEY,
} from "./data";
import { LeaveInfoPanel } from "./leave-info-panel";

import "./mobile/replica.css";
import { PreviewPanel } from "./preview-panel";

export const LeaveSlipPage = () => {
  const [templateType, setTemplateType] = useState<TemplateType>(loadTemplate);
  const [localData, setLocalData] = useState<LocalData>(loadLocal);
  const [sessionData, setSessionData] = useState<SessionData>(loadSession);
  const [imagePreview, setImagePreview] = useState(localData.img);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localData));
  }, [localData]);

  useEffect(() => {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
  }, [sessionData]);

  useEffect(() => {
    localStorage.setItem(TEMPLATE_STORAGE_KEY, templateType);
  }, [templateType]);

  const setLocal = useCallback((patch: Partial<LocalData>) => {
    setLocalData((value) => ({ ...value, ...patch }));
  }, []);

  const setSession = useCallback((patch: Partial<SessionData>) => {
    setSessionData((value) => ({ ...value, ...patch }));
  }, []);

  // 图片上传
  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    const onLoad = (e: ProgressEvent<FileReader>) => {
      const result = z.string().safeParse(e.target?.result);

      if (!result.success) {
        return;
      }

      setImagePreview(result.data);
      setLocal({ img: result.data });
      reader.removeEventListener("load", onLoad);
    };

    reader.addEventListener("load", onLoad);

    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview("");
    setLocal({ img: "" });

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  // 随机填充
  const randomFillLocal = () => {
    setLocal({
      phoneNumber1: `1${Math.floor(3 + Math.random() * 6)}${Math.floor(10_000_000 + Math.random() * 90_000_000)}`,
      phoneNumber2: `1${Math.floor(3 + Math.random() * 6)}${Math.floor(10_000_000 + Math.random() * 90_000_000)}`,
    });
  };

  const randomFillSession = () => {
    const now = new Date();

    const startTime = new Date(now);
    startTime.setMinutes(Math.floor(startTime.getMinutes() / 30) * 30);
    startTime.setSeconds(0);

    const endTime = new Date(now);
    endTime.setHours(endTime.getHours() + Math.floor(Math.random() * 2 + 2));
    endTime.setMinutes(Math.floor(endTime.getMinutes() / 30) * 30);
    endTime.setSeconds(0);

    const approvetime = new Date(now);
    approvetime.setMinutes(
      approvetime.getMinutes() - Math.floor(Math.random() * 16)
    );
    approvetime.setSeconds(Math.floor(Math.random() * 60));

    const submitTime = new Date(now);
    submitTime.setMinutes(
      submitTime.getMinutes() - Math.floor(Math.random() * 16 + 30)
    );
    submitTime.setSeconds(Math.floor(Math.random() * 60));

    const reviewTime = new Date(now);
    reviewTime.setMinutes(
      reviewTime.getMinutes() - Math.floor(Math.random() * 16)
    );
    reviewTime.setSeconds(Math.floor(Math.random() * 60));

    const leaveCategory = Math.random() < 0.5 ? "事假" : "病假";

    const leaveSubtype =
      leaveCategory === "事假"
        ? (PERSONAL_LEAVE_TYPES[
            Math.floor(Math.random() * PERSONAL_LEAVE_TYPES.length)
          ] ?? "个人找工作、兼职工作")
        : (SICK_LEAVE_TYPES[
            Math.floor(Math.random() * SICK_LEAVE_TYPES.length)
          ] ?? "看病");

    setSession({
      leaveCategory,
      leaveSubtype,
      startTime: formatDateTimeLocal(startTime),
      endTime: formatDateTimeLocal(endTime),
      approvetime: formatDateTimeLocal(approvetime),
      submitTime: formatDateTimeLocal(submitTime),
      reviewTime: formatDateTimeLocal(reviewTime),
      reason: leaveReason(leaveCategory),
      reviewPeople: randomName(),
      reviewMessage: '通过"老师审核"',
    });
  };

  // 截图 / 下载 / 复制
  const captureTemplate = async () => {
    if (!previewRef.current) {
      setError("未找到预览区域");

      return;
    }

    setError(null);

    try {
      const result = await snapdom(previewRef.current);
      // 用 PNG 导出，避免 toImg() 在 SVG 渲染下返回 SVG dataURL 导致下载/复制格式不符
      const img = await result.toPng();
      setCapturedImage(img.src);
    } catch (error_) {
      console.error(error_);
      setError("截图失败，请重试");
    }
  };

  const downloadImage = () => {
    if (capturedImage === null) {
      return;
    }

    const a = document.createElement("a");
    a.href = capturedImage;
    a.download = `leave-slip-${templateType}-${Date.now()}.png`;
    a.click();
  };

  const copyImage = async () => {
    if (capturedImage === null) {
      return;
    }

    try {
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
    } catch (error_) {
      console.error(error_);
      setError("复制失败，请改用下载");
    }
  };

  return (
    <main className="min-h-dvh">
      <section className="mx-auto max-w-5xl px-6 pt-24 pb-24">
        <header className="max-w-2xl">
          <p className="text-muted-foreground text-sm font-semibold">
            校园服务
          </p>
          <h1 className="mt-3 text-4xl font-semibold md:text-5xl">
            请假条生成器
          </h1>
          <p className="text-muted-foreground mt-5 text-lg">
            填好资料，直接导出请假条。
          </p>
          <p className="text-muted-foreground mt-3 text-base leading-7">
            基本资料、请假信息和预览导出放在三个折叠面板里，可以按任意顺序填写。所有内容只保存在本机浏览器，不会上传。
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
            <a
              href="#profile"
              className="bg-secondary hover:bg-secondary/70 rounded-full px-4 py-2 transition-colors"
            >
              基本资料
            </a>
            <a
              href="#leave-info"
              className="bg-secondary hover:bg-secondary/70 rounded-full px-4 py-2 transition-colors"
            >
              请假信息
            </a>
            <a
              href="#export"
              className="bg-secondary hover:bg-secondary/70 rounded-full px-4 py-2 transition-colors"
            >
              预览与导出
            </a>
          </div>
        </header>

        <div className="mt-10 space-y-5">
          <BasicInfoPanel
            localData={localData}
            setLocal={setLocal}
            imagePreview={imagePreview}
            imageInputRef={imageInputRef}
            handleImageUpload={handleImageUpload}
            removeImage={removeImage}
            randomFillLocal={randomFillLocal}
          />

          <LeaveInfoPanel
            sessionData={sessionData}
            setSession={setSession}
            randomFillSession={randomFillSession}
          />

          <PreviewPanel
            localData={localData}
            sessionData={sessionData}
            templateType={templateType}
            setTemplateType={setTemplateType}
            capturedImage={capturedImage}
            setCapturedImage={setCapturedImage}
            error={error}
            previewRef={previewRef}
            captureTemplate={captureTemplate}
            downloadImage={downloadImage}
            copyImage={copyImage}
            onLocalChange={setLocal}
            onSessionChange={setSession}
          />
        </div>
      </section>
    </main>
  );
};
