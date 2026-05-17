import { useEffect, useMemo, useState } from 'react';
import { formatIDR } from '../lib/format';

const typeIcons = { standard: 'STD', ev: 'EV', disabled: 'A11Y' };
const typeLabels = { standard: 'Standar', ev: 'EV charging', disabled: 'Difabel' };

function getSlotStyle(slot, isHovered) {
  const tones = {
    available: { color: '#00c896', label: 'Tersedia' },
    occupied: { color: '#ef4444', label: 'Terisi' },
    maintenance: { color: '#f59e0b', label: 'Perawatan' },
  };
  const tone = tones[slot.status] || tones.maintenance;
  return {
    tone,
    background: `color-mix(in srgb, ${tone.color} ${isHovered ? 18 : 10}%, transparent)`,
    border: `1.5px solid color-mix(in srgb, ${tone.color} ${isHovered ? 48 : 22}%, transparent)`,
    boxShadow: isHovered ? `0 10px 24px color-mix(in srgb, ${tone.color} 18%, transparent)` : 'none',
    transform: isHovered && slot.status === 'available' ? 'translateY(-2px) scale(1.01)' : 'translateY(0) scale(1)',
  };
}

function getColumnCount() {
  if (typeof window === 'undefined') return 4;
  if (window.innerWidth < 640) return 2;
  if (window.innerWidth < 1024) return 3;
  return 4;
}

