var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/parse.ts
var SKIP_TAGS = /* @__PURE__ */ new Set([
  "script",
  "style",
  "noscript",
  "svg",
  "template",
  "iframe"
]);
var BLOCK_TAGS = /* @__PURE__ */ new Set([
  "p",
  "li",
  "div",
  "section",
  "article",
  "blockquote",
  "td",
  "th",
  "dd",
  "dt",
  "figcaption",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "main",
  "header",
  "footer",
  "nav",
  "aside",
  "br",
  "tr",
  "ul",
  "ol"
]);
var VOID_TAGS = /* @__PURE__ */ new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
]);
function normalizeWhitespace(s) {
  return s.replace(/\s+/g, " ").trim();
}
__name(normalizeWhitespace, "normalizeWhitespace");
function detectPlatform(html) {
  const h = html.toLowerCase();
  if (h.includes("wp-content") || h.includes("wp-includes")) return "wordpress";
  if (h.includes("wixstatic") || h.includes("wix.com")) return "wix";
  if (h.includes("squarespace")) return "squarespace";
  if (h.includes("<html")) return "custom";
  return "unknown";
}
__name(detectPlatform, "detectPlatform");
async function parseHtml(html) {
  const data = {
    title: null,
    metas: [],
    canonical: null,
    iconHrefs: [],
    htmlLang: null,
    jsonLdBlocks: [],
    headings: [],
    hasMain: false,
    hasHeader: false,
    hasFooter: false,
    hasNav: false,
    hasArticleOrSection: false,
    hasLists: false,
    imgTotal: 0,
    imgWithAlt: 0,
    telLinks: [],
    text: "",
    navText: "",
    footerText: "",
    textBlocks: [],
    htmlBytes: new TextEncoder().encode(html).byteLength,
    detectedPlatform: detectPlatform(html)
  };
  let skipDepth = 0;
  let navDepth = 0;
  let footerDepth = 0;
  let ldDepth = 0;
  let titleDepth = 0;
  let ldBuffer = "";
  let titleBuffer = "";
  let headingBuffer = null;
  const textParts = [];
  const navParts = [];
  const footerParts = [];
  let blockBuffer = "";
  const flushBlock = /* @__PURE__ */ __name(() => {
    const t = normalizeWhitespace(blockBuffer);
    if (t.length > 0) data.textBlocks.push(t);
    blockBuffer = "";
  }, "flushBlock");
  let endActions = [];
  const onEnd = /* @__PURE__ */ __name((fn) => {
    endActions.push(fn);
  }, "onEnd");
  const rewriter = new HTMLRewriter().on("*", {
    element(el) {
      const tag = el.tagName;
      endActions = [];
      if (BLOCK_TAGS.has(tag)) {
        flushBlock();
        onEnd(flushBlock);
      }
      switch (tag) {
        case "html": {
          const lang = el.getAttribute("lang");
          if (lang !== null && lang.trim() !== "") data.htmlLang = lang.trim();
          break;
        }
        case "title":
          titleDepth++;
          onEnd(() => {
            titleDepth--;
            if (data.title === null) data.title = normalizeWhitespace(titleBuffer);
            titleBuffer = "";
          });
          break;
        case "meta": {
          const name = el.getAttribute("name") ?? el.getAttribute("property");
          const content = el.getAttribute("content");
          if (name !== null && content !== null) {
            data.metas.push({ name: name.trim().toLowerCase(), content: content.trim() });
          }
          break;
        }
        case "link": {
          const rel = (el.getAttribute("rel") ?? "").toLowerCase();
          const href = el.getAttribute("href");
          if (!href) break;
          if (rel.split(/\s+/).includes("canonical") && data.canonical === null) {
            data.canonical = href.trim();
          }
          if (rel.includes("icon")) data.iconHrefs.push(href.trim());
          break;
        }
        case "a": {
          const href = el.getAttribute("href") ?? "";
          if (href.toLowerCase().startsWith("tel:")) data.telLinks.push(href.slice(4));
          break;
        }
        case "img": {
          data.imgTotal++;
          if (el.getAttribute("alt") !== null) data.imgWithAlt++;
          break;
        }
        case "main":
          data.hasMain = true;
          break;
        case "header":
          data.hasHeader = true;
          break;
        case "footer":
          data.hasFooter = true;
          footerDepth++;
          onEnd(() => {
            footerDepth--;
          });
          break;
        case "nav":
          data.hasNav = true;
          navDepth++;
          onEnd(() => {
            navDepth--;
          });
          break;
        case "article":
        case "section":
          data.hasArticleOrSection = true;
          break;
        case "ul":
        case "ol":
          data.hasLists = true;
          break;
        case "script": {
          const type = (el.getAttribute("type") ?? "").toLowerCase();
          if (type.includes("ld+json")) {
            ldDepth++;
            onEnd(() => {
              ldDepth--;
              const raw = ldBuffer.trim();
              if (raw) data.jsonLdBlocks.push(raw);
              ldBuffer = "";
            });
          }
          break;
        }
        default:
          break;
      }
      if (/^h[1-6]$/.test(tag)) {
        headingBuffer = { level: Number(tag.slice(1)), text: "" };
        onEnd(() => {
          if (headingBuffer) {
            data.headings.push({
              level: headingBuffer.level,
              text: normalizeWhitespace(headingBuffer.text)
            });
            headingBuffer = null;
          }
        });
      }
      if (SKIP_TAGS.has(tag)) {
        skipDepth++;
        onEnd(() => {
          skipDepth--;
        });
      }
      if (endActions.length > 0) {
        const actions = endActions;
        const runAll = /* @__PURE__ */ __name(() => {
          for (const fn of actions) fn();
        }, "runAll");
        if (VOID_TAGS.has(tag)) {
          runAll();
        } else {
          try {
            el.onEndTag(runAll);
          } catch {
            runAll();
          }
        }
      }
    },
    text(chunk) {
      const t = chunk.text;
      if (!t) return;
      if (ldDepth > 0) {
        ldBuffer += t;
        return;
      }
      if (skipDepth > 0) return;
      if (titleDepth > 0) {
        titleBuffer += t;
        return;
      }
      if (headingBuffer) headingBuffer.text += t;
      textParts.push(t);
      blockBuffer += t;
      if (navDepth > 0) navParts.push(t);
      if (footerDepth > 0) footerParts.push(t);
    }
  });
  await rewriter.transform(new Response(html)).arrayBuffer();
  flushBlock();
  data.text = normalizeWhitespace(textParts.join(" "));
  data.navText = normalizeWhitespace(navParts.join(" "));
  data.footerText = normalizeWhitespace(footerParts.join(" "));
  if (data.title !== null) data.title = normalizeWhitespace(data.title);
  return data;
}
__name(parseHtml, "parseHtml");
function mainText(page) {
  let text = page.text;
  for (const part of [page.navText, page.footerText]) {
    if (part.length > 0 && text.includes(part)) {
      text = text.replace(part, " ");
    }
  }
  return normalizeWhitespace(text);
}
__name(mainText, "mainText");
function countWords(text) {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}
__name(countWords, "countWords");
function getMeta(page, name) {
  const found = page.metas.find((m) => m.name === name.toLowerCase());
  return found ? found.content : null;
}
__name(getMeta, "getMeta");

