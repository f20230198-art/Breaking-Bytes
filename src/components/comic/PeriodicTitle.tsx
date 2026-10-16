/** "[Br]eaking [B]ytes" lockup: element tiles + display type, linocut-styled. Placeholder until the linocut logo is drawn. */
function Tile({ symbol, number, mass, name }: { symbol: string; number: number; mass: string; name: string }) {
  return (
    <span className="carved relative mr-1 inline-flex [text-shadow:none] h-[1.15em] min-w-[1.15em] flex-col items-center justify-center px-[0.1em] border-[0.06em] border-ink bg-olive align-[-0.12em] text-paper print-shadow">
      <span className="absolute left-[0.08em] top-[0.05em] font-type text-[0.16em] leading-none">{number}</span>
      <span className="absolute right-[0.08em] top-[0.05em] font-type text-[0.12em] leading-none">{mass}</span>
      <span className="text-center leading-none">{symbol}</span>
      <span className="absolute bottom-[0.06em] w-full text-center font-type text-[0.11em] leading-none">{name}</span>
    </span>
  );
}

export function PeriodicTitle({ className = "" }: { className?: string }) {
  return (
    <h1 className={`font-display leading-[1.02] text-paper [text-shadow:0.05em_0.05em_0_#111] ${className}`}>
      <span className="block">
        <Tile symbol="Br" number={35} mass="79.904" name="Bromine" />
        eaking
      </span>
      <span className="block pl-[1.4em]">
        <Tile symbol="B" number={5} mass="10.81" name="Boron" />
        ytes
      </span>
    </h1>
  );
}
