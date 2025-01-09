"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  if (typeof Promise.withResolvers === "undefined") {
    // @ts-expect-error This does not exist outside of polyfill which this is doing
    Promise.withResolvers = function () {
      let resolve, reject;
      const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    };
  }
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/session", { method: "GET" });
        if (response.ok) {
          router.push("/upload");
        } else {
          router.push("/auth");
        }
      } catch {
        router.push("/auth");
      }
    };

    checkSession();
  }, [router]);

  return <div></div>;
}
