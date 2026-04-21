'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Ruler, Save, Download, Trash2, FileText, Package } from 'lucide-react';
import { toast } from 'sonner';

interface Component {
  name: string;
  panel_l: number;
  panel_w: number;
  thickness: number;
  quantity: number;
  edging_length_m: number;
  material: string;
  notes: string;
}

interface CuttingListItem {
  line_number: number;
  dimension_display: string;
  dimension_l: number;
  dimension_w: number;
  quantity: number;
  material: string;
  edging: string;
  notes: string;
  area_m2: number;
}

interface CuttingListSection {
  category: string;
  items: CuttingListItem[];
}

interface MaterialSummary {
  sheets_18mm: Record<string, number>;
  sheets_6mm: Record<string, number>;
  total_edging_m: number;
  material_breakdown: Array<{
    material: string;
    pieces: number;
    area_m2: number;
  }>;
  estimated_sheets_18mm: number;
  estimated_sheets_6mm: number;
}

interface CalculationResult {
  cabinet_type: string;
  dimensions: {
    height: number;
    width: number;
    depth: number;
  };
  components: {
    carcass: Component[];
    backs: Component[];
    shelves: Component[];
    doors: Component[];
    hardware: any[];
  };
  cutting_list_formatted: CuttingListSection[];
  material_summary: MaterialSummary;
  summary: {
    total_panels: number;
    total_area_m2: number;
    door_count?: number;
  };
}

