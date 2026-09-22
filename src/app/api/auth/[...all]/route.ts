import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.toString();
  console.log(`📡 [BetterAuth GET] URL: ${url}`);
  try {
    const res = await auth.handler(request);
    console.log(`📡 [BetterAuth GET] Response Status: ${res.status}`);
    return res;
  } catch (err) {
    console.error(`❌ [BetterAuth GET Error]:`, err);
    throw err;
  }
}

export async function POST(request: NextRequest) {
  const url = request.nextUrl.toString();
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  console.log(`📡 [BetterAuth POST] URL: ${url} | Origin: ${origin} | Host: ${host}`);
  try {
    const res = await auth.handler(request);
    console.log(`📡 [BetterAuth POST] Response Status: ${res.status}`);
    return res;
  } catch (err) {
    console.error(`❌ [BetterAuth POST Error]:`, err);
    throw err;
  }
}

