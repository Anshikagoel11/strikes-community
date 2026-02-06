import Image from "next/image";
import { CheckCircle2, LucideIcon } from "lucide-react";

interface FeatureSectionProps {
    imageSrc: string;
    imageAlt: string;
    icon: LucideIcon;
    title: string;
    description: string;
    reversed?: boolean;
    features?: string[];
}

export function FeatureSection({
    imageSrc,
    imageAlt,
    icon: Icon,
    title,
    description,
    reversed = false,
    features,
}: FeatureSectionProps) {
    const imageSection = (
        <div className="lg:w-1/2">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border/50 aspect-square sm:aspect-video lg:aspect-square group">
                <Image
                    src={imageSrc}
                    alt={imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 600px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
            </div>
        </div>
    );

    const contentSection = (
        <div className="lg:w-1/2 space-y-6 flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="h-12 w-12 rounded-2xl bg-primary-color/10 flex items-center justify-center">
                <Icon className="h-6 w-6 text-primary-color" />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold">{title}</h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
                {description}
            </p>
            {features && features.length > 0 && (
                <ul className="space-y-3 pt-4">
                    {features.map((feature, index) => (
                        <li
                            key={index}
                            className="flex items-center gap-3 text-muted-foreground"
                        >
                            <CheckCircle2 className="h-5 w-5 text-primary-color" />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

    return (
        <div className="container px-4 mx-auto mb-32">
            <div
                className={`flex ${
                    reversed
                        ? "flex-col-reverse lg:flex-row"
                        : "flex-col lg:flex-row"
                } items-center gap-12 lg:gap-24`}
            >
                {reversed ? (
                    <>
                        {contentSection}
                        {imageSection}
                    </>
                ) : (
                    <>
                        {imageSection}
                        {contentSection}
                    </>
                )}
            </div>
        </div>
    );
}
