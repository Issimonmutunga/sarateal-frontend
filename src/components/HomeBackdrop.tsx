interface HomeBackdropProps {
  slides: Array<{ src: string; alt: string }>;
}

export function HomeBackdrop({ slides }: HomeBackdropProps) {
  const single = slides.length === 1;

  return (
    <div
      className={single ? "home-backdrop is-single" : "home-backdrop"}
      aria-hidden="true"
    >
      {slides.map((slide) => (
        <img
          key={slide.src}
          className="home-backdrop-slide is-front"
          src={slide.src}
          alt={slide.alt}
          loading="eager"
          fetchPriority="high"
          draggable={false}
        />
      ))}
    </div>
  );
}