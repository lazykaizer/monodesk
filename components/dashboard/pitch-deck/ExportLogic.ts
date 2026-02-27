
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const exportDeckToPDF = async (deckId: string, slidesCount: number, startupName: string) => {
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1920, 1080], // High-res 16:9
        hotfixes: ['px_scaling']
    });

    const container = document.getElementById(deckId);
    if (!container) {
        console.error("Export container not found");
        return;
    }

    // The container should have children divs, each representing a slide
    const slideElements = container.childNodes;

    for (let i = 0; i < slideElements.length; i++) {
        const slide = slideElements[i] as HTMLElement;

        // Ensure images are loaded
        const images = slide.getElementsByTagName('img');
        await Promise.all(Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve; // Continue even if image fails
            });
        }));

        const canvas = await html2canvas(slide, {
            scale: 2, // 2x scale for crisp text
            useCORS: true,
            logging: false,
            backgroundColor: '#000000', // Ensure dark background
            width: 1920,
            height: 1080,
            windowWidth: 1920,
            windowHeight: 1080,
            onclone: (clonedDoc) => {
                const allElements = clonedDoc.querySelectorAll('*');
                // Helper canvas for color conversion
                const canvas = document.createElement('canvas');
                canvas.width = 1;
                canvas.height = 1;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });

                const convertToSafeColor = (colorStr: string) => {
                    if (!ctx || !colorStr || (!colorStr.includes('oklch') && !colorStr.includes('lab') && !colorStr.includes('oklab'))) return colorStr;
                    ctx.clearRect(0, 0, 1, 1);
                    ctx.fillStyle = colorStr;
                    ctx.fillRect(0, 0, 1, 1);
                    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
                    return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
                };

                allElements.forEach((el) => {
                    const element = el as HTMLElement;
                    const style = window.getComputedStyle(element);

                    // Properties to check
                    const props = ['color', 'backgroundColor', 'borderColor', 'outlineColor', 'textDecorationColor', 'boxShadow'];

                    props.forEach(prop => {
                        const val = style.getPropertyValue(prop.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`));
                        if (val && (val.includes('oklch') || val.includes('lab') || val.includes('oklab'))) {
                            // Special handling for box-shadow which is complex
                            if (prop === 'boxShadow') {
                                // Simple heuristic: try to replace the color part if possible, or just remove shadow if it's too complex
                                // For now, let's skip complex props or just zero them out if they break things
                                element.style.boxShadow = 'none';
                            } else {
                                element.style[prop as any] = convertToSafeColor(val);
                            }
                        }
                    });
                });
            }
        });

        const imgData = canvas.toDataURL('image/png');

        if (i > 0) doc.addPage([1920, 1080]);
        doc.addImage(imgData, 'PNG', 0, 0, 1920, 1080);
    }

    doc.save(`${startupName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_pitch_deck.pdf`);
};
