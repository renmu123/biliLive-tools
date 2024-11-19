// @ts-ignore
import font from "font-ls";

/**
 * 判断字符串是否全部为 ASCII 字符
 * @param str 要检查的字符串
 * @returns 如果字符串全部为 ASCII 字符，则返回 true；否则返回 false
 */
function isAscii(str: string): boolean {
  // eslint-disable-next-line no-control-regex
  return /^[\x00-\x7F]*$/.test(str);
}

export async function getFontsList(): Promise<
  {
    postscriptName: string;
    fullName: string;
  }[]
> {
  const fonts = await font.getAvailableFonts();
  return fonts.map((font) => {
    if (isAscii(font.postscriptName)) {
      return {
        postscriptName: font.postscriptName,
        fullName: font.localizedName,
      };
    } else {
      return {
        postscriptName: font.enName,
        fullName: font.postscriptName,
      };
    }
  });
}
