'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Calculator, Ruler, Save, Download, Trash2,
  FileText, Package, ChevronDown, ChevronRight,
  Layers, DoorOpen, PoundSterling, Hammer, Plus,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

type CabinetType = 'base' | 'wall' | 'larder' | 'bedroom';
type KitchenUnitType = 'base' | 'wall' | 'larder' | 'l_corner';

const KITCHEN_UNIT_LABELS: Record<KitchenUnitType, string> = {
  base: 'Kitchen Base', wall: 'Kitchen Wall',
  larder: 'Larder / Tall', l_corner: 'L Corner',
};

interface KitchenUnit {
  id:                 string;
  type:               KitchenUnitType;
  label:              string;
  height:             string;
  width:              string;
  depth:              string;
  adjustable_shelves: string;
  shelf_count:        string;
  drawer_system:      string;
  drawer_count:       string;
  accessories:        AccRow[];
}

interface KitchenResult {
  project_name:           string;
  unit_count:             number;
  unit_summaries:         Array<{index:number;label:string;type:string;height:number;width:number;cost_price:number;resale_price:number}>;
  cutting_list_formatted: Array<{ category: string; items: any[] }>;
  material_summary:       any;
  pricing: {
    board_name: string; board_cost_m2: number; edging_name: string;
    pricing_tier: string; multiplier: number;
    total_cost_price: number; total_resale_price: number;
  };
}

interface EditableCuttingRow {
  line_number: number;
  name: string;
  dimension_l: number;
  dimension_w: number;
  quantity: number;
  material: string;
  edging: string;
  notes: string;
  // derived — recalculated live
  area_m2: number;
  dimension_display: string;
}

interface EditableSection {
  category: string;
  items: EditableCuttingRow[];
}

interface EditableAccessory {
  name: string;
  unit_price: number;
  qty: number;
  // derived
  total: number;
}

interface Pricing {
  board_name: string;
  board_cost_m2: number;
  edging_name: string;
  edging_cost_m: number;
  pricing_tier: string;
  multiplier: number;
  material_cost: number;
  hardware_cost: number;
  total_cost_price: number;
  resale_price: number;
}

