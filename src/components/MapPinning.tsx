import { useState, useRef } from 'react';
import { Upload, MapPin, Trash2, Undo, Save, Loader2, X } from 'lucide-react';
import { uploadImage } from '../lib/imagekit';

interface MapPinningProps {
    currentMapUrl?: string;
    onSave: (url: string) => void;
}

interface Pin {
    x: number;
    y: number;
}

export function MapPinning({ currentMapUrl, onSave }: MapPinningProps) {
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [pins, setPins] = useState<Pin[]>([]);
    const [uploading, setUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // To toggle between "View Saved" and "Edit New"

    // If we have a currentMapUrl and no local edit in progress, we show the saved map
    const showSaved = currentMapUrl && !originalImage && !isEditing;

    const imageRef = useRef<HTMLImageElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            if (typeof event.target?.result === 'string') {
                setOriginalImage(event.target.result);
                setPins([]);
                setIsEditing(true);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!imageRef.current) return;

        const rect = imageRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check bounds
        if (x < 0 || x > rect.width || y < 0 || y > rect.height) return;

        const xPercent = (x / rect.width) * 100;
        const yPercent = (y / rect.height) * 100;

        setPins([...pins, { x: xPercent, y: yPercent }]);
    };

    const undoPin = () => {
        setPins(prev => prev.slice(0, -1));
    };

    const clearPins = () => {
        if (confirm('¿Borrar todos los pines?')) {
            setPins([]);
        }
    };

    const handleSave = async () => {
        if (!imageRef.current || !originalImage) return;

        setUploading(true);
        try {
            // Create canvas for high-res export
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const img = imageRef.current;
            const naturalWidth = img.naturalWidth;
            const naturalHeight = img.naturalHeight;

            canvas.width = naturalWidth;
            canvas.height = naturalHeight;

            // Draw image
            ctx.drawImage(img, 0, 0, naturalWidth, naturalHeight);

            // Draw Pins
            // Logic from Pin Maps app.js
            const pinRadius = Math.max(naturalWidth, naturalHeight) * 0.012;
            const borderWidth = pinRadius * 0.25;
            const fontSize = pinRadius * 1.2;

            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            pins.forEach((pin, index) => {
                const xPx = (pin.x / 100) * naturalWidth;
                const yPx = (pin.y / 100) * naturalHeight;

                // Draw Circle
                ctx.beginPath();
                ctx.arc(xPx, yPx, pinRadius, 0, 2 * Math.PI);
                ctx.fillStyle = '#ef4444'; // Red
                ctx.fill();
                ctx.lineWidth = borderWidth;
                ctx.strokeStyle = '#ffffff'; // White
                ctx.stroke();

                // Draw Number
                ctx.fillStyle = '#ffffff';
                ctx.fillText((index + 1).toString(), xPx, yPx);
            });

            // Convert to Blob and Upload
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    throw new Error("Failed to generate image blob");
                }
                const file = new File([blob], "map-with-pins.png", { type: "image/png" });
                const url = await uploadImage(file);
                onSave(url);

                // Reset local state after save? 
                // Maybe keep it so user sees what they did, but let's assume successful save switches back to "View Saved" mode via parent prop update
                setOriginalImage(null);
                setPins([]);
                setIsEditing(false);
            }, 'image/png');

        } catch (error) {
            console.error("Error generating/uploading map:", error);
            alert("Error al guardar el mapa. Intenta nuevamente.");
        } finally {
            setUploading(false);
        }
    };

    const cancelEdit = () => {
        setOriginalImage(null);
        setPins([]);
        setIsEditing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-xs text-slate-500 uppercase font-medium">Mapa de Ubicación</label>
                {showSaved && (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs text-brand font-medium hover:underline flex items-center gap-1"
                    >
                        <Upload className="w-3 h-3" /> Subir Nuevo Mapa
                    </button>
                )}
            </div>

            {/* Empty State / Upload Button */}
            {!showSaved && !originalImage && (
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-slate-300 hover:border-brand/50 hover:bg-brand/5 transition-all text-slate-500 hover:text-brand bg-slate-50"
                >
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium">Subir Imagen del Mapa</span>
                </button>
            )}

            {/* Saved Map Display */}
            {showSaved && (
                <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 aspect-[16/9] w-full max-w-[200px]">
                    <img src={currentMapUrl} alt="Mapa Guardado" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-medium">Mapa Guardado</span>
                    </div>
                </div>
            )}

            {/* Modal for Editing / Pinning UI */}
            {originalImage && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">

                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-brand" />
                                Colocar Pines de Referencia
                            </h3>
                            <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-50">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Image Container */}
                        <div className="flex-1 overflow-auto p-4 bg-slate-100 flex items-center justify-center">
                            <div className="relative rounded-lg shadow-lg overflow-hidden bg-white select-none touch-none max-w-full">
                                <div
                                    className="relative cursor-crosshair"
                                    onClick={handleImageClick}
                                >
                                    <img
                                        ref={imageRef}
                                        src={originalImage}
                                        alt="Mapa para editar"
                                        className="max-w-full max-h-[60vh] object-contain block"
                                    />
                                    {/* Pins Overlay */}
                                    <div className="absolute inset-0 pointer-events-none">
                                        {pins.map((pin, i) => (
                                            <div
                                                key={i}
                                                className="absolute w-6 h-6 -ml-3 -mt-3 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
                                                style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                                            >
                                                {i + 1}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Controls */}
                        <div className="p-4 border-t border-slate-100 bg-white rounded-b-2xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={undoPin}
                                        disabled={pins.length === 0}
                                        className="flex items-center gap-1 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
                                    >
                                        <Undo className="w-4 h-4" /> Deshacer
                                    </button>
                                    <button
                                        onClick={clearPins}
                                        disabled={pins.length === 0}
                                        className="flex items-center gap-1 px-3 py-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
                                    >
                                        <Trash2 className="w-4 h-4" /> Borrar Todos
                                    </button>
                                    <div className="mx-2 h-6 w-px bg-slate-200"></div>
                                    <span className="text-sm text-slate-500">
                                        {pins.length} pines colocados
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={cancelEdit}
                                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={uploading}
                                        className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-brand hover:bg-brand-dark rounded-lg transition-colors shadow-sm disabled:opacity-70 shadow-brand/20"
                                    >
                                        {uploading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" /> Procesando...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" /> Guardar Mapa
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />
        </div>
    );
}