// src/score.ts
function mkFinding(id, status, maxPoints, priority, data = {}, override) {
  let points = 0;
  if (override !== void 0) points = override;
  else if (status === "pass") points = maxPoints;
  else if (status === "warn") points = Math.floor(maxPoints / 2);
  return { id, status, priority, points, maxPoints, data };
}
__name(mkFinding, "mkFinding");
var CATEGORY_MAX = { A: 30, B: 25, C: 25, D: 20 };
function buildCategory(id, findings) {
  const score = findings.reduce((sum, f) => sum + f.points, 0);
  const measurable = findings.some((f) => f.status !== "error");
  return { id, score, max: CATEGORY_MAX[id], measurable, findings };
}
__name(buildCategory, "buildCategory");
function verdictFor(totalScore) {
  if (totalScore >= 85) return "strong";
  if (totalScore >= 60) return "gaps";
  if (totalScore >= 35) return "vulnerable";
  return "invisible";
}
__name(verdictFor, "verdictFor");
function totalScoreFor(categories) {
  const all = categories.flatMap((c) => c.findings);
  const earned = all.reduce((sum, f) => sum + f.points, 0);
  const measurableMax = all.filter((f) => f.status !== "error").reduce((sum, f) => sum + f.maxPoints, 0);
  if (measurableMax === 0) return 0;
  return Math.max(0, Math.min(100, Math.round(earned / measurableMax * 100)));
}
__name(totalScoreFor, "totalScoreFor");

