import { useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import pptxgen from "pptxgenjs";
import { saveAs } from 'file-saver';
import { Slide as SlideData } from '../PitchDeckSlide';

export type ExportFormat = 'pdf' | 'png-zip' | 'pptx-editable' | 'pptx-static';

export const useExportSystem = () => {
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState<string | null>(null);

    const exportDeck = async (format: ExportFormat, containerId: string, startupName: string, slides: SlideData[]) => {
        setIsExporting(true);
        setExportProgress(`Preparing ${format.toUpperCase()}...`);

        try {
            const container = document.getElementById(containerId);
            if (!container) throw new Error("Export container not found.");

            const fileNameBase = startupName.replace(/[^a-z0-9]/gi, '_').toLowerCase();

            switch (format) {
                case 'pdf':
                    await handlePdfExport(container, fileNameBase);
                    break;
                case 'png-zip':
                    await handleImageZipExport(container, fileNameBase);
                    break;
                case 'pptx-static':
                    await handlePptStaticExport(container, fileNameBase);
                    break;
                case 'pptx-editable':
                    await handlePptEditableExport(slides, fileNameBase);
                    break;
            }
        } catch (error: any) {
            console.error(`${format} Export Failed:`, error);
            alert(`Export failed: ${error.message}`);
        } finally {
            setIsExporting(false);
            setExportProgress(null);
        }
    };

    // --- SHARED UTILS ---

    const convertToSafeColor = (colorStr: string, ctx: CanvasRenderingContext2D | null) => {
        if (!ctx || !colorStr) return colorStr;
        const cleanStr = colorStr.trim();
        if (!cleanStr.includes('oklch') && !cleanStr.includes('lab') && !cleanStr.includes('oklab')) return cleanStr;

        try {
            ctx.clearRect(0, 0, 1, 1);
            ctx.fillStyle = cleanStr;
            ctx.fillRect(0, 0, 1, 1);
            const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
            return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
        } catch (e) {
            return '#000000'; // Fallback
        }
    };

    const captureSlide = async (slideElement: HTMLElement) => {
        setExportProgress("Sanitizing colors...");

        // 1. Setup conversion canvas
        const sanitizerCanvas = document.createElement('canvas');
        sanitizerCanvas.width = 1;
        sanitizerCanvas.height = 1;
        const sanitizerCtx = sanitizerCanvas.getContext('2d', { willReadFrequently: true });

        // 2. Clone and Prepare
        const clone = slideElement.cloneNode(true) as HTMLElement;
        document.body.appendChild(clone);
        clone.style.position = 'fixed';
        clone.style.top = '0';
        clone.style.left = '0';
        clone.style.zIndex = '-9999';
        clone.style.width = '1920px';
        clone.style.height = '1080px';
        clone.style.transform = 'none';

        try {
            // 3. Wait for images to be ready in the original element (improves cache hit for clone)
            const images = slideElement.getElementsByTagName('img');
            await Promise.all(Array.from(images).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            }));

            // 4. SANITIZATION PASS: Convert modern CSS colors to RGB
            const allCloneElements = clone.querySelectorAll('*');
            const allOriginalElements = slideElement.querySelectorAll('*');

            allCloneElements.forEach((el, idx) => {
                const element = el as HTMLElement;
                const originalEl = allOriginalElements[idx] as HTMLElement;
                if (!originalEl) return;

                const style = window.getComputedStyle(originalEl);
                const colorProps = ['color', 'backgroundColor', 'borderColor', 'outlineColor'];

                colorProps.forEach(prop => {
                    const val = style.getPropertyValue(prop.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`));
                    if (val && (val.includes('oklch') || val.includes('lab') || val.includes('oklab'))) {
                        element.style[prop as any] = convertToSafeColor(val, sanitizerCtx);
                    }
                });

                // Special handling for Gradients in backgroundImage
                const bgImage = style.backgroundImage;
                if (bgImage && (bgImage.includes('oklch') || bgImage.includes('oklab') || bgImage.includes('lab'))) {
                    if (bgImage.includes('gradient')) {
                        // Fallback to a safe standard gradient if modern colors are used
                        element.style.backgroundImage = 'linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0.4), transparent)';
                    } else {
                        element.style.backgroundImage = 'none';
                    }
                }
            });

            // 5. Generate Canvas
            const canvas = await html2canvas(clone, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#000000',
                width: 1920,
                height: 1080,
                logging: false
            });
            return canvas.toDataURL('image/png', 0.95);
        } finally {
            document.body.removeChild(clone);
        }
    };

    // --- FORMAT HANDLERS ---

    const handlePdfExport = async (container: HTMLElement, filename: string) => {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1920, 1080] });
        const slideElements = Array.from(container.children) as HTMLElement[];

        for (let i = 0; i < slideElements.length; i++) {
            setExportProgress(`Capturing Slide ${i + 1}/${slideElements.length}...`);
            const imgData = await captureSlide(slideElements[i]);
            if (i > 0) doc.addPage([1920, 1080]);
            doc.addImage(imgData, 'PNG', 0, 0, 1920, 1080);
        }

        doc.save(`${filename}_pitch_deck.pdf`);
    };

    const handleImageZipExport = async (container: HTMLElement, filename: string) => {
        const zip = new JSZip();
        const slideElements = Array.from(container.children) as HTMLElement[];

        for (let i = 0; i < slideElements.length; i++) {
            setExportProgress(`Processing Image ${i + 1}/${slideElements.length}...`);
            const imgData = await captureSlide(slideElements[i]);
            // Remove data:image/png;base64,
            const base64Content = imgData.split(',')[1];
            zip.file(`slide_${i + 1}.png`, base64Content, { base64: true });
        }

        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `${filename}_slides_bundle.zip`);
    };

    const handlePptStaticExport = async (container: HTMLElement, filename: string) => {
        const pptx = new pptxgen();
        const slideElements = Array.from(container.children) as HTMLElement[];

        for (let i = 0; i < slideElements.length; i++) {
            setExportProgress(`Exporting Slide ${i + 1}/${slideElements.length}...`);
            const imgData = await captureSlide(slideElements[i]);
            const slide = pptx.addSlide();
            slide.background = { color: "000000" };
            slide.addImage({ data: imgData, x: 0, y: 0, w: '100%', h: '100%' });
        }

        await pptx.writeFile({ fileName: `${filename}_presentation.pptx` });
    };

    const handlePptEditableExport = async (slides: SlideData[], filename: string) => {
        const pptx = new pptxgen();
        pptx.layout = 'LAYOUT_WIDE';

        slides.forEach((slideData, i) => {
            setExportProgress(`Mapping Data ${i + 1}/${slides.length}...`);
            const slide = pptx.addSlide();
            slide.background = { color: "0A0A0A" }; // Dark theme default

            // Title
            slide.addText(slideData.title, {
                x: 0.5, y: 0.5, w: '90%', h: 1,
                fontSize: 36, color: '06B6D4', bold: true, fontFace: 'Arial'
            });

            // Subtitle
            if (slideData.subtitle) {
                slide.addText(slideData.subtitle, {
                    x: 0.5, y: 1.2, w: '90%', h: 0.5,
                    fontSize: 18, color: '888888', italic: true
                });
            }

            // Content (Strip HTML for PPT text boxes)
            const cleanContent = slideData.content.replace(/<[^>]*>/g, '\n').trim();
            slide.addText(cleanContent, {
                x: 0.5, y: 2.0, w: '60%', h: 4,
                fontSize: 14, color: 'FFFFFF', align: 'left', valign: 'top'
            });

            // Image Placeholder (Base64)
            if (slideData.moodImage || slideData.image_url) {
                slide.addImage({
                    data: slideData.moodImage || slideData.image_url,
                    x: 6.5, y: 2.0, w: 6, h: 4
                });
            }
        });

        await pptx.writeFile({ fileName: `${filename}_editable.pptx` });
    };

    return { exportDeck, isExporting, exportProgress };
};
