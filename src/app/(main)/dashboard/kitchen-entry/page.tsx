'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Calculator, Plus, Trash2, FileText, Download,
  Layers, ChevronDown, ChevronRight, Package,
  PoundSterling, Ruler, LayoutList,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

type UnitType = 'base' | 'wall' | 'larder' | 'l_corner';

const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  base:     'Kitchen Base',
  wall:     'Kitchen Wall',
  larder:   'Larder / Tall',
  l_corner: 'L Corner',
};

const UNIT_TYPE_HEIGHTS: Record<UnitType, string> = {
  base:     '720',
  wall:     '720',
  larder:   '1970',
  l_corner: '720',
};

interface AccRow { name: string; unit: number; qty: number; type: 'accessory' | 'hinge' | 'handle'; }

interface KitchenUnit {
  id:                string;
  type:              UnitType;
  label:             string;
  height:            string;
  width:             string;
  adjustable_shelves:string;
  shelf_count:       string;
  drawer_system:     string;
  drawer_count:      string;
  accessories:       AccRow[];
}

interface UnitSummary {
  index:       number;
  label:       string;
  type:        string;
  height:      number;
  width:       number;
  cost_price:  number;
  resale_price:number;
}

interface KitchenResult {
  project_name:           string;
  unit_count:             number;
  unit_summaries:         UnitSummary[];
  cutting_list_formatted: Array<{ category: string; items: any[] }>;
  material_summary:       any;
  pricing: {
    board_name:         string;
    board_cost_m2:      number;
    edging_name:        string;
    pricing_tier:       string;
    multiplier:         number;
    total_cost_price:   number;
    total_resale_price: number;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

let _uid = 0;
const uid = () => `unit_${Date.now()}_${_uid++}`;

const SECTION_COLORS: Record<string, string> = {
  'GABLE':               'bg-slate-800',
  'T/B & FIX SHELVES':  'bg-slate-700',
  'S/H':                 'bg-slate-700',
  'BACKS':               'bg-slate-600',
  'END PANELS & INFILLS':'bg-slate-600',
  'BRACES':              'bg-slate-500',
  'DOORS & DRAW FACES':  'bg-stone-700',
  'DRAWS':               'bg-stone-700',
};

const ALL_ACCESSORIES = [
  { name: 'Legs 150',                            unit: 5.00,  type: 'accessory' as const },
  { name: 'Legs 100',                            unit: 4.00,  type: 'accessory' as const },
  { name: 'Shelf Pegs Plastic',                  unit: 0.12,  type: 'accessory' as const },
  { name: 'Shelf Pegs Metal Hafele 282.24.710',  unit: 0.147, type: 'accessory' as const },
  { name: 'Hanger plate',                        unit: 0.40,  type: 'accessory' as const },
  { name: 'Cabinet hanger set',                  unit: 2.00,  type: 'accessory' as const },
];
const ALL_HINGES  = [
  { name: 'Overlay Splung',    unit: 5.00, type: 'hinge' as const },
  { name: 'Overlay Unsprung',  unit: 5.00, type: 'hinge' as const },
  { name: 'Overlay Softclose', unit: 5.00, type: 'hinge' as const },
  { name: 'Inset Sprung',      unit: 5.00, type: 'hinge' as const },
  { name: 'Inset Unsprung',    unit: 5.00, type: 'hinge' as const },
  { name: 'Inset Softclose',   unit: 5.00, type: 'hinge' as const },
];
const ALL_HANDLES = [{ name: 'sample', unit: 5.00, type: 'handle' as const }];

const DEFAULT_ACCESSORIES: Record<UnitType, AccRow[]> = {
  base:     [
    { name: 'Legs 150',          unit: 5.00, qty: 0, type: 'accessory' },
    { name: 'Shelf Pegs Plastic',unit: 0.12, qty: 0, type: 'accessory' },
    { name: 'Overlay Splung',    unit: 5.00, qty: 0, type: 'hinge'     },
    { name: 'sample',            unit: 5.00, qty: 0, type: 'handle'    },
  ],
  wall:     [
    { name: 'Shelf Pegs Plastic',  unit: 0.12, qty: 0, type: 'accessory' },
    { name: 'Hanger plate',        unit: 0.40, qty: 0, type: 'accessory' },
    { name: 'Cabinet hanger set',  unit: 2.00, qty: 0, type: 'accessory' },
    { name: 'Overlay Splung',      unit: 5.00, qty: 0, type: 'hinge'     },
    { name: 'sample',              unit: 5.00, qty: 0, type: 'handle'    },
  ],
  larder:   [
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

function makeUnit(type: UnitType = 'base'): KitchenUnit {
  return {
    id: uid(), type,
    label:              '',
    height:             UNIT_TYPE_HEIGHTS[type],
    width:              '1200',
    adjustable_shelves: type === 'wall' ? '2' : '1',
    shelf_count:        '6',
    drawer_system:      '',
    drawer_count:       '2',
    accessories:        DEFAULT_ACCESSORIES[type].map(a => ({ ...a })),
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function KitchenEntryPage() {
  const [refData, setRefData]         = useState<any>(null);
  const [projectName, setProjectName] = useState('');
  const [boardCode, setBoardCode]     = useState('Egger         MFC G 4-5');
  const [edgingCode, setEdgingCode]   = useState('Egger White MFC G8');
  const [pricingTier, setPricingTier] = useState('Retail 3.5');

  const [units, setUnits]             = useState<KitchenUnit[]>([makeUnit('base')]);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(units[0].id);
  const [calculating, setCalculating] = useState(false);
  const [result, setResult]           = useState<KitchenResult | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.get('/api/manual-cabinet/reference').then((r: any) => { if (r.success) setRefData(r); }).catch(() => {});
  }, []);

  // ── Unit operations ────────────────────────────────────────────────────────

  const addUnit = (type: UnitType = 'base') => {
    const u = makeUnit(type);
    setUnits(prev => [...prev, u]);
    setExpandedUnit(u.id);
  };

  const removeUnit = (id: string) => {
    setUnits(prev => {
      const next = prev.filter(u => u.id !== id);
      return next.length ? next : [makeUnit('base')];
    });
    if (expandedUnit === id) setExpandedUnit(null);
  };

  const updateUnit = (id: string, field: keyof KitchenUnit, value: any) => {
    setUnits(prev => prev.map(u => {
      if (u.id !== id) return u;
      const next = { ...u, [field]: value };
      // When type changes, reset height and accessories
      if (field === 'type') {
        next.height      = UNIT_TYPE_HEIGHTS[value as UnitType];
        next.accessories = DEFAULT_ACCESSORIES[value as UnitType].map(a => ({ ...a }));
        next.adjustable_shelves = value === 'wall' ? '2' : '1';
      }
      return next;
    }));
  };

  const updateUnitAcc = (unitId: string, idx: number, field: keyof AccRow, value: any) => {
    setUnits(prev => prev.map(u => {
      if (u.id !== unitId) return u;
      const accs = u.accessories.map((a, i) => {
        if (i !== idx) return a;
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

  // ── Calculate ──────────────────────────────────────────────────────────────

  const handleCalculate = async () => {
    if (units.length === 0) { toast.error('Add at least one unit'); return; }
    setCalculating(true);
    try {
      const payload = {
        project_name: projectName || 'Kitchen',
        board_name:   boardCode,
        edging_name:  edgingCode,
        pricing_tier: pricingTier,
        units: units.map(u => {
          const base: any = {
            type:              u.type,
            label:             u.label || UNIT_TYPE_LABELS[u.type],
            height:            parseFloat(u.height),
            width:             parseFloat(u.width),
            adjustable_shelves:parseInt(u.adjustable_shelves) || 1,
            shelf_count:       parseInt(u.shelf_count) || 6,
            accessories:       u.accessories.map(a => ({ name: a.name, qty: a.qty })),
          };
          if (u.type === 'base' && u.drawer_system) {
            base.drawer_system = u.drawer_system;
            base.drawer_count  = parseInt(u.drawer_count) || 1;
          }
          return base;
        }),
      };
      const r = await api.post('/api/manual-cabinet/calculate-kitchen', payload);
      if (r.success) {
        setResult(r.result);
        setCollapsedSections(new Set());
        toast.success(`Kitchen calculated — ${r.result.unit_count} units, ${r.result.cutting_list_formatted?.reduce((s: number, sec: any) => s + sec.items.length, 0)} rows`);
      } else {
        toast.error(r.error || 'Calculation failed');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed');
    } finally {
      setCalculating(false);
    }
  };

  // ── Export ─────────────────────────────────────────────────────────────────

  const handleExport = () => {
    if (!result) return;
    const payload = {
      cabinet_type:  'Kitchen',
      project_name:  result.project_name,
      customer_name: '',
      carcase_wood:  result.pricing.board_name,
      date:          new Date().toLocaleDateString('en-GB'),
      sections:      result.cutting_list_formatted.map(sec => ({
        category: sec.category,
        items:    sec.items.map(item => ({
          name:        item.unit_label ? `[${item.unit_label}] ${item.name || ''}` : (item.name || ''),
          dimension_l: item.dimension_l,
          dimension_w: item.dimension_w,
          quantity:    item.quantity,
        })),
      })),
      accessories:      [],
      material_summary: result.material_summary,
    };
    sessionStorage.setItem('cutting_list_preview_data', JSON.stringify(payload));
    window.open('/dashboard/cutting-list-preview', '_blank');
    toast.success('Opening cutting list preview...');
  };

  const toggleSection = (cat: string) =>
    setCollapsedSections(prev => { const n = new Set(prev); n.has(cat) ? n.delete(cat) : n.add(cat); return n; });

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kitchen Entry</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Add all units for this kitchen — one combined cutting list at the end
          </p>
        </div>
        {result && (
          <Button onClick={handleExport} className="gap-2">
            <FileText className="h-4 w-4" /> Preview &amp; Export
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Material + Calculate ── */}
        <div className="space-y-4">

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <PoundSterling className="h-4 w-4" /> Material &amp; Pricing
              </CardTitle>
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
                    {refData
                      ? Object.entries(refData.board_codes).map(([k, v]: any) => (
                          <SelectItem key={k} value={k}>{k.trim()} — {v}</SelectItem>
                        ))
                      : [['Egger         MFC G 4-5','£11.21'],['EGGER    White MFC G 2-3','£9.66'],['Alvic','£55.65']].map(([k,v]) => (
                          <SelectItem key={k} value={k}>{k.trim()} — {v}</SelectItem>
                        ))
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
                          <SelectItem key={k} value={k}>{k.trim()} — {v}</SelectItem>
                        ))
                      : [['Egger White MFC G8','£0.533/m'],['Saviola','£1.133/m']].map(([k,v]) => (
                          <SelectItem key={k} value={k}>{k.trim()} — {v}</SelectItem>
                        ))
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
              <Button
                className="w-full" size="lg"
                onClick={handleCalculate}
                disabled={calculating || units.length === 0}
              >
                {calculating
                  ? <><Calculator className="mr-2 h-4 w-4 animate-spin" />Calculating…</>
                  : <><Calculator className="mr-2 h-4 w-4" />Generate Cutting List</>
                }
              </Button>
            </CardContent>
          </Card>

          {/* Cost summary */}
          {result && (
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="pt-4 space-y-3">
                <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Kitchen Total</p>
                <div className="space-y-1 text-sm">
                  {result.unit_summaries.map(u => (
                    <div key={u.index} className="flex justify-between text-muted-foreground">
                      <span className="truncate mr-2">{u.label}</span>
                      <span className="font-mono shrink-0">£{u.cost_price.toFixed(2)}</span>
                    </div>
                  ))}
                  <Separator className="my-1" />
                  <div className="flex justify-between font-medium">
                    <span>Cost price</span>
                    <span className="font-mono">£{result.pricing.total_cost_price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-800 text-base">
                    <span>Sell ×{result.pricing.multiplier}</span>
                    <span className="font-mono">£{result.pricing.total_resale_price.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right: Unit Builder ── */}
        <div className="lg:col-span-2 space-y-3">

          {/* Add unit buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground font-medium mr-1">Add unit:</span>
            {(Object.keys(UNIT_TYPE_LABELS) as UnitType[]).map(type => (
              <Button key={type} variant="outline" size="sm" onClick={() => addUnit(type)}>
                <Plus className="mr-1 h-3 w-3" />{UNIT_TYPE_LABELS[type]}
              </Button>
            ))}
          </div>

          {/* Unit list */}
          {units.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">
              No units yet — add a base or wall unit above
            </CardContent></Card>
          ) : (
            units.map((unit, idx) => {
              const isExpanded = expandedUnit === unit.id;
              const label = unit.label || UNIT_TYPE_LABELS[unit.type];
              return (
                <Card key={unit.id} className="overflow-hidden">
                  {/* Unit header */}
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedUnit(isExpanded ? null : unit.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-800 text-white text-xs flex items-center justify-center font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-semibold text-sm">{label}</span>
                        <span className="text-muted-foreground text-xs ml-2">
                          {UNIT_TYPE_LABELS[unit.type]} · {unit.height} × {unit.width}mm
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); removeUnit(unit.id); }}
                        className="text-muted-foreground hover:text-red-500 transition p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </button>

                  {/* Unit form */}
                  {isExpanded && (
                    <CardContent className="pt-0 pb-4 space-y-4 border-t">

                      {/* Type + Label */}
                      <div className="grid grid-cols-2 gap-3 pt-3">
                        <div className="space-y-1.5">
                          <Label>Unit type</Label>
                          <Select value={unit.type} onValueChange={v => updateUnit(unit.id, 'type', v as UnitType)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {(Object.entries(UNIT_TYPE_LABELS) as [UnitType, string][]).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Label (optional)</Label>
                          <Input
                            placeholder={`e.g. Boiler Room, Island…`}
                            value={unit.label}
                            onChange={e => updateUnit(unit.id, 'label', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Dimensions */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground font-mono">Height (mm)</Label>
                          <Input type="number" value={unit.height} onChange={e => updateUnit(unit.id, 'height', e.target.value)} className="font-semibold" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground font-mono">Width (mm)</Label>
                          <Input type="number" value={unit.width} onChange={e => updateUnit(unit.id, 'width', e.target.value)} className="font-semibold" />
                          {unit.type === 'base' && (
                            <p className="text-xs text-muted-foreground">
                              {parseInt(unit.width) >= 600 ? '→ 2 doors' : '→ 1 door'}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Type-specific options */}
                      {(unit.type === 'base' || unit.type === 'wall') && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label>Adjustable shelves</Label>
                            <Input type="number" min={0} max={10} value={unit.adjustable_shelves}
                              onChange={e => updateUnit(unit.id, 'adjustable_shelves', e.target.value)} />
                          </div>
                          {unit.type === 'base' && (
                            <div className="space-y-1.5">
                              <Label>Drawer system</Label>
                              <Select value={unit.drawer_system || '__none__'}
                                onValueChange={v => updateUnit(unit.id, 'drawer_system', v === '__none__' ? '' : v)}>
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
                            onChange={e => updateUnit(unit.id, 'shelf_count', e.target.value)} />
                        </div>
                      )}

                      {/* Accessories */}
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold">Accessories</Label>
                          <div className="flex gap-1.5">
                            {(['accessory','hinge','handle'] as const).map(t => (
                              <button key={t} onClick={() => {
                                const defaults = t === 'hinge' ? ALL_HINGES : t === 'handle' ? ALL_HANDLES : ALL_ACCESSORIES;
                                const d = defaults[0];
                                setUnits(prev => prev.map(u => u.id !== unit.id ? u : {
                                  ...u, accessories: [...u.accessories, { name: d.name, unit: d.unit, qty: 0, type: t }]
                                }));
                              }} className="text-[10px] text-blue-500 hover:text-blue-700 border border-blue-200 rounded px-1.5 py-0.5">
                                + {t}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Acc table header */}
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="w-14 shrink-0 text-center">Type</span>
                          <span className="flex-1">Item</span>
                          <span className="w-16 text-center">Unit £</span>
                          <span className="w-14 text-center">Qty</span>
                          <span className="w-4"></span>
                        </div>

                        {unit.accessories.map((acc, accIdx) => {
                          const typeColor = acc.type === 'hinge'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : acc.type === 'handle'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200';
                          const options = acc.type === 'hinge' ? ALL_HINGES : acc.type === 'handle' ? ALL_HANDLES : ALL_ACCESSORIES;
                          return (
                            <div key={accIdx} className="flex items-center gap-2">
                              <div className={`w-14 shrink-0 text-center text-[9px] px-1 py-0.5 rounded border ${typeColor}`}>
                                {acc.type}
                              </div>
                              <div className="flex-1 min-w-0">
                                <Select value={acc.name} onValueChange={v => updateUnitAcc(unit.id, accIdx, 'name', v)}>
                                  <SelectTrigger className="h-7 text-xs w-full"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {options.map(o => <SelectItem key={o.name} value={o.name} className="text-xs">{o.name}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Input type="number" step="0.01" value={acc.unit}
                                onChange={e => updateUnitAcc(unit.id, accIdx, 'unit', parseFloat(e.target.value) || 0)}
                                className="w-16 h-7 text-xs font-mono text-right shrink-0" />
                              <Input type="number" min={0} value={acc.qty}
                                onChange={e => updateUnitAcc(unit.id, accIdx, 'qty', parseInt(e.target.value) || 0)}
                                className="w-14 h-7 text-xs text-center shrink-0" />
                              <button onClick={() => setUnits(prev => prev.map(u => u.id !== unit.id ? u : {
                                ...u, accessories: u.accessories.filter((_, i) => i !== accIdx)
                              }))} className="text-muted-foreground hover:text-red-400 w-4 text-sm">×</button>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* ── Combined Cutting List Result ── */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <h2 className="text-lg font-bold">Combined Cutting List</h2>
              <p className="text-sm text-muted-foreground">
                {result.unit_count} units · {result.cutting_list_formatted.reduce((s, sec) => s + sec.items.length, 0)} total rows
              </p>
            </div>
            <Button onClick={handleExport} className="gap-2">
              <FileText className="h-4 w-4" /> Preview &amp; Export PDF
            </Button>
          </div>

          {/* Unit legend */}
          <div className="flex flex-wrap gap-2">
            {result.unit_summaries.map(u => (
              <Badge key={u.index} variant="outline" className="gap-1">
                <span className="font-bold text-slate-800">{u.index}</span>
                {u.label}
                <span className="text-muted-foreground">·</span>
                <span className="font-mono">£{u.resale_price.toFixed(2)}</span>
              </Badge>
            ))}
          </div>

          {/* Cutting list sections */}
          {result.cutting_list_formatted.map((section, secIdx) => {
            const collapsed = collapsedSections.has(section.category);
            const colour = SECTION_COLORS[section.category] ?? 'bg-slate-700';
            const totalPcs = section.items.reduce((s: number, i: any) => s + (i.quantity || 0), 0);
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
                      {section.items.map((item: any, rowIdx: number) => (
                        <TableRow key={rowIdx} className={`text-sm ${rowIdx % 2 === 0 ? '' : 'bg-muted/20'}`}>
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
                            {typeof item.area_m2 === 'number' ? item.area_m2.toFixed(2) : '—'}
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
          {result.material_summary && (
            <Card>
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="h-4 w-4" /> Material Summary — Whole Kitchen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 bg-slate-50 rounded-lg p-3 text-sm">
                  <div>
                    <div className="text-xl font-bold">{result.material_summary.estimated_sheets_18mm || 0}</div>
                    <div className="text-xs text-muted-foreground">18mm sheets</div>
                  </div>
                  {(result.material_summary.estimated_sheets_8mm || 0) > 0 && (
                    <div>
                      <div className="text-xl font-bold">{result.material_summary.estimated_sheets_8mm}</div>
                      <div className="text-xs text-muted-foreground">8mm sheets</div>
                    </div>
                  )}
                  <div>
                    <div className="text-xl font-bold">{result.material_summary.estimated_sheets_6mm || 0}</div>
                    <div className="text-xs text-muted-foreground">6mm sheets</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}