export default function FloorMap({ slots = [], onReserve, selectedSlotId = null }) {
  const [activeFloor, setActiveFloor] = useState(null);
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const [columns, setColumns] = useState(getColumnCount);

  const floors = useMemo(() => {
    const groups = {};
    slots.forEach((slot) => {
      if (!groups[slot.floor]) groups[slot.floor] = [];
      groups[slot.floor].push(slot);
    });
    return groups;
  }, [slots]);

  const floorList = Object.keys(floors).sort();

  useEffect(() => {
    if (!floorList.length) {
      setActiveFloor(null);
      return;
    }

    const selected = selectedSlotId
      ? slots.find((slot) => slot.id === selectedSlotId)
      : null;

    if (selected?.floor && selected.floor !== activeFloor) {
      setActiveFloor(selected.floor);
      return;
    }

    if (!activeFloor || !floorList.includes(activeFloor)) {
      setActiveFloor(floorList[0]);
    }
  }, [activeFloor, floorList, selectedSlotId, slots]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const updateColumns = () => setColumns(getColumnCount());
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  const currentFloor = activeFloor || floorList[0];
  const floorSlots = floors[currentFloor] || [];
  const available = floorSlots.filter((slot) => slot.status === 'available').length;
  const occupied = floorSlots.filter((slot) => slot.status === 'occupied').length;
  const maintenance = floorSlots.filter((slot) => slot.status === 'maintenance').length;
  const slotPreview = hoveredSlot || (selectedSlotId ? slots.find((slot) => slot.id === selectedSlotId) : null);

  const rows = [];
  for (let index = 0; index < floorSlots.length; index += columns) {
    rows.push(floorSlots.slice(index, index + columns));
  }

  if (!floorList.length) {
    return (
      <div
        className="rounded-[26px] p-6 text-center"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}
      >
        Belum ada data denah slot untuk ditampilkan.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory">
        {floorList.map((floor) => {
          const floorAvailable = (floors[floor] || []).filter((slot) => slot.status === 'available').length;
          const isActive = floor === currentFloor;
          return (
            <button
              key={floor}
              type="button"
              onClick={() => setActiveFloor(floor)}
              className="px-4 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap transition-all shrink-0 snap-start"
              style={{
                background: isActive ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--surface)',
                color: isActive ? 'var(--accent)' : 'var(--text-dim)',
                border: `1px solid ${isActive ? 'color-mix(in srgb, var(--accent) 26%, transparent)' : 'var(--border)'}`,
              }}
            >
              Lantai {floor}
              <span className="ml-2 text-xs">{floorAvailable} kosong</span>
            </button>
          );
        })}
      </div>

      <div
        className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between rounded-[24px] p-4"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Denah lantai {currentFloor}
          </span>
          {[
            { label: 'Tersedia', value: available, color: 'var(--accent)' },
            { label: 'Terisi', value: occupied, color: 'var(--danger)' },
            { label: 'Perawatan', value: maintenance, color: 'var(--warn)' },
          ].map((item) => (
            <span
              key={item.label}
              className="text-xs px-2.5 py-1 rounded-full"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: item.color }}
            >
              {item.value} {item.label.toLowerCase()}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3 flex-wrap text-xs" style={{ color: 'var(--text-dim)' }}>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-md" style={{ background: 'color-mix(in srgb, var(--accent) 40%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 40%, transparent)' }} />
            Tersedia
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-md" style={{ background: 'color-mix(in srgb, var(--danger) 40%, transparent)', border: '1px solid color-mix(in srgb, var(--danger) 40%, transparent)' }} />
            Terisi
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-md" style={{ background: 'color-mix(in srgb, var(--warn) 40%, transparent)', border: '1px solid color-mix(in srgb, var(--warn) 40%, transparent)' }} />
            Perawatan
          </span>
        </div>
      </div>

      <div
        className="rounded-[28px] p-4 sm:p-5 md:p-6 overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, color-mix(in srgb, var(--card) 94%, transparent) 0%, color-mix(in srgb, var(--surface) 92%, transparent) 100%)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="flex justify-center mb-5">
          <div
            className="inline-flex items-center justify-center rounded-full px-5 py-2 text-xs font-medium text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}
          >
            Pintu masuk kendaraan
          </div>
        </div>

        <div
          className="mb-4 rounded-[22px] px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
          style={{
            minHeight: 76,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          {slotPreview ? (
            <>
              <div>
                <p className="text-sm font-semibold" style={{ color: getSlotStyle(slotPreview, false).tone.color }}>
                  {slotPreview.number} | {typeLabels[slotPreview.type] || 'Slot'}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                  {formatIDR(slotPreview.pricePerHour)}/jam | {getSlotStyle(slotPreview, false).tone.label}
                </p>
              </div>
              <p className="text-xs" style={{ color: slotPreview.status === 'available' ? 'var(--accent)' : 'var(--text-dim)' }}>
                {slotPreview.status === 'available'
                  ? 'Gunakan tombol reservasi di kartu slot.'
                  : 'Slot ini sedang tidak bisa dipesan.'}
              </p>
            </>
          ) : (
            <>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  Pilih slot untuk melihat detail singkat
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                  Informasi singkat slot akan tampil di sini tanpa menggeser posisi denah.
                </p>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                Pilih slot yang tersedia lalu lanjutkan reservasi dari kartu slot.
              </p>
            </>
          )}
        </div>

        <div className="space-y-4">
          {rows.map((row, rowIndex) => (
            <div key={`row-${rowIndex}`}>
              {rowIndex > 0 && rowIndex % 2 === 0 && (
                <div className="flex justify-center my-4">
                  <div
                    className="w-full max-w-md text-center rounded-2xl px-4 py-2 text-xs font-medium"
                    style={{ background: 'color-mix(in srgb, var(--muted) 8%, transparent)', border: '1px dashed var(--border)', color: 'var(--muted)' }}
                  >
                    Jalur kendaraan
                  </div>
                </div>
              )}

              <div className="grid gap-2.5 sm:gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
                {row.map((slot) => {
                  const isHovered = hoveredSlot?.id === slot.id;
                  const isSelected = selectedSlotId === slot.id;
                  const style = getSlotStyle(slot, isHovered);
                  const canReserve = slot.status === 'available';

                  return (
                    <div
                      key={slot.id}
                      onMouseEnter={() => setHoveredSlot(slot)}
                      onMouseLeave={() => setHoveredSlot(null)}
                      className="relative rounded-[24px] min-h-[172px] sm:min-h-[160px] px-3 py-3 transition-all"
                      style={{
                        background: style.background,
                        border: isSelected ? '1.5px solid color-mix(in srgb, var(--accent) 42%, transparent)' : style.border,
                        boxShadow: style.boxShadow,
                        transform: style.transform,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-semibold px-2 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: style.tone.color }}>
                          {typeIcons[slot.type] || 'STD'}
                        </span>
                        <span
                          className="text-[11px] px-2 py-1 rounded-full"
                          style={{ background: 'color-mix(in srgb, var(--surface) 85%, transparent)', color: style.tone.color, border: '1px solid color-mix(in srgb, var(--border) 90%, transparent)' }}
                        >
                          {style.tone.label}
                        </span>
                      </div>

                      <div className="mt-4 space-y-1 text-left">
                        <p className="font-mono text-xl sm:text-lg font-bold" style={{ color: style.tone.color }}>
                          {slot.number}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                          {typeLabels[slot.type] || 'Slot'}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>
                          {slot.lot?.name || 'Area parkir'}
                        </p>
                        <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                          {formatIDR(slot.pricePerHour)}/jam
                        </p>
                      </div>

                      <div className="mt-4">
                        {canReserve ? (
                          <button
                            type="button"
                            onClick={() => onReserve?.(slot)}
                            className="w-full rounded-xl px-3 py-2.5 text-xs font-semibold transition-all"
                            style={{
                              background: 'var(--accent)',
                              color: '#04121c',
                              boxShadow: '0 8px 18px color-mix(in srgb, var(--accent) 20%, transparent)',
                            }}
                          >
                            Reservasi
                          </button>
                        ) : (
                          <div
                            className="w-full rounded-xl px-3 py-2.5 text-xs font-semibold text-center"
                            style={{
                              background: 'color-mix(in srgb, var(--surface) 84%, transparent)',
                              color: style.tone.color,
                              border: '1px solid color-mix(in srgb, var(--border) 90%, transparent)',
                            }}
                          >
                            {slot.status === 'occupied' ? 'Sedang terisi' : 'Dalam perawatan'}
                          </div>
                        )}
                      </div>

                      {slot.status === 'occupied' && (
                        <div className="absolute inset-0 rounded-[24px] flex items-center justify-center pointer-events-none">
                          <span className="text-2xl font-bold opacity-15" style={{ color: 'var(--danger)' }}>
                            X
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {Array.from({ length: columns - row.length }).map((_, index) => (
                  <div key={`empty-${rowIndex}-${index}`} className="rounded-2xl min-h-[172px] sm:min-h-[160px]" style={{ background: 'var(--border)', opacity: 0.14 }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
