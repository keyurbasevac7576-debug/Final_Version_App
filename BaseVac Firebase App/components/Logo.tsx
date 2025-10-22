
import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({ className }: { className?: string }) {
    return (
        <Image 
            src="https://images.squarespace-cdn.com/content/v1/5399ff42e4b070157e072b2f/1413836051573-C6745M5Y879JSYE7NHRP/Base-Vac-Dental-Logo-Box.png?format=1500w" 
            alt="BaseVac Logo" 
            width={160} 
            height={40} 
            className={cn("object-contain", className)}
        />
    )
}
