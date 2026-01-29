// src/app/(main)/dashboard/drawing-analyser/page.tsx

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, FileText, Loader2, Download, Trash2, Scissors, AlertCircle, Edit2, Save, X, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface CuttingListItem {
  component_type: string;
  part_name: string;
  overall_unit_width?: number;
  component_width?: number;
  height?: number;
  depth?: number;
  quantity: number;
  material_thickness: number;
  edge_banding_notes?: string;
  area_m2: number;
}

interface Drawing {
  id: string;
  project_name: string;
  original_filename: string;
  status: string;
  ocr_method: string;
  cutting_list: CuttingListItem[];
  total_pieces: number;
  total_area_m2: number;
  confidence?: number;
  created_at: string;
  preview_url?: string;
}

const COMPONENT_GROUPS = {
  'Structure': ['GABLE', 'BACKS', 'BRACES'],
  'Horizontals': ['S/H', 'SHELF', 'SHELVES', 'T/B', 'TOP', 'BOTTOM', 'FIXED_SHELVES'],
  'Panels': ['END_PANEL', 'END_PANELS', 'INFILLS', 'INFILL'],
  'Drawers': ['DRAWS', 'DRAWER'],
  'Fronts': ['DOORS', 'DOOR', 'DRAWER_FACES', 'DRAWER_FACE', 'DOORS_DRAW_FACES']
};