// src/checks/aiReadability.ts
function readJsonLd(page) {
  const parsed = [];
  for (const raw of page.jsonLdBlocks) {
    try {
      parsed.push(JSON.parse(raw));
    } catch {
    }
  }
  const types = /* @__PURE__ */ new Set();
  const walk = /* @__PURE__ */ __name((node, depth = 0) => {
    if (depth > 12 || node === null || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item, depth + 1);
      return;
    }
    for (const [key, value] of Object.entries(node)) {
      if (key === "@type") {
        if (typeof value === "string") types.add(value);
        else if (Array.isArray(value)) {
          for (const v of value) if (typeof v === "string") types.add(v);
        }
      } else {
        walk(value, depth + 1);
      }
    }
  }, "walk");
  walk(parsed);
  return {
    parsed,
    blockCount: page.jsonLdBlocks.length,
    anyValid: parsed.length > 0,
    types: [...types]
  };
}
__name(readJsonLd, "readJsonLd");
function findNodesByType(ld, typeMatcher) {
  const out = [];
  const walk = /* @__PURE__ */ __name((node, depth = 0) => {
    if (depth > 12 || node === null || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item, depth + 1);
      return;
    }
    const obj = node;
    const t = obj["@type"];
    const list = typeof t === "string" ? [t] : Array.isArray(t) ? t : [];
    if (list.some((x) => typeof x === "string" && typeCoreMatches(x, typeMatcher))) {
      out.push(obj);
    }
    for (const value of Object.values(obj)) walk(value, depth + 1);
  }, "walk");
  walk(ld.parsed);
  return out;
}
__name(findNodesByType, "findNodesByType");
function typeCoreMatches(raw, matcher) {
  const short = raw.split("/").pop() ?? raw;
  return matcher(short);
}
__name(typeCoreMatches, "typeCoreMatches");
function parseRobots(body) {
  const groups = [];
  const sitemaps = [];
  let current = null;
  let lastLineWasAgent = false;
  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.split("#")[0].trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (field === "user-agent") {
      if (current && !lastLineWasAgent) current = null;
      if (!current) {
        current = { agents: [], disallow: [], allow: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastLineWasAgent = true;
      continue;
    }
    lastLineWasAgent = false;
    if (field === "sitemap") {
      sitemaps.push(value);
      continue;
    }
    if (!current) continue;
    if (field === "disallow") current.disallow.push(value);
    else if (field === "allow") current.allow.push(value);
  }
  return { groups, sitemaps };
}
__name(parseRobots, "parseRobots");
function isRootBlocked(robots, agent) {
  const target = agent.toLowerCase();
  const exact = robots.groups.filter((g) => g.agents.includes(target));
  const wildcard = robots.groups.filter((g) => g.agents.includes("*"));
  const applicable = exact.length > 0 ? exact : wildcard;
  if (applicable.length === 0) return false;
  const blocksRoot = applicable.some((g) => g.disallow.some((d) => d.trim() === "/"));
  const allowsRoot = applicable.some((g) => g.allow.some((a) => a.trim() === "/"));
  return blocksRoot && !allowsRoot;
}
__name(isRootBlocked, "isRootBlocked");
var AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
  "Bingbot"
];
function checkA1(ld) {
  if (ld.blockCount === 0) {
    return mkFinding("A1", "fail", 8, "kritisk", { blocks: 0 });
  }
  if (!ld.anyValid) {
    return mkFinding("A1", "warn", 8, "kritisk", { invalid: true, blocks: ld.blockCount });
  }
  return mkFinding("A1", "pass", 8, "kritisk", { blocks: ld.blockCount });
}
__name(checkA1, "checkA1");
var BUSINESS_TYPES = /(LocalBusiness|Organization|ProfessionalService|Business)$/i;
var WEAK_TYPES = ["website", "webpage", "breadcrumblist"];
function checkA2(ld, a1) {
  if (a1.status === "fail" || ld.types.length === 0) {
    return mkFinding("A2", "fail", 4, "vigtig", { types: ld.types });
  }
  const short = ld.types.map((t) => (t.split("/").pop() ?? t).trim());
  const hasBusiness = short.some((t) => BUSINESS_TYPES.test(t));
  if (hasBusiness) return mkFinding("A2", "pass", 4, "vigtig", { types: short });
  const onlyWeak = short.every((t) => WEAK_TYPES.includes(t.toLowerCase()));
  if (onlyWeak) return mkFinding("A2", "warn", 4, "vigtig", { types: short });
  return mkFinding("A2", "fail", 4, "vigtig", { types: short });
}
__name(checkA2, "checkA2");
function checkA3(robotsRes) {
  if (robotsRes.errored) {
    return mkFinding("A3", "error", 6, "kritisk", {});
  }
  if (!robotsRes.ok || !robotsRes.body) {
    return mkFinding("A3", "pass", 6, "kritisk", { blockedBots: [], robotsTxt: false });
  }
  const robots = parseRobots(robotsRes.body);
  const blockedBots = AI_BOTS.filter((bot) => isRootBlocked(robots, bot));
  const wildcardBlocked = robots.groups.some(
    (g) => g.agents.includes("*") && g.disallow.some((d) => d.trim() === "/") && !g.allow.some((a) => a.trim() === "/")
  );
  if (wildcardBlocked) {
    return mkFinding("A3", "fail", 6, "kritisk", {
      blockedBots: ["*", ...blockedBots],
      robotsTxt: true
    });
  }
  if (blockedBots.length >= 3) {
    return mkFinding("A3", "fail", 6, "kritisk", { blockedBots, robotsTxt: true });
  }
  if (blockedBots.length > 0) {
    return mkFinding("A3", "warn", 6, "kritisk", { blockedBots, robotsTxt: true });
  }
  return mkFinding("A3", "pass", 6, "kritisk", { blockedBots: [], robotsTxt: true });
}
__name(checkA3, "checkA3");
function checkA4(llms) {
  if (llms.errored) return mkFinding("A4", "error", 2, "forbedring", {});
  const isText = (llms.contentType ?? "").toLowerCase().includes("text/");
  const hasBody = (llms.body ?? "").trim().length > 0;
  const ok = llms.ok && isText && hasBody;
  return mkFinding("A4", ok ? "pass" : "fail", 2, "forbedring", { found: ok });
}
__name(checkA4, "checkA4");
function headingIssues(page) {
  const issues = [];
  const hs = page.headings;
  if (hs.length === 0) {
    issues.push("no-headings");
    return issues;
  }
  const h1count = hs.filter((h) => h.level === 1).length;
  if (h1count === 0) issues.push("no-h1");
  if (hs[0].level !== 1) issues.push("first-heading-not-h1");
  for (let i = 1; i < hs.length; i++) {
    if (hs[i].level > hs[i - 1].level + 1) {
      issues.push(`jump-h${hs[i - 1].level}-to-h${hs[i].level}`);
    }
  }
  return issues;
}
__name(headingIssues, "headingIssues");
function checkA5(page) {
  const issues = headingIssues(page);
  let points = 0;
  if (page.hasMain) points += 2;
  if (page.hasHeader && page.hasFooter) points += 1;
  if (issues.length === 0) points += 2;
  const status = points === 5 ? "pass" : points >= 2 ? "warn" : "fail";
  return mkFinding("A5", status, 5, "vigtig", {
    hasMain: page.hasMain,
    hasHeader: page.hasHeader,
    hasFooter: page.hasFooter,
    headingIssues: issues
  });
}
__name(checkA5, "checkA5");
function checkA6(page) {
  const text = mainText(page);
  const wordCount = countWords(text);
  const ratio = page.htmlBytes > 0 ? page.text.length / page.htmlBytes : 0;
  const rounded = Math.round(ratio * 1e3) / 1e3;
  let status;
  if (wordCount >= 250 && ratio >= 0.1) status = "pass";
  else if (wordCount < 100 || ratio < 0.05) status = "fail";
  else status = "warn";
  return mkFinding("A6", status, 5, status === "fail" ? "kritisk" : "vigtig", {
    wordCount,
    ratio: rounded
  });
}
__name(checkA6, "checkA6");
function runCategoryA(page, robots, llms) {
  const ld = readJsonLd(page);
  const a1 = checkA1(ld);
  return [a1, checkA2(ld, a1), checkA3(robots), checkA4(llms), checkA5(page), checkA6(page)];
}
__name(runCategoryA, "runCategoryA");

