// Every public route, with the heading that proves it loaded. The release
// acceptance checks and the private-name scan both walk this list.
export const routes = [
  ["/", "Every record ends with a person."],
  ["/work/multi-company-hris", "Multi-Company HRIS"],
  ["/work/ai-odoo-rnd", "AI R&D Case Study"],
  ["/work/payment-provider", "Payment Provider Module"],
  ["/work/public-sector-hris", "Government Water District HRIS"],
  ["/work/brokerage-erp-rebuild", "Brokerage ERP Rebuild"],
  ["/systems/dots-hyprland", "Evolving my previous Hyprland desktop"],
] as const;