export default function DrawingAnalyserPage() {
  const { user, getAuthHeaders } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [selectedDrawing, setSelectedDrawing] = useState<Drawing | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedList, setEditedList] = useState<CuttingListItem[]>([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Bulk delete state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    fetchDrawings();
  }, []);

  useEffect(() => {
    if (selectedDrawing) {
      setEditedList([...selectedDrawing.cutting_list]);
      setImageError(false);
    }
  }, [selectedDrawing]);

  const fetchDrawings = async () => {
    setLoading(true);
    
    try {
      const data = await api.get('/api/drawing-analyser');
      setDrawings(data.drawings || []);
    } catch (error: any) {
      console.error('Error fetching drawings:', error);
      
      if (error.status !== 403) {
        toast.error('Failed to load drawings');
      }
      setDrawings([]);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    
    if (!file) {
      toast.error('No file selected');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('project_name', file.name.replace(/\.[^/.]+$/, ''));

      const authHeaders = getAuthHeaders();
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const uploadUrl = `${apiUrl}/api/drawing-analyser/upload`;
      
      console.log('📤 Uploading to:', uploadUrl);
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          ...authHeaders,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`
        }));
        throw new Error(errorData.error || `Upload failed (${response.status})`);
      }

      const data = await response.json();
      
      console.log('✅ Upload successful:', data);
      
      const newDrawing: Drawing = {
        id: data.drawing_id,
        project_name: file.name.replace(/\.[^/.]+$/, ''),
        original_filename: file.name,
        status: data.status,
        ocr_method: data.ocr_method,
        cutting_list: data.cutting_list || [],
        total_pieces: data.total_pieces || 0,
        total_area_m2: data.total_area_m2 || 0,
        confidence: data.confidence || 0,
        created_at: new Date().toISOString(),
        preview_url: `/api/drawing-analyser/${data.drawing_id}/preview`
      };
      
      const confidencePercent = Math.round((data.confidence || 0) * 100);
      toast.success(`Drawing processed using ${data.ocr_method}`, {
        description: `Extracted ${data.total_pieces || 0} components • ${confidencePercent}% confidence`,
      });
      
      setSelectedDrawing(newDrawing);
      setDrawings([newDrawing, ...drawings]);
      
    } catch (error: any) {
      console.error('❌ Upload error:', error);
      toast.error(error.message || 'Failed to upload drawing');
    } finally {
      setUploading(false);
    }
  }, [drawings, getAuthHeaders]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    disabled: uploading,
    onDropRejected: () => {
      toast.error('Invalid file type. Please upload PNG, JPG, or PDF.');
    },
  });

  const handleDelete = async (drawingId: string) => {
    if (!confirm('Are you sure you want to delete this drawing?')) return;
    
    try {
      await api.delete(`/api/drawing-analyser/${drawingId}`);

      toast.success('Drawing deleted');
      setDrawings(drawings.filter(d => d.id !== drawingId));
      if (selectedDrawing?.id === drawingId) {
        setSelectedDrawing(null);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete drawing');
    }
  };

  // Bulk delete functions
  const toggleSelectAll = () => {
    if (selectedIds.size === drawings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(drawings.map(d => d.id)));
    }
  };

  const toggleSelectDrawing = (drawingId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(drawingId)) {
      newSelected.delete(drawingId);
    } else {
      newSelected.add(drawingId);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      toast.error('No drawings selected');
      return;
    }

    const count = selectedIds.size;
    if (!confirm(`Are you sure you want to delete ${count} drawing${count > 1 ? 's' : ''}?`)) {
      return;
    }

    setBulkDeleting(true);

    try {
      // Delete all selected drawings
      const deletePromises = Array.from(selectedIds).map(id => 
        api.delete(`/api/drawing-analyser/${id}`)
      );

      await Promise.all(deletePromises);

      toast.success(`Successfully deleted ${count} drawing${count > 1 ? 's' : ''}`);
      
      // Remove deleted drawings from state
      setDrawings(drawings.filter(d => !selectedIds.has(d.id)));
      setSelectedIds(new Set());
      
      // Clear selected drawing if it was deleted
      if (selectedDrawing && selectedIds.has(selectedDrawing.id)) {
        setSelectedDrawing(null);
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete some drawings');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleViewDrawing = async (drawing: Drawing) => {
    setImageLoading(true);
    
    // Fetch full drawing details including cutting list if not already loaded
    if (!drawing.cutting_list || drawing.cutting_list.length === 0) {
      try {
        const fullDrawing = await api.get(`/api/drawing-analyser/${drawing.id}`);
        setSelectedDrawing({
          ...drawing,
          cutting_list: fullDrawing.cutting_list || [],
          total_pieces: fullDrawing.total_pieces || 0,
          total_area_m2: fullDrawing.total_area_m2 || 0
        });
      } catch (error) {
        console.error('Error loading drawing details:', error);
        setSelectedDrawing(drawing);
      }
    } else {
      setSelectedDrawing(drawing);
    }
    
    setImageLoading(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedList([...selectedDrawing!.cutting_list]);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedList([...selectedDrawing!.cutting_list]);
  };

  const handleSaveEdit = async () => {
    if (!selectedDrawing) return;

    // Recalculate totals
    const totalPieces = editedList.reduce((sum, item) => sum + item.quantity, 0);
    const totalArea = editedList.reduce((sum, item) => sum + item.area_m2, 0);

    try {
      await api.put(`/api/drawing-analyser/${selectedDrawing.id}`, {
        cutting_list: editedList
      });

      const updatedDrawing = {
        ...selectedDrawing,
        cutting_list: editedList,
        total_pieces: totalPieces,
        total_area_m2: totalArea
      };

      setSelectedDrawing(updatedDrawing);
      
      // Update in drawings list
      setDrawings(drawings.map(d => d.id === updatedDrawing.id ? updatedDrawing : d));
      
      setIsEditing(false);
      toast.success('Changes saved successfully');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save changes');
    }
  };

  const updateItem = (index: number, field: keyof CuttingListItem, value: any) => {
    const updated = [...editedList];
    const item = { ...updated[index] };
    
    // Update the field
    (item as any)[field] = value;
    
    // Recalculate area if dimensions changed
    if (['component_width', 'height', 'depth', 'quantity'].includes(field)) {
      const width = item.component_width || 0;
      const height = item.height || 0;
      const depth = item.depth || 0;
      const qty = item.quantity || 0;
      
      let area_mm2 = 0;
      if (width && height) {
        area_mm2 = width * height * qty;
      } else if (width && depth) {
        area_mm2 = width * depth * qty;
      }
      
      item.area_m2 = area_mm2 / 1_000_000;
    }
    
    updated[index] = item;
    setEditedList(updated);
  };

  const deleteItem = (index: number) => {
    if (!confirm('Are you sure you want to delete this component?')) return;
    
    const updated = editedList.filter((_, i) => i !== index);
    setEditedList(updated);
    toast.success('Component deleted');
  };

  const exportToCsv = (drawing: Drawing) => {
    const headers = [
      'Component Type',
      'Part Name',
      'Unit Width (mm)',
      'Component Width (mm)',
      'Height (mm)',
      'Depth (mm)',
      'Quantity',
      'Material Thickness (mm)',
      'Edge Banding',
      'Area (m²)',
    ];

    const rows = drawing.cutting_list.map(item => [
      item.component_type,
      item.part_name,
      item.overall_unit_width || 'N/A',
      item.component_width || 'N/A',
      item.height || 'N/A',
      item.depth || 'N/A',
      item.quantity,
      item.material_thickness,
      item.edge_banding_notes || 'None',
      item.area_m2.toFixed(4),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      '',
      `Total Pieces,${drawing.total_pieces}`,
      `Total Area (m²),${drawing.total_area_m2.toFixed(2)}`,
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${drawing.project_name}_cutting_list.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('CSV exported');
  };

  const getGroupedItems = (items: CuttingListItem[]) => {
    return items.reduce((acc, item, index) => {
      const group = Object.entries(COMPONENT_GROUPS).find(([_, types]) => 
        types.some(type => item.component_type.toUpperCase().includes(type))
      )?.[0] || 'Other';
      
      if (!acc[group]) acc[group] = [];
      acc[group].push({ ...item, originalIndex: index });
      return acc;
    }, {} as Record<string, (CuttingListItem & { originalIndex: number })[]>);
  };

  const getConfidenceBadge = (confidence?: number) => {
    if (!confidence) return null;
    
    const percent = Math.round(confidence * 100);
    const variant = percent >= 80 ? 'default' : percent >= 60 ? 'secondary' : 'destructive';
    
    return (
      <Badge variant={variant} className="ml-2">
        {percent}% confidence
      </Badge>
    );
  };

  const displayList = isEditing ? editedList : (selectedDrawing?.cutting_list || []);

  const getImageUrl = (drawing: Drawing) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    return `${apiUrl}${drawing.preview_url || `/api/drawing-analyser/${drawing.id}/preview`}`;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Drawing Analyser</h1>
          <p className="text-muted-foreground">
            Upload technical drawings to automatically generate cutting lists
          </p>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">{user.first_name} {user.last_name}</span>
              <span className="mx-2">•</span>
              <Badge variant="outline">{user.role}</Badge>
            </div>
          )}
          <Button onClick={fetchDrawings} disabled={loading} variant="outline">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Refresh
          </Button>
        </div>
      </div>

      {/* Upload Zone */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Drawing</CardTitle>
          <CardDescription>
            Supported formats: PNG, JPG, PDF • AI-powered dimension extraction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-muted/50'}
            `}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <>
                <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                <p className="text-lg font-medium mb-2">Processing drawing...</p>
                <p className="text-sm text-muted-foreground">
                  Analyzing dimensions with AI • This may take 30-60 seconds
                </p>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  {isDragActive ? 'Drop drawing here...' : 'Drop drawing here or click to browse'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Kitchen plans, cabinet elevations, or wardrobe drawings • Max 10MB
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Drawing Details */}
      {selectedDrawing && (
        <>
          {/* Back Button */}
          <div>
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedDrawing(null);
                setIsEditing(false);
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All Drawings
            </Button>
          </div>

          {/* Drawing Image Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Drawing Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {imageLoading ? (
                <div className="flex items-center justify-center p-12 bg-muted rounded-lg">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : imageError ? (
                <div className="flex flex-col items-center justify-center p-12 bg-muted rounded-lg">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Unable to load drawing preview
                  </p>
                </div>
              ) : (
                <div className="relative w-full bg-muted rounded-lg overflow-hidden">
                  <img
                    src={getImageUrl(selectedDrawing)}
                    alt={selectedDrawing.project_name}
                    className="w-full h-auto max-h-[600px] object-contain"
                    onError={() => setImageError(true)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cutting List Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {selectedDrawing.project_name}
                    {getConfidenceBadge(selectedDrawing.confidence)}
                  </CardTitle>
                  <CardDescription>
                    {selectedDrawing.original_filename} •{' '}
                    <Badge variant="outline" className="ml-2">{selectedDrawing.ocr_method}</Badge>
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEdit}
                        disabled={selectedDrawing.cutting_list.length === 0}
                      >
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportToCsv(selectedDrawing)}
                        disabled={selectedDrawing.cutting_list.length === 0}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(selectedDrawing.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {isEditing 
                        ? editedList.reduce((sum, item) => sum + item.quantity, 0)
                        : selectedDrawing.total_pieces
                      }
                    </div>
                    <p className="text-xs text-muted-foreground">Total Pieces</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {isEditing
                        ? editedList.reduce((sum, item) => sum + item.area_m2, 0).toFixed(2)
                        : selectedDrawing.total_area_m2.toFixed(2)
                      } m²
                    </div>
                    <p className="text-xs text-muted-foreground">Total Area</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {displayList.length}
                    </div>
                    <p className="text-xs text-muted-foreground">Component Types</p>
                  </CardContent>
                </Card>
              </div>

              {/* No cutting list warning */}
              {displayList.length === 0 && (
                <div className="flex items-center gap-2 p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    No components were extracted from this drawing. The AI may need a clearer image or different drawing format.
                  </p>
                </div>
              )}

              {/* Cutting List Table - Grouped by Component Type */}
              {displayList.length > 0 && Object.entries(getGroupedItems(displayList)).map(([group, items]) => (
                <div key={group} className="space-y-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Scissors className="h-5 w-5" />
                    {group} ({items.length} {items.length === 1 ? 'item' : 'items'})
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Component</TableHead>
                          <TableHead>Part Name</TableHead>
                          <TableHead className="text-right">Unit Width</TableHead>
                          <TableHead className="text-right">Width</TableHead>
                          <TableHead className="text-right">Height</TableHead>
                          <TableHead className="text-right">Depth</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Thickness</TableHead>
                          <TableHead>Edge Banding</TableHead>
                          <TableHead className="text-right">Area (m²)</TableHead>
                          {isEditing && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => {
                          const idx = item.originalIndex;
                          return (
                            <TableRow key={`${group}-${idx}`}>
                              <TableCell>
                                {isEditing ? (
                                  <Input
                                    value={item.component_type}
                                    onChange={(e) => updateItem(idx, 'component_type', e.target.value)}
                                    className="w-24"
                                  />
                                ) : (
                                  <Badge variant="secondary">{item.component_type}</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {isEditing ? (
                                  <Input
                                    value={item.part_name}
                                    onChange={(e) => updateItem(idx, 'part_name', e.target.value)}
                                    className="w-40"
                                  />
                                ) : (
                                  <span className="font-medium">{item.part_name}</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    value={item.overall_unit_width || ''}
                                    onChange={(e) => updateItem(idx, 'overall_unit_width', parseInt(e.target.value) || 0)}
                                    className="w-20 text-right"
                                  />
                                ) : (
                                  item.overall_unit_width || 'N/A'
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    value={item.component_width || ''}
                                    onChange={(e) => updateItem(idx, 'component_width', parseInt(e.target.value) || 0)}
                                    className="w-20 text-right"
                                  />
                                ) : (
                                  item.component_width || 'N/A'
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    value={item.height || ''}
                                    onChange={(e) => updateItem(idx, 'height', parseInt(e.target.value) || 0)}
                                    className="w-20 text-right"
                                  />
                                ) : (
                                  item.height || 'N/A'
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    value={item.depth || ''}
                                    onChange={(e) => updateItem(idx, 'depth', parseInt(e.target.value) || 0)}
                                    className="w-20 text-right"
                                  />
                                ) : (
                                  item.depth || 'N/A'
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                                    className="w-16 text-right"
                                    min="1"
                                  />
                                ) : (
                                  item.quantity
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    value={item.material_thickness}
                                    onChange={(e) => updateItem(idx, 'material_thickness', parseInt(e.target.value) || 18)}
                                    className="w-16 text-right"
                                  />
                                ) : (
                                  item.material_thickness
                                )}
                              </TableCell>
                              <TableCell>
                                {isEditing ? (
                                  <Input
                                    value={item.edge_banding_notes || ''}
                                    onChange={(e) => updateItem(idx, 'edge_banding_notes', e.target.value)}
                                    className="w-32"
                                    placeholder="None"
                                  />
                                ) : (
                                  <span className="text-sm text-muted-foreground">
                                    {item.edge_banding_notes || 'None'}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {item.area_m2.toFixed(4)}
                              </TableCell>
                              {isEditing && (
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteItem(idx)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {/* Recent Drawings List */}
      {drawings.length > 0 && !selectedDrawing && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Drawings ({drawings.length})</CardTitle>
              {selectedIds.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                >
                  {bulkDeleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete Selected ({selectedIds.size})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Select All Checkbox */}
              {drawings.length > 0 && (
                <div className="flex items-center gap-3 p-3 border-b">
                  <Checkbox
                    checked={selectedIds.size === drawings.length && drawings.length > 0}
                    onCheckedChange={toggleSelectAll}
                    id="select-all"
                  />
                  <label
                    htmlFor="select-all"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Select All
                  </label>
                </div>
              )}

              {/* Drawing List */}
              {drawings.map((drawing) => (
                <div
                  key={drawing.id}
                  className="flex items-center gap-3 p-4 border rounded-lg transition-colors hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedIds.has(drawing.id)}
                    onCheckedChange={() => toggleSelectDrawing(drawing.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div 
                    className="flex items-center gap-4 flex-1 cursor-pointer"
                    onClick={() => handleViewDrawing(drawing)}
                  >
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{drawing.project_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {drawing.total_pieces} pieces • {drawing.total_area_m2.toFixed(2)} m² • {new Date(drawing.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{drawing.ocr_method}</Badge>
                    {getConfidenceBadge(drawing.confidence)}
                    <Badge
                      variant={drawing.status === 'completed' ? 'default' : 'secondary'}
                    >
                      {drawing.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(drawing.id);
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {drawings.length === 0 && !loading && !selectedDrawing && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">No drawings yet</p>
              <p className="text-sm text-muted-foreground">
                Upload your first drawing to get started
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}