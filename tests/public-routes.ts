// Every public route, with the heading that proves it loaded. The release
// acceptance checks and the private-name scan both walk this list.
export const routes = [
  ["/", "Every record ends with a person."],
  ["/work/multi-company-hris", "Multi-Company HRIS"],
  ["/work/ai-odoo-rnd", "AI R&D Case Study"],
  ["/work/payment-provider", "Payment Provider Module"],
  ["/work/public-sector-hris", "Government Water District HRIS"],
  ["/systems/dots-hyprland", "Evolving a Hyprland desktop into my daily platform"],
] as const;
