interface HomeBackdropProps {
  slides: Array<{ src: string; alt: string }>;
}

export function HomeBackdrop({ slides }: HomeBackdropProps) {
  return (
    <div className="home-backdrop" aria-hidden="true">
      {slides.map((slide, index) => (
        <img
          key={slide.src}
          className={index === 0 ? "home-backdrop-slide is-front" : "home-backdrop-slide"}
          src={slide.src}
          alt={slide.alt}
          loading="eager"
          fetchPriority={index === 0 ? "high" : "low"}
          draggable={false}
        />
      ))}
    </div>
  );
}