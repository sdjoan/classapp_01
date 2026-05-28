"use client";

import { useState } from "react";
import PdfToJpg from "@/components/PdfToJpg";
import JpgToPdf from "@/components/JpgToPdf";

const tabs = [
  { id: "pdf2jpg", label: "📄 PDF → JPG" },
  { id: "jpg2pdf", label: "🖼️ JPG → PDF" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function Home() {
  const [active, setActive] = useState<TabId>("pdf2jpg");

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          🔄 PDF ↔ JPG 변환기
        </h1>
        <p className="text-center text-gray-500 text-sm mb-8">
          PDF를 JPG로, JPG 여러 장을 PDF로 변환합니다.
        </p>

        {/* 탭 */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-6 bg-white shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                active === tab.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 컨텐츠 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {active === "pdf2jpg" ? <PdfToJpg /> : <JpgToPdf />}
        </div>
      </div>
    </main>
  );
}
