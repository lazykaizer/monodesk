"use client";

import { cn } from "@/lib/utils";

interface ImageSource {
    src: string;
    alt: string;
}

interface ShowImageListItemProps {
    id?: string;
    text: string;
    images: [ImageSource, ImageSource];
    onClick?: () => void;
}

function RevealImageListItem({ text, images, onClick }: ShowImageListItemProps) {
    const container = "absolute right-8 -top-1 z-40 h-20 w-16";
    const effect =
        "relative duration-500 delay-100 shadow-none group-hover:shadow-xl scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100 group-hover:w-full group-hover:h-full w-16 h-16 overflow-hidden transition-all rounded-md";

    return (
        <div
            onClick={onClick}
            className="group relative h-fit w-fit overflow-visible py-8 cursor-pointer active:scale-95 transition-transform"
        >
            <h1 className="text-7xl font-black text-foreground transition-all duration-500 group-hover:opacity-40 select-none">
                {text}
            </h1>
            <div className={container}>
                <div className={effect}>
                    <img alt={images[1].alt} src={images[1].src} className="h-full w-full object-cover" />
                </div>
            </div>
            <div
                className={cn(
                    container,
                    "translate-x-0 translate-y-0 rotate-0 transition-all delay-150 duration-500 group-hover:translate-x-6 group-hover:translate-y-6 group-hover:rotate-12",
                )}
            >
                <div className={cn(effect, "duration-200")}>
                    <img alt={images[0].alt} src={images[0].src} className="h-full w-full object-cover" />
                </div>
            </div>
        </div>
    );
}

export function RevealImageList() {

    // Future: This could be fetched from Supabase
    // const { data: services } = await supabase.from('services').select('*');

    const handleServiceClick = (serviceId: string, serviceName: string) => {
        // 1. Log click for analytics (Future: Supabase Insert)
        console.log(`User clicked service: ${serviceName} (${serviceId})`);

        // 2. Redirect Logic (Placeholder)
        // Since pages don't exist yet, we show an alert/toast
        // router.push(`/dashboard/${serviceId}`);
        console.log(`[Simulation] Navigating to: ${serviceName}`);

        // 3. Example Supabase Realtime Logic (Commented out)
        /*
        await supabase.from('user_activity').insert({ 
            user_id: user.id, 
            action: 'view_service', 
            details: { service_name: serviceName }
        });
        */
    };

    const items: ShowImageListItemProps[] = [
        {
            id: "design",
            text: "Design",
            images: [
                {
                    src: "https://images.unsplash.com/photo-1542744094-3a31f272c490?w=500&auto=format&fit=crop&q=80",
                    alt: "UI Design Screens",
                },
                {
                    src: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500&auto=format&fit=crop&q=80",
                    alt: "Figma Interface",
                },
            ],
        },
        {
            id: "creative-studio",
            text: "Creative Studio",
            images: [
                {
                    src: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&auto=format&fit=crop&q=80",
                    alt: "Neon Workspace",
                },
                {
                    src: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=500&auto=format&fit=crop&q=80",
                    alt: "Creative Agency",
                },
            ],
        },
        {
            id: "trend-hunt",
            text: "Trend Hunt",
            images: [
                {
                    src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format&fit=crop&q=80",
                    alt: "Data Charts",
                },
                {
                    src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=80",
                    alt: "Stock Market",
                },
            ],
        },
        {
            id: "idea-validator",
            text: "Idea Validator",
            images: [
                {
                    src: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&auto=format&fit=crop&q=80",
                    alt: "Strategy Meeting",
                },
                {
                    src: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&auto=format&fit=crop&q=80",
                    alt: "Brainstorming",
                },
            ],
        },
        {
            id: "strategy-deck",
            text: "Strategy Deck",
            images: [
                {
                    src: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=500&auto=format&fit=crop&q=80",
                    alt: "Presentation",
                },
                {
                    src: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=500&auto=format&fit=crop&q=80",
                    alt: "Conference Room",
                },
            ],
        },
        {
            id: "analytics",
            text: "Analytics",
            images: [
                {
                    src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format&fit=crop&q=80",
                    alt: "Analytics Graph",
                },
                {
                    src: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=500&auto=format&fit=crop&q=80",
                    alt: "Dashboard UI",
                },
            ],
        },
    ];

    return (
        <div className="flex flex-col gap-1 items-center justify-center w-full px-8 py-2 mt-0">
            <h3 className="text-4xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 tracking-widest mb-6">Our Services</h3>
            {items.map((item, index) => (
                <RevealImageListItem
                    key={index}
                    {...item} // Spread id, text, images
                    onClick={() => handleServiceClick(item.id || item.text.toLowerCase().replace(/\s/g, '-'), item.text)}
                />
            ))}
        </div>
    );
}
