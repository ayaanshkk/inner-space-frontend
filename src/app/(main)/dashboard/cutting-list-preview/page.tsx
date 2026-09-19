'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Printer, RotateCcw, ArrowLeft, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CLItem {
  id:          string;
  name:        string;
  unit_label?: string;
  unit_index?: number;
  dimension_l: number;
  dimension_w: number;
  quantity:    number;
}

interface CLSection { category: string; items: CLItem[]; }

interface CLData {
  cabinet_type:     string;
  project_name:     string;
  customer_name:    string;
  address:          string;
  fitting_date:     string;
  outside_wood:     string;
  carcase_wood:     string;
  door_wood:        string;
  date:             string;
  sections:         CLSection[];
  accessories:      { name: string; qty: number }[];
  material_summary: { estimated_sheets_18mm: number; estimated_sheets_6mm: number; estimated_sheets_8mm: number; };
  units_info?: Array<{ index: number; label: string; type: string; height: number|string; width: number|string; depth: number|string; }>;
}

interface HeaderFields {
  customer_name: string; address: string; kitchen: string; modular: string;
  sliding: string; fitting_date: string; outside_wood: string;
  carcase_wood: string; door_wood: string; readymade: string; date: string;
}

interface AccFields {
  spegs: string; hinges: string; legs: string; handles: string; softclose: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTIONS_LEFT  = ['GABLE', 'S/H', 'BACKS', 'END PANELS & INFILLS'];
const SECTIONS_RIGHT = ['T/B & FIX SHELVES', 'DRAWS', 'BRACES', 'DOORS & DRAW FACES'];
const ALL_SECTIONS   = [...SECTIONS_LEFT, ...SECTIONS_RIGHT];
export const STORAGE_KEY = 'cutting_list_preview_data';
const MIN_ROWS = 3;

let _id = 0;
const uid = () => `r${Date.now()}${_id++}`;
const makeEmpty = (): CLItem => ({ id: uid(), name: '', dimension_l: 0, dimension_w: 0, quantity: 0 });

function padSection(items: CLItem[]): CLItem[] {
  const r = [...items];
  while (r.length < MIN_ROWS) r.push(makeEmpty());
  return r;
}

function stripUnitPrefix(name: string): string {
  // Remove "[Unit Label] " prefix e.g. "[Kitchen Base] Gable" -> "Gable"
  if (name.startsWith('[')) {
    const end = name.indexOf('] ');
    if (end !== -1) return name.slice(end + 2);
  }
  return name;
}

function buildMap(sections: CLSection[]): Record<string, CLItem[]> {
  const m: Record<string, CLItem[]> = {};
  ALL_SECTIONS.forEach(s => { m[s] = []; });
  sections.forEach(s => {
    m[s.category] = (s.items || []).map(i => ({
      ...i,
      id:         uid(),
      name:       stripUnitPrefix(i.name ?? ''),
      unit_label: i.unit_label ?? '',
      unit_index: i.unit_index ?? 0,
    }));
  });
  ALL_SECTIONS.forEach(s => { m[s] = padSection(m[s]); });
  return m;
}

function accFromData(data: CLData): AccFields {
  const m: Record<string, number> = {};
  (data.accessories || []).forEach(a => { m[a.name] = a.qty; });
  return {
    spegs:     String(m['Shelf Pegs Plastic'] || m['Shelf Pegs Metal Hafele 282.24.710'] || ''),
    hinges:    String(m['Overlay Splung'] || m['Hinge - Overlay Sprung'] || ''),
    legs:      String(m['Legs 150'] || m['Legs 100'] || ''),
    handles:   String(m['sample'] || ''),
    softclose: String(m['Overlay Softclose'] || ''),
  };
}

function headerFromData(data: CLData): HeaderFields {
  return {
    customer_name: data.customer_name || '',
    address:       data.address       || '',
    kitchen:       data.cabinet_type  || '',
    modular:       data.project_name  || '',
    sliding:       '',
    fitting_date:  data.fitting_date  || '',
    outside_wood:  data.outside_wood  || '',
    carcase_wood:  data.carcase_wood  || '',
    door_wood:     data.door_wood     || '',
    readymade:     '',
    date:          data.date || new Date().toLocaleDateString('en-GB'),
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function HField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-[130px_1fr] border-b border-gray-100 last:border-0">
      <div className="bg-gray-50 font-semibold text-[9px] uppercase tracking-wide text-gray-500 px-3 py-2.5 border-r border-gray-100 flex items-center">
        {label}
      </div>
      <input
        className="px-2 py-2.5 text-sm bg-transparent focus:outline-none focus:bg-yellow-50 focus:ring-1 focus:ring-inset focus:ring-blue-400"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="—"
      />
    </div>
  );
}

function CLRow({ item, lineNum, onChange, onDelete }: {
  item: CLItem; lineNum: number;
  onChange: (id: string, f: keyof CLItem, v: any) => void;
  onDelete: (id: string) => void;
}) {
  const n = (v: any) => (v === 0 ? '' : String(v));
  const inp = 'bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:bg-yellow-50 rounded text-[13px] font-mono text-center';
  return (
    <div className="group flex items-stretch border-b border-gray-100 last:border-0 hover:bg-gray-50/40 min-h-[36px]">
      <div className="w-8 shrink-0 text-[10px] text-gray-400 font-bold border-r border-gray-100 flex items-center justify-center bg-gray-50/60">{lineNum}</div>
      <div className="w-[200px] shrink-0 border-r border-gray-100 flex items-center gap-1 px-1">
        {item.unit_label && (
          <span className="text-[8px] bg-slate-100 text-slate-600 rounded px-1 py-0.5 shrink-0 font-medium whitespace-nowrap">
            {item.unit_index}
          </span>
        )}
        <input className="flex-1 min-w-0 text-[12px] text-gray-700 bg-transparent focus:outline-none focus:bg-yellow-50 px-1" value={item.name} onChange={e => onChange(item.id,'name',e.target.value)} placeholder="panel" title={item.unit_label} />
      </div>
      <div className="flex items-center gap-1 px-2 flex-1">
        <input type="number" className={`w-[62px] ${inp}`} value={n(item.dimension_l)} onChange={e => onChange(item.id,'dimension_l',parseFloat(e.target.value)||0)} placeholder="L" />
        <span className="text-gray-400 font-bold text-[13px]">×</span>
        <input type="number" className={`w-[62px] ${inp}`} value={n(item.dimension_w)} onChange={e => onChange(item.id,'dimension_w',parseFloat(e.target.value)||0)} placeholder="W" />
        <span className="text-gray-400 font-bold text-[13px]">=</span>
        <input type="number" className={`w-[40px] ${inp}`} value={n(item.quantity)} onChange={e => onChange(item.id,'quantity',parseInt(e.target.value)||0)} placeholder="qty" />
      </div>
      <button className="no-print opacity-0 group-hover:opacity-100 px-1.5 text-gray-300 hover:text-red-400 transition shrink-0" onClick={() => onDelete(item.id)}>
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

function SectionBlock({ name, items, startLine, onChangeRow, onDeleteRow, onAddRow }: {
  name: string; items: CLItem[]; startLine: number;
  onChangeRow: (id: string, f: keyof CLItem, v: any) => void;
  onDeleteRow: (id: string) => void;
  onAddRow:    (s: string) => void;
}) {
  return (
    <div className="flex border-b border-gray-200 last:border-0" style={{ minHeight: 90 }}>
      <div className="shrink-0 flex items-center justify-center font-bold text-[9px] tracking-widest uppercase text-white border-r border-gray-200"
        style={{ writingMode:'vertical-rl', transform:'rotate(180deg)', background:'#1e3a5f', minWidth:28, padding:'10px 5px', fontSize:'10px', letterSpacing:'1.5px' }}>
        {name}
      </div>
      <div className="flex-1 flex flex-col">
        {items.map((item, idx) => (
          <CLRow key={item.id} item={item} lineNum={startLine + idx} onChange={onChangeRow} onDelete={onDeleteRow} />
        ))}
        <button className="no-print text-[10px] text-blue-400 hover:text-blue-600 hover:bg-blue-50 text-left px-3 py-1 transition" onClick={() => onAddRow(name)}>
          + add row
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CuttingListPreviewPage() {
  const router = useRouter();
  const [orig, setOrig]         = useState<CLData | null>(null);
  const [header, setHeader]     = useState<HeaderFields | null>(null);
  const [secs, setSecs]         = useState<Record<string, CLItem[]>>({});
  const [acc, setAcc]           = useState<AccFields>({ spegs:'', hinges:'', legs:'', handles:'', softclose:'' });
  const [mat, setMat]           = useState<CLData['material_summary'] | null>(null);
  const [unitsInfo, setUnitsInfo] = useState<CLData['units_info']>([]);
  const [loaded, setLoaded]     = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) { toast.error('No cutting list data — calculate a cabinet first.'); return; }
    try {
      const data: CLData = JSON.parse(raw);
      setOrig(data);
      setHeader(headerFromData(data));
      setSecs(buildMap(data.sections));
      setAcc(accFromData(data));
      setMat(data.material_summary || null);
      setUnitsInfo(data.units_info || []);
      setLoaded(true);
    } catch { toast.error('Failed to load cutting list data.'); }
  }, []);

  const changeRow = (id: string, f: keyof CLItem, v: any) => {
    setSecs(prev => {
      const next = { ...prev };
      for (const s of ALL_SECTIONS) {
        const i = next[s].findIndex(r => r.id === id);
        if (i !== -1) { const rows = [...next[s]]; rows[i] = { ...rows[i], [f]: v }; next[s] = rows; break; }
      }
      return next;
    });
  };

  const deleteRow = (id: string) => {
    setSecs(prev => {
      const next = { ...prev };
      for (const s of ALL_SECTIONS) {
        if (next[s].some(r => r.id === id)) { next[s] = next[s].filter(r => r.id !== id); break; }
      }
      return next;
    });
  };

  const addRow = (section: string) => {
    setSecs(prev => ({ ...prev, [section]: [...(prev[section] || []), makeEmpty()] }));
  };

  const reset = () => {
    if (!orig) return;
    setHeader(headerFromData(orig));
    setSecs(buildMap(orig.sections));
    setAcc(accFromData(orig));
    toast.success('Reset to original values');
  };

  // Line numbers
  const lineStarts: Record<string, number> = {};
  let c = 1;
  ALL_SECTIONS.forEach(s => { lineStarts[s] = c; c += (secs[s]?.length || 0); });

  // Summary
  const summaryText = (() => {
    if (!mat) return '';
    const t18 = mat.estimated_sheets_18mm || 0;
    const t6  = mat.estimated_sheets_6mm  || 0;
    const t8  = mat.estimated_sheets_8mm  || 0;
    const total = t18 + t6 + t8;
    const parts = [];
    if (t18) parts.push(`${t18} × 18mm`);
    if (t8)  parts.push(`${t8} × 8mm`);
    if (t6)  parts.push(`${t6} × 6mm`);
    return total ? `${total} Sheets total  (${parts.join('   ')})` : '';
  })();

  if (!loaded) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-gray-500">
      <FileText className="h-12 w-12 text-gray-300" />
      <p className="text-lg font-medium">No cutting list data</p>
      <p className="text-sm">Calculate a cabinet first, then click Export Sheet.</p>
      <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Go back</Button>
    </div>
  );

  const inp = 'bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:bg-yellow-50 rounded';

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 6mm 5mm; }

