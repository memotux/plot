import {h} from "vue";

// Converts the real DOM to virtual DOM (for client-side hydration).
export function toHyperScript(node) {
  if (node.nodeType === 3) return node.nodeValue; // TextNode
  const props = {};
  for (const name of node.getAttributeNames()) props[name] = node.getAttribute(name);
  const children = [];
  for (let child = node.firstChild; child; child = child.nextSibling) children.push(toHyperScript(child));
  return h(node.tagName, props, children);
}
