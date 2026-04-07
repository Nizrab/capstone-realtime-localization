import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, ZoomIn, ZoomOut, Move, Type, Save, X } from 'lucide-react';

interface RoomLabel {
  id: string;
  x: number;
  y: number;
  name: string;
}

interface FloorplanConfig {
  name: string;
  imageUrl: string;
  widthM: number;
  heightM: number;
  roomLabels: RoomLabel[];
}

export default function FloorplansTab() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState('');

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<FloorplanConfig | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState<'pan' | 'label'>('pan');
  const [roomLabels, setRoomLabels] = useState<RoomLabel[]>([]);
  const [widthM, setWidthM] = useState(40);
  const [heightM, setHeightM] = useState(20);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [labelInput, setLabelInput] = useState('');
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedImage(ev.target?.result as string);
      setUploadedName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const openEditor = (plan: FloorplanConfig) => {
    setEditingPlan(plan);
    setRoomLabels(plan.roomLabels);
    setWidthM(plan.widthM);
    setHeightM(plan.heightM);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setTool('pan');
    setEditorOpen(true);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (tool === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    } else if (tool === 'label') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      const id = `label-${Date.now()}`;
      setRoomLabels((prev) => [...prev, { id, x, y, name: '' }]);
      setEditingLabel(id);
      setLabelInput('');
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const handleCanvasMouseUp = () => setIsPanning(false);

  const confirmLabel = useCallback(() => {
    if (editingLabel && labelInput.trim()) {
      setRoomLabels((prev) =>
        prev.map((l) => (l.id === editingLabel ? { ...l, name: labelInput.trim() } : l))
      );
    } else if (editingLabel) {
      setRoomLabels((prev) => prev.filter((l) => l.id !== editingLabel));
    }
    setEditingLabel(null);
    setLabelInput('');
  }, [editingLabel, labelInput]);

  const removeLabel = (id: string) => {
    setRoomLabels((prev) => prev.filter((l) => l.id !== id));
  };

  const handleSave = () => {
    // In a real app, this would POST to the API
    console.log('Saved layout:', { widthM, heightM, roomLabels });
    setEditorOpen(false);
  };

  const defaultPlan: FloorplanConfig = {
    name: 'Canal Building Floor 1',
    imageUrl: '',
    widthM: 40,
    heightM: 20,
    roomLabels: [],
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Floorplan Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".svg,.png,.jpg,.jpeg"
              className="hidden"
              onChange={handleFileChange}
            />
            <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <div className="text-sm font-medium mb-1">Upload Floorplan</div>
            <div className="text-xs text-muted-foreground mb-3">
              SVG, PNG, or JPG • Drag and drop or click to browse
            </div>
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
              Browse Files
            </Button>
          </div>

          {uploadedImage && (
            <div className="border border-border rounded-lg p-3 space-y-2">
              <div className="text-sm font-medium">Preview: {uploadedName}</div>
              <img
                src={uploadedImage}
                alt="Uploaded floorplan preview"
                className="max-h-48 rounded border border-border object-contain w-full bg-muted"
              />
            </div>
          )}

          <div className="space-y-2">
            <div className="text-sm font-medium">Existing Floorplans</div>
            <div className="border border-border rounded-lg p-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Canal Building Floor 1</div>
                <div className="text-xs text-muted-foreground">40m × 20m • 800×400px</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="status-online">Active</Badge>
                <Button variant="outline" size="sm" onClick={() => openEditor(defaultPlan)}>
                  Edit Layout
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Layout Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium">
              Layout Editor — {editingPlan?.name}
            </DialogTitle>
          </DialogHeader>

          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={tool === 'pan' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('pan')}
            >
              <Move className="h-4 w-4 mr-1" /> Pan
            </Button>
            <Button
              variant={tool === 'label' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('label')}
            >
              <Type className="h-4 w-4 mr-1" /> Add Label
            </Button>
            <div className="border-l border-border h-6 mx-1" />
            <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.min(z + 0.2, 3))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.max(z - 0.2, 0.3))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
            <div className="border-l border-border h-6 mx-1" />
            <div className="flex items-center gap-2">
              <Label className="text-xs">W (m):</Label>
              <Input
                type="number"
                value={widthM}
                onChange={(e) => setWidthM(Number(e.target.value))}
                className="w-16 h-8 text-xs"
              />
              <Label className="text-xs">H (m):</Label>
              <Input
                type="number"
                value={heightM}
                onChange={(e) => setHeightM(Number(e.target.value))}
                className="w-16 h-8 text-xs"
              />
            </div>
            <div className="ml-auto">
              <Button size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-1" /> Save Layout
              </Button>
            </div>
          </div>

          {/* Canvas */}
          <div
            ref={canvasRef}
            className="flex-1 overflow-hidden bg-muted rounded-md relative select-none"
            style={{ cursor: tool === 'pan' ? 'grab' : 'crosshair' }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          >
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: '0 0',
                width: 800,
                height: 400,
                position: 'relative',
              }}
            >
              {/* Grid overlay */}
              <svg width={800} height={400} className="absolute inset-0">
                {/* Vertical grid lines */}
                {Array.from({ length: Math.floor(widthM) + 1 }, (_, i) => {
                  const x = (i / widthM) * 800;
                  return (
                    <g key={`v-${i}`}>
                      <line x1={x} y1={0} x2={x} y2={400} stroke="hsl(var(--border))" strokeWidth={i % 5 === 0 ? 1 : 0.5} opacity={i % 5 === 0 ? 0.6 : 0.25} />
                      {i % 5 === 0 && (
                        <text x={x + 2} y={12} fill="hsl(var(--muted-foreground))" fontSize={10}>{i}m</text>
                      )}
                    </g>
                  );
                })}
                {/* Horizontal grid lines */}
                {Array.from({ length: Math.floor(heightM) + 1 }, (_, i) => {
                  const y = (i / heightM) * 400;
                  return (
                    <g key={`h-${i}`}>
                      <line x1={0} y1={y} x2={800} y2={y} stroke="hsl(var(--border))" strokeWidth={i % 5 === 0 ? 1 : 0.5} opacity={i % 5 === 0 ? 0.6 : 0.25} />
                      {i % 5 === 0 && (
                        <text x={2} y={y + 12} fill="hsl(var(--muted-foreground))" fontSize={10}>{i}m</text>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Floorplan image if available */}
              {editingPlan?.imageUrl && (
                <img src={editingPlan.imageUrl} alt="" className="absolute inset-0 w-full h-full object-contain opacity-60" />
              )}

              {/* Room labels */}
              {roomLabels.map((label) => (
                <div
                  key={label.id}
                  className="absolute flex items-center gap-1"
                  style={{ left: label.x, top: label.y, transform: 'translate(-50%, -50%)' }}
                >
                  {editingLabel === label.id ? (
                    <form
                      onSubmit={(e) => { e.preventDefault(); confirmLabel(); }}
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <Input
                        autoFocus
                        value={labelInput}
                        onChange={(e) => setLabelInput(e.target.value)}
                        onBlur={confirmLabel}
                        placeholder="Room name"
                        className="h-6 w-28 text-xs"
                      />
                    </form>
                  ) : (
                    <div className="bg-primary/90 text-primary-foreground px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                      {label.name || '(unnamed)'}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeLabel(label.id); }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
