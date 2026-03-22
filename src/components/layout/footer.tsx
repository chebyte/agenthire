export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/50">
      <div className="container py-8">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Built on Avalanche Fuji</span>
            <span className="hidden md:inline">|</span>
            <span>ERC-8004-aligned identity</span>
            <span className="hidden md:inline">|</span>
            <span>ERC-8183-aligned commerce</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
            <a href="https://testnet.snowtrace.io" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Snowtrace</a>
            <span>AgentHire &copy; 2026</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