// src/checks/aiCitability.ts
var DK_PHONE = /(\+45[ ]?)?\b\d{2}[ ]?\d{2}[ ]?\d{2}[ ]?\d{2}\b/;
var DK_POSTCODE = /\b\d{4}\b[ ]+[A-Za-zÆØÅæøå]/;
function checkD1(page, ld) {
  const faqSchema = ld.types.some((t) => (t.split("/").pop() ?? t).toLowerCase() === "faqpage");
  const questionHeadings = page.headings.filter(
    (h) => (h.level === 2 || h.level === 3) && h.text.trim().endsWith("?")
  ).length;
  let status;
  if (faqSchema || questionHeadings >= 3) status = "pass";
  else if (questionHeadings >= 1) status = "warn";
  else status = "fail";
  return mkFinding("D1", status, 6, "vigtig", { faqSchema, questionHeadings });
}
__name(checkD1, "checkD1");
function checkD2(page, ld) {
  const hasPhone = page.telLinks.length > 0 || DK_PHONE.test(page.text);
  const addressNodes = findNodesByType(ld, (t) => t.toLowerCase() === "postaladdress");
  const hasLdAddress = addressNodes.length > 0 || ld.parsed.some((block) => JSON.stringify(block).includes('"address"'));
  const hasAddress = hasLdAddress || DK_POSTCODE.test(page.text);
  const points = (hasPhone ? 3 : 0) + (hasAddress ? 2 : 0);
  const status = points === 5 ? "pass" : points === 3 ? "warn" : "fail";
  return mkFinding("D2", status, 5, "vigtig", { phone: hasPhone, address: hasAddress });
}
__name(checkD2, "checkD2");
function checkD3(page) {
  const blocks = page.textBlocks;
  const citableBlocks = blocks.filter((b) => b.length >= 40 && b.length <= 350).length;
  const totalChars = blocks.reduce((sum, b) => sum + b.length, 0);
  const wallChars = blocks.filter((b) => b.length > 800).reduce((sum, b) => sum + b.length, 0);
  const wallDominant = totalChars > 0 && wallChars > totalChars * 0.5;
  let status;
  if (citableBlocks >= 3 && !wallDominant) status = page.hasLists ? "pass" : "warn";
  else status = "fail";
  return mkFinding("D3", status, 4, "forbedring", {
    citableBlocks,
    hasLists: page.hasLists
  });
}
__name(checkD3, "checkD3");
function checkD4(page) {
  const total = page.imgTotal;
  if (total === 0) return mkFinding("D4", "pass", 3, "forbedring", { pct: 100, total: 0 });
  const pct = Math.round(page.imgWithAlt / total * 100);
  const status = pct >= 80 ? "pass" : pct >= 50 ? "warn" : "fail";
  return mkFinding("D4", status, 3, "forbedring", { pct, total });
}
__name(checkD4, "checkD4");
function businessName(page, ld) {
  const businessNodes = findNodesByType(
    ld,
    (t) => /(LocalBusiness|Organization|ProfessionalService|Business)$/i.test(t)
  );
  for (const node of businessNodes) {
    if (typeof node.name === "string" && node.name.trim()) return node.name.trim();
  }
  const siteName = getMeta(page, "og:site_name");
  if (siteName && siteName.trim()) return siteName.trim();
  return null;
}
__name(businessName, "businessName");
function checkD5(page, ld) {
  const name = businessName(page, ld);
  if (!name) return mkFinding("D5", "fail", 2, "forbedring", { name: null });
  const needle = name.toLowerCase();
  const inTitle = (page.title ?? "").toLowerCase().includes(needle);
  const inFooter = page.footerText.toLowerCase().includes(needle);
  const hits = (inTitle ? 1 : 0) + (inFooter ? 1 : 0);
  const status = hits === 2 ? "pass" : hits === 1 ? "warn" : "fail";
  return mkFinding("D5", status, 2, "forbedring", { name, inTitle, inFooter });
}
__name(checkD5, "checkD5");
function runCategoryD(page) {
  const ld = readJsonLd(page);
  return [checkD1(page, ld), checkD2(page, ld), checkD3(page), checkD4(page), checkD5(page, ld)];
}
__name(runCategoryD, "runCategoryD");

// src/checks/googleFoundation.ts
function checkB1(page) {
  const text = page.title ?? "";
  const length = text.length;
  let status;
  if (length >= 30 && length <= 60) status = "pass";
  else if (length >= 15 && length <= 29 || length >= 61 && length <= 70) status = "warn";
  else status = "fail";
  return mkFinding("B1", status, 3, "vigtig", { length, text });
}
__name(checkB1, "checkB1");
function checkB2(page) {
  const desc = getMeta(page, "description");
  const length = desc ? desc.length : 0;
  let status;
  if (desc === null) status = "fail";
  else if (length >= 70 && length <= 160) status = "pass";
  else if (length >= 40 && length <= 69 || length >= 161 && length <= 200) status = "warn";
  else status = "fail";
  return mkFinding("B2", status, 3, "vigtig", { length, found: desc !== null });
}
__name(checkB2, "checkB2");
function checkB3(page, finalUrl) {
  if (!page.canonical) return mkFinding("B3", "fail", 3, "vigtig", { found: false });
  let canonicalUrl;
  try {
    canonicalUrl = new URL(page.canonical, finalUrl);
  } catch {
    return mkFinding("B3", "warn", 3, "vigtig", { found: true, valid: false });
  }
  const sameOrigin = canonicalUrl.origin === new URL(finalUrl).origin;
  return mkFinding("B3", sameOrigin ? "pass" : "warn", 3, "vigtig", {
    found: true,
    canonical: canonicalUrl.toString(),
    sameOrigin
  });
}
__name(checkB3, "checkB3");
function checkB4(page) {
  const count = page.headings.filter((h) => h.level === 1).length;
  const status = count === 1 ? "pass" : count === 2 ? "warn" : "fail";
  return mkFinding("B4", status, 2, "vigtig", { count });
}
__name(checkB4, "checkB4");
function checkB5(page) {
  const lang = page.htmlLang;
  if (!lang) return mkFinding("B5", "fail", 2, "forbedring", { lang: null });
  const status = lang.toLowerCase().startsWith("da") ? "pass" : "warn";
  return mkFinding("B5", status, 2, "forbedring", { lang });
}
__name(checkB5, "checkB5");
function checkB6(page) {
  const missing = [];
  for (const tag of ["og:title", "og:description", "og:image"]) {
    if (!getMeta(page, tag)) missing.push(tag);
  }
  const present = 3 - missing.length;
  const status = present === 3 ? "pass" : present >= 1 ? "warn" : "fail";
  return mkFinding("B6", status, 3, "forbedring", { missing });
}
__name(checkB6, "checkB6");
function checkB7(page) {
  const viewport = getMeta(page, "viewport") ?? "";
  const ok = viewport.toLowerCase().replace(/\s+/g, "").includes("width=device-width");
  return mkFinding("B7", ok ? "pass" : "fail", 2, "kritisk", { found: viewport !== "" });
}
__name(checkB7, "checkB7");
function checkB8(sitemap) {
  if (sitemap.errored) return mkFinding("B8", "error", 3, "vigtig", {});
  const body = sitemap.body ?? "";
  const looksXml = (sitemap.contentType ?? "").toLowerCase().includes("xml") || /<(urlset|sitemapindex)[\s>]/i.test(body);
  const ok = sitemap.ok && body.trim().length > 0 && looksXml;
  return mkFinding("B8", ok ? "pass" : "fail", 3, "vigtig", {
    found: ok,
    url: ok ? sitemap.url : null
  });
}
__name(checkB8, "checkB8");
function checkB9(httpsOk, httpProbe) {
  if (!httpsOk) {
    return mkFinding("B9", "fail", 2, "kritisk", { https: false, redirect: false });
  }
  if (httpProbe.errored || httpProbe.redirectsToHttps === null) {
    return mkFinding("B9", "error", 2, "kritisk", { https: true });
  }
  const status = httpProbe.redirectsToHttps ? "pass" : "warn";
  return mkFinding("B9", status, 2, "kritisk", {
    https: true,
    redirect: httpProbe.redirectsToHttps
  });
}
__name(checkB9, "checkB9");
function checkB10(page, favicon) {
  if (page.iconHrefs.length > 0) {
    return mkFinding("B10", "pass", 1, "forbedring", { source: "link" });
  }
  if (favicon.errored) return mkFinding("B10", "error", 1, "forbedring", {});
  return mkFinding("B10", favicon.ok ? "pass" : "fail", 1, "forbedring", {
    source: favicon.ok ? "favicon.ico" : null
  });
}
__name(checkB10, "checkB10");
function checkB11(robots) {
  if (robots.errored) return mkFinding("B11", "error", 1, "forbedring", {});
  const ok = robots.ok && (robots.body ?? "").trim().length > 0;
  return mkFinding("B11", ok ? "pass" : "fail", 1, "forbedring", { found: ok });
}
__name(checkB11, "checkB11");
function runCategoryB(page, finalUrl, robots, sitemap, favicon, httpsOk, httpProbe) {
  return [
    checkB1(page),
    checkB2(page),
    checkB3(page, finalUrl),
    checkB4(page),
    checkB5(page),
    checkB6(page),
    checkB7(page),
    checkB8(sitemap),
    checkB9(httpsOk, httpProbe),
    checkB10(page, favicon),
    checkB11(robots)
  ];
}
__name(runCategoryB, "runCategoryB");

