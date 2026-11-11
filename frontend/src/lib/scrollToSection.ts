export const scrollToSection = (id: string) => {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  const element = document.getElementById(id);
  if (element) {
    const headerOffset = 76;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.scrollY - headerOffset;
    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth"
    });
  }
};

