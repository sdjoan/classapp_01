"use client";

import { useState, useRef } from "react";

interface FileItem {
  file: File;
  preview: string;
}

export default function JpgToPdf() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [pdfName, setPdfName] = useState("output");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    const items: FileItem[] = selected.map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
    }));
    setFiles((prev) => [...prev, ...items]);
    setStatus("idle");
    setMessage("");
    e.target.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  function moveFile(from: number, to: number) {
    setFiles((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  }

  async function handleConvert() {
    if (!files.length) return;

    setStatus("loading");
    setMessage("변환 중...");

    try {
      const formData = new FormData();
      files.forEach(({ file }) => formData.append("images", file));

      const res = await fetch("/api/jpg-to-pdf", { method: "POST", body: formData });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "서버 오류");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = pdfName.endsWith(".pdf") ? pdfName : `${pdfName}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      setStatus("done");
      setMessage(`완료: ${files.length}장 → ${pdfName}.pdf`);
    } catch (e: unknown) {
      console.error(e);
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "변환 중 오류가 발생했습니다.");
    }
  }

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-gray-700">JPG → PDF 변환</h2>

      {/* 파일 추가 버튼 */}
      <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-orange-300 rounded-xl cursor-pointer bg-orange-50 hover:bg-orange-100 transition-colors">
        <span className="text-4xl mb-1">🖼️</span>
        <span className="text-sm text-orange-600 font-medium">JPG / PNG 파일 선택</span>
        <span className="text-xs text-gray-400 mt-1">여러 장 동시 선택 가능</span>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </label>

      {/* 파일 목록 */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            총 {files.length}장 · 순서를 바꾸려면 ↑↓ 버튼을 사용하세요.
          </p>
          {files.map(({ file, preview }, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-2 rounded-lg border border-gray-100 bg-gray-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt={file.name} className="w-12 h-12 object-cover rounded" />
              <span className="flex-1 text-sm text-gray-700 truncate">{file.name}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => i > 0 && moveFile(i, i - 1)}
                  disabled={i === 0}
                  className="px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  onClick={() => i < files.length - 1 && moveFile(i, i + 1)}
                  disabled={i === files.length - 1}
                  className="px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  onClick={() => removeFile(i)}
                  className="px-2 py-1 text-xs rounded bg-red-100 text-red-500 hover:bg-red-200"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PDF 파일명 */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600 w-24 shrink-0">파일명</label>
        <input
          type="text"
          value={pdfName}
          onChange={(e) => setPdfName(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          placeholder="output"
        />
        <span className="text-sm text-gray-400">.pdf</span>
      </div>

      {/* 변환 버튼 */}
      <button
        onClick={handleConvert}
        disabled={files.length === 0 || status === "loading"}
        className="w-full py-3 rounded-xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 disabled:opacity-50 transition-colors"
      >
        {status === "loading" ? "변환 중..." : "PDF로 변환 및 다운로드"}
      </button>

      {/* 상태 메시지 */}
      {status === "done" && (
        <p className="text-center text-green-600 text-sm font-medium">✅ {message}</p>
      )}
      {status === "error" && (
        <p className="text-center text-red-500 text-sm">❌ {message}</p>
      )}
    </div>
  );
}
