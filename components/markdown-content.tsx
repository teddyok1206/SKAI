"use client";

import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

interface MarkdownContentProps {
  content: string;
}

function normalizeMarkdown(content: string) {
  return content
    .replace(/\\\*\\\*/g, "**")
    .replace(/\\_\\_/g, "__")
    .replace(/\\\*(?=\S)/g, "*")
    .replace(/(\S)\\\*/g, "$1*");
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  const normalizedContent = normalizeMarkdown(content);

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          a: ({ children, href }) => (
            <a href={href} rel="noreferrer" target="_blank">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="markdown-table-wrap">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}
