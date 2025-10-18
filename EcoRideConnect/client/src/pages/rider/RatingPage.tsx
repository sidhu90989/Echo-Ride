import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Star, 
  Heart, 
  Smile, 
  Frown, 
  Meh,
  ThumbsUp,
  Award,
  Leaf,
  DollarSign,
  CheckCircle
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

const emojiReactions = [
  { id: 'love', icon: Heart, label: 'Loved it!', color: 'text-red-500' },
  { id: 'happy', icon: Smile, label: 'Happy', color: 'text-green-500' },
  { id: 'okay', icon: Meh, label: 'Okay', color: 'text-yellow-500' },
  { id: 'sad', icon: Frown, label: 'Disappointed', color: 'text-orange-500' },
  { id: 'thumbs', icon: ThumbsUp, label: 'Great!', color: 'text-blue-500' }
];

const tipAmounts = [10, 20, 30, 50];

export default function RatingPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [rating, setRating] = useState(0);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [customTip, setCustomTip] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Mock ride and driver data
  const rideData = {
    driverName: "Ravi Kumar",
    vehicleNumber: "DL 8C 1234",
    vehicleType: "E-Rickshaw",
    fare: 45,
    co2Saved: 1.2,
    ecoPointsEarned: 25,
    distance: "4.2 km",
    duration: "12 mins"
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      toast({
        title: "Please provide a rating",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      
      toast({
        title: "Thank you for your feedback!",
        description: "Your rating helps us improve our service."
      });

      // Navigate to dashboard after a delay
      setTimeout(() => {
        setLocation("/rider");
      }, 3000);
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4 text-center">
          <div className="space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <div className="space-y-2">
              <h3 className="font-serif text-2xl font-semibold">Trip Complete!</h3>
              <p className="text-sm text-muted-foreground">
                Thank you for choosing EcoRide. Your feedback helps us serve you better.
              </p>
            </div>
            
            {/* Eco Impact Summary */}
            <Card className="p-4 bg-green-50 dark:bg-green-950/20">
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-green-600">
                    <Leaf className="w-4 h-4" />
                    <span className="font-semibold">{rideData.co2Saved} kg</span>
                  </div>
                  <p className="text-xs text-muted-foreground">CO₂ Saved</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-primary">
                    <Award className="w-4 h-4" />
                    <span className="font-semibold">{rideData.ecoPointsEarned}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Eco Points</p>
                </div>
              </div>
            </Card>
            
            <div className="animate-pulse">
              <p className="text-xs text-muted-foreground">
                Redirecting to dashboard...
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4 text-center">
          <div className="space-y-6">
            <div className="animate-spin w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <div className="space-y-2">
              <h3 className="font-serif text-xl font-semibold">Submitting your feedback...</h3>
              <p className="text-sm text-muted-foreground">
                Thank you for taking the time to rate your experience
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b">
        <div className="flex items-center gap-4 px-4 py-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setLocation("/rider")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-serif text-xl font-bold">Rate Your Ride</h1>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Driver Info */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <span className="font-bold text-xl">{rideData.driverName.charAt(0)}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{rideData.driverName}</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{rideData.vehicleType}</span>
                <span>{rideData.vehicleNumber}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span>{rideData.distance}</span>
                <span>{rideData.duration}</span>
                <span>₹{rideData.fare}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Star Rating */}
        <Card className="p-6">
          <div className="text-center space-y-4">
            <h2 className="font-serif text-xl font-semibold">How was your ride?</h2>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-all duration-200 hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-400'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground">
                {rating === 1 && "We're sorry to hear that"}
                {rating === 2 && "We'll work to improve"}
                {rating === 3 && "Thank you for the feedback"}
                {rating === 4 && "Great! We're glad you enjoyed it"}
                {rating === 5 && "Awesome! Thank you for the perfect rating"}
              </p>
            )}
          </div>
        </Card>

        {/* Emoji Reactions */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">How did it make you feel?</h3>
          <div className="flex justify-center gap-4 flex-wrap">
            {emojiReactions.map((emoji) => {
              const IconComponent = emoji.icon;
              return (
                <button
                  key={emoji.id}
                  onClick={() => setSelectedEmoji(emoji.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
                    selectedEmoji === emoji.id
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'hover:bg-muted border-2 border-transparent'
                  }`}
                >
                  <IconComponent className={`w-6 h-6 ${emoji.color}`} />
                  <span className="text-xs font-medium">{emoji.label}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Feedback */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Additional Feedback (Optional)</h3>
          <Textarea
            placeholder="Tell us more about your experience..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-20"
          />
        </Card>

        {/* Tip Section */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold">Add a tip (Optional)</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Show your appreciation for excellent service
          </p>
          
          <div className="grid grid-cols-4 gap-3 mb-4">
            {tipAmounts.map((amount) => (
              <Button
                key={amount}
                variant={selectedTip === amount ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedTip(amount);
                  setCustomTip("");
                }}
              >
                ₹{amount}
              </Button>
            ))}
          </div>
          
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Custom amount"
              value={customTip}
              onChange={(e) => {
                setCustomTip(e.target.value);
                setSelectedTip(null);
              }}
              className="flex-1 px-3 py-2 border rounded-md text-sm"
            />
            <Button
              variant="outline"
              onClick={() => {
                if (customTip) {
                  setSelectedTip(parseInt(customTip));
                }
              }}
            >
              Add
            </Button>
          </div>
          
          {(selectedTip || customTip) && (
            <div className="mt-3 p-2 bg-green-50 dark:bg-green-950/20 rounded-md">
              <p className="text-sm text-green-700 dark:text-green-300">
                💚 Tip of ₹{selectedTip || customTip} will be added to your total
              </p>
            </div>
          )}
        </Card>

        {/* Eco Impact */}
        <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3 mb-3">
            <Leaf className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-800 dark:text-green-200">Your Eco Impact</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{rideData.co2Saved} kg</div>
              <p className="text-sm text-green-700 dark:text-green-300">CO₂ Saved</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{rideData.ecoPointsEarned}</div>
              <p className="text-sm text-green-700 dark:text-green-300">Eco Points Earned</p>
            </div>
          </div>
          <p className="text-xs text-green-700 dark:text-green-300 mt-2 text-center">
            🌱 Every eco-friendly ride helps build a cleaner future!
          </p>
        </Card>

        {/* Submit Button */}
        <div className="pb-6">
          <Button 
            className="w-full py-6 text-lg font-semibold"
            size="lg"
            onClick={handleSubmitRating}
            disabled={rating === 0}
          >
            Submit Rating & Complete Trip
          </Button>
          
          {rating === 0 && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              Please provide a star rating to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
