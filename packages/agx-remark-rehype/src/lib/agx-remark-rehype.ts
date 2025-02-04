import type { Plugin, Processor } from 'unified';
import { unified } from 'unified';
import { Literal } from 'unist';
import { visit } from 'unist-util-visit';
import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import remarkFrontmatter from 'remark-frontmatter';
import remarkExtractFrontmatter from 'remark-extract-frontmatter';
import yaml from 'yaml';

type MarkdownTemplateTransform = (
  content: string,
  fileName: string
) => string | Promise<string>;

type PluginWithSettings<
  S extends any[] = [Record<string, any>?],
  P extends Plugin<S> = Plugin<S>
> = [P, ...S];

type PluginWithoutSettings<S extends any[] = any[]> = (...settings: S) => any;

export type UnifiedPlugins = Array<PluginWithSettings | PluginWithoutSettings>;

export interface RemarkRehypeOptions {
  remarkPlugins?: UnifiedPlugins;
  rehypePlugins?: UnifiedPlugins;
}

export const agxRemarkRehype =
  (options: RemarkRehypeOptions = {}): MarkdownTemplateTransform =>
  async (content: string) => {
    const processor = setupUnified(options);
    const mdContent = await processor.process(content);

    return fixDoubleEscape(String(mdContent));
  };

const fixDoubleEscape = (content: string) => {
  return content
    .replace(/&#x26;#64;/g, '&#64;')
    .replace(/&#x26;#x2774;/g, '&lbrace;')
    .replace(/&#x26;#x2775;/g, '&rbrace;');
};

const rehypeAnalog: Plugin = () => {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if ((node as any).tagName === 'p') {
        visit(node, 'text', (childNode) => {
          const literal = childNode as Literal;
          if (detectAngularControlFlow(literal.value as string)) {
            literal.type = 'raw';
          } else if (detectHTML(literal.value as string)) {
            (node as Literal).type = 'raw';
            (node as Literal).value = literal.value;
          } else {
            literal.value = escapeBreakingCharacters(literal.value as string);
          }
        });
      }

      if ((node as any).tagName === 'code') {
        visit(node, 'text', (childNode) => {
          const literal = childNode as Literal;
          literal.value = escapeBreakingCharacters(literal.value as string);
        });
      }

      if ((node as any).tagName === 'pre') {
        (node as any).properties.ngNonBindable = true;
      }
    });
  };
};

const escapeBreakingCharacters = (code: string) => {
  // Escape commonly used HTML characters
  // in Angular templates that cause template parse errors
  // such as @, {, and ,}.
  code = code.replace(/@/g, '&#64;');
  code = code.replace(/{/g, '&#x2774;').replace(/}/g, '&#x2775;');
  return code;
};

const detectAngularControlFlow = (text: string) => {
  return (
    (text.trim().startsWith('@if') ||
      text.trim().startsWith('@for') ||
      text.trim().startsWith('@switch') ||
      text.trim().startsWith('@defer')) &&
    text.trim().endsWith('}')
  );
};

const detectHTML = (text: string) => {
  return text.trim().startsWith('<') && text.trim().endsWith('/>');
};

const applyPlugins = (
  plugins: UnifiedPlugins,
  parser: Processor<any, any, any>
) => {
  plugins.forEach((plugin: any) => {
    if (Array.isArray(plugin)) {
      if (plugin[1] && plugin[1]) parser.use(plugin[0], plugin[1]);
      else parser.use(plugin[0]);
    } else {
      parser.use(plugin);
    }
  });

  return parser;
};

const setupUnified = (options: RemarkRehypeOptions) => {
  const toMDAST = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml'])
    .use(remarkExtractFrontmatter, { yaml: yaml.parse });
  applyPlugins(options.remarkPlugins || [], toMDAST);
  const toHAST = toMDAST.use(remarkRehype, { allowDangerousHtml: true });
  applyPlugins(options.rehypePlugins || [], toHAST);

  const processor = toHAST
    .use(rehypeStringify, {
      allowDangerousHtml: true,
    })
    .use(rehypeAnalog);

  return processor;
};