// src/types.ts
var ScanError = class extends Error {
  constructor(code, detail) {
    super(code);
    this.code = code;
    this.detail = detail;
    this.name = "ScanError";
  }
  code;
  detail;
  static {
    __name(this, "ScanError");
  }
};

// src/fetchPage.ts
var USER_AGENT = "Mozilla/5.0 (compatible; ThordahlAI-Tjek/1.0; +https://thordahlstudio.dk/ai-tjek/)";
var PAGE_TIMEOUT_MS = 1e4;
var SUB_TIMEOUT_MS = 5e3;
var PSI_TIMEOUT_MS = 45e3;
var MAX_HTML_BYTES = 2 * 1024 * 1024;
var MAX_REDIRECTS = 5;
var BLOCKED_SUFFIXES = [".local", ".internal", ".test"];
var SELF_HOSTS = ["ai-tjek-api.thordahlstudio.dk"];
function ipv4ToLong(host) {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return null;
  const parts = m.slice(1).map((p) => Number(p));
  if (parts.some((p) => p > 255)) return null;
  return (parts[0] << 24 >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}
__name(ipv4ToLong, "ipv4ToLong");
function inRange(ip, cidrBase, bits) {
  const base = ipv4ToLong(cidrBase);
  if (base === null) return false;
  const mask = bits === 0 ? 0 : 4294967295 << 32 - bits >>> 0;
  return (ip & mask) >>> 0 === (base & mask) >>> 0;
}
__name(inRange, "inRange");
function isBlockedHost(rawHost, selfHost) {
  const host = rawHost.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "" || host === "localhost") return true;
  if (BLOCKED_SUFFIXES.some((s) => host.endsWith(s))) return true;
  if (SELF_HOSTS.includes(host)) return true;
  if (selfHost && host === selfHost.toLowerCase()) return true;
  const ip = ipv4ToLong(host);
  if (ip !== null) {
    if (inRange(ip, "127.0.0.0", 8) || inRange(ip, "10.0.0.0", 8) || inRange(ip, "172.16.0.0", 12) || inRange(ip, "192.168.0.0", 16) || inRange(ip, "169.254.0.0", 16) || host === "0.0.0.0") {
      return true;
    }
    return false;
  }
  if (host.includes(":")) {
    if (host === "::1" || host === "::") return true;
    const first = host.split(":")[0];
    if (/^f[cd][0-9a-f]{0,2}$/.test(first)) return true;
    if (/^fe[89ab][0-9a-f]?$/.test(first)) return true;
    return false;
  }
  if (!host.includes(".")) return true;
  return false;
}
__name(isBlockedHost, "isBlockedHost");
function normalizeUrl(input, selfHost) {
  const trimmed = (input ?? "").trim();
  if (!trimmed) throw new ScanError("INVALID_URL", "tom adresse");
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url;
  try {
    url = new URL(withScheme);
  } catch {
    throw new ScanError("INVALID_URL", "kunne ikke fortolkes som adresse");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ScanError("INVALID_URL", "kun http og https underst\xF8ttes");
  }
  if (url.port !== "" && url.port !== "80" && url.port !== "443") {
    throw new ScanError("PRIVATE_TARGET", "ikke-standard port");
  }
  url.hostname = url.hostname.toLowerCase();
  if (isBlockedHost(url.hostname, selfHost)) {
    throw new ScanError("PRIVATE_TARGET", "privat eller intern adresse");
  }
  return new URL(`${url.protocol}//${url.host}/`);
}
__name(normalizeUrl, "normalizeUrl");
function withTimeout(ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, done: /* @__PURE__ */ __name(() => clearTimeout(timer), "done") };
}
__name(withTimeout, "withTimeout");
function isAbort(err) {
  const name = err?.name ?? "";
  return name === "AbortError" || name === "TimeoutError";
}
__name(isAbort, "isAbort");
async function fetchHomepage(start, selfHost) {
  let current = new URL(start.toString());
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const { signal, done } = withTimeout(PAGE_TIMEOUT_MS);
    let res;
    try {
      res = await fetch(current.toString(), {
        method: "GET",
        redirect: "manual",
        signal,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "da,en;q=0.8"
        }
      });
    } catch (err) {
      done();
      if (isAbort(err)) throw new ScanError("TIMEOUT", "siden svarede ikke i tide");
      throw new ScanError("UNREACHABLE", String(err?.message ?? err));
    }
    done();
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new ScanError("UNREACHABLE", "redirect uden location");
      let next;
      try {
        next = new URL(location, current);
      } catch {
        throw new ScanError("UNREACHABLE", "ugyldig redirect-adresse");
      }
      if (next.protocol !== "http:" && next.protocol !== "https:") {
        throw new ScanError("PRIVATE_TARGET", "redirect til ikke-web-protokol");
      }
      if (isBlockedHost(next.hostname, selfHost) || next.port !== "" && next.port !== "80" && next.port !== "443") {
        throw new ScanError("PRIVATE_TARGET", "redirect til privat adresse");
      }
      current = next;
      continue;
    }
    if (res.status === 401 || res.status === 403 || res.headers.get("cf-mitigated")) {
      throw new ScanError("BLOCKED", `HTTP ${res.status}`);
    }
    if (res.status >= 400) {
      throw new ScanError("UNREACHABLE", `HTTP ${res.status}`);
    }
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.toLowerCase().includes("text/html")) {
      throw new ScanError("NOT_HTML", ct || "ukendt content-type");
    }
    const html = await readCapped(res, MAX_HTML_BYTES);
    if (looksLikeChallenge(html)) {
      throw new ScanError("BLOCKED", "bot-beskyttelse");
    }
    return { html, finalUrl: current.toString(), status: res.status };
  }
  throw new ScanError("UNREACHABLE", "for mange viderestillinger");
}
__name(fetchHomepage, "fetchHomepage");
function looksLikeChallenge(html) {
  const head = html.slice(0, 4e3).toLowerCase();
  return head.includes("cf-browser-verification") || head.includes("just a moment...") || head.includes("/cdn-cgi/challenge-platform");
}
__name(looksLikeChallenge, "looksLikeChallenge");
async function readCapped(res, maxBytes) {
  if (!res.body) return await res.text();
  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let out = "";
  let total = 0;
  try {
    for (; ; ) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total >= maxBytes) {
        const keep = value.subarray(0, Math.max(0, value.byteLength - (total - maxBytes)));
        out += decoder.decode(keep);
        break;
      }
      out += decoder.decode(value, { stream: true });
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
    }
  }
  return out;
}
__name(readCapped, "readCapped");
var EMPTY_SUB = {
  ok: false,
  status: null,
  contentType: null,
  body: null,
  errored: true,
  url: null
};
async function fetchSub(url, init = {}) {
  const { signal, done } = withTimeout(SUB_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      ...init,
      signal,
      headers: { "User-Agent": USER_AGENT, ...init.headers ?? {} }
    });
    const contentType = res.headers.get("content-type");
    const method = (init.method ?? "GET").toUpperCase();
    const body = method === "HEAD" ? null : await readCapped(res, 512 * 1024);
    return {
      ok: res.status === 200,
      status: res.status,
      contentType,
      body,
      errored: false,
      url
    };
  } catch (err) {
    console.error("sub-fetch failed", url, String(err?.message ?? err));
    return { ...EMPTY_SUB, url };
  } finally {
    done();
  }
}
__name(fetchSub, "fetchSub");
async function probeHttp(origin) {
  const httpUrl = origin.replace(/^https:/, "http:");
  const { signal, done } = withTimeout(SUB_TIMEOUT_MS);
  try {
    const res = await fetch(httpUrl, {
      method: "GET",
      redirect: "manual",
      signal,
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" }
    });
    let redirectsToHttps = false;
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location") ?? "";
      try {
        redirectsToHttps = new URL(loc, httpUrl).protocol === "https:";
      } catch {
        redirectsToHttps = false;
      }
    }
    return {
      ok: true,
      status: res.status,
      contentType: res.headers.get("content-type"),
      body: null,
      errored: false,
      url: httpUrl,
      redirectsToHttps
    };
  } catch (err) {
    console.error("http probe failed", String(err?.message ?? err));
    return { ...EMPTY_SUB, url: httpUrl, redirectsToHttps: null };
  } finally {
    done();
  }
}
__name(probeHttp, "probeHttp");

