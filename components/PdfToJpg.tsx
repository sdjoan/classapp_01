"use client";

import { useState, useRef } from "react";
import JSZip from "jszip";

export default function PdfToJpg() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [previews, setPreviews] = useState<string[]>([]);
  const [pdfName, setPdfName] = useState("");
  const [dpi, setDpi] = useState(150);
  const fileRef = useRef<HTMLInputElement>(null);

  const scale = dpi / 72;

  async function handleConvert() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setPdfName(file.name.replace(/\.pdf$/i, ""));
    setStatus("loading");
    setMessage("변환 중...");
    setPreviews([]);

    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const total = pdf.numPages;
      const blobs: Blob[] = [];
      const urls: string[] = [];

      for (let i = 1; i <= total; i++) {
        setMessage(`렌더링 중... (${i}/${total})`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;

        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.92)
        );
        blobs.push(blob);
        urls.push(URL.createObjectURL(blob));
      }

      setPreviews(urls);
      setStatus("done");
      setMessage(`완료: ${total}페이지 변환됨`);

      if (total === 1) {
        triggerDownload(blobs[0], `${pdfName || "page"}_001.jpg`);
      } else {
        const zip = new JSZip();
        blobs.forEach((b, i) =>
          zip.file(`page_${String(i + 1).padStart(3, "0")}.jpg`, b)
        );
        const zipBlob = await zip.generateAsync({ type: "blob" });
        triggerDownload(zipBlob, `${file.name.replace(/\.pdf$/i, "")}_images.zip`);
      }
    } catch (e) {
      console.error(e);
      setStatus("error");
      setMessage("변환 중 오류가 발생했습니다.");
    }
  }

  function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-gray-700">PDF → JPG 변환</h2>

      {/* 파일 업로드 */}
      <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-blue-300 rounded-xl cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors">
        <span className="text-4xl mb-1">📄</span>
        <span className="text-sm text-blue-600 font-medium">PDF 파일 선택</span>
        <span className="text-xs text-gray-400 mt-1">클릭하거나 드래그해서 업로드</span>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={() => {
            setStatus("idle");
            setPreviews([]);
            setMessage("");
          }}
        />
      </label>

      {/* DPI 설정 */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600 w-28 shrink-0">
          해상도: <span className="font-semibold text-blue-600">{dpi} DPI</span>
        </label>
        <input
          type="range"
          min={72}
          max={300}
          step={10}
          value={dpi}
          onChange={(e) => setDpi(Number(e.target.value))}
          className="flex-1"
        />
      </div>

      {/* 변환 버튼 */}
      <button
        onClick={handleConvert}
        disabled={status === "loading"}
        className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {status === "loading" ? message : "JPG로 변환 및 다운로드"}
      </button>

      {/* 상태 메시지 */}
      {status === "done" && (
        <p className="text-center text-green-600 text-sm font-medium">✅ {message}</p>
      )}
      {status === "error" && (
        <p className="text-center text-red-500 text-sm">❌ {message}</p>
      )}

      {/* 미리보기 */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          {previews.map((url, i) => (
            <div key={i} className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`page ${i + 1}`} className="w-full object-cover" />
              <p className="text-center text-xs text-gray-400 py-1">
                page_{String(i + 1).padStart(3, "0")}.jpg
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
