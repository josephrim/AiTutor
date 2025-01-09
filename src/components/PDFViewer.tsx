"use client";

import { Annotation } from "@/types";
import { useEffect, useState } from "react";
import { pdfjs, Document, Page } from "react-pdf";
import "core-js/proposals/promise-with-resolvers";

import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// there is your `/legacy/build/pdf.worker.min.mjs` url
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// Polyfill for environments where window is not available (e.g., server-side rendering)
if (typeof Promise.withResolvers === "undefined") {
  if (typeof window !== "undefined") {
    // @ts-expect-error This does not exist outside of polyfill which this is doing
    window.Promise.withResolvers = function () {
      let resolve, reject;
      const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    };
  } else {
    // @ts-expect-error This does not exist outside of polyfill which this is doing
    global.Promise.withResolvers = function () {
      let resolve, reject;
      const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    };
  }
}
interface PDFViewerProps {
  fileUrl: string;
  annotations: Annotation[];
  goToPage?: number;
}

export default function PDFViewer({
  fileUrl,
  annotations,
  goToPage,
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    if (goToPage && goToPage > 0 && goToPage <= (numPages || 0)) {
      setCurrentPage(goToPage);
    }
  }, [goToPage, numPages]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const goToNextPage = () => {
    if (currentPage < (numPages || 0)) setCurrentPage((prev) => prev + 1);
  };

  const renderAnnotations = (pageNumber: number) => {
    return annotations
      .filter((annotation) => annotation.pageNumber === pageNumber)
      .map((annotation, idx) => (
        <div
          key={idx}
          className="absolute bg-yellow-200 opacity-75 rounded p-1"
          style={{
            top: "0%",
            left: "0%",
          }}
        >
          {annotation.text}
        </div>
      ));
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center p-4 bg-gray-100 border-b">
        <button
          onClick={goToPrevPage}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Previous
        </button>
        <p className="text-sm text-gray-700">
          Page {currentPage} of {numPages || "?"}
        </p>
        <button
          onClick={goToNextPage}
          disabled={currentPage === numPages}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Next
        </button>
      </div>

      <div className="flex-grow bg-gray-200 overflow-auto flex justify-center items-start">
        <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess}>
          <div className="relative">
            <Page pageNumber={currentPage} />
            {renderAnnotations(currentPage)}
          </div>
        </Document>
      </div>
    </div>
  );
}
