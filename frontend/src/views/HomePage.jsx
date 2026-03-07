import React from "react";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { QuizPreview } from "@/components/landing/QuizPreview";
import { WordTypesSection } from "@/components/landing/WordTypesSection";
import { Footer } from "@/components/landing/Footer";

function HomePage() {
    return (
        <div className="min-h-screen bg-background font-sans text-foreground selection:bg-accent selection:text-accent-foreground">
            <main className="flex-1">
                <HeroSection />
                <FeaturesSection />
                <WordTypesSection />
                <QuizPreview />
            </main>
            <Footer />
        </div>
    );
}

export default HomePage;