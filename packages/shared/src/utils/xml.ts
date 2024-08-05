import libxmljs from "libxmljs";

import type { XMLElement } from "libxmljs";

/**
 * 将json转换为xml
 * @param data json数据
 * @param rootName 根节点名称
 */
function _xml2json(node: XMLElement, arrayNodeNames = []) {
  const data: Record<string, any> = {};
  const nodeType = node.type();

  if (nodeType === "element") {
    let hasChildElements = false;
    const attrs = node.attrs();
    const childNodes = node.childNodes();

    for (let i = 0; i < attrs.length; i++) {
      const attr = attrs[i];
      data[`@_${attr.name()}`] = attr.value();
    }

    for (let i = 0; i < childNodes.length; i++) {
      const child = childNodes[i];
      const childType = child.type();
      const childName = child.name();

      if (childType === "element") {
        hasChildElements = true;
        const childData = _xml2json(child, arrayNodeNames);

        if (data[childName]) {
          if (Array.isArray(data[childName])) {
            data[childName].push(childData);
          } else {
            data[childName] = [data[childName], childData];
          }
        } else {
          if (arrayNodeNames.includes(childName)) {
            data[childName] = [childData];
          } else {
            data[childName] = childData;
          }
        }
      } else if (childType === "text") {
        if (!hasChildElements) {
          data["#text"] = (data["#text"] || "") + child.text();
        }
      }
    }

    // 如果没有属性和子节点，将文本内容作为值返回
    if (attrs.length === 0 && childNodes.length === 0) {
      return node.text();
    }
  } else if (nodeType === "text") {
    return node.text();
  }

  return data;
}

/**
 * 将xml转换为json
 * @param xmlContent xml内容
 * @param arrayNodeNames 需要始终解析为数组的节点名称列表
 */
export function xml2json(xmlContent: string, arrayNodeNames: string[] = []) {
  const xmlDoc = libxmljs.parseXml(xmlContent);
  const root = xmlDoc.root();
  const data = { [root.name()]: _xml2json(root, arrayNodeNames) };
  return data;
}
