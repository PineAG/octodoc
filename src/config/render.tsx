import type { IFileRenderersConfig } from "@/lib/loadUtils";
import { MarkdownRenderer } from "@/lib/mdUtils";

export default {
    ".md": new MarkdownRenderer()
} satisfies IFileRenderersConfig
