import { configApi } from "@renderer/apis";
import showInput from "@renderer/components/showInput";

export type VerifyBiliKeyBlockedReason = "missing" | "mismatch" | "error" | "cancelled";

interface VerifyBiliKeyOptions {
  onBlocked?: (reason: VerifyBiliKeyBlockedReason) => void;
}

export async function verifyBiliKey(options?: VerifyBiliKeyOptions): Promise<boolean> {
  if (!window.isWeb) {
    return true;
  }

  const userInput = await showInput({
    title: "安全校验",
    placeholder: "请输入 BILILIVE_TOOLS_BILIKEY",
    type: "password",
    required: true,
    errorMessage: "请输入密钥",
  });

  if (typeof userInput !== "string") {
    options?.onBlocked?.("cancelled");
    return false;
  }

  const key = userInput.trim();
  if (!key) {
    options?.onBlocked?.("mismatch");
    return false;
  }

  try {
    const result = await configApi.verifyBiliKey(key);
    const reason = result?.reason;

    if (reason === "ok") {
      return true;
    }

    if (reason === "missing" || reason === "mismatch") {
      options?.onBlocked?.(reason);
      return false;
    }

    options?.onBlocked?.("error");
    return false;
  } catch {
    options?.onBlocked?.("error");
    return false;
  }
}