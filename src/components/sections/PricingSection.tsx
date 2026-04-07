// components/sections/PricingSection.tsx
import { useState } from "react";
import { Button } from "../ui/button";

const PRICES = {
  cubPlan: 399, // per plan
  admin: 200,   // per additional admin (first included)
  mediator: 500 // per mediator
};

const PricingSection = () => {
  const [numPlans, setNumPlans] = useState(1);
  const [numAdmins, setNumAdmins] = useState(1); // first admin included
  const [numMediators, setNumMediators] = useState(0);
  const [isAnnual, setIsAnnual] = useState(false);

  const monthlySubtotal =
    PRICES.cubPlan * numPlans +
    PRICES.admin * Math.max(0, numAdmins - 1) +
    PRICES.mediator * numMediators;
const multiplier = isAnnual ? 12 * 0.85 : 1;
const total = monthlySubtotal * multiplier;

  return (
    <section className="py-16 bg-cub-background-light" id="pricing-section">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-center text-primary mb-10">
          Pricing Calculator
        </h2>

        {/* Sliders */}
        <div className="grid gap-8 bg-white p-8 rounded-3xl shadow-lg">
          {/* Plans */}
        <div>
            <label className="block mb-2 font-medium text-foreground">
                CUB Plans: {numPlans}
            </label>
            <div className="flex items-center gap-4">
                <input
                type="range"
                min={1}
                max={500}
                step={1}
                value={numPlans}
                onChange={(e) => setNumPlans(Number(e.target.value))}
                className="flex-1 accent-cub-teal"
                aria-label="Number of CUB plans slider"
                />
                <input
                type="number"
                min={1}
                max={500}
                value={numPlans}
                onChange={(e) => setNumPlans(Number(e.target.value))}
                className="w-16 p-1 border rounded text-center text-foreground"
                aria-label="Number of CUB plans input"
                />
            </div>
        </div>

          {/* Admins */}
        <div>
        <label className="block mb-2 font-medium text-foreground">
            Admins: {numAdmins}
        </label>
        <div className="flex items-center gap-4">
            <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={numAdmins}
            onChange={(e) => setNumAdmins(Number(e.target.value))}
            className="flex-1 accent-cub-teal"
            aria-label="Number of admins slider"
            />
            <input
            type="number"
            min={1}
            max={10}
            value={numAdmins}
            onChange={(e) => setNumAdmins(Number(e.target.value))}
            className="w-16 p-1 border rounded text-center text-foreground"
            aria-label="Number of admins input"
            />
        </div>
        <p className="text-sm text-muted-foreground">
            First admin included, additional @ R200 each
        </p>
        </div>

          {/* Mediators */}
            <div>
            <label className="block mb-2 font-medium text-foreground">
                Mediators: {numMediators}
            </label>
            <div className="flex items-center gap-4">
                <input
                type="range"
                min={0}
                max={5}
                step={1}
                value={numMediators}
                onChange={(e) => setNumMediators(Number(e.target.value))}
                className="flex-1 accent-cub-teal"
                aria-label="Number of mediators slider"
                />
                <input
                type="number"
                min={0}
                max={5}
                value={numMediators}
                onChange={(e) => setNumMediators(Number(e.target.value))}
                className="w-16 p-1 border rounded text-center text-foreground"
                aria-label="Number of mediators input"
                />
            </div>
            </div>

          {/* Monthly / Annual Toggle */}
<div className="flex items-center justify-center gap-4 mt-4">
  <span className="text-foreground font-medium">Monthly</span>
  <label className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      checked={isAnnual}
      onChange={() => setIsAnnual(!isAnnual)}
      className="sr-only peer"
    />
    {/* Toggle background changes for Monthly / Annual */}
    <div className="w-12 h-6 rounded-full transition
      bg-cub-teal peer-checked:bg-cub-muted">
    </div>
    {/* Toggle knob */}
    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition
      peer-checked:translate-x-6"></div>
  </label>
  <span className="text-foreground font-medium">Annual (15% off)</span>
</div>

          {/* {/* Cost Breakdown */}
        <div className="bg-cub-background rounded-2xl p-6 mt-6 shadow-inner min-h-[200px] overflow-y-auto flex flex-col justify-between">
  <div>
    <h3 className="text-xl font-semibold text-primary mb-4">
      Cost Breakdown
    </h3>
    <ul className="mb-2 text-foreground/90 space-y-1">
        <li>
        CUB Plans ({numPlans} × R{PRICES.cubPlan}) = R{Math.round(PRICES.cubPlan * numPlans * multiplier)}
        </li>
        <li>
        Admins ({numAdmins > 1 ? numAdmins - 1 : 0} × R{PRICES.admin}) = R{Math.round(PRICES.admin * Math.max(0, numAdmins - 1) * multiplier)}
        </li>
        <li>
        Mediators ({numMediators} × R{PRICES.mediator}) = R{Math.round(PRICES.mediator * numMediators * multiplier)}
        </li>
    </ul>
    <p className={`text-green-600 font-medium mb-2 h-5 ${isAnnual ? "visible" : "invisible"}`}>
      Annual discount applied: 15%
    </p>
  </div>
  <p className="text-2xl font-bold text-primary h-10">
      Total ({isAnnual ? "Annual" : "Monthly"}): R{Math.round(total)}
  </p>
</div>

          {/* CTA */}
          <div className="text-center mt-6">
            <Button variant="coral" size="lg">
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;