          /* Hide sidebar, navbar, toolbars — but keep page content visible */
          .no-print { display: none !important; }
          nav { display: none !important; }
          aside { display: none !important; }
          [data-sidebar] { display: none !important; }
          [role="navigation"] { display: none !important; }

          /* Clean inputs and editable fields */
          input {
            border: none !important;
            background: transparent !important;
            outline: none !important;
          }
          [contenteditable] {
            border: none !important;
            background: transparent !important;
            outline: none !important;
          }

          /* Preserve background colours (section labels etc.) */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .shadow-sm { box-shadow: none !important; }

          /* Remove page padding so content fills the sheet */
          .print-content { padding: 0 !important; }
        }
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      <div id="print-target" className="w-full p-6 space-y-4 print-content">

        {/* Page header */}
        <div className="flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{header?.modular || 'Cutting List'}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{header?.kitchen} · Click any value to edit · Print / Export PDF when ready</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={reset}><RotateCcw className="mr-1.5 h-3.5 w-3.5" />Reset</Button>
            <Button size="sm" onClick={() => window.print()} className="bg-green-600 hover:bg-green-700 text-white">
              <Printer className="mr-1.5 h-3.5 w-3.5" />Print / Export PDF
            </Button>
          </div>
        </div>

        {/* Dimensions strip */}
        {unitsInfo && unitsInfo.length > 0 && (
          <div className="bg-slate-50 border border-gray-200 rounded-lg px-5 py-4 flex flex-wrap gap-6 no-print mb-3">
            {unitsInfo.map((u, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-slate-800 text-white text-sm flex items-center justify-center font-bold shrink-0">{u.index}</span>
                <span className="font-bold text-gray-900 text-base">{u.label}</span>
                <span className="text-gray-400">·</span>
                <span className="font-mono text-base font-semibold text-gray-700 bg-white border border-gray-200 rounded px-3 py-1">
                  H {u.height} × W {u.width}{u.depth ? ` × D ${u.depth}` : ''} mm
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Also show in print version as a clean header line */}
        {unitsInfo && unitsInfo.length > 0 && (
          <div className="hidden print:block text-[9px] text-gray-500 mb-2 border-b pb-1">
            {unitsInfo.map((u, i) => (
              <span key={i} className="mr-4">
                {u.index}. {u.label} — H{u.height}×W{u.width}{u.depth ? `×D${u.depth}` : ''}
              </span>
            ))}
          </div>
        )}

        {/* Main card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden text-xs" style={{ zoom: 1.35 }}>

          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_130px] border-b border-gray-200">
            <div className="divide-y divide-gray-100 border-r border-gray-200">
              {header && (['CUSTOMER NAME','address','HOME ADDRESS','address','KITCHEN','kitchen','MODULAR','modular','SLIDING','sliding'] as any) &&
                ([['CUSTOMER NAME','customer_name'],['HOME ADDRESS','address'],['KITCHEN','kitchen'],['MODULAR','modular'],['SLIDING','sliding']] as [string,keyof HeaderFields][])
                  .map(([lbl,key]) => <HField key={key} label={lbl} value={header[key]} onChange={v => setHeader(h => h ? {...h,[key]:v} : h)} />)
              }
            </div>
            <div className="divide-y divide-gray-100 border-r border-gray-200">
              {header &&
                ([['FITTING DATE','fitting_date'],['OUTSIDE WOOD','outside_wood'],['CARCASE WOOD','carcase_wood'],['DOOR WOOD','door_wood'],['READYMADE DOOR','readymade']] as [string,keyof HeaderFields][])
                  .map(([lbl,key]) => <HField key={key} label={lbl} value={header[key]} onChange={v => setHeader(h => h ? {...h,[key]:v} : h)} />)
              }
            </div>
            <div className="flex flex-col items-center justify-center bg-gray-50 p-3 text-center">
              <div className="text-[9px] font-semibold uppercase tracking-wide text-gray-500">DATE</div>
              <input className={`font-bold text-base mt-1 text-center w-full ${inp}`} value={header?.date||''} onChange={e => setHeader(h => h ? {...h,date:e.target.value} : h)} />
            </div>
          </div>

          {/* Cutting list */}
          <div className="grid grid-cols-2 border-b border-gray-200">
            <div className="border-r border-gray-200">
              {SECTIONS_LEFT.map(s => <SectionBlock key={s} name={s} items={secs[s]||[]} startLine={lineStarts[s]} onChangeRow={changeRow} onDeleteRow={deleteRow} onAddRow={addRow} />)}
            </div>
            <div>
              {SECTIONS_RIGHT.map(s => <SectionBlock key={s} name={s} items={secs[s]||[]} startLine={lineStarts[s]} onChangeRow={changeRow} onDeleteRow={deleteRow} onAddRow={addRow} />)}
            </div>
          </div>

          {/* Summary */}
          {summaryText && <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700">{summaryText}</div>}

          {/* Accessories */}
          <div className="grid grid-cols-5 text-xs">
            {([['S/Pegs','spegs'],['Hinges','hinges'],['Legs pack','legs'],['Handles','handles'],['Soft Close','softclose']] as [string,keyof AccFields][]).map(([lbl,key],i) => (
              <div key={key} className={`flex flex-col items-center justify-center py-3 px-2 text-center ${i<4?'border-r border-gray-200':''}`}>
                <div className="font-semibold text-gray-500 uppercase tracking-wide text-[9px] mb-1.5">{lbl}</div>
                <input className={`font-bold text-sm text-gray-800 w-12 text-center border-b border-gray-300 ${inp}`} value={acc[key]} onChange={e => setAcc(a => ({...a,[key]:e.target.value}))} />
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}