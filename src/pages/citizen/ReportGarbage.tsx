import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Camera, MapPin, Upload } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { Constants } from "@/integrations/supabase/types";

const categories = Constants.public.Enums.garbage_category;

export default function ReportGarbage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("other");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const getLocation = () => {
    setGettingLocation(true);
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      setGettingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAddress(`Lat: ${pos.coords.latitude.toFixed(6)}, Lng: ${pos.coords.longitude.toFixed(6)}`);
        setGettingLocation(false);
        toast.success("Location captured!");
      },
      (err) => {
        toast.error("Could not get location: " + err.message);
        setGettingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    getLocation();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !imageFile || !coords) {
      toast.error("Please provide an image and location");
      return;
    }
    setLoading(true);

    // Upload image
    const ext = imageFile.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("complaint-images")
      .upload(path, imageFile);
    if (uploadErr) {
      toast.error("Image upload failed: " + uploadErr.message);
      setLoading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("complaint-images").getPublicUrl(path);

    const { error } = await supabase.from("complaints").insert({
      user_id: user.id,
      image_url: urlData.publicUrl,
      latitude: coords.lat,
      longitude: coords.lng,
      address,
      category: category as Database["public"]["Enums"]["garbage_category"],
      description,
    });

    if (error) {
      toast.error("Failed to submit report: " + error.message);
    } else {
      toast.success("Report submitted successfully!");
      navigate("/complaints");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-heading">Report Garbage</CardTitle>
          <CardDescription>Upload a photo and your location to report garbage</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Photo Evidence</Label>
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="mt-3"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                    >
                      Change Photo
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-3">
                    <div className="p-4 rounded-full bg-secondary">
                      <Camera className="h-8 w-8 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Click to upload or take a photo
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label>Location</Label>
              <div className="flex gap-2">
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address or coordinates" className="flex-1" />
                <Button type="button" variant="secondary" onClick={getLocation} disabled={gettingLocation}>
                  <MapPin className="h-4 w-4 mr-1" />
                  {gettingLocation ? "Getting..." : "GPS"}
                </Button>
              </div>
              {coords && (
                <p className="text-xs text-muted-foreground">
                  📍 {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                </p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="capitalize">
                      {cat.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the garbage situation..."
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full gap-2" disabled={loading || !imageFile || !coords}>
              <Upload className="h-4 w-4" />
              {loading ? "Submitting..." : "Submit Report"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