// src/checks/speed.ts
var PSI_UNAVAILABLE = {
  ok: false,
  performanceScore: null,
  lcpMs: null,
  lcpSource: null,
  cls: null,
  clsSource: null,
  inpMs: null,
  tbtMs: null,
  interactionSource: null,
  totalBytes: null
};
function num(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
__name(num, "num");
function parsePsi(json2) {
  const root = json2 ?? {};
  const lh = root.lighthouseResult ?? {};
  const audits = lh.audits ?? {};
  const fieldMetrics = root.loadingExperience?.metrics ?? {};
  const perfRaw = num(lh.categories?.performance?.score);
  const performanceScore = perfRaw === null ? null : Math.round(perfRaw * 100);
  const fieldLcp = num(fieldMetrics.LARGEST_CONTENTFUL_PAINT_MS?.percentile);
  const labLcp = num(audits["largest-contentful-paint"]?.numericValue);
  const fieldCls = num(fieldMetrics.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile);
  const labCls = num(audits["cumulative-layout-shift"]?.numericValue);
  const fieldInp = num(fieldMetrics.INTERACTION_TO_NEXT_PAINT?.percentile);
  const labTbt = num(audits["total-blocking-time"]?.numericValue);
  const lcpMs = fieldLcp ?? labLcp;
  const cls = fieldCls !== null ? fieldCls / 100 : labCls;
  const result = {
    ok: performanceScore !== null || lcpMs !== null,
    performanceScore,
    lcpMs: lcpMs === null ? null : Math.round(lcpMs),
    lcpSource: fieldLcp !== null ? "felt" : labLcp !== null ? "lab" : null,
    cls: cls === null ? null : Math.round(cls * 1e3) / 1e3,
    clsSource: fieldCls !== null ? "felt" : labCls !== null ? "lab" : null,
    inpMs: fieldInp === null ? null : Math.round(fieldInp),
    tbtMs: labTbt === null ? null : Math.round(labTbt),
    interactionSource: fieldInp !== null ? "felt" : labTbt !== null ? "lab" : null,
    totalBytes: num(audits["total-byte-weight"]?.numericValue)
  };
  return result;
}
__name(parsePsi, "parsePsi");
async function fetchPsi(targetUrl, apiKey) {
  if (!apiKey) {
    console.error("PSI_API_KEY missing \u2014 category C unmeasurable");
    return PSI_UNAVAILABLE;
  }
  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&strategy=mobile&category=performance&key=${encodeURIComponent(apiKey)}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    const { signal, done } = withTimeout(PSI_TIMEOUT_MS);
    try {
      const res = await fetch(endpoint, {
        signal,
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" }
      });
      if (res.status >= 500 && attempt === 0) {
        console.error("PSI 5xx, retrying once");
        continue;
      }
      if (!res.ok) {
        console.error("PSI failed", res.status);
        return PSI_UNAVAILABLE;
      }
      return parsePsi(await res.json());
    } catch (err) {
      console.error("PSI error", String(err?.message ?? err));
      return PSI_UNAVAILABLE;
    } finally {
      done();
    }
  }
  return PSI_UNAVAILABLE;
}
__name(fetchPsi, "fetchPsi");
function checkC1(psi) {
  const score = psi.performanceScore;
  if (!psi.ok || score === null) return mkFinding("C1", "error", 10, "kritisk", {});
  if (score >= 90) return mkFinding("C1", "pass", 10, "kritisk", { score });
  if (score >= 50) {
    const points2 = Math.round(4 + (score - 50) * 5 / 39);
    return mkFinding("C1", "warn", 10, "kritisk", { score }, points2);
  }
  const points = Math.round(score / 49 * 3);
  return mkFinding("C1", "fail", 10, "kritisk", { score }, points);
}
__name(checkC1, "checkC1");
function checkC2(psi) {
  if (!psi.ok || psi.lcpMs === null) return mkFinding("C2", "error", 6, "vigtig", {});
  const lcpMs = psi.lcpMs;
  const status = lcpMs <= 2500 ? "pass" : lcpMs <= 4e3 ? "warn" : "fail";
  return mkFinding("C2", status, 6, "vigtig", { lcpMs, source: psi.lcpSource });
}
__name(checkC2, "checkC2");
function checkC3(psi) {
  if (!psi.ok || psi.cls === null) return mkFinding("C3", "error", 4, "vigtig", {});
  const cls = psi.cls;
  const status = cls <= 0.1 ? "pass" : cls <= 0.25 ? "warn" : "fail";
  return mkFinding("C3", status, 4, "vigtig", { cls, source: psi.clsSource });
}
__name(checkC3, "checkC3");
function checkC4(psi) {
  const usesInp = psi.inpMs !== null;
  const ms = usesInp ? psi.inpMs : psi.tbtMs;
  if (!psi.ok || ms === null) return mkFinding("C4", "error", 3, "vigtig", {});
  const status = ms <= 200 ? "pass" : ms <= 500 ? "warn" : "fail";
  return mkFinding("C4", status, 3, "vigtig", {
    metric: usesInp ? "INP" : "TBT",
    ms,
    source: psi.interactionSource
  });
}
__name(checkC4, "checkC4");
function checkC5(psi) {
  if (!psi.ok || psi.totalBytes === null) return mkFinding("C5", "error", 2, "forbedring", {});
  const mb = Math.round(psi.totalBytes / (1024 * 1024) * 100) / 100;
  const status = mb <= 1.5 ? "pass" : mb <= 3 ? "warn" : "fail";
  return mkFinding("C5", status, 2, "forbedring", { mb });
}
__name(checkC5, "checkC5");
function runCategoryC(psi) {
  return [checkC1(psi), checkC2(psi), checkC3(psi), checkC4(psi), checkC5(psi)];
}
__name(runCategoryC, "runCategoryC");