export default function ManualCabinetEntryPage() {
  // Form inputs
  const [cabinetType, setCabinetType] = useState<'base' | 'wall'>('base');
  const [height, setHeight] = useState<string>('720');
  const [width, setWidth] = useState<string>('1200');
  const [depth, setDepth] = useState<string>('500');
  const [projectName, setProjectName] = useState<string>('');
  
  // Calculation state
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [showDetailedList, setShowDetailedList] = useState(true);

  const handleCalculate = async () => {
    if (!height || !width) {
      toast.error('Please enter height and width');
      return;
    }

    setCalculating(true);

    try {
      const response = await api.post('/api/manual-cabinet/calculate', {
        cabinet_type: cabinetType,
        height: parseFloat(height),
        width: parseFloat(width),
        depth: depth ? parseFloat(depth) : undefined,
        project_name: projectName || `${cabinetType === 'base' ? 'Kitchen Base' : 'Kitchen Wall'} ${height}`,
        save: false
      });

      if (response.success) {
        setResult(response.result);
        toast.success('Cabinet calculated successfully');
      } else {
        toast.error(response.error || 'Calculation failed');
      }
    } catch (error: any) {
      console.error('Calculation error:', error);
      toast.error(error.message || 'Failed to calculate cabinet');
    } finally {
      setCalculating(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;

    try {
      const response = await api.post('/api/manual-cabinet/calculate', {
        cabinet_type: cabinetType,
        height: parseFloat(height),
        width: parseFloat(width),
        depth: depth ? parseFloat(depth) : undefined,
        project_name: projectName || result.cabinet_type,
        save: true
      });

      if (response.success) {
        toast.success('Calculation saved');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save');
    }
  };

  const exportToCsv = () => {
    if (!result) return;

    const rows: string[][] = [
      [result.cabinet_type],
      [''],
      ['CUTTING LIST - DETAILED'],
      ['']
    ];

    // Add each section
    result.cutting_list_formatted.forEach(section => {
      rows.push([section.category]);
      rows.push(['#', 'Dimensions', 'Qty', 'Material', 'Edging', 'Notes', 'Area (m²)']);
      
      section.items.forEach(item => {
        rows.push([
          item.line_number.toString(),
          item.dimension_display,
          item.quantity.toString(),
          item.material,
          item.edging,
          item.notes,
          item.area_m2.toFixed(2)
        ]);
      });
      
      rows.push(['']);
    });

    // Add material summary
    rows.push(['MATERIAL SUMMARY']);
    rows.push(['']);
    result.material_summary.material_breakdown.forEach(mat => {
      rows.push([mat.material, `${mat.pieces} pieces`, `${mat.area_m2} m²`]);
    });
    rows.push(['']);
    rows.push(['Estimated 18mm Sheets', result.material_summary.estimated_sheets_18mm.toString()]);
    rows.push(['Estimated 6mm Sheets', result.material_summary.estimated_sheets_6mm.toString()]);
    rows.push(['']);
    rows.push(['TOTALS']);
    rows.push(['Total Panels', result.summary.total_panels.toString()]);
    rows.push(['Total Area (m²)', result.summary.total_area_m2.toFixed(2)]);

    const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName || 'cabinet'}_cutting_list.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('CSV exported');
  };

  const handleReset = () => {
    setResult(null);
    setHeight('720');
    setWidth('1200');
    setDepth('500');
    setProjectName('');
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manual Cabinet Entry</h1>
          <p className="text-muted-foreground">
            K Carc Style - Detailed Cutting List Generator
          </p>
        </div>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Cabinet Dimensions
          </CardTitle>
          <CardDescription>
            Enter external dimensions in millimeters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cabinet Type Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cabinet-type">Cabinet Type</Label>
              <Select value={cabinetType} onValueChange={(value: any) => {
                setCabinetType(value);
                setDepth(value === 'wall' ? '320' : '500');
              }}>
                <SelectTrigger id="cabinet-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="base">Kitchen Base</SelectItem>
                  <SelectItem value="wall">Kitchen Wall</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name (Optional)</Label>
              <Input
                id="project-name"
                placeholder="e.g., Kitchen Renovation"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
          </div>

          {/* Dimensions */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height" className="font-mono text-xs text-muted-foreground">
                  Height (C3) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="height"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="text-lg font-semibold"
                  min="200"
                  max="3000"
                />
                <p className="text-xs text-muted-foreground">Panel height (mm)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="width" className="font-mono text-xs text-muted-foreground">
                  Width (D3) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="width"
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="text-lg font-semibold"
                  min="200"
                  max="3000"
                />
                <p className="text-xs text-muted-foreground">
                  {width && parseInt(width) >= 600 ? '2 doors' : '1 door'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="depth" className="font-mono text-xs text-muted-foreground">
                  Depth (E3)
                </Label>
                <Input
                  id="depth"
                  type="number"
                  value={depth}
                  onChange={(e) => setDepth(e.target.value)}
                  className="text-lg font-semibold"
                  min="200"
                  max="800"
                />
                <p className="text-xs text-muted-foreground">
                  Default: {cabinetType === 'wall' ? '320mm' : '500mm'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleCalculate}
              disabled={calculating || !height || !width}
              className="flex-1"
              size="lg"
            >
              {calculating ? (
                <>
                  <Calculator className="mr-2 h-4 w-4 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="mr-2 h-4 w-4" />
                  Calculate Components
                </>
              )}
            </Button>

            {result && (
              <>
                <Button variant="outline" onClick={handleSave} size="lg">
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
                <Button variant="outline" onClick={exportToCsv} size="lg">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button variant="outline" onClick={handleReset} size="lg">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold">{result.summary.total_panels}</div>
                <p className="text-sm text-muted-foreground">Total Panels</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold">{result.summary.total_area_m2.toFixed(2)} m²</div>
                <p className="text-sm text-muted-foreground">Total Area</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold">
                  {result.dimensions.height} × {result.dimensions.width} × {result.dimensions.depth}
                </div>
                <p className="text-sm text-muted-foreground">H × W × D (mm)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold">{result.summary.door_count}</div>
                <p className="text-sm text-muted-foreground">Door{result.summary.door_count! > 1 ? 's' : ''}</p>
              </CardContent>
            </Card>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2">
            <Button 
              variant={showDetailedList ? 'default' : 'outline'}
              onClick={() => setShowDetailedList(true)}
            >
              <FileText className="mr-2 h-4 w-4" />
              Detailed Cutting List
            </Button>
            <Button 
              variant={!showDetailedList ? 'default' : 'outline'}
              onClick={() => setShowDetailedList(false)}
            >
              <Package className="mr-2 h-4 w-4" />
              Component View
            </Button>
          </div>

          {/* DETAILED CUTTING LIST - Like Paper Format */}
          {showDetailedList && (
            <Card>
              <CardHeader>
                <CardTitle>{result.cabinet_type} - Detailed Cutting List</CardTitle>
                <CardDescription>
                  Line-by-line breakdown matching paper format
                </CardDescription>
              </CardHeader>
              <CardContent>
                {result.cutting_list_formatted.map((section, sectionIdx) => (
                  <div key={sectionIdx} className="mb-6">
                    {/* Section Header */}
                    <div className="bg-slate-800 text-white px-4 py-2 font-bold mb-2 rounded">
                      {section.category}
                    </div>
                    
                    {/* Section Items */}
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Dimensions</TableHead>
                          <TableHead className="text-center">Qty</TableHead>
                          <TableHead>Material</TableHead>
                          <TableHead>Edging</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead className="text-right">Area (m²)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {section.items.map((item, itemIdx) => (
                          <TableRow key={itemIdx}>
                            <TableCell className="font-mono text-sm">{item.line_number}</TableCell>
                            <TableCell className="font-mono font-bold">
                              {item.dimension_display}
                            </TableCell>
                            <TableCell className="text-center font-bold">{item.quantity}</TableCell>
                            <TableCell>
                              {item.material && <Badge variant="outline">{item.material}</Badge>}
                            </TableCell>
                            <TableCell>
                              {item.edging && <Badge variant="secondary">{item.edging}</Badge>}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {item.notes}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {item.area_m2.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}

                {/* Material Summary - Like "4 Sheets" at bottom */}
                <div className="mt-8 border-t pt-4">
                  <h3 className="font-bold text-lg mb-4">Material Summary</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {result.material_summary.material_breakdown.map((mat, idx) => (
                      <Card key={idx}>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">{mat.pieces}</div>
                          <p className="text-sm text-muted-foreground">{mat.material} pieces</p>
                          <p className="text-xs text-muted-foreground">{mat.area_m2} m²</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="font-bold">Estimated Sheets Required:</p>
                    <p>18mm Sheets: <span className="font-bold">{result.material_summary.estimated_sheets_18mm}</span></p>
                    <p>6mm Sheets: <span className="font-bold">{result.material_summary.estimated_sheets_6mm}</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* COMPONENT VIEW - Original Table */}
          {!showDetailedList && (
            <Card>
              <CardHeader>
                <CardTitle>{result.cabinet_type} - Component View</CardTitle>
                <CardDescription>
                  All components with K Carc formula calculations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-bold">Component</TableHead>
                      <TableHead className="text-right font-bold">Panel L (mm)</TableHead>
                      <TableHead className="text-right font-bold">Panel W (mm)</TableHead>
                      <TableHead className="text-right font-bold">m²</TableHead>
                      <TableHead className="text-right font-bold">Edging L (m)</TableHead>
                      <TableHead className="text-center font-bold">Qty</TableHead>
                      <TableHead className="font-bold">Material</TableHead>
                      <TableHead className="font-bold">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Carcass Components */}
                    {result.components.carcass.map((comp, idx) => (
                      <TableRow key={`carcass-${idx}`}>
                        <TableCell className="font-medium">{comp.name}</TableCell>
                        <TableCell className="text-right">{comp.panel_l}</TableCell>
                        <TableCell className="text-right">{comp.panel_w}</TableCell>
                        <TableCell className="text-right font-mono">
                          {(Math.ceil((comp.panel_l * comp.panel_w) / 1_000_000 * 100) / 100).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono">{comp.edging_length_m.toFixed(3)}</TableCell>
                        <TableCell className="text-center">{comp.quantity}</TableCell>
                        <TableCell><Badge variant="outline">{comp.material}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{comp.notes}</TableCell>
                      </TableRow>
                    ))}

                    {/* Other components... */}
                    {result.components.backs.map((comp, idx) => (
                      <TableRow key={`back-${idx}`}>
                        <TableCell className="font-medium">{comp.name}</TableCell>
                        <TableCell className="text-right">{comp.panel_l}</TableCell>
                        <TableCell className="text-right">{comp.panel_w}</TableCell>
                        <TableCell className="text-right font-mono">
                          {(Math.ceil((comp.panel_l * comp.panel_w) / 1_000_000 * 100) / 100).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono">{comp.edging_length_m.toFixed(3)}</TableCell>
                        <TableCell className="text-center">{comp.quantity}</TableCell>
                        <TableCell><Badge variant="outline">{comp.material}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{comp.notes}</TableCell>
                      </TableRow>
                    ))}

                    {result.components.shelves.map((comp, idx) => (
                      <TableRow key={`shelf-${idx}`}>
                        <TableCell className="font-medium">{comp.name}</TableCell>
                        <TableCell className="text-right">{comp.panel_l}</TableCell>
                        <TableCell className="text-right">{comp.panel_w}</TableCell>
                        <TableCell className="text-right font-mono">
                          {(Math.ceil((comp.panel_l * comp.panel_w) / 1_000_000 * 100) / 100).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono">{comp.edging_length_m.toFixed(3)}</TableCell>
                        <TableCell className="text-center">{comp.quantity}</TableCell>
                        <TableCell><Badge variant="outline">{comp.material}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{comp.notes}</TableCell>
                      </TableRow>
                    ))}

                    <TableRow className="bg-muted/30 font-bold">
                      <TableCell>Total Panel Cost</TableCell>
                      <TableCell colSpan={7} className="text-right">
                        {result.summary.total_area_m2.toFixed(2)} m²
                      </TableCell>
                    </TableRow>

                    {result.components.doors.map((comp, idx) => (
                      <TableRow key={`door-${idx}`}>
                        <TableCell className="font-medium">{comp.name}</TableCell>
                        <TableCell className="text-right">{comp.panel_l}</TableCell>
                        <TableCell className="text-right">{comp.panel_w}</TableCell>
                        <TableCell className="text-right font-mono">
                          {(Math.ceil((comp.panel_l * comp.panel_w) / 1_000_000 * 100) / 100).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono">{comp.edging_length_m.toFixed(3)}</TableCell>
                        <TableCell className="text-center">{comp.quantity}</TableCell>
                        <TableCell><Badge variant="outline">{comp.material}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{comp.notes}</TableCell>
                      </TableRow>
                    ))}

                    {result.components.hardware.map((comp, idx) => (
                      <TableRow key={`hardware-${idx}`} className="bg-blue-50/50">
                        <TableCell className="font-medium">{comp.name}</TableCell>
                        <TableCell colSpan={4} className="text-sm text-muted-foreground">{comp.notes}</TableCell>
                        <TableCell className="text-center font-bold">{comp.quantity}</TableCell>
                        <TableCell colSpan={2}></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Empty State */}
      {!result && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">No calculation yet</p>
              <p className="text-sm text-muted-foreground">
                Enter cabinet dimensions and click Calculate
              </p>
              <div className="mt-4 text-xs text-muted-foreground font-mono">
                <p>K Carc Formula Reference:</p>
                <p>Gables: Height × Depth</p>
                <p>Base: (Width - 36) × (Depth - 70)</p>
                <p>Shelf: (Width - 36) × (Depth - 140)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}