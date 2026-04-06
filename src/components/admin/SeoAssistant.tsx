import { useMemo } from 'react';
import { analyzeSeo, generateKeywords } from '@/lib/seoScore';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Copy, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface SeoAssistantProps {
  title: string;
  content: string;
  primaryKeyword: string;
  onKeywordSelect: (keyword: string) => void;
}

export function SeoAssistant({ title, content, primaryKeyword, onKeywordSelect }: SeoAssistantProps) {
  const analysis = useMemo(() => analyzeSeo(title, content, primaryKeyword), [title, content, primaryKeyword]);
  const keywords = useMemo(() => generateKeywords(title), [title]);

  const scoreColor = analysis.score >= 70 ? 'text-emerald-500' : analysis.score >= 40 ? 'text-amber-500' : 'text-destructive';

  const copyKeyword = (kw: string) => {
    navigator.clipboard.writeText(kw);
    toast.success('Keyword copied!');
  };

  return (
    <div className="space-y-4 rounded-lg border border-border p-4 bg-muted/20">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          SEO Assistant
        </h3>
        <div className={`text-2xl font-bold ${scoreColor}`}>
          {analysis.score}<span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <MetricItem label="Word Count" value={`${analysis.wordCount}`} ok={analysis.wordCount >= 800} />
        <MetricItem label="Headings" value={`${analysis.headingCount}`} ok={analysis.headingCount >= 2} />
        <MetricItem label="Keyword in Title" value={analysis.keywordInTitle ? 'Yes' : 'No'} ok={analysis.keywordInTitle} />
        <MetricItem label="Keyword in Intro" value={analysis.keywordInFirstPara ? 'Yes' : 'No'} ok={analysis.keywordInFirstPara} />
        <MetricItem label="Keyword Uses" value={`${analysis.keywordCount}`} ok={analysis.keywordCount >= 2} />
      </div>

      {/* Suggestions */}
      {analysis.suggestions.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Suggestions:</p>
          {analysis.suggestions.map((s, i) => (
            <p key={i} className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1">
              <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
              {s}
            </p>
          ))}
        </div>
      )}

      {/* Keywords */}
      {title.length > 5 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Suggested Keywords:</p>
          <div
            className="cursor-pointer"
            onClick={() => onKeywordSelect(keywords.primary)}
          >
            <Badge variant="default" className="text-xs gap-1">
              ★ {keywords.primary}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-1">
            {keywords.related.map((kw, i) => (
              <Badge
                key={i}
                variant="outline"
                className="text-xs cursor-pointer hover:bg-muted gap-1"
                onClick={() => copyKeyword(kw)}
              >
                {kw}
                <Copy className="w-2.5 h-2.5" />
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricItem({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between rounded bg-background px-2 py-1.5 border border-border/50">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium flex items-center gap-1 ${ok ? 'text-emerald-500' : 'text-amber-500'}`}>
        {value}
        {ok ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
      </span>
    </div>
  );
}