interface CalculationResult {
  cabinet_type: string;
  dimensions: { height: number; width: number; depth: number };
  internal_dimensions: Record<string, number>;
  components: Record<string, any[]>;
  cutting_list_formatted: Array<{ category: string; items: any[] }>;
  material_summary: {
    material_breakdown: Array<{ material: string; pieces: number; area_m2: number }>;
    total_area_18mm: number;
    total_area_6mm: number;
    total_area_8mm: number;
    estimated_sheets_18mm: number;
    estimated_sheets_6mm: number;
    estimated_sheets_8mm: number;
  };
  pricing: Pricing;
  summary: {
    total_panels: number;
    total_area_m2: number;
    door_count?: number;
    drawer_count?: number;
    shelf_count?: number;
    hanging_rails?: number;
    hanging_rail_cut_length?: number | null;
    accessories?: Array<{ name: string; qty: number }>;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CABINET_TYPE_LABELS: Record<CabinetType, string> = {
  base: 'Kitchen Base', wall: 'Kitchen Wall',
  larder: 'Larder / Tall Unit', bedroom: 'Bedroom Carcass',
};

const CABINET_TYPE_DEFAULTS: Record<CabinetType, { depth: string; height: string }> = {
  base:    { depth: '570',  height: '720'  },   // 570 fixed gable depth per client spec
  wall:    { depth: '320',  height: '720'  },   // 320 fixed gable depth per client spec
  larder:  { depth: '400',  height: '1970' },
  bedroom: { depth: '600',  height: '2300' },
};

const SECTION_COLORS: Record<string, string> = {
  'GABLE':               'bg-slate-800',
  'T/B & FIX SHELVES':   'bg-slate-700',
  'S/H':                 'bg-slate-700',
  'BACKS':               'bg-slate-600',
  'END PANELS & INFILLS':'bg-slate-600',
  'BRACES':              'bg-slate-500',
  'DOORS & DRAW FACES':  'bg-stone-700',
  'DRAWS':               'bg-stone-700',
};

const ACCESSORY_DEFAULTS: Record<'full' | '8mm', Array<{ name: string; unit_price: number; qty: number }>> = {
  full: [
    { name: 'Hanging Rail',              unit_price: 10.00, qty: 0 },
    { name: 'Shelf Pegs Plastic',        unit_price: 0.12,  qty: 0 },
    { name: 'Legs 100',                  unit_price: 4.00,  qty: 0 },
    { name: 'Shelf Holes Row Per Gable', unit_price: 15.00, qty: 0 },
    { name: 'LED Groving Per Gable',     unit_price: 20.00, qty: 0 },
  ],
  '8mm': [
    { name: 'Hanging Rail',                       unit_price: 10.00,  qty: 0 },
    { name: 'Shelf Pegs Metal Hafele 282.24.710', unit_price: 0.147,  qty: 0 },
    { name: 'Legs 100',                           unit_price: 4.00,   qty: 0 },
    { name: 'Shelf Holes Row Per Gable',          unit_price: 15.00,  qty: 0 },
    { name: 'LED Groving Per Gable',              unit_price: 20.00,  qty: 0 },
  ],
};

// ─── Kitchen unit constants ───────────────────────────────────────────────────

const KITCHEN_UNIT_HEIGHTS: Record<KitchenUnitType, string> = {
  base: '720', wall: '720', larder: '1970', l_corner: '720',
};

const KITCHEN_UNIT_DEPTHS: Record<KitchenUnitType, string> = {
  base: '570', wall: '320', larder: '400', l_corner: '570',
};

const KITCHEN_UNIT_ACCESSORIES: Record<KitchenUnitType, AccRow[]> = {
  base:     [
    { name: 'Legs 150',           unit: 5.00, qty: 0, type: 'accessory' },
    { name: 'Shelf Pegs Plastic', unit: 0.12, qty: 0, type: 'accessory' },
    { name: 'Overlay Splung',     unit: 5.00, qty: 0, type: 'hinge'     },
    { name: 'sample',             unit: 5.00, qty: 0, type: 'handle'    },
  ],
  wall:     [
    { name: 'Shelf Pegs Plastic',  unit: 0.12, qty: 0, type: 'accessory' },
    { name: 'Hanger plate',        unit: 0.40, qty: 0, type: 'accessory' },
    { name: 'Cabinet hanger set',  unit: 2.00, qty: 0, type: 'accessory' },
    { name: 'Overlay Splung',      unit: 5.00, qty: 0, type: 'hinge'     },
    { name: 'sample',              unit: 5.00, qty: 0, type: 'handle'    },
  ],
  larder:   [
    { name: 'Legs 150',           unit: 5.00, qty: 0, type: 'accessory' },
    { name: 'Shelf Pegs Plastic', unit: 0.12, qty: 0, type: 'accessory' },
    { name: 'Overlay Splung',     unit: 5.00, qty: 0, type: 'hinge'     },
    { name: 'sample',             unit: 5.00, qty: 0, type: 'handle'    },
  ],
  l_corner: [
    { name: 'Legs 150',           unit: 5.00, qty: 0, type: 'accessory' },
    { name: 'Shelf Pegs Plastic', unit: 0.12, qty: 0, type: 'accessory' },
    { name: 'Overlay Splung',     unit: 5.00, qty: 0, type: 'hinge'     },
    { name: 'sample',             unit: 5.00, qty: 0, type: 'handle'    },
  ],
};

let _kuid = 0;
function makeKitchenUnit(type: KitchenUnitType = 'base'): KitchenUnit {
  return {
    id: `ku_${Date.now()}_${_kuid++}`, type,
    label: '', height: KITCHEN_UNIT_HEIGHTS[type], width: '1200',
    depth: KITCHEN_UNIT_DEPTHS[type],
    adjustable_shelves: type === 'wall' ? '2' : '1',
    shelf_count: '6', drawer_system: '', drawer_count: '2',
    accessories: KITCHEN_UNIT_ACCESSORIES[type].map(a => ({ ...a })),
  };
}

const ALL_ACCESSORIES = [
  { name: 'Hanging Rail',                        unit: 10.00  },
  { name: 'Shelf Pegs Metal Hafele 282.24.710',  unit: 0.147  },
  { name: 'Shelf Pegs Plastic',                  unit: 0.12   },
  { name: 'Legs 150',                            unit: 5.00   },
  { name: 'Legs 100',                            unit: 4.00   },
  { name: 'Hanger plate',                        unit: 0.40   },
  { name: 'Cabinet hanger set',                  unit: 2.00   },
  { name: 'Shelf Holes Row Per Gable',           unit: 15.00  },
  { name: 'LED Groving Per Gable',               unit: 20.00  },
  { name: 'Cable Tidy 80mm    429.99.511',       unit: 6.00   },
];

// Hinges from Hinges sheet — all £5.00
const ALL_HINGES = [
  { name: 'Overlay Splung',    unit: 5.00 },
  { name: 'Overlay Unsprung',  unit: 5.00 },
  { name: 'Overlay Softclose', unit: 5.00 },
  { name: 'Inset Sprung',      unit: 5.00 },
  { name: 'Inset Unsprung',    unit: 5.00 },
  { name: 'Inset Softclose',   unit: 5.00 },
];

// Handles from Handles sheet
const ALL_HANDLES = [
  { name: 'sample', unit: 5.00 },
];

// Kitchen accessory defaults per cabinet type (K Carc exact defaults)
// Each row: {name, unit, qty, type: 'accessory'|'hinge'|'handle'}
type AccRow = { name: string; unit: number; qty: number; type: 'accessory' | 'hinge' | 'handle' };

const KITCHEN_ACCESSORY_DEFAULTS: Record<string, AccRow[]> = {
  base: [
    { name: 'Legs 150',          unit: 5.00, qty: 0, type: 'accessory' },
    { name: 'Shelf Pegs Plastic',unit: 0.12, qty: 0, type: 'accessory' },
    { name: 'Overlay Splung',    unit: 5.00, qty: 0, type: 'hinge'     },
    { name: 'sample',            unit: 5.00, qty: 0, type: 'handle'    },
  ],
  wall: [
    { name: 'Shelf Pegs Plastic',  unit: 0.12, qty: 0, type: 'accessory' },
    { name: 'Hanger plate',        unit: 0.40, qty: 0, type: 'accessory' },
    { name: 'Cabinet hanger set',  unit: 2.00, qty: 0, type: 'accessory' },
    { name: 'Overlay Splung',      unit: 5.00, qty: 0, type: 'hinge'     },
    { name: 'sample',              unit: 5.00, qty: 0, type: 'handle'    },
  ],
  larder: [
    { name: 'Legs 150',          unit: 5.00, qty: 0, type: 'accessory' },
    { name: 'Shelf Pegs Plastic',unit: 0.12, qty: 0, type: 'accessory' },
    { name: 'Overlay Splung',    unit: 5.00, qty: 0, type: 'hinge'     },
    { name: 'sample',            unit: 5.00, qty: 0, type: 'handle'    },
  ],
  l_corner: [
    { name: 'Legs 150',          unit: 5.00, qty: 0, type: 'accessory' },
    { name: 'Shelf Pegs Plastic',unit: 0.12, qty: 0, type: 'accessory' },
    { name: 'Overlay Splung',    unit: 5.00, qty: 0, type: 'hinge'     },
    { name: 'sample',            unit: 5.00, qty: 0, type: 'handle'    },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roundup(x: number, dp = 2) {
  const f = 10 ** dp;
  return Math.ceil(x * f) / f;
}

function calcArea(l: number, w: number) {
  return roundup((l * w) / 1_000_000, 2);
}

/** Convert backend result sections → editable rows */
function toEditableSections(sections: CalculationResult['cutting_list_formatted']): EditableSection[] {
  return sections.map(s => ({
    category: s.category,
    items: s.items.map(item => {
      const area = calcArea(item.dimension_l ?? 0, item.dimension_w ?? 0);
      return {
        line_number: item.line_number,
        name: item.name ?? '',
        dimension_l: item.dimension_l ?? 0,
        dimension_w: item.dimension_w ?? 0,
        quantity: item.quantity ?? 1,
        material: item.material_code ?? item.material ?? '',
        edging: item.edging_code ?? item.edging ?? '',
        notes: item.notes ?? '',
        area_m2: area,
        dimension_display: `${item.dimension_l} × ${item.dimension_w} = ${item.quantity}`,
      };
    }),
  }));
}

/** Convert backend hardware list → editable accessories */
function toEditableAccessories(hardware: any[]): EditableAccessory[] {
  return hardware.map(h => ({
    name: h.name ?? '',
    unit_price: h.unit_price ?? 0,
    qty: h.quantity ?? h.qty ?? 0,
    total: h.total ?? 0,
  }));
}

/** Recompute derived fields on a row after editing */
function recomputeRow(row: EditableCuttingRow): EditableCuttingRow {
  const area = calcArea(row.dimension_l, row.dimension_w);
  return {
    ...row,
    area_m2: area,
    dimension_display: `${row.dimension_l} × ${row.dimension_w} = ${row.quantity}`,
  };
}

/** Live material summary from editable sections */
function computeMaterialSummary(sections: EditableSection[]) {
  let total18 = 0, total8 = 0, total6 = 0;
  const byMaterial: Record<string, { pieces: number; area: number }> = {};

  for (const sec of sections) {
    for (const item of sec.items) {
      const area = item.area_m2 * item.quantity;
      const t = item.notes?.includes('8mm') ? 8 : item.notes?.includes('6MM') || item.notes?.includes('6mm') ? 6 : 18;
      if (t === 18) total18 += area;
      else if (t === 8) total8 += area;
      else total6 += area;

      const mat = item.material || 'Unknown';
      if (!byMaterial[mat]) byMaterial[mat] = { pieces: 0, area: 0 };
      byMaterial[mat].pieces += item.quantity;
      byMaterial[mat].area   += area;
    }
  }

  const SHEET = 2.88;
  return {
    material_breakdown: Object.entries(byMaterial).map(([m, v]) => ({
      material: m, pieces: v.pieces, area_m2: Math.round(v.area * 1000) / 1000,
    })),
    total_area_18mm: Math.round(total18 * 1000) / 1000,
    total_area_8mm:  Math.round(total8  * 1000) / 1000,
    total_area_6mm:  Math.round(total6  * 1000) / 1000,
    estimated_sheets_18mm: total18 > 0 ? Math.ceil(total18 / SHEET) : 0,
    estimated_sheets_8mm:  total8  > 0 ? Math.ceil(total8  / SHEET) : 0,
    estimated_sheets_6mm:  total6  > 0 ? Math.ceil(total6  / SHEET) : 0,
  };
}

/** Live cost summary from editable data */
function computeCostSummary(
  sections: EditableSection[],
  accs: EditableAccessory[],
  multiplier: number,
  boardCostM2: number,
  edgingCostM: number,
) {
  // Material cost: sum of panel_price per row (ROUNDUP formula)
  let matCost = 0;
  for (const sec of sections) {
    for (const item of sec.items) {
      const m2   = roundup((item.dimension_l * item.dimension_w) / 1_000_000, 2);
      const pc   = roundup(m2 * boardCostM2, 2);
      const edgM = (item.dimension_l / 1000) * item.quantity;
      const ec   = roundup(edgM * edgingCostM, 2);
      matCost   += roundup((pc + ec) * item.quantity, 2);
    }
  }

  const hwCost   = accs.reduce((s, a) => s + roundup(a.unit_price * a.qty, 2), 0);
  const total    = Math.round((matCost + hwCost) * 100) / 100;
  const resale   = Math.round(total * multiplier * 100) / 100;

  return { material_cost: Math.round(matCost * 100) / 100, hardware_cost: Math.round(hwCost * 100) / 100, total_cost_price: total, resale_price: resale };
}

// ─── Inline editable cell ─────────────────────────────────────────────────────

function EditNum({ value, onChange, className = '' }: {
  value: number; onChange: (v: number) => void; className?: string;
}) {
  return (
    <Input
      type="number"
      value={value}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      className={`h-7 text-xs font-mono text-center w-full border-dashed focus:border-solid ${className}`}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ManualCabinetEntryPage() {
  const [refData, setRefData]         = useState<any>(null);
  const [cabinetType, setCabinetType] = useState<CabinetType>('base');
  const [height, setHeight]           = useState('720');
  const [width, setWidth]             = useState('1200');
  const [depth, setDepth]             = useState('500');
  const [projectName, setProjectName] = useState('');
  const [boardCode, setBoardCode]     = useState('Egger         MFC G 4-5');
  const [edgingCode, setEdgingCode]   = useState('Egger White MFC G8');
  const [pricingTier, setPricingTier] = useState('Retail 3.5');
  const [adjustableShelves, setAdjustableShelves] = useState('1');
  const [shelfCount, setShelfCount]   = useState('6');
  const [drawerSystem, setDrawerSystem] = useState('');
  const [drawerCount, setDrawerCount] = useState('2');
  const [backType, setBackType]       = useState<'full' | '8mm'>('full');
  const [bedroomAccessories, setBedroomAccessories] = useState(ACCESSORY_DEFAULTS['full'].map(a => ({ ...a })));

  // ── Door Price Calculator state ──────────────────────────────────
  const [doorHeight, setDoorHeight]       = useState('2600');
  const [doorWidth, setDoorWidth]         = useState('550');
  const [doorQty, setDoorQty]             = useState('1');
  const [doorDepth, setDoorDepth]         = useState('18');
  const [doorBoard, setDoorBoard]         = useState('Egger         MFC G 4-5');
  const [doorEdging, setDoorEdging]       = useState('Egger    Perfect  Gloss');
  const [doorTier, setDoorTier]           = useState('Retail 5');
  const [doorCalculating, setDoorCalculating] = useState(false);
  const [doorResult, setDoorResult]       = useState<any>(null);
  const [pageMode, setPageMode]           = useState<'kitchen' | 'bedroom' | 'door'>('kitchen');

  // ── Kitchen multi-unit state ─────────────────────────────────────────────
  const [kitchenUnits, setKitchenUnits]         = useState<KitchenUnit[]>([makeKitchenUnit('base')]);
  const [expandedKUnit, setExpandedKUnit]       = useState<string | null>(kitchenUnits[0]?.id ?? null);
  const [kitchenResult, setKitchenResult]       = useState<KitchenResult | null>(null);
  const [kitchenCalculating, setKitchenCalculating] = useState(false);

  // Kitchen accessories (base/wall/larder/l_corner) — includes hinges + handles
  const [kitchenAccessories, setKitchenAccessories] = useState<AccRow[]>(
    KITCHEN_ACCESSORY_DEFAULTS['base'].map(a => ({ ...a }))
  );

  const [calculating, setCalculating] = useState(false);
  const [result, setResult]           = useState<CalculationResult | null>(null);
  const [activeView, setActiveView]   = useState<'cutting' | 'components'>('cutting');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Editable state — populated after calculation, live thereafter
  const [editSections, setEditSections]   = useState<EditableSection[]>([]);
  const [editAccessories, setEditAccessories] = useState<EditableAccessory[]>([]);
  const [livePricing, setLivePricing]     = useState<ReturnType<typeof computeCostSummary> | null>(null);
  const [liveSummary, setLiveSummary]     = useState<ReturnType<typeof computeMaterialSummary> | null>(null);

  useEffect(() => {
    api.get('/api/manual-cabinet/reference')
      .then((r: any) => { if (r.success) setRefData(r); })
      .catch(() => {});
  }, []);

  // Recompute live summaries whenever editable state changes
  useEffect(() => {
    if (!result || editSections.length === 0) return;
    const pricing = computeCostSummary(
      editSections, editAccessories,
      result.pricing.multiplier,
      result.pricing.board_cost_m2,
      result.pricing.edging_cost_m,
    );
    setLivePricing(pricing);
    setLiveSummary(computeMaterialSummary(editSections));
  }, [editSections, editAccessories, result]);

  // ── Handlers ────────────────────────────────────────────────────

  const handleTypeChange = (val: CabinetType) => {
    setCabinetType(val);
    const d = CABINET_TYPE_DEFAULTS[val];
    setHeight(d.height); setDepth(d.depth);
    setDrawerSystem(''); setResult(null);
    setEditSections([]); setEditAccessories([]);
    if (val === 'bedroom') {
      setBedroomAccessories(ACCESSORY_DEFAULTS['full'].map(a => ({ ...a })));
    } else {
      const defaults = KITCHEN_ACCESSORY_DEFAULTS[val] ?? KITCHEN_ACCESSORY_DEFAULTS['base'];
      setKitchenAccessories(defaults.map(a => ({ ...a })));
    }
  };

  const handleBackTypeChange = (val: 'full' | '8mm') => {
    setBackType(val);
    setBedroomAccessories(ACCESSORY_DEFAULTS[val].map(a => ({ ...a })));
  };

  const buildPayload = (save = false) => {
    const base: any = {
      cabinet_type: cabinetType, height: parseFloat(height),
      width: parseFloat(width), depth: depth ? parseFloat(depth) : undefined,
      board_name: boardCode, edging_name: edgingCode,
      pricing_tier: pricingTier,
      project_name: projectName || `${CABINET_TYPE_LABELS[cabinetType]} ${width}`, save,
    };
    if (cabinetType === 'base' || cabinetType === 'wall') {
      base.adjustable_shelves = parseInt(adjustableShelves) || 1;
      if (cabinetType === 'base' && drawerSystem) {
        base.drawer_system = drawerSystem;
        base.drawer_count  = parseInt(drawerCount) || 1;
      }
    }
    if (cabinetType === 'larder') base.shelf_count = parseInt(shelfCount) || 6;
    // Kitchen accessories for non-bedroom types
    if (cabinetType !== 'bedroom') {
      base.accessories = kitchenAccessories.map(a => ({ name: a.name, qty: a.qty, type: a.type }));
    }
    if (cabinetType === 'bedroom') {
      base.back_type   = backType;
      base.service_gap = backType === '8mm' ? 18 : 0;
      base.shelf_count = parseInt(adjustableShelves) || 1;
      base.accessories = bedroomAccessories.map(a => ({ name: a.name, qty: a.qty }));
    }
    return base;
  };

  const handleCalculate = async () => {
    if (!height || !width) { toast.error('Height and width are required'); return; }
    setCalculating(true);
    try {
      const r = await api.post('/api/manual-cabinet/calculate', buildPayload(false));
      if (r.success) {
        setResult(r.result);
        const secs = toEditableSections(r.result.cutting_list_formatted);
        setEditSections(secs);
        const hw: EditableAccessory[] = (r.result.components?.hardware ?? []).map((h: any) => ({
          name: h.name, unit_price: h.unit_price ?? 0, qty: h.quantity ?? 0,
          total: h.total ?? 0,
        }));
        setEditAccessories(hw);
        setCollapsedSections(new Set());
        toast.success(`${r.result.cabinet_type} calculated`);
      } else {
        toast.error(r.error || 'Calculation failed');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed');
    } finally {
      setCalculating(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    try {
      const r = await api.post('/api/manual-cabinet/calculate', buildPayload(true));
      if (r.success) toast.success('Saved');
      else toast.error(r.error || 'Save failed');
    } catch (e: any) { toast.error(e.message || 'Failed'); }
  };

  const exportCuttingList = () => {
    if (!result || editSections.length === 0) return;

    // Build payload from current EDITED state
    const payload = {
      cabinet_type:  result.cabinet_type,
      project_name:  projectName || result.cabinet_type,
      customer_name: projectName || '',
      address:       '',
      fitting_date:  '',
      outside_wood:  '',
      carcase_wood:  result.pricing?.board_name ?? '',
      door_wood:     '',
      date:          new Date().toLocaleDateString('en-GB'),
      // Single unit dimensions strip
      units_info: [{
        index:  1,
        label:  projectName || result.cabinet_type,
        type:   'bedroom',
        height: result.dimensions?.height ?? height,
        width:  result.dimensions?.width  ?? width,
        depth:  result.dimensions?.depth  ?? depth,
      }],
      sections: editSections.map(sec => ({
        category: sec.category,
        items: sec.items.map(item => ({
          name:        item.name,
          dimension_l: item.dimension_l,
          dimension_w: item.dimension_w,
          quantity:    item.quantity,
          notes:       item.notes ?? '',
          area_m2:     item.area_m2,
        })),
      })),
      accessories:      editAccessories.map(a => ({ name: a.name, qty: a.qty })),
      material_summary: liveSummary ?? result.material_summary,
    };

    // Store in sessionStorage then navigate — no backend call needed
    sessionStorage.setItem('cutting_list_preview_data', JSON.stringify(payload));
    window.open('/dashboard/cutting-list-preview', '_blank');
    toast.success('Opening cutting list preview...');
  };

  const handleReset = () => {
    setResult(null); setEditSections([]); setEditAccessories([]);
    setLivePricing(null); setLiveSummary(null);
    const d = CABINET_TYPE_DEFAULTS[cabinetType];
    setHeight(d.height); setDepth(d.depth); setWidth('1200'); setProjectName('');
    setDrawerSystem('');
  };

  const handleDoorCalculate = async () => {
    if (!doorHeight || !doorWidth) { toast.error('Door height and width are required'); return; }
    setDoorCalculating(true);
    try {
      const r = await api.post('/api/manual-cabinet/door-price', {
        height:      parseFloat(doorHeight),
        width:       parseFloat(doorWidth),
        depth:       parseFloat(doorDepth) || 18,
        quantity:    parseInt(doorQty) || 1,
        board_name:  doorBoard,
        edging_name: doorEdging,
        tier_name:   doorTier,
      });
      if (r.success) {
        setDoorResult(r.result);
        toast.success('Door price calculated');
      } else {
        toast.error(r.error || 'Calculation failed');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed');
    } finally {
      setDoorCalculating(false);
    }
  };

  const toggleSection = (cat: string) =>
    setCollapsedSections(prev => { const n = new Set(prev); n.has(cat) ? n.delete(cat) : n.add(cat); return n; });

  // ── Row/accessory editing ──────────────────────────────────────

  const updateRow = (secIdx: number, rowIdx: number, field: keyof EditableCuttingRow, value: any) => {
    setEditSections(prev => prev.map((sec, si) => si !== secIdx ? sec : {
      ...sec,
      items: sec.items.map((row, ri) => ri !== rowIdx ? row : recomputeRow({ ...row, [field]: value }),
      ),
    }));
  };

  const updateAccessory = (idx: number, field: keyof EditableAccessory, value: any) => {
    setEditAccessories(prev => prev.map((a, i) => i !== idx
      ? a
      : { ...a, [field]: value, total: roundup((field === 'unit_price' ? value : a.unit_price) * (field === 'qty' ? value : a.qty), 2) }
    ));
  };

  const updateBedroomAcc = (idx: number, field: 'name' | 'unit_price' | 'qty', value: any) => {
    setBedroomAccessories(prev => prev.map((a, i) => {
      if (i !== idx) return a;
      const next = { ...a, [field]: value };
      if (field === 'name') next.unit_price = ALL_ACCESSORIES.find(x => x.name === value)?.unit ?? next.unit_price;
      return next;
    }));
  };

  const addBedroomAcc = () => setBedroomAccessories(prev => [...prev, { name: 'Hanging Rail', unit_price: 10.00, qty: 0 }]);
  const removeBedroomAcc = (idx: number) => setBedroomAccessories(prev => prev.filter((_, i) => i !== idx));

  // ── Kitchen multi-unit handlers ─────────────────────────────────────────────

  const addKitchenUnit = (type: KitchenUnitType = 'base') => {
    const u = makeKitchenUnit(type);
    setKitchenUnits(prev => [...prev, u]);
    setExpandedKUnit(u.id);
  };

  const removeKitchenUnit = (id: string) => {
    setKitchenUnits(prev => {
      const next = prev.filter(u => u.id !== id);
      return next.length ? next : [makeKitchenUnit('base')];
    });
    if (expandedKUnit === id) setExpandedKUnit(null);
  };

  const updateKitchenUnit = (id: string, field: keyof KitchenUnit, value: any) => {
    setKitchenUnits(prev => prev.map(u => {
      if (u.id !== id) return u;
      const next = { ...u, [field]: value };
      if (field === 'type') {
        next.height      = KITCHEN_UNIT_HEIGHTS[value as KitchenUnitType];
        next.depth       = KITCHEN_UNIT_DEPTHS[value as KitchenUnitType];
        next.accessories = KITCHEN_UNIT_ACCESSORIES[value as KitchenUnitType].map(a => ({ ...a }));
        next.adjustable_shelves = value === 'wall' ? '2' : '1';
      }
      return next;
    }));
  };

  const updateKitchenUnitAcc = (unitId: string, accIdx: number, field: keyof AccRow, value: any) => {
    setKitchenUnits(prev => prev.map(u => {
      if (u.id !== unitId) return u;
      const accs = u.accessories.map((a, i) => {
        if (i !== accIdx) return a;
        const next = { ...a, [field]: value };
        if (field === 'name') {
          const all = [...ALL_ACCESSORIES, ...ALL_HINGES, ...ALL_HANDLES];
          next.unit = all.find(x => x.name === value)?.unit ?? next.unit;
        }
        return next;
      });
      return { ...u, accessories: accs };
    }));
  };

  const addKitchenUnitAccRow = (unitId: string, type: 'accessory' | 'hinge' | 'handle') => {
    const defaults = type === 'hinge' ? ALL_HINGES : type === 'handle' ? ALL_HANDLES : ALL_ACCESSORIES;
    const d = defaults[0];
    setKitchenUnits(prev => prev.map(u => u.id !== unitId ? u : {
      ...u, accessories: [...u.accessories, { name: d.name, unit: d.unit, qty: 0, type }]
    }));
  };

  const handleKitchenCalculate = async () => {
    if (kitchenUnits.length === 0) { toast.error('Add at least one unit'); return; }
    setKitchenCalculating(true);
    try {
      const payload = {
        project_name: projectName || 'Kitchen',
        board_name:   boardCode,
        edging_name:  edgingCode,
        pricing_tier: pricingTier,
        units: kitchenUnits.map(u => ({
          type:               u.type,
          label:              u.label || KITCHEN_UNIT_LABELS[u.type],
          height:             parseFloat(u.height),
          width:              parseFloat(u.width),
          depth:              parseFloat(u.depth) || undefined,
          adjustable_shelves: parseInt(u.adjustable_shelves) || 1,
          shelf_count:        parseInt(u.shelf_count) || 6,
          drawer_system:      u.drawer_system || undefined,
          drawer_count:       u.drawer_system ? (parseInt(u.drawer_count) || 1) : undefined,
          accessories:        u.accessories.map(a => ({ name: a.name, qty: a.qty })),
        })),
      };
      const r = await api.post('/api/manual-cabinet/calculate-kitchen', payload);
      if (r.success) {
        setKitchenResult(r.result);
        setCollapsedSections(new Set());
        toast.success(`Kitchen calculated — ${r.result.unit_count} units combined`);
      } else {
        toast.error(r.error || 'Calculation failed');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed');
    } finally {
      setKitchenCalculating(false);
    }
  };

  const handleKitchenExport = () => {
    if (!kitchenResult) return;
    const payload = {
      cabinet_type:  'Kitchen',
      project_name:  kitchenResult.project_name,
      customer_name: projectName || '',
      carcase_wood:  kitchenResult.pricing.board_name,
      date:          new Date().toLocaleDateString('en-GB'),
      // Units info shown as a dimensions strip at top of preview
      units_info: kitchenResult.unit_summaries.map((u: any) => ({
        index:  u.index,
        label:  u.label,
        type:   u.type,
        height: u.height,
        width:  u.width,
        depth:  kitchenUnits.find(ku => ku.label === u.label || KITCHEN_UNIT_LABELS[ku.type as KitchenUnitType] === u.label)?.depth ?? '',
      })),
      sections:      kitchenResult.cutting_list_formatted.map((sec: any) => ({
        category: sec.category,
        items:    sec.items.map((item: any) => ({
          name:        item.name || '',
          unit_label:  item.unit_label || '',
          unit_index:  item.unit_index || 0,
          dimension_l: item.dimension_l,
          dimension_w: item.dimension_w,
          quantity:    item.quantity,
        })),
      })),
      accessories:      [],
      material_summary: kitchenResult.material_summary,
    };
    sessionStorage.setItem('cutting_list_preview_data', JSON.stringify(payload));
    window.open('/dashboard/cutting-list-preview', '_blank');
    toast.success('Opening cutting list preview...');
  };

  // Kitchen accessory handlers (base/wall/larder/l_corner)
  const updateKitchenAcc = (idx: number, field: keyof AccRow, value: any) => {
    setKitchenAccessories(prev => prev.map((a, i) => {
      if (i !== idx) return a;
      const next = { ...a, [field]: value };
      if (field === 'name') {
        const all = [...ALL_ACCESSORIES, ...ALL_HINGES, ...ALL_HANDLES];
        next.unit = all.find(x => x.name === value)?.unit ?? next.unit;
      }
      return next;
    }));
  };
  const addKitchenAccRow = (type: 'accessory' | 'hinge' | 'handle' = 'accessory') => {
    const defaults: Record<string, {name: string; unit: number}> = {
      accessory: { name: 'Legs 150', unit: 5.00 },
      hinge:     { name: 'Overlay Splung', unit: 5.00 },
      handle:    { name: 'sample', unit: 5.00 },
    };
    const d = defaults[type];
    setKitchenAccessories(prev => [...prev, { ...d, qty: 0, type }]);
  };
  const removeKitchenAccRow = (idx: number) =>
    setKitchenAccessories(prev => prev.filter((_, i) => i !== idx));

  // ── Derived ───────────────────────────────────────────────────

  const pricing = livePricing ?? (result ? {
    material_cost: result.pricing.material_cost,
    hardware_cost: result.pricing.hardware_cost,
    total_cost_price: result.pricing.total_cost_price,
    resale_price: result.pricing.resale_price,
  } : null);

  const summary = liveSummary ?? result?.material_summary ?? null;
  const widthNum = parseInt(width) || 0;
  const doorHint = cabinetType === 'larder' ? '2 doors (std)' : widthNum >= 600 ? '→ 2 doors' : '→ 1 door';

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cabinet Entry</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pageMode === 'kitchen' ? 'Kitchen — add all units, one combined cutting list'
              : pageMode === 'bedroom' ? 'Bedroom Carcass — B Carc cutting list & cost'
              : 'Door Prices — B Carc door calculator'}
          </p>
        </div>
        {/* Mode switcher — 3 tabs */}
        <div className="flex rounded-lg border overflow-hidden text-sm font-medium">
          <button
            onClick={() => setPageMode('kitchen')}
            className={`px-5 py-2 transition-colors ${pageMode === 'kitchen' ? 'bg-slate-800 text-white' : 'bg-white text-muted-foreground hover:bg-muted/50'}`}
          >
            Kitchen
          </button>
          <button
            onClick={() => setPageMode('bedroom')}
            className={`px-5 py-2 transition-colors border-l ${pageMode === 'bedroom' ? 'bg-slate-800 text-white' : 'bg-white text-muted-foreground hover:bg-muted/50'}`}
          >
            Bedroom
          </button>
          <button
            onClick={() => setPageMode('door')}
            className={`px-5 py-2 transition-colors border-l ${pageMode === 'door' ? 'bg-slate-800 text-white' : 'bg-white text-muted-foreground hover:bg-muted/50'}`}
          >
            Door Prices
          </button>
        </div>
      </div>

      {/* ══ KITCHEN TAB ══ */}
      {pageMode === 'kitchen' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left: Material + Calculate */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base"><PoundSterling className="h-4 w-4" /> Material &amp; Pricing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Project name</Label>
                    <Input placeholder="e.g. Smith Kitchen" value={projectName} onChange={e => setProjectName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Board</Label>
                    <Select value={boardCode} onValueChange={setBoardCode}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {refData ? Object.entries(refData.board_codes).map(([k,v]:any) => (
                          <SelectItem key={k} value={k}>{k.trim()} — {v}</SelectItem>
                        )) : [['Egger         MFC G 4-5','£11.21'],['EGGER    White MFC G 2-3','£9.66'],['Alvic','£55.65']].map(([k,v]) => (
                          <SelectItem key={k} value={k}>{k.trim()} — {v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Edging</Label>
                    <Select value={edgingCode} onValueChange={setEdgingCode}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {refData ? Object.entries(refData.edging_codes).map(([k,v]:any) => (
                          <SelectItem key={k} value={k}>{k.trim()} — {v}</SelectItem>
                        )) : [['Egger White MFC G8','£0.533/m'],['Saviola','£1.133/m']].map(([k,v]) => (
                          <SelectItem key={k} value={k}>{k.trim()} — {v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Pricing tier</Label>
                    <Select value={pricingTier} onValueChange={setPricingTier}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[['Trade Min','×2.0'],['Trade 2.5','×2.5'],['Retail 3','×3.0'],['Retail 3.5','×3.5'],['Retail 4','×4.0'],['Retail 5','×5.0']].map(([k,v]) => (
                          <SelectItem key={k} value={k}>{k} ({v})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <Button className="w-full" size="lg" onClick={handleKitchenCalculate} disabled={kitchenCalculating || kitchenUnits.length === 0}>
                    {kitchenCalculating
                      ? <><Calculator className="mr-2 h-4 w-4 animate-spin" />Calculating…</>
                      : <><Calculator className="mr-2 h-4 w-4" />Generate Cutting List</>}
                  </Button>
                  {kitchenResult && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={handleKitchenExport}>
                        <Download className="mr-1 h-3 w-3" /> Export Sheet
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setKitchenResult(null); setKitchenUnits([makeKitchenUnit('base')]); setExpandedKUnit(null); }}>
                        <Trash2 className="mr-1 h-3 w-3" /> Reset
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Kitchen cost summary */}
              {kitchenResult && (
                <Card className="border-emerald-200 bg-emerald-50">
                  <CardContent className="pt-4 space-y-2">
                    <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Kitchen Total</p>
                    <div className="space-y-1 text-sm">
                      {kitchenResult.unit_summaries.map(u => (
                        <div key={u.index} className="flex justify-between text-muted-foreground">
                          <span className="truncate mr-2 text-xs">{u.index}. {u.label}</span>
                          <span className="font-mono text-xs shrink-0">£{u.cost_price.toFixed(2)}</span>
                        </div>
                      ))}
                      <Separator className="my-1" />
                      <div className="flex justify-between font-medium">
                        <span>Cost price</span><span className="font-mono">£{kitchenResult.pricing.total_cost_price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-800 text-base">
                        <span>Sell ×{kitchenResult.pricing.multiplier}</span>
                        <span className="font-mono">£{kitchenResult.pricing.total_resale_price.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right: Unit builder */}
            <div className="lg:col-span-2 space-y-3">
              {/* Add unit buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground font-medium mr-1">Add unit:</span>
                {(Object.keys(KITCHEN_UNIT_LABELS) as KitchenUnitType[]).map(type => (
                  <Button key={type} variant="outline" size="sm" onClick={() => addKitchenUnit(type)}>
                    <Plus className="mr-1 h-3 w-3" />{KITCHEN_UNIT_LABELS[type]}
                  </Button>
                ))}
              </div>

              {/* Unit cards */}
              {kitchenUnits.map((unit, idx) => {
                const isExpanded = expandedKUnit === unit.id;
                const label = unit.label || KITCHEN_UNIT_LABELS[unit.type];
                const accOptions = (t: string) => t === 'hinge' ? ALL_HINGES : t === 'handle' ? ALL_HANDLES : ALL_ACCESSORIES;
                return (
                  <Card key={unit.id} className="overflow-hidden">
                    <div className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setExpandedKUnit(isExpanded ? null : unit.id)}>
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-800 text-white text-xs flex items-center justify-center font-bold shrink-0">{idx+1}</span>
                        <div>
                          <span className="font-semibold text-sm">{label}</span>
                          <span className="text-muted-foreground text-xs ml-2">{KITCHEN_UNIT_LABELS[unit.type]} · {unit.height} × {unit.width}mm</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span role="button" tabIndex={0}
                          onClick={e => { e.stopPropagation(); removeKitchenUnit(unit.id); }}
                          onKeyDown={e => e.key==='Enter' && removeKitchenUnit(unit.id)}
                          className="text-muted-foreground hover:text-red-500 transition p-1 cursor-pointer">
                          <Trash2 className="h-3.5 w-3.5" />
                        </span>
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <CardContent className="pt-0 pb-4 space-y-4 border-t">
                        {/* Type + Label */}
                        <div className="grid grid-cols-2 gap-3 pt-3">
                          <div className="space-y-1.5">
                            <Label>Unit type</Label>
                            <Select value={unit.type} onValueChange={v => updateKitchenUnit(unit.id, 'type', v as KitchenUnitType)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {(Object.entries(KITCHEN_UNIT_LABELS) as [KitchenUnitType, string][]).map(([k,v]) => (
                                  <SelectItem key={k} value={k}>{v}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label>Label <span className="text-muted-foreground">(optional)</span></Label>
                            <Input placeholder="e.g. Boiler Room, Island…" value={unit.label}
                              onChange={e => updateKitchenUnit(unit.id, 'label', e.target.value)} />
                          </div>
                        </div>

                        {/* Dimensions */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground font-mono">Height (mm)</Label>
                            <Input type="number" value={unit.height} onChange={e => updateKitchenUnit(unit.id,'height',e.target.value)} className="font-semibold" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground font-mono">Width (mm)</Label>
                            <Input type="number" value={unit.width} onChange={e => updateKitchenUnit(unit.id,'width',e.target.value)} className="font-semibold" />
                            {unit.type === 'base' && (
                              <p className="text-xs text-muted-foreground">{parseInt(unit.width) >= 600 ? '→ 2 doors' : '→ 1 door'}</p>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground font-mono">Depth (mm)</Label>
                            <Input type="number" value={unit.depth} onChange={e => updateKitchenUnit(unit.id,'depth',e.target.value)} className="font-semibold" />
                            <p className="text-xs text-muted-foreground">
                              {unit.type === 'base' ? 'Default 570mm' : unit.type === 'wall' ? 'Default 320mm' : `Default ${KITCHEN_UNIT_DEPTHS[unit.type]}mm`}
                            </p>
                          </div>
                        </div>

                        {/* Type options */}
                        {(unit.type === 'base' || unit.type === 'wall') && (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label>Adjustable shelves</Label>
                              <Input type="number" min={0} max={10} value={unit.adjustable_shelves}
                                onChange={e => updateKitchenUnit(unit.id,'adjustable_shelves',e.target.value)} />
                            </div>
                            {unit.type === 'base' && (
                              <div className="space-y-1.5">
                                <Label>Drawer system</Label>
                                <Select value={unit.drawer_system || '__none__'}
                                  onValueChange={v => updateKitchenUnit(unit.id,'drawer_system',v==='__none__'?'':v)}>
                                  <SelectTrigger><SelectValue placeholder="None — door only" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__none__">None — door only</SelectItem>
                                    <SelectItem value="hettich">Hettich (−60mm)</SelectItem>
                                    <SelectItem value="ball_bearing">Ball Bearing (−24mm)</SelectItem>
                                    <SelectItem value="blum_bottom_fix">Blum Bottom Fix (−24mm)</SelectItem>
                                    <SelectItem value="blum_motion_tip_on">Blum Motion Tip-On (−24mm)</SelectItem>
                                    <SelectItem value="slyder_twin_wall">Slyder Twin Wall (−24mm)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        )}
                        {unit.type === 'larder' && (
                          <div className="w-40 space-y-1.5">
                            <Label>Shelf count</Label>
                            <Input type="number" min={1} max={12} value={unit.shelf_count}
                              onChange={e => updateKitchenUnit(unit.id,'shelf_count',e.target.value)} />
                          </div>
                        )}

                        {/* Accessories */}
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold">Accessories</Label>
                            <div className="flex gap-1.5">
                              {(['accessory','hinge','handle'] as const).map(t => (
                                <button key={t} onClick={() => addKitchenUnitAccRow(unit.id, t)}
                                  className="text-[10px] text-blue-500 hover:text-blue-700 border border-blue-200 rounded px-1.5 py-0.5">
                                  + {t}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground pb-0.5">
                            <span className="w-14 shrink-0 text-center">Type</span>
                            <span className="flex-1">Item</span>
                            <span className="w-20 text-center">Unit £</span>
                            <span className="w-14 text-center">Qty</span>
                            <span className="w-16 text-right">Total</span>
                            <span className="w-4"></span>
                          </div>
                          {unit.accessories.map((acc, accIdx) => {
                            const typeColor = acc.type==='hinge' ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : acc.type==='handle' ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200';
                            const lineTotal = Math.round(acc.unit * acc.qty * 100) / 100;
                            return (
                              <div key={accIdx} className="flex items-center gap-2">
                                <div className={`w-14 shrink-0 text-center text-[9px] px-1 py-0.5 rounded border ${typeColor}`}>{acc.type}</div>
                                <div className="flex-1 min-w-0">
                                  <Select value={acc.name} onValueChange={v => updateKitchenUnitAcc(unit.id,accIdx,'name',v)}>
                                    <SelectTrigger className="h-8 text-xs w-full"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      {accOptions(acc.type).map(o => <SelectItem key={o.name} value={o.name} className="text-xs">{o.name}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="w-20 shrink-0">
                                  <Input type="number" step="0.01" value={acc.unit}
                                    onChange={e => updateKitchenUnitAcc(unit.id,accIdx,'unit',parseFloat(e.target.value)||0)}
                                    className="h-8 text-xs font-mono text-right w-full" />
                                </div>
                                <div className="w-14 shrink-0">
                                  <Input type="number" min={0} value={acc.qty}
                                    onChange={e => updateKitchenUnitAcc(unit.id,accIdx,'qty',parseInt(e.target.value)||0)}
                                    className="h-8 text-xs text-center w-full" />
                                </div>
                                <span className="w-16 shrink-0 text-right text-xs font-mono text-muted-foreground">£{lineTotal.toFixed(2)}</span>
                                <button onClick={() => setKitchenUnits(prev => prev.map(u => u.id!==unit.id ? u : {
                                  ...u, accessories: u.accessories.filter((_,i) => i!==accIdx)
                                }))} className="w-4 text-muted-foreground hover:text-red-400 text-sm shrink-0">×</button>
                              </div>
                            );
                          })}
                          <div className="flex justify-between text-xs font-medium border-t pt-1">
                            <span>Accessories total</span>
                            <span className="font-mono">£{unit.accessories.reduce((s,a) => s + a.unit*a.qty, 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Combined cutting list */}
          {kitchenResult && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Combined Cutting List</h2>
                  <p className="text-sm text-muted-foreground">
                    {kitchenResult.unit_count} units · {kitchenResult.cutting_list_formatted.reduce((s,sec) => s+sec.items.length, 0)} total rows
                  </p>
                </div>
                <Button onClick={handleKitchenExport} className="gap-2">
                  <FileText className="h-4 w-4" /> Preview &amp; Export PDF
                </Button>
              </div>

              {/* Unit legend */}
              <div className="flex flex-wrap gap-2">
                {kitchenResult.unit_summaries.map(u => (
                  <Badge key={u.index} variant="outline" className="gap-1 text-xs">
                    <span className="font-bold">{u.index}</span>{u.label}
                    <span className="text-muted-foreground">·</span>
                    <span className="font-mono">£{u.resale_price.toFixed(2)}</span>
                  </Badge>
                ))}
              </div>

              {/* Sections */}
              {kitchenResult.cutting_list_formatted.map((section, secIdx) => {
                const collapsed = collapsedSections.has(section.category);
                const colour = SECTION_COLORS[section.category] ?? 'bg-slate-700';
                const totalPcs = section.items.reduce((s:number,i:any) => s+(i.quantity||0), 0);
                return (
                  <Card key={secIdx} className="overflow-hidden">
                    <button className={`w-full flex items-center justify-between px-4 py-2.5 text-white font-semibold text-sm ${colour}`}
                      onClick={() => toggleSection(section.category)}>
                      <span className="flex items-center gap-2">
                        <Layers className="h-3.5 w-3.5" />{section.category}
                        <span className="font-normal opacity-70 text-xs">({totalPcs} pcs)</span>
                      </span>
                      {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {!collapsed && (
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/40 text-xs">
                            <TableHead className="w-8 py-2">#</TableHead>
                            <TableHead className="w-28 py-2">Unit</TableHead>
                            <TableHead className="py-2">Panel</TableHead>
                            <TableHead className="py-2 text-center w-24">L (mm)</TableHead>
                            <TableHead className="py-2 text-center w-24">W (mm)</TableHead>
                            <TableHead className="py-2 text-center w-14">Qty</TableHead>
                            <TableHead className="py-2">Notes</TableHead>
                            <TableHead className="text-right py-2 w-16">Area m²</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {section.items.map((item:any, rowIdx:number) => (
                            <TableRow key={rowIdx} className={rowIdx%2===0?'':'bg-muted/20'}>
                              <TableCell className="font-mono text-xs text-muted-foreground py-1.5">{item.line_number}</TableCell>
                              <TableCell className="py-1.5">
                                {item.unit_label && (
                                  <Badge variant="outline" className="text-[10px] font-normal">
                                    {item.unit_index}. {item.unit_label}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="font-medium py-1.5 text-sm">{item.name}</TableCell>
                              <TableCell className="text-center font-mono py-1.5">{item.dimension_l}</TableCell>
                              <TableCell className="text-center font-mono py-1.5">{item.dimension_w}</TableCell>
                              <TableCell className="text-center font-bold py-1.5">{item.quantity}</TableCell>
                              <TableCell className="text-xs text-muted-foreground py-1.5">{item.notes}</TableCell>
                              <TableCell className="text-right font-mono text-xs py-1.5">
                                {typeof item.area_m2==='number' ? item.area_m2.toFixed(2) : '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </Card>
                );
              })}

              {/* Material summary */}
              {kitchenResult.material_summary && (
                <Card>
                  <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Package className="h-4 w-4" /> Material Summary — Whole Kitchen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 bg-slate-50 rounded-lg p-3 text-sm">
                      <div><div className="text-xl font-bold">{kitchenResult.material_summary.estimated_sheets_18mm||0}</div><div className="text-xs text-muted-foreground">18mm sheets</div></div>
                      {(kitchenResult.material_summary.estimated_sheets_8mm||0)>0 && (
                        <div><div className="text-xl font-bold">{kitchenResult.material_summary.estimated_sheets_8mm}</div><div className="text-xs text-muted-foreground">8mm sheets</div></div>
                      )}
                      <div><div className="text-xl font-bold">{kitchenResult.material_summary.estimated_sheets_6mm||0}</div><div className="text-xs text-muted-foreground">6mm sheets</div></div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {pageMode === 'bedroom' && (<>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: dimensions ── */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Ruler className="h-4 w-4" /> Dimensions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Cabinet type</Label>
                  <Select value={cabinetType} onValueChange={(v: any) => handleTypeChange(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bedroom">Bedroom Carcass</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Project name</Label>
                  <Input placeholder="e.g. Master Bedroom Wardrobe" value={projectName} onChange={e => setProjectName(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Height (mm) *', val: height, set: setHeight, hint: '' },
                  { label: 'Width (mm) *',  val: width,  set: setWidth,  hint: doorHint },
                  { label: 'Depth (mm)',     val: depth,  set: setDepth,
          hint: cabinetType === 'base' ? 'Fixed 570mm gable (510mm internal)'
              : cabinetType === 'wall' ? 'Fixed 320mm gable (300mm internal)'
              : `Default ${CABINET_TYPE_DEFAULTS[cabinetType].depth}mm` },
                ].map(({ label, val, set, hint }) => (
                  <div key={label} className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground font-mono">{label}</Label>
                    <Input type="number" value={val} onChange={e => set(e.target.value)} className="font-semibold" />
                    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
                  </div>
                ))}
              </div>

              {/* Base / Wall */}
              {(cabinetType === 'base' || cabinetType === 'wall') && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Adjustable shelves</Label>
                      <Input type="number" value={adjustableShelves} onChange={e => setAdjustableShelves(e.target.value)} min={0} max={10} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Drawer system</Label>
                      <Select value={drawerSystem || '__none__'} onValueChange={v => setDrawerSystem(v === '__none__' ? '' : v)}>
                        <SelectTrigger><SelectValue placeholder="None (door only)" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">None — door only</SelectItem>
                          {refData
                            ? Object.entries(refData.drawer_systems).map(([k, v]: any) => (
                                <SelectItem key={k} value={k}>{v as string}</SelectItem>
                              ))
                            : [['hettich','Hettich'],['ball_bearing','Ball Bearing'],['blum_bottom_fix','Blum Bottom Fix'],['blum_motion_tip_on','Blum Motion'],['slyder_twin_wall','Slyder Twin Wall']].map(([k,v]) => (
                                <SelectItem key={k} value={k}>{v}</SelectItem>
                              ))
                          }
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {drawerSystem && (
                    <div className="grid grid-cols-2 gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <div className="space-y-1.5">
                        <Label>Number of drawers</Label>
                        <Input type="number" value={drawerCount} onChange={e => setDrawerCount(e.target.value)} min={1} max={6} />
                      </div>
                      <div className="self-end pb-1">
                        <p className="text-xs text-amber-700">{drawerSystem === 'hettich' ? '−60mm total' : '−24mm total'}</p>
                        <p className="text-xs font-mono text-amber-600">
                          Box ≈ {Math.max(0, widthNum - 36 - (drawerSystem === 'hettich' ? 60 : 24))}mm
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Larder */}
              {cabinetType === 'larder' && (
                <>
                  <Separator />
                  <div className="w-40 space-y-1.5">
                    <Label>Shelf count</Label>
                    <Input type="number" value={shelfCount} onChange={e => setShelfCount(e.target.value)} min={1} max={12} />
                    <p className="text-xs text-muted-foreground">K Carc default: 6</p>
                  </div>
                </>
              )}

              {/* Kitchen Accessories (base / wall / larder / l_corner) */}
              {cabinetType !== 'bedroom' && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Accessories</Label>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => addKitchenAccRow('accessory')} className="text-xs text-blue-600 hover:underline">+ Accessory</button>
                        <button type="button" onClick={() => addKitchenAccRow('hinge')} className="text-xs text-blue-600 hover:underline">+ Hinge</button>
                        <button type="button" onClick={() => addKitchenAccRow('handle')} className="text-xs text-blue-600 hover:underline">+ Handle</button>
                      </div>
                    </div>

                    {/* Column headers */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pb-0.5">
                      <span className="w-16 shrink-0 text-center text-muted-foreground/60">Type</span>
                      <span className="flex-1">Item</span>
                      <span className="w-20 text-center">Unit £</span>
                      <span className="w-16 text-center">Qty</span>
                      <span className="w-16 text-right">Total</span>
                      <span className="w-4"></span>
                    </div>

                    {kitchenAccessories.map((acc, idx) => {
                      const typeColor = acc.type === 'hinge' ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : acc.type === 'handle' ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200';
                      const lineTotal = Math.round(acc.unit * acc.qty * 100) / 100;
                      const options = acc.type === 'hinge' ? ALL_HINGES
                        : acc.type === 'handle' ? ALL_HANDLES
                        : ALL_ACCESSORIES;
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          {/* Type badge */}
                          <div className={`w-16 shrink-0 text-center text-xs px-1 py-0.5 rounded border ${typeColor}`}>
                            {acc.type}
                          </div>

                          {/* Name dropdown */}
                          <div className="flex-1 min-w-0">
                            <Select value={acc.name} onValueChange={v => updateKitchenAcc(idx, 'name', v)}>
                              <SelectTrigger className="h-8 text-xs w-full"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {options.map(o => (
                                  <SelectItem key={o.name} value={o.name} className="text-xs">{o.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Unit £ */}
                          <div className="w-20 shrink-0">
                            <Input
                              type="number" step="0.01"
                              value={acc.unit}
                              onChange={e => updateKitchenAcc(idx, 'unit', parseFloat(e.target.value) || 0)}
                              className="h-8 text-xs font-mono text-right w-full"
                            />
                          </div>

                          {/* Qty */}
                          <div className="w-16 shrink-0">
                            <Input
                              type="number"
                              value={acc.qty}
                              onChange={e => updateKitchenAcc(idx, 'qty', parseInt(e.target.value) || 0)}
                              min={0} max={99}
                              className="h-8 text-xs text-center w-full"
                            />
                          </div>

                          {/* Total */}
                          <span className="w-16 shrink-0 text-right text-xs font-mono text-muted-foreground">
                            £{lineTotal.toFixed(2)}
                          </span>

                          {/* Remove */}
                          <button type="button" onClick={() => removeKitchenAccRow(idx)}
                            className="w-4 shrink-0 text-muted-foreground hover:text-red-500 text-sm leading-none">×</button>
                        </div>
                      );
                    })}

                    <div className="flex justify-between text-xs font-medium border-t pt-1 mt-1">
                      <span>Accessories total</span>
                      <span className="font-mono">
                        £{kitchenAccessories.reduce((s, a) => s + a.unit * a.qty, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Bedroom */}
              {cabinetType === 'bedroom' && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Back type</Label>
                      <Select value={backType} onValueChange={(v: any) => handleBackTypeChange(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full">Full 18mm back</SelectItem>
                          <SelectItem value="8mm">8mm back (cheaper)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Adjustable shelves</Label>
                      <Input type="number" value={adjustableShelves} onChange={e => setAdjustableShelves(e.target.value)} min={0} max={10} />
                    </div>
                  </div>

                  {/* Accessories table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Accessories</Label>
                      <button type="button" onClick={addBedroomAcc} className="text-xs text-blue-600 hover:underline">+ Add row</button>
                    </div>
                    {/* Column headers — widths match row cells exactly */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pb-0.5">
                      <span className="flex-1">Item</span>
                      <span className="w-20 text-center">Unit £</span>
                      <span className="w-16 text-center">Qty</span>
                      <span className="w-16 text-right">Total</span>
                      <span className="w-4"></span>
                    </div>

                    {bedroomAccessories.map((acc, idx) => {
                      const cutLength = acc.name === 'Hanging Rail' && acc.qty > 0
                        ? Math.max(0, widthNum - 36 - 7) : null;
                      const lineTotal = Math.round(acc.unit_price * acc.qty * 100) / 100;
                      return (
                        <div key={idx} className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            {/* Name dropdown — fills remaining space */}
                            <div className="flex-1 min-w-0">
                              <Select value={acc.name} onValueChange={v => updateBedroomAcc(idx, 'name', v)}>
                                <SelectTrigger className="h-8 text-xs w-full"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {ALL_ACCESSORIES.map(a => (
                                    <SelectItem key={a.name} value={a.name} className="text-xs">{a.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Unit price — fixed width, right-aligned */}
                            <div className="w-20 shrink-0">
                              <Input
                                type="number" step="0.001"
                                value={acc.unit_price}
                                onChange={e => updateBedroomAcc(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                                className="h-8 text-xs font-mono text-right w-full"
                              />
                            </div>

                            {/* Qty — fixed width, centred */}
                            <div className="w-16 shrink-0">
                              <Input
                                type="number"
                                value={acc.qty}
                                onChange={e => updateBedroomAcc(idx, 'qty', parseInt(e.target.value) || 0)}
                                min={0} max={99}
                                className="h-8 text-xs text-center w-full"
                              />
                            </div>

                            {/* Line total */}
                            <span className="w-16 shrink-0 text-right text-xs font-mono text-muted-foreground">
                              £{lineTotal.toFixed(2)}
                            </span>

                            {/* Remove */}
                            <button
                              type="button"
                              onClick={() => removeBedroomAcc(idx)}
                              className="w-4 shrink-0 text-muted-foreground hover:text-red-500 text-sm leading-none"
                            >
                              ×
                            </button>
                          </div>

                          {cutLength !== null && (
                            <p className="text-xs text-amber-700 font-mono pl-1">
                              Cut length: {cutLength}mm (internal −7mm)
                            </p>
                          )}
                        </div>
                      );
                    })}
                    <div className="flex justify-between text-xs font-medium border-t pt-1 mt-1">
                      <span>Accessories total</span>
                      <span className="font-mono">
                        £{bedroomAccessories.reduce((s, a) => s + a.unit_price * a.qty, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </>
              )}

            </CardContent>
          </Card>
        </div>

        {/* ── Right: material + pricing + actions ── */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><PoundSterling className="h-4 w-4" /> Material &amp; Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>Board</Label>
                <Select value={boardCode} onValueChange={setBoardCode}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {refData
                      ? Object.entries(refData.board_codes).map(([k, v]: any) => (
                          <SelectItem key={k} value={k}>{k.replace(/_/g,' ')} — {v as string}</SelectItem>
                        ))
                      : [
                          ['EGGER    White MFC G 2-3','£9.66/m²'],['Egger         MFC G 4-5','£11.21/m²'],
                          ['Egger         MFC G 6-7','£12.59/m²'],['Egger      Perfect Gloss','£27.61/m²'],
                          ['Acrylic    White / Cream   G1','£30.33/m²'],['Alvic','£55.65/m²'],
                        ].map(([k,v]) => <SelectItem key={k} value={k}>{k} — {v}</SelectItem>)
                    }
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Edging</Label>
                <Select value={edgingCode} onValueChange={setEdgingCode}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {refData
                      ? Object.entries(refData.edging_codes).map(([k, v]: any) => (
                          <SelectItem key={k} value={k}>{k} — {v as string}</SelectItem>
                        ))
                      : [
                          ['Egger White MFC G3-7','£0.5333/m'],['Egger White MFC G8','£0.5333/m'],
                          ['Egger    Perfect  Gloss','£1.1333/m'],['Acrylic  Duo Edging','£1.1333/m'],
                        ].map(([k,v]) => <SelectItem key={k} value={k}>{k} — {v}</SelectItem>)
                    }
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Pricing tier</Label>
                <Select value={pricingTier} onValueChange={setPricingTier}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[['Trade Min','×2.0'],['Trade 2.5','×2.5'],['Retail 3','×3.0'],['Retail 3.5','×3.5'],['Retail 4','×4.0'],['Retail 5','×5.0']].map(([k,v]) => (
                      <SelectItem key={k} value={k}>{k} ({v})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="space-y-2">
                <Button onClick={handleCalculate} disabled={calculating || !height || !width} className="w-full" size="lg">
                  {calculating
                    ? <><Calculator className="mr-2 h-4 w-4 animate-spin" /> Calculating…</>
                    : <><Calculator className="mr-2 h-4 w-4" /> Calculate</>}
                </Button>
                {result && (
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm" onClick={handleSave}><Save className="mr-1 h-3 w-3" /> Save</Button>
                    <Button variant="outline" size="sm" onClick={exportCuttingList}><Download className="mr-1 h-3 w-3" /> Export Sheet</Button>
                    <Button variant="outline" size="sm" onClick={handleReset}><Trash2 className="mr-1 h-3 w-3" /> Reset</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Live cost summary */}
          {pricing && result && (
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="pt-4 space-y-2">
                <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Cost Summary</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Material</span><span className="font-mono">£{pricing.material_cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Hardware</span><span className="font-mono">£{pricing.hardware_cost.toFixed(2)}</span>
                  </div>
                  <Separator className="my-1" />
                  <div className="flex justify-between font-medium">
                    <span>Cost price</span><span className="font-mono">£{pricing.total_cost_price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-800 text-base">
                    <span>Sell ×{result.pricing.multiplier}</span>
                    <span className="font-mono">£{pricing.resale_price.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── Results ── */}
      {result && editSections.length > 0 && (
        <>
          {/* Summary strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total panels',  value: editSections.reduce((s, sec) => s + sec.items.reduce((ss, i) => ss + i.quantity, 0), 0) },
              { label: 'Total area',    value: `${editSections.reduce((s, sec) => s + sec.items.reduce((ss, i) => ss + i.area_m2 * i.quantity, 0), 0).toFixed(2)} m²` },
              { label: 'H × W × D',    value: `${result.dimensions.height}×${result.dimensions.width}×${result.dimensions.depth}` },
              { label: result.summary.drawer_count ? 'Drawers' : 'Doors', value: result.summary.drawer_count || result.summary.door_count || '—' },
            ].map(({ label, value }) => (
              <Card key={label}><CardContent className="pt-4 pb-3">
                <div className="text-xl font-bold font-mono">{value}</div>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </CardContent></Card>
            ))}
          </div>

          {/* Hanging rail callout */}
          {result.summary.hanging_rail_cut_length && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
              <Hammer className="h-4 w-4 text-amber-600 shrink-0" />
              <span><strong>Hanging rail cut length:</strong> <span className="font-mono">{result.summary.hanging_rail_cut_length}mm</span><span className="text-muted-foreground ml-2">(×{result.summary.hanging_rails})</span></span>
            </div>
          )}

          {/* View toggle */}
          <div className="flex gap-2 border-b pb-2">
            <Button variant={activeView === 'cutting' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveView('cutting')}>
              <FileText className="mr-1.5 h-3.5 w-3.5" /> Cutting List
            </Button>
            <Button variant={activeView === 'components' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveView('components')}>
              <Package className="mr-1.5 h-3.5 w-3.5" /> Components
            </Button>
          </div>

          {/* ── CUTTING LIST (editable) ── */}
          {activeView === 'cutting' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                All dimensions, quantities, and prices are editable — totals update live.
              </p>

              {editSections.map((section, secIdx) => {
                const collapsed = collapsedSections.has(section.category);
                const colour = SECTION_COLORS[section.category] ?? 'bg-slate-700';
                const totalPcs = section.items.reduce((s, i) => s + i.quantity, 0);
                return (
                  <Card key={secIdx} className="overflow-hidden">
                    <button
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-white font-semibold text-sm ${colour}`}
                      onClick={() => toggleSection(section.category)}
                    >
                      <span className="flex items-center gap-2">
                        <Layers className="h-3.5 w-3.5" />
                        {section.category}
                        <span className="font-normal opacity-70 text-xs">({totalPcs} pcs)</span>
                      </span>
                      {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    {!collapsed && (
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/40 text-xs">
                            <TableHead className="w-8 py-2">#</TableHead>
                            <TableHead className="py-2 w-28">Panel</TableHead>
                            <TableHead className="py-2 w-24 text-center">L (mm)</TableHead>
                            <TableHead className="py-2 w-24 text-center">W (mm)</TableHead>
                            <TableHead className="py-2 w-16 text-center">Qty</TableHead>
                            <TableHead className="py-2">Material</TableHead>
                            <TableHead className="py-2">Notes</TableHead>
                            <TableHead className="text-right py-2 w-20">Area m²</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {section.items.map((item, rowIdx) => (
                            <TableRow key={rowIdx} className="text-sm">
                              <TableCell className="font-mono text-xs text-muted-foreground py-1">{item.line_number}</TableCell>
                              <TableCell className="font-medium py-1 text-sm">{item.name}</TableCell>
                              <TableCell className="py-1">
                                <EditNum value={item.dimension_l} onChange={v => updateRow(secIdx, rowIdx, 'dimension_l', v)} />
                              </TableCell>
                              <TableCell className="py-1">
                                <EditNum value={item.dimension_w} onChange={v => updateRow(secIdx, rowIdx, 'dimension_w', v)} />
                              </TableCell>
                              <TableCell className="py-1">
                                <EditNum value={item.quantity} onChange={v => updateRow(secIdx, rowIdx, 'quantity', Math.max(1, Math.round(v)))} />
                              </TableCell>
                              <TableCell className="py-1">
                                {item.material && <Badge variant="outline" className="text-xs font-mono">{item.material}</Badge>}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground py-1">{item.notes}</TableCell>
                              <TableCell className="text-right font-mono text-xs py-1 font-semibold">
                                {item.area_m2.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </Card>
                );
              })}

              {/* Accessories (editable — for non-bedroom or after calc) */}
              {editAccessories.length > 0 && (
                <Card>
                  <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-sm">Accessories</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 text-xs">
                          <TableHead className="py-2">Item</TableHead>
                          <TableHead className="py-2 w-28 text-right">Unit £</TableHead>
                          <TableHead className="py-2 w-8"></TableHead>
                          <TableHead className="py-2 w-20 text-center">Qty</TableHead>
                          <TableHead className="py-2 w-24 text-right">Total £</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {editAccessories.map((acc, idx) => (
                          <TableRow key={idx} className="text-sm">
                            <TableCell className="font-medium py-1">{acc.name}</TableCell>
                            <TableCell className="py-1 w-28">
                              <Input
                                type="number" step="0.001"
                                value={acc.unit_price}
                                onChange={e => updateAccessory(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                                className="h-7 text-xs font-mono text-right border-dashed focus:border-solid"
                              />
                            </TableCell>
                            <TableCell className="py-1 text-center text-muted-foreground text-xs">×</TableCell>
                            <TableCell className="py-1 w-20">
                              <Input
                                type="number"
                                value={acc.qty}
                                onChange={e => updateAccessory(idx, 'qty', parseInt(e.target.value) || 0)}
                                min={0}
                                className="h-7 text-xs font-mono text-center border-dashed focus:border-solid"
                              />
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs py-1 font-semibold">
                              £{(acc.unit_price * acc.qty).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/30 font-semibold">
                          <TableCell colSpan={4} className="py-2 text-sm">Accessories total</TableCell>
                          <TableCell className="text-right font-mono py-2">
                            £{editAccessories.reduce((s, a) => s + a.unit_price * a.qty, 0).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Material summary */}
              {summary && (
                <Card>
                  <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-sm">Material Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {summary.material_breakdown.map(mat => (
                        <div key={mat.material} className="border rounded-lg px-3 py-2 text-center">
                          <div className="text-lg font-bold">{mat.pieces}</div>
                          <div className="text-xs font-mono text-muted-foreground truncate">{mat.material}</div>
                          <div className="text-xs text-muted-foreground">{mat.area_m2.toFixed(2)} m²</div>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-3 bg-slate-50 rounded-lg p-3 text-sm">
                      <div><div className="font-bold">{summary.estimated_sheets_18mm}</div><div className="text-xs text-muted-foreground">18mm sheets</div></div>
                      {summary.estimated_sheets_8mm > 0 && (
                        <div><div className="font-bold">{summary.estimated_sheets_8mm}</div><div className="text-xs text-muted-foreground">8mm sheets</div></div>
                      )}
                      <div><div className="font-bold">{summary.estimated_sheets_6mm}</div><div className="text-xs text-muted-foreground">6mm sheets</div></div>
                      <div><div className="font-bold font-mono">{summary.total_area_18mm.toFixed(2)} m²</div><div className="text-xs text-muted-foreground">18mm area</div></div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ── COMPONENT VIEW ── */}
          {activeView === 'components' && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{result.cabinet_type} — All Components</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 text-xs">
                      <TableHead className="py-2">Component</TableHead>
                      <TableHead className="text-right py-2">L (mm)</TableHead>
                      <TableHead className="text-right py-2">W (mm)</TableHead>
                      <TableHead className="text-right py-2">m²</TableHead>
                      <TableHead className="text-center py-2">Qty</TableHead>
                      <TableHead className="py-2">Material</TableHead>
                      <TableHead className="py-2">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {['carcass','backs','shelves'].flatMap(cat =>
                      (result.components[cat] ?? []).map((comp: any, idx: number) => (
                        <TableRow key={`${cat}-${idx}`} className="text-sm">
                          <TableCell className="font-medium py-2">{comp.name}</TableCell>
                          <TableCell className="text-right font-mono py-2">{comp.panel_l}</TableCell>
                          <TableCell className="text-right font-mono py-2">{comp.panel_w}</TableCell>
                          <TableCell className="text-right font-mono py-2">
                            {(Math.ceil((comp.panel_l * comp.panel_w) / 1_000_000 * 100) / 100).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center font-bold py-2">{comp.quantity}</TableCell>
                          <TableCell className="py-2"><Badge variant="outline" className="text-xs">{comp.material}</Badge></TableCell>
                          <TableCell className="text-xs text-muted-foreground py-2">{comp.notes}</TableCell>
                        </TableRow>
                      ))
                    )}
                    {(result.components.doors ?? []).map((comp: any, idx: number) => (
                      <TableRow key={`door-${idx}`} className="text-sm bg-stone-50">
                        <TableCell className="font-medium py-2">
                          <DoorOpen className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" />{comp.name}
                        </TableCell>
                        <TableCell className="text-right font-mono py-2">{comp.panel_l}</TableCell>
                        <TableCell className="text-right font-mono py-2">{comp.panel_w}</TableCell>
                        <TableCell className="text-right font-mono py-2">
                          {(Math.ceil((comp.panel_l * comp.panel_w) / 1_000_000 * 100) / 100).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center font-bold py-2">{comp.quantity}</TableCell>
                        <TableCell className="py-2"><Badge variant="outline" className="text-xs">{comp.material}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground py-2">{comp.notes}</TableCell>
                      </TableRow>
                    ))}
                    {(result.components.hardware ?? []).map((hw: any, idx: number) => (
                      <TableRow key={`hw-${idx}`} className="text-sm bg-blue-50/40">
                        <TableCell className="font-medium py-2 text-blue-800">{hw.name}</TableCell>
                        <TableCell colSpan={3} className="text-xs text-muted-foreground py-2">{hw.notes}</TableCell>
                        <TableCell className="text-center font-bold py-2">{hw.quantity}</TableCell>
                        <TableCell colSpan={2} />
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ── Empty state ── */}
      {!result && (
        <Card><CardContent className="pt-6">
          <div className="text-center py-10">
            <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium mb-1">No calculation yet</p>
            <p className="text-sm text-muted-foreground">Set dimensions, material, and pricing tier then click Calculate.</p>
            <div className="mt-5 text-xs text-muted-foreground font-mono space-y-0.5 inline-block text-left bg-muted/40 rounded p-3">
              <p>Gable:     H × D</p>
              <p>Base:      (W−36) × (D−70)</p>
              <p>Top rail:  (W−36) × 100</p>
              <p>Back:      H × (W−36)</p>
              <p>Shelf:     (W−36) × (D−140)</p>
              <p>Hettich:   internal −60mm</p>
              <p>Ball brg:  internal −24mm</p>
              <p>Hang rail: internal −7mm</p>
            </div>
          </div>
        </CardContent></Card>
      )}

      </>)}

      {/* ══ DOOR PRICE CALCULATOR ══ */}
      {pageMode === 'door' && (
      <div className="space-y-6">
        <div>
          <p className="text-xs text-muted-foreground mb-4">
            B Carc — Door Prices section · Board cost only · Edging £0 (billed by supplier) · Default Retail 5
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: door dimensions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Ruler className="h-4 w-4" /> Door Dimensions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* H × W × Qty */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground font-mono">Height (mm) *</Label>
                    <Input
                      type="number"
                      value={doorHeight}
                      onChange={e => setDoorHeight(e.target.value)}
                      className="font-semibold"
                      placeholder="2600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground font-mono">Width (mm) *</Label>
                    <Input
                      type="number"
                      value={doorWidth}
                      onChange={e => setDoorWidth(e.target.value)}
                      className="font-semibold"
                      placeholder="550"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground font-mono">Depth (mm)</Label>
                    <Input
                      type="number"
                      value={doorDepth}
                      onChange={e => setDoorDepth(e.target.value)}
                      className="font-semibold"
                      placeholder="18"
                    />
                    <p className="text-xs text-muted-foreground">Reference only</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground font-mono">Quantity</Label>
                    <Input
                      type="number"
                      value={doorQty}
                      onChange={e => setDoorQty(e.target.value)}
                      min={1} max={99}
                      className="font-semibold"
                    />
                  </div>
                </div>

                {/* Result row — shown inline after calculation */}
                {doorResult && (
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      Door — Cutting List Row
                    </p>
                    <div className="grid grid-cols-6 gap-2 text-xs font-mono">
                      {[
                        { label: 'Panel L', value: doorResult.dimensions.height },
                        { label: 'Panel W', value: doorResult.dimensions.width },
                        { label: 'Depth',   value: doorResult.dimensions.depth ?? 18 },
                        { label: 'm²',      value: doorResult.area_m2.toFixed(2) },
                        { label: 'Edging L', value: `${doorResult.edging_length_m}m` },
                        { label: 'Qty',      value: doorResult.quantity },
                      ].map(({ label, value }) => (
                        <div key={label} className="text-center">
                          <div className="text-muted-foreground mb-0.5">{label}</div>
                          <div className="font-bold text-sm">{value}</div>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-3" />

                    <div className="grid grid-cols-4 gap-2 text-xs">
                      {[
                        { label: 'Panel Cost',   value: `£${doorResult.panel_cost.toFixed(2)}` },
                        { label: 'Edging Cost',  value: `£${doorResult.edging_cost.toFixed(2)}` },
                        { label: 'Total Cost',   value: `£${doorResult.total_cost_price.toFixed(2)}` },
                        { label: `Resale ×${doorResult.multiplier}`, value: `£${doorResult.resale_price.toFixed(2)}`, highlight: true },
                      ].map(({ label, value, highlight }) => (
                        <div key={label} className={`rounded p-2 text-center ${highlight ? 'bg-emerald-100 border border-emerald-300' : 'bg-white border'}`}>
                          <div className="text-muted-foreground text-xs mb-0.5">{label}</div>
                          <div className={`font-bold text-sm font-mono ${highlight ? 'text-emerald-800' : ''}`}>{value}</div>
                        </div>
                      ))}
                    </div>

                    <p className="text-xs text-amber-600 mt-2 italic">
                      ⚠ Edging cost £0.00 — door edging billed by supplier separately
                    </p>
                  </div>
                )}

              </CardContent>
            </Card>
          </div>

          {/* Right: board / edging / tier */}
          <div>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <PoundSterling className="h-4 w-4" /> Material &amp; Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">

                <div className="space-y-1.5">
                  <Label>Board</Label>
                  <Select value={doorBoard} onValueChange={setDoorBoard}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {refData
                        ? Object.entries(refData.board_codes).map(([k, v]: any) => (
                            <SelectItem key={k} value={k}>{k.trim()} — {v as string}</SelectItem>
                          ))
                        : [
                            ['Egger         MFC G 4-5', '£11.21/m²'],
                            ['EGGER    White MFC G 2-3', '£9.66/m²'],
                            ['Egger      Perfect Gloss', '£27.61/m²'],
                            ['Alvic', '£55.65/m²'],
                          ].map(([k,v]) => <SelectItem key={k} value={k}>{k.trim()} — {v}</SelectItem>)
                      }
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Edging finish</Label>
                  <Select value={doorEdging} onValueChange={setDoorEdging}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {refData
                        ? Object.entries(refData.edging_codes).map(([k, v]: any) => (
                            <SelectItem key={k} value={k}>{k.trim()} — {v as string}</SelectItem>
                          ))
                        : [
                            ['Egger    Perfect  Gloss', '£1.1333/m'],
                            ['Egger    Perfect  Matt',  '£1.1333/m'],
                            ['Egger White MFC G8',      '£0.5333/m'],
                            ['Acrylic  Duo Edging',     '£1.1333/m'],
                          ].map(([k,v]) => <SelectItem key={k} value={k}>{k.trim()} — {v}</SelectItem>)
                      }
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Label only — edging cost is £0</p>
                </div>

                <div className="space-y-1.5">
                  <Label>Pricing tier</Label>
                  <Select value={doorTier} onValueChange={setDoorTier}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[['Trade Min','×2.0'],['Trade 2.5','×2.5'],['Retail 3','×3.0'],['Retail 3.5','×3.5'],['Retail 4','×4.0'],['Retail 5','×5.0']].map(([k,v]) => (
                        <SelectItem key={k} value={k}>{k} ({v})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <Button
                  onClick={handleDoorCalculate}
                  disabled={doorCalculating || !doorHeight || !doorWidth}
                  className="w-full"
                  size="lg"
                >
                  {doorCalculating
                    ? <><Calculator className="mr-2 h-4 w-4 animate-spin" /> Calculating…</>
                    : <><Calculator className="mr-2 h-4 w-4" /> Calculate Door Price</>}
                </Button>

                {/* Cost summary card */}
                {doorResult && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 space-y-1.5">
                    <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Cost Summary</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Area</span>
                        <span className="font-mono">{doorResult.area_m2.toFixed(2)} m²</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Board cost</span>
                        <span className="font-mono">£{doorResult.panel_cost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Edging</span>
                        <span className="font-mono text-amber-600">£0.00 (supplier)</span>
                      </div>
                      <Separator className="my-1" />
                      <div className="flex justify-between font-medium">
                        <span>Cost price</span>
                        <span className="font-mono">£{doorResult.total_cost_price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-800 text-base">
                        <span>Sell ×{doorResult.multiplier}</span>
                        <span className="font-mono">£{doorResult.resale_price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>
          </div>

        </div>
      </div>
      )}

    </div>
  );
}