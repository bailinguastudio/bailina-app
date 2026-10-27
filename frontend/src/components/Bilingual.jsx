export function Bilingual({ es, de, size = "md", testId }) {
  const big = size === "lg";
  return (
    <div data-testid={testId}>
      <p className={`font-display font-bold text-[#174B50] leading-tight ${big ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl"}`} lang="es">
        {es}
      </p>
      <p className={`text-[#4B767A] ${big ? "text-lg sm:text-xl" : "text-base sm:text-lg"}`} lang="de">
        {de}
      </p>
    </div>
  );
}
