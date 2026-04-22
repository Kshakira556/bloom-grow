import { useState } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import * as api from "@/lib/api";

const CreatePlan = () => {
  const [title, setTitle] = useState("");
  const [coParentEmail, setCoParentEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const handleCreatePlan = async () => {
    try {
        setLoading(true);

        if (!user?.id) {
            alert("You must be logged in to create a plan");
            setLoading(false);
            return;
        }
        
        // 1. Create plan
        const plan = await api.createPlan({
        title,
        created_by: user.id,
        });

        // 2. Invite co-parent
        if (coParentEmail.trim()) {
        await api.inviteToPlan({
          planId: plan.id,
          email: coParentEmail.trim(),
        });
        }

        // 3. Redirect
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