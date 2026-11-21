import React from 'react';
import { Sparkles, Flame, Zap, CheckCircle2, Target } from 'lucide-react';

/**
 * CardStatusBadge: Huy hiệu trạng thái thẻ học với hiệu ứng ánh kim (metallic shimmer),
 * viền phát sáng và animation nổi bật cho Thẻ mới, Chưa nhớ, Tạm hiểu, Đã thuộc.
 */
export default function CardStatusBadge({ prog, repCount }) {
  // Thẻ mới tinh (chưa từng ôn hoặc repCount === 0)
  const isNew = !prog || (!prog.lastReviewed && (!prog.reps || prog.reps === 0));

  if (isNew) {
    return (
      <span
        title="Thẻ mới chưa ôn lần nào"
        className="badge-gold-metallic inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black tracking-wide select-none cursor-default shadow-md hover:scale-105 active:scale-95 transition-transform"
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-900 animate-spin" style={{ animationDuration: '4s' }} />
        <span>Thẻ mới</span>
      </span>
    );
  }

  // Đã thuộc (Xanh lá / Ngọc lục bảo)
  if (prog?.status === 'green') {
    return (
      <span
        title={`Đã thuộc vững vàng (Hộp ${prog?.box || 1})`}
        className="badge-emerald-metallic inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide select-none cursor-default shadow-md hover:scale-105 transition-transform"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
        <span>Đã thuộc • {repCount > 0 ? `${repCount} lần` : 'Vững'}</span>
      </span>
    );
  }

  // Tạm hiểu (Vàng cam / Hoàng ngọc)
  if (prog?.status === 'yellow') {
    return (
      <span
        title={`Cần ôn thêm (Đã ôn ${repCount} lần)`}
        className="badge-amber-metallic inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide select-none cursor-default shadow-md hover:scale-105 transition-transform"
      >
        <Zap className="w-3.5 h-3.5 text-white fill-white" />
        <span>Tạm hiểu • Ôn {repCount} lần</span>
      </span>
    );
  }

  // Chưa nhớ (Đỏ hồng / Hồng ngọc)
  if (prog?.status === 'red') {
    return (
      <span
        title={`Cần ưu tiên ôn lại (Đã ôn ${repCount} lần)`}
        className="badge-ruby-metallic inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide select-none cursor-default shadow-md hover:scale-105 transition-transform"
      >
        <Flame className="w-3.5 h-3.5 text-white animate-bounce" style={{ animationDuration: '1.2s' }} />
        <span>Chưa nhớ • Ôn {repCount} lần</span>
      </span>
    );
  }

  // Mặc định nếu đã ôn nhưng chưa gán trạng thái cụ thể
  return (
    <span
      title={`Đã ôn ${repCount} lần`}
      className="badge-sky-metallic inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide select-none cursor-default shadow-md hover:scale-105 transition-transform"
    >
      <Target className="w-3.5 h-3.5 text-white" />
      <span>Ôn {repCount} lần</span>
    </span>
  );
}
