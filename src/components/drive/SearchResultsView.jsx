import React from 'react';
import { ArrowRight } from 'lucide-react';

function stripCloze(text) {
  return (text || '').replace(/\{\{c\d+::(.*?)\}\}/g, '$1');
}

export default function SearchResultsView({
  searchQuery,
  searchResults,
  onStartStudy,
}) {
  if (!searchQuery?.trim()) return null;

  return (
    <div className="glass-panel rounded-2xl p-4 space-y-3 shadow-md">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-sky-800">Kết quả tìm kiếm toàn cục</h2>
        <span className="text-xs text-slate-500 font-medium">{searchResults.length} thẻ phù hợp</span>
      </div>
      {searchResults.length === 0 ? (
        <p className="text-xs text-slate-500 py-3 text-center">
          Không tìm thấy thẻ nào khớp với "{searchQuery}".
        </p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {searchResults.slice(0, 35).map((item) => (
            <div
              key={`${item.deck.id}_${item.card.id}`}
              onClick={() =>
                onStartStudy({ title: item.deck.name, deckIds: [item.deck.id], filterMode: 'all' })
              }
              className="glass-card rounded-xl p-3 flex items-center justify-between gap-3 cursor-pointer hover:border-sky-300"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-sky-700 font-medium truncate">
                  {item.folderPathStr} › {item.deck.name}
                </p>
                <p className="text-sm text-slate-900 font-semibold mt-0.5 truncate">
                  {stripCloze(item.card.front)}
                </p>
                <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                  {stripCloze(item.card.back)}
                </p>
              </div>
              <span className="glass-pill px-2.5 py-1 rounded-lg text-xs font-semibold text-sky-700 shrink-0 flex items-center gap-1">
                <span>Học bài này</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
