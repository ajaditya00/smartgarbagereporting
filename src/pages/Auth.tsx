import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Recycle, Leaf, MapPin } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      const user = data.user;

      // Get user roles from database
      const { data: rolesData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id);

      if (roleError) {
        toast.error("Unable to fetch user role: " + roleError.message);
        setLoading(false);
        return;
      }

      if (!rolesData || rolesData.length === 0) {
        toast.error("No roles assigned. Please check user_roles in database.");
        setLoading(false);
        return;
      }

      const roleList = rolesData.map((r) => r.role);
      const hasAdmin = roleList.includes("admin");
      const hasEmployee = roleList.includes("employee");

      toast.success("Logged in successfully!");

      if (hasAdmin) {
        navigate("/admin");
      } else if (hasEmployee) {
        navigate("/employee");
      } else {
        navigate("/");
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Account created! Please verify your email.");
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="relative text-center space-y-8">
          <Recycle className="h-14 w-14 text-white mx-auto" />
          <h1 className="text-4xl font-bold text-white">CleanCity</h1>

          <p className="text-white/80">
            Smart Garbage Reporting & Management System
          </p>

          <div className="space-y-4 text-white/80 mt-8">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Report garbage with GPS
            </div>

            <div className="flex items-center gap-2">
              <Leaf className="h-5 w-5" />
              Track cleanup progress
            </div>

            <div className="flex items-center gap-2">
              <Recycle className="h-5 w-5" />
              Keep your city clean
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {isLogin ? "Welcome back" : "Create account"}
            </CardTitle>

            <CardDescription>
              {isLogin
                ? "Sign in to your account"
                : "Join the clean city movement"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <Label>Full Name</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? "Please wait..."
                  : isLogin
                  ? "Sign In"
                  : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}