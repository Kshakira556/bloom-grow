import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import * as api from "@/lib/api";

const CreatePlan = () => {
  const [title, setTitle] = useState("");
  const [coParentEmail, setCoParentEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreatePlan = async () => {
    try {
      setLoading(true);

      // 1. Create plan
      const plan = await api.createPlan(title);

      // 2. Invite co-parent (ONLY via plan invite system)
      if (coParentEmail.trim()) {
        await api.inviteToPlan({
          planId: Number(plan.id),
          email: coParentEmail.trim(),
        });
      }

      // 3. Redirect into app
      navigate("/visits");
    } catch (err) {
      console.error("Failed to create plan:", err);
      alert("Failed to create plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 space-y-4">
      <h1 className="text-2xl font-bold">Create Parenting Plan</h1>

      <Input
        placeholder="Plan title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <Input
        placeholder="Co-parent email"
        value={coParentEmail}
        onChange={(e) => setCoParentEmail(e.target.value)}
      />

      <Button onClick={handleCreatePlan} disabled={loading}>
        {loading ? "Creating..." : "Create Plan"}
      </Button>
    </div>
  );
};

export default CreatePlan;