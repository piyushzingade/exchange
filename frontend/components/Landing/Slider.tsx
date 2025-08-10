"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Slide = {
  id: number;
  image: string;
  title: string;
  description: string;
  buttonText: string;
};

const slides: Slide[] = [
  {
    id: 1,
    image: "/home-banner-refer.webp",
    title: "Refer and Earn",
    description: "Refer a friend and earn a percentage of their trading fees.",
    buttonText: "Manage Referrals",
  },
  {
    id: 2,
    image: "/home-banner-stacked-yield-sol-new.webp",
    title: "Trade Smarter",
    description: "Get insights and analytics for your trading journey.",
    buttonText: "Start Trading",
  },
  {
    id: 3,
    image: "/home-banner-season-2.webp",
    title: "Exclusive Rewards",
    description: "Earn rewards for consistent trading activity.",
    buttonText: "View Rewards",
  },
  {
    id: 4,
    image: "/home-banner-stacked-yield-usd-new.webp",
    title: "Secure Platform",
    description: "Experience safe and secure crypto trading.",
    buttonText: "Learn More",
  },
  {
    id: 5,
    image: "/home-banner-wire-transfers.webp",
    title: "Advanced Tools",
    description: "Access pro-grade trading tools for free.",
    buttonText: "Explore Tools",
  },
  {
    id: 6,
    image: "/home-banner-usdt-3.webp",
    title: "Join the Community",
    description: "Be part of a growing global trading community.",
    buttonText: "Join Now",
  },
];

export default function Slider() {
  const [current, setCurrent] = useState(0);

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  // Auto change every 1.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-[420px] overflow-hidden rounded-2xl bg-black">
      {/* Slide container */}
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide) => (
          <div
            key={slide.id}
            className="relative min-w-full h-[420px] flex-shrink-0"
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              priority
              className="object-cover rounded-2xl"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent rounded-2xl" />

            {/* Bottom-left content */}
            <div className="absolute left-8 bottom-8 max-w-md text-white space-y-4">
              <h2 className="text-4xl font-extrabold drop-shadow-lg">
                {slide.title}
              </h2>
              <p className="text-lg text-gray-200">{slide.description}</p>
              <button className="px-5 py-2 bg-white text-black rounded-lg font-semibold shadow-lg hover:bg-gray-200 transition">
                {slide.buttonText}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full transition"
      >
        <ChevronLeft className="text-white" size={16} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full transition"
      >
        <ChevronRight className="text-white" size={16} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-3 h-3 rounded-full transition ${
              current === index ? "bg-white scale-110" : "bg-gray-500"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