// src/index.ts
var CACHE_TTL_SECONDS = 86400;
var RATE_HOURLY_MAX = 5;
var RATE_DAILY_MAX = 15;
function allowedOrigin(request, env) {
  const configured = env.ALLOWED_ORIGIN ?? "https://thordahlstudio.dk";
  const origin = request.headers.get("Origin");
  if (!origin) return configured;
  if (origin === configured) return origin;
  if (env.ENV === "dev" && /^http:\/\/localhost(:\d+)?$/.test(origin)) return origin;
  return configured;
}
__name(allowedOrigin, "allowedOrigin");
function corsHeaders(request, env) {
  return {
    "Access-Control-Allow-Origin": allowedOrigin(request, env) ?? "https://thordahlstudio.dk",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
}
__name(corsHeaders, "corsHeaders");
function json(body, status, request, env) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...corsHeaders(request, env)
    }
  });
}
__name(json, "json");
function errorResponse(code, detail, request, env) {
  const status = code === "RATE_LIMITED" ? 429 : code === "INTERNAL" ? 500 : 200;
  return json({ ok: false, error: code, ...detail ? { detail } : {} }, status, request, env);
}
__name(errorResponse, "errorResponse");
function rateKeys(ip, now) {
  const iso = now.toISOString();
  const day = iso.slice(0, 10).replace(/-/g, "");
  const hour = day + iso.slice(11, 13);
  return { hour: `rl:${ip}:${hour}`, day: `rl:${ip}:${day}` };
}
__name(rateKeys, "rateKeys");
async function isRateLimited(env, ip, now) {
  const keys = rateKeys(ip, now);
  const [hourly, daily] = await Promise.all([
    env.RATE_LIMIT.get(keys.hour),
    env.RATE_LIMIT.get(keys.day)
  ]);
  return Number(hourly ?? 0) >= RATE_HOURLY_MAX || Number(daily ?? 0) >= RATE_DAILY_MAX;
}
__name(isRateLimited, "isRateLimited");
async function bumpRateLimit(env, ip, now) {
  const keys = rateKeys(ip, now);
  const [hourly, daily] = await Promise.all([
    env.RATE_LIMIT.get(keys.hour),
    env.RATE_LIMIT.get(keys.day)
  ]);
  await Promise.all([
    env.RATE_LIMIT.put(keys.hour, String(Number(hourly ?? 0) + 1), { expirationTtl: 3600 }),
    env.RATE_LIMIT.put(keys.day, String(Number(daily ?? 0) + 1), { expirationTtl: 86400 })
  ]);
}
__name(bumpRateLimit, "bumpRateLimit");
async function fetchSitemap(origin, robots) {
  const direct = await fetchSub(`${origin}/sitemap.xml`);
  if (direct.ok && (direct.body ?? "").trim().length > 0) return direct;
  if (robots.ok && robots.body) {
    const fromRobots = parseRobots(robots.body).sitemaps[0];
    if (fromRobots) {
      try {
        const url = new URL(fromRobots, origin);
        if (url.protocol === "http:" || url.protocol === "https:") {
          return await fetchSub(url.toString());
        }
      } catch {
      }
    }
  }
  return direct;
}
__name(fetchSitemap, "fetchSitemap");
async function runScan(target, env, selfHost) {
  const psiPromise = fetchPsi(target.toString(), env.PSI_API_KEY);
  let page;
  try {
    page = await fetchHomepage(target, selfHost);
  } catch (err) {
    void psiPromise.catch(() => void 0);
    throw err;
  }
  const finalUrl = page.finalUrl;
  const finalOrigin = new URL(finalUrl).origin;
  const robots = await fetchSub(`${finalOrigin}/robots.txt`);
  const [llms, favicon, httpProbe, sitemap, pageData, psi] = await Promise.all([
    fetchSub(`${finalOrigin}/llms.txt`),
    fetchSub(`${finalOrigin}/favicon.ico`, { method: "HEAD" }),
    probeHttp(finalOrigin),
    fetchSitemap(finalOrigin, robots),
    parseHtml(page.html),
    psiPromise
  ]);
  const httpsOk = finalUrl.startsWith("https:");
  const categories = [
    buildCategory("A", runCategoryA(pageData, robots, llms)),
    buildCategory("B", runCategoryB(pageData, finalUrl, robots, sitemap, favicon, httpsOk, httpProbe)),
    buildCategory("C", runCategoryC(psi)),
    buildCategory("D", runCategoryD(pageData))
  ];
  const totalScore = totalScoreFor(categories);
  const result = {
    ok: true,
    scannedUrl: target.toString(),
    finalUrl,
    scannedAt: (/* @__PURE__ */ new Date()).toISOString(),
    cached: false,
    totalScore,
    verdictBand: verdictFor(totalScore),
    categories,
    meta: {
      titleText: pageData.title,
      detectedPlatform: pageData.detectedPlatform,
      psi: psi.ok ? {
        performanceScore: psi.performanceScore,
        lcpMs: psi.lcpMs,
        cls: psi.cls,
        inpMs: psi.inpMs,
        totalBytes: psi.totalBytes
      } : null
    }
  };
  return { result, finalOrigin, psi };
}
__name(runScan, "runScan");
async function handleScan(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_URL", "ugyldig JSON", request, env);
  }
  const input = body?.url;
  if (typeof input !== "string") {
    return errorResponse("INVALID_URL", "url mangler", request, env);
  }
  const selfHost = new URL(request.url).hostname;
  let target;
  try {
    target = normalizeUrl(input, selfHost);
  } catch (err) {
    const e = err;
    return errorResponse(e.code ?? "INVALID_URL", e.detail, request, env);
  }
  const cacheKey = `scan:${target.origin}`;
  const cachedRaw = await env.SCAN_CACHE.get(cacheKey);
  if (cachedRaw) {
    try {
      const cached = JSON.parse(cachedRaw);
      return json({ ...cached, cached: true }, 200, request, env);
    } catch {
      console.error("corrupt cache entry", cacheKey);
    }
  }
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const now = /* @__PURE__ */ new Date();
  if (await isRateLimited(env, ip, now)) {
    return errorResponse("RATE_LIMITED", void 0, request, env);
  }
  let scan;
  try {
    scan = await runScan(target, env, selfHost);
  } catch (err) {
    if (err instanceof ScanError) {
      return errorResponse(err.code, err.detail, request, env);
    }
    console.error("unexpected scan failure", String(err?.message ?? err));
    return errorResponse("INTERNAL", void 0, request, env);
  }
  const finalKey = `scan:${scan.finalOrigin}`;
  const payload = JSON.stringify(scan.result);
  const puts = [
    env.SCAN_CACHE.put(cacheKey, payload, { expirationTtl: CACHE_TTL_SECONDS })
  ];
  if (finalKey !== cacheKey) {
    puts.push(env.SCAN_CACHE.put(finalKey, payload, { expirationTtl: CACHE_TTL_SECONDS }));
  }
  await Promise.all(puts);
  await bumpRateLimit(env, ip, now);
  return json(scan.result, 200, request, env);
}
__name(handleScan, "handleScan");
var index_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }
    if (url.pathname === "/scan" && request.method === "POST") {
      try {
        return await handleScan(request, env);
      } catch (err) {
        console.error("unhandled error", String(err?.message ?? err));
        return errorResponse("INTERNAL", void 0, request, env);
      }
    }
    return json({ ok: false, error: "NOT_FOUND" }, 404, request, env);
  }
};
export {
  index_default as default,
  runScan
};
//# sourceMappingURL=index.js.map