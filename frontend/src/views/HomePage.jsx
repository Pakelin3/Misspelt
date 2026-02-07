import React from "react";
import Navbar from "@/components/Navbar";// Tu Navbar pixelado
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { QuizPreview } from "@/components/landing/QuizPreview";
import { Footer } from "@/components/landing/Footer";

function HomePage() {
    return (
        <div className="min-h-screen bg-background font-sans text-foreground selection:bg-accent selection:text-accent-foreground">
            {/* El Navbar ya maneja su propio estado responsive */}
            <Navbar />
            
            <main className="flex-1">
                <HeroSection />
                <FeaturesSection />
                <QuizPreview />
            </main>

            <Footer />
        </div>
    );
}

export default HomePage;