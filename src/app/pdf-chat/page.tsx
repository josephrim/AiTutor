"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PDFViewer from "@/components/PDFViewer";
import ChatBox from "@/components/ChatBox";
import { Annotation } from "@/types";
import { extractPdfText } from "@/utils/pdfUtils";
import { useRouter } from "next/navigation";

export default function PDFChatPage() {
  const searchParams = useSearchParams();
  const fileUrl = searchParams.get("fileUrl");
  const [pdfText, setPdfText] = useState<string>("");
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [goToPage, setGoToPage] = useState<number | null>(null);
  const [chatHistory, setChatHistory] = useState<
    { user: string; ai: string }[]
  >([]);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/session", { method: "GET" });
        if (!response.ok) {
          router.push("/auth");
        }
      } catch {
        router.push("/auth");
      }
    };

    checkSession();
  }, [router]);

  useEffect(() => {
    const loadPdf = async () => {
      const text = await extractPdfText(fileUrl ?? "");
      setPdfText(text);
    };

    if (fileUrl) {
      loadPdf();
    }

    const storedfileUrl = localStorage.getItem("fileUrl");
    const storedChatHistory = localStorage.getItem("chatHistory");
    const storedAnnotations = localStorage.getItem("annotations");

    if (storedfileUrl === fileUrl) {
      if (storedChatHistory) setChatHistory(JSON.parse(storedChatHistory));
      if (storedAnnotations) setAnnotations(JSON.parse(storedAnnotations));
    } else {
      localStorage.removeItem("chatHistory");
      localStorage.removeItem("annotations");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("fileUrl", fileUrl!);
    if (chatHistory.length > 0)
      localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
    if (annotations.length > 0)
      localStorage.setItem("annotations", JSON.stringify(annotations));
  }, [fileUrl, chatHistory, annotations]);

  if (!fileUrl) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">No PDF found. Please upload a file.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 h-screen">
      <div className="border-r overflow-hidden">
        <PDFViewer
          fileUrl={fileUrl}
          annotations={annotations}
          goToPage={goToPage ?? 1}
        />
      </div>

      <div className="h-full overflow-hidden">
        {pdfText ? (
          <ChatBox
            context={pdfText}
            setAnnotations={setAnnotations}
            setGoToPage={setGoToPage}
            chatHistory={chatHistory}
            setChatHistory={setChatHistory}
          />
        ) : (
          <p className="text-gray-500">Extracting PDF context...</p>
        )}
      </div>
    </div>
  );
}
