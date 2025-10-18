import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Gift, 
  Bell, 
  Users, 
  Car, 
  Send, 
  Copy,
  Edit,
  Trash2,
  Eye,
  Calendar as CalendarIcon,
  Target,
  Percent,
  Leaf,
  Shield,
  Megaphone,
  Plus,
  Search,
  Filter,
  BarChart3
} from "lucide-react";
import { format } from "date-fns";

interface Offer {
  id: string;
  title: string;
  description: string;
  type: 'discount' | 'referral' | 'eco_bonus' | 'loyalty';
  value: number;
  valueType: 'percentage' | 'fixed';
  code: string;
  target: 'all' | 'riders' | 'drivers' | 'new_users';
  status: 'active' | 'scheduled' | 'expired' | 'draft';
  startDate: string;
  endDate: string;
  usageLimit: number;
  usageCount: number;
  createdAt: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'promotion' | 'safety' | 'system' | 'eco_tip';
  target: 'all' | 'riders' | 'drivers' | 'specific';
  status: 'sent' | 'scheduled' | 'draft';
  scheduledFor?: string;
  sentAt?: string;
  recipientCount: number;
  readCount?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface EcoBonusProgram {
  id: string;
  name: string;
  description: string;
  bonusType: 'co2_reduction' | 'electric_ride' | 'bike_share' | 'carpooling';
  rewardPoints: number;
  isActive: boolean;
  participantCount: number;
  totalRewardsIssued: number;
}

export default function OffersNotificationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [offerForm, setOfferForm] = useState({
    title: "",
    description: "",
    type: "discount",
    value: 0,
    valueType: "percentage",
    code: "",
    target: "all",
    startDate: "",
    endDate: "",
    usageLimit: 100
  });

  const [notificationForm, setNotificationForm] = useState({
    title: "",
    message: "",
    type: "promotion",
    target: "all",
    priority: "medium",
    scheduledFor: ""
  });

  // Mock offers data
  const offers: Offer[] = [
    {
      id: "OFFER-001",
      title: "New Year Ride Discount",
      description: "20% off on all rides during New Year week",
      type: "discount",
      value: 20,
      valueType: "percentage",
      code: "NEWYEAR20",
      target: "all",
      status: "active",
      startDate: "2024-01-01",
      endDate: "2024-01-07",
      usageLimit: 1000,
      usageCount: 347,
      createdAt: "2023-12-28"
    },
    {
      id: "OFFER-002",
      title: "Refer a Friend",
      description: "Get $10 credit when your friend takes their first ride",
      type: "referral",
      value: 10,
      valueType: "fixed",
      code: "REFER10",
      target: "all",
      status: "active",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      usageLimit: 5000,
      usageCount: 1234,
      createdAt: "2024-01-01"
    },
    {
      id: "OFFER-003",
      title: "Eco Warrior Bonus",
      description: "Extra 50 points for choosing electric vehicles",
      type: "eco_bonus",
      value: 50,
      valueType: "fixed",
      code: "ECO50",
      target: "all",
      status: "active",
      startDate: "2024-01-15",
      endDate: "2024-02-15",
      usageLimit: 2000,
      usageCount: 89,
      createdAt: "2024-01-10"
    }
  ];

  // Mock notifications data
  const notifications: Notification[] = [
    {
      id: "NOTIF-001",
      title: "Safety First Reminder",
      message: "Remember to wear your seatbelt and follow traffic rules. Your safety is our priority!",
      type: "safety",
      target: "all",
      status: "sent",
      sentAt: "2024-01-15 09:00",
      recipientCount: 15420,
      readCount: 12336,
      priority: "high"
    },
    {
      id: "NOTIF-002",
      title: "New Electric Vehicles Available",
      message: "We've added new Tesla Model 3s to our fleet. Book now and reduce your carbon footprint!",
      type: "promotion",
      target: "riders",
      status: "sent",
      sentAt: "2024-01-14 14:30",
      recipientCount: 8750,
      readCount: 6125,
      priority: "medium"
    },
    {
      id: "NOTIF-003",
      title: "Driver Bonus Weekend",
      message: "Earn 1.5x more this weekend! Complete 10+ rides and get bonus rewards.",
      type: "promotion",
      target: "drivers",
      status: "scheduled",
      scheduledFor: "2024-01-20 08:00",
      recipientCount: 2340,
      priority: "medium"
    }
  ];

  // Mock eco bonus programs
  const ecoBonusPrograms: EcoBonusProgram[] = [
    {
      id: "ECO-001",
      name: "Carbon Offset Champion",
      description: "Earn points for every kg of CO₂ saved by choosing eco-friendly rides",
      bonusType: "co2_reduction",
      rewardPoints: 10,
      isActive: true,
      participantCount: 3247,
      totalRewardsIssued: 45680
    },
    {
      id: "ECO-002",
      name: "Electric Explorer",
      description: "Double points for rides in electric vehicles",
      bonusType: "electric_ride",
      rewardPoints: 20,
      isActive: true,
      participantCount: 1856,
      totalRewardsIssued: 28440
    },
    {
      id: "ECO-003",
      name: "Bike Share Hero",
      description: "Special rewards for combining bike shares with ride bookings",
      bonusType: "bike_share",
      rewardPoints: 15,
      isActive: false,
      participantCount: 892,
      totalRewardsIssued: 12180
    }
  ];

  const getOfferStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      scheduled: "secondary",
      expired: "outline",
      draft: "secondary"
    } as const;
    
    const colors = {
      active: "bg-green-100 text-green-800",
      scheduled: "bg-blue-100 text-blue-800",
      expired: "bg-gray-100 text-gray-600",
      draft: "bg-yellow-100 text-yellow-800"
    };
    
    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getNotificationStatusBadge = (status: string) => {
    const colors = {
      sent: "bg-green-100 text-green-800",
      scheduled: "bg-blue-100 text-blue-800",
      draft: "bg-yellow-100 text-yellow-800"
    };
    
    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: "bg-gray-100 text-gray-600",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800"
    };
    
    return (
      <Badge className={colors[priority as keyof typeof colors]}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'discount':
        return <Percent className="h-4 w-4 text-green-500" />;
      case 'referral':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'eco_bonus':
        return <Leaf className="h-4 w-4 text-emerald-500" />;
      case 'loyalty':
        return <Gift className="h-4 w-4 text-purple-500" />;
      case 'promotion':
        return <Megaphone className="h-4 w-4 text-orange-500" />;
      case 'safety':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'system':
        return <Bell className="h-4 w-4 text-gray-500" />;
      case 'eco_tip':
        return <Leaf className="h-4 w-4 text-green-500" />;
      default:
        return <Gift className="h-4 w-4 text-gray-500" />;
    }
  };

  const generateReferralCode = () => {
    const code = 'REF' + Math.random().toString(36).substr(2, 6).toUpperCase();
    setOfferForm(prev => ({ ...prev, code }));
  };

  const filteredOffers = offers.filter(offer =>
    offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    offer.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredNotifications = notifications.filter(notification =>
    notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notification.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-4 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Offers & Notifications</h1>
          <p className="text-muted-foreground">
            Manage promotional campaigns, referral codes, and user communications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Campaign Analytics
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Offers</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{offers.filter(o => o.status === 'active').length}</div>
            <div className="text-xs text-muted-foreground">
              {offers.filter(o => o.status === 'scheduled').length} scheduled
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications Sent</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.reduce((acc, n) => acc + (n.recipientCount || 0), 0).toLocaleString()}
            </div>
            <div className="text-xs text-green-600">
              {notifications.filter(n => n.status === 'sent').length} campaigns completed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eco Programs</CardTitle>
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ecoBonusPrograms.filter(p => p.isActive).length}</div>
            <div className="text-xs text-muted-foreground">
              {ecoBonusPrograms.reduce((acc, p) => acc + p.participantCount, 0).toLocaleString()} participants
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referral Usage</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {offers.find(o => o.type === 'referral')?.usageCount || 0}
            </div>
            <div className="text-xs text-muted-foreground">
              {((offers.find(o => o.type === 'referral')?.usageCount || 0) / 
                (offers.find(o => o.type === 'referral')?.usageLimit || 1) * 100).toFixed(1)}% of limit
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="offers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="offers">Offers & Codes</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="eco-programs">Eco Programs</TabsTrigger>
          <TabsTrigger value="referrals">Referral System</TabsTrigger>
        </TabsList>

        {/* Offers Tab */}
        <TabsContent value="offers">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create New Offer */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Create New Offer</CardTitle>
                <CardDescription>
                  Design promotional campaigns and discount codes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Offer Title</label>
                  <Input 
                    placeholder="Enter offer title"
                    value={offerForm.title}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea 
                    placeholder="Describe your offer..."
                    value={offerForm.description}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <Select value={offerForm.type} onValueChange={(value) => setOfferForm(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="discount">Discount</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="eco_bonus">Eco Bonus</SelectItem>
                        <SelectItem value="loyalty">Loyalty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Target</label>
                    <Select value={offerForm.target} onValueChange={(value) => setOfferForm(prev => ({ ...prev, target: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="riders">Riders Only</SelectItem>
                        <SelectItem value="drivers">Drivers Only</SelectItem>
                        <SelectItem value="new_users">New Users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium">Value</label>
                    <Input 
                      type="number" 
                      placeholder="0"
                      value={offerForm.value}
                      onChange={(e) => setOfferForm(prev => ({ ...prev, value: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <Select value={offerForm.valueType} onValueChange={(value) => setOfferForm(prev => ({ ...prev, valueType: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Promo Code</label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Enter code"
                      value={offerForm.code}
                      onChange={(e) => setOfferForm(prev => ({ ...prev, code: e.target.value }))}
                    />
                    <Button variant="outline" size="sm" onClick={generateReferralCode}>
                      Generate
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium">Start Date</label>
                    <Input 
                      type="date"
                      value={offerForm.startDate}
                      onChange={(e) => setOfferForm(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">End Date</label>
                    <Input 
                      type="date"
                      value={offerForm.endDate}
                      onChange={(e) => setOfferForm(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Usage Limit</label>
                  <Input 
                    type="number" 
                    placeholder="100"
                    value={offerForm.usageLimit}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, usageLimit: Number(e.target.value) }))}
                  />
                </div>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Offer
                </Button>
              </CardContent>
            </Card>

            {/* Offers List */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Active Offers</CardTitle>
                    <CardDescription>
                      Manage existing promotional campaigns
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search offers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-48"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Offer</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOffers.map((offer) => (
                      <TableRow key={offer.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(offer.type)}
                            <div>
                              <div className="font-medium">{offer.title}</div>
                              <div className="text-sm text-muted-foreground">{offer.description.substring(0, 40)}...</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="bg-muted px-2 py-1 rounded text-sm">{offer.code}</code>
                            <Button variant="ghost" size="sm">
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          {offer.value}{offer.valueType === 'percentage' ? '%' : '$'}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {offer.usageCount} / {offer.usageLimit}
                            <div className="w-full bg-muted rounded-full h-1 mt-1">
                              <div 
                                className="bg-primary h-1 rounded-full" 
                                style={{ width: `${(offer.usageCount / offer.usageLimit) * 100}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getOfferStatusBadge(offer.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Offer Details</DialogTitle>
                                  <DialogDescription>
                                    Complete information for {offer.title}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">Offer ID</label>
                                      <p className="text-sm text-muted-foreground font-mono">{offer.id}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Type</label>
                                      <div className="flex items-center gap-2">
                                        {getTypeIcon(offer.type)}
                                        <span className="text-sm capitalize">{offer.type.replace('_', ' ')}</span>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Value</label>
                                      <p className="text-sm text-muted-foreground">
                                        {offer.value}{offer.valueType === 'percentage' ? '%' : '$'}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Target</label>
                                      <p className="text-sm text-muted-foreground capitalize">{offer.target.replace('_', ' ')}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Valid Period</label>
                                      <p className="text-sm text-muted-foreground">
                                        {offer.startDate} to {offer.endDate}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Usage Stats</label>
                                      <p className="text-sm text-muted-foreground">
                                        {offer.usageCount} / {offer.usageLimit} used
                                      </p>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Description</label>
                                    <p className="text-sm text-muted-foreground">{offer.description}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Promo Code</label>
                                    <div className="flex items-center gap-2">
                                      <code className="bg-muted px-3 py-2 rounded">{offer.code}</code>
                                      <Button variant="outline" size="sm">
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Notification */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Send Notification</CardTitle>
                <CardDescription>
                  Push app-wide offers, safety alerts, or announcements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input 
                    placeholder="Notification title"
                    value={notificationForm.title}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Message</label>
                  <Textarea 
                    placeholder="Notification message..."
                    value={notificationForm.message}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <Select value={notificationForm.type} onValueChange={(value) => setNotificationForm(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="promotion">Promotion</SelectItem>
                        <SelectItem value="safety">Safety Alert</SelectItem>
                        <SelectItem value="system">System Update</SelectItem>
                        <SelectItem value="eco_tip">Eco Tip</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <Select value={notificationForm.priority} onValueChange={(value) => setNotificationForm(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Target Audience</label>
                  <Select value={notificationForm.target} onValueChange={(value) => setNotificationForm(prev => ({ ...prev, target: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="riders">Riders Only</SelectItem>
                      <SelectItem value="drivers">Drivers Only</SelectItem>
                      <SelectItem value="specific">Specific Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Schedule For (Optional)</label>
                  <Input 
                    type="datetime-local"
                    value={notificationForm.scheduledFor}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, scheduledFor: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1">
                    <Send className="h-4 w-4 mr-2" />
                    Send Now
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notifications List */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Notification History</CardTitle>
                    <CardDescription>
                      Track sent and scheduled notifications
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search notifications..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-48"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNotifications.map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(notification.type)}
                            <div>
                              <div className="font-medium">{notification.title}</div>
                              <div className="text-sm text-muted-foreground">{notification.message.substring(0, 40)}...</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{notification.type.replace('_', ' ')}</TableCell>
                        <TableCell className="capitalize">{notification.target}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{notification.recipientCount.toLocaleString()}</div>
                            {notification.readCount && (
                              <div className="text-sm text-muted-foreground">
                                {notification.readCount.toLocaleString()} read
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getPriorityBadge(notification.priority)}</TableCell>
                        <TableCell>{getNotificationStatusBadge(notification.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Notification Details</DialogTitle>
                                  <DialogDescription>
                                    Complete information for {notification.title}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">ID</label>
                                      <p className="text-sm text-muted-foreground font-mono">{notification.id}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Type</label>
                                      <div className="flex items-center gap-2">
                                        {getTypeIcon(notification.type)}
                                        <span className="text-sm capitalize">{notification.type.replace('_', ' ')}</span>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Target</label>
                                      <p className="text-sm text-muted-foreground capitalize">{notification.target}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Priority</label>
                                      {getPriorityBadge(notification.priority)}
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Recipients</label>
                                      <p className="text-sm text-muted-foreground">{notification.recipientCount.toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Read Rate</label>
                                      <p className="text-sm text-muted-foreground">
                                        {notification.readCount ? 
                                          `${((notification.readCount / notification.recipientCount) * 100).toFixed(1)}%` : 
                                          'N/A'
                                        }
                                      </p>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Message</label>
                                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Status</label>
                                    <div className="flex items-center gap-2">
                                      {getNotificationStatusBadge(notification.status)}
                                      <span className="text-sm text-muted-foreground">
                                        {notification.sentAt ? `Sent: ${notification.sentAt}` : 
                                         notification.scheduledFor ? `Scheduled: ${notification.scheduledFor}` : 
                                         'Draft'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Eco Programs Tab */}
        <TabsContent value="eco-programs">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Eco-Bonus Programs</CardTitle>
                <CardDescription>
                  Manage environmental incentive programs and rewards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {ecoBonusPrograms.map((program) => (
                    <Card key={program.id} className={program.isActive ? "border-green-200" : "border-gray-200"}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <Leaf className="h-5 w-5 text-green-500" />
                            <CardTitle className="text-lg">{program.name}</CardTitle>
                          </div>
                          <Switch checked={program.isActive} />
                        </div>
                        <CardDescription>{program.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Reward Points</span>
                          <Badge variant="secondary">{program.rewardPoints} pts</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Participants</span>
                          <span className="text-sm font-medium">{program.participantCount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Total Rewards</span>
                          <span className="text-sm font-medium">{program.totalRewardsIssued.toLocaleString()}</span>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Stats
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Create New Eco Program */}
            <Card>
              <CardHeader>
                <CardTitle>Create New Eco Program</CardTitle>
                <CardDescription>
                  Launch new environmental incentive programs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Program Name</label>
                    <Input placeholder="Enter program name" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Bonus Type</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="co2_reduction">CO₂ Reduction</SelectItem>
                        <SelectItem value="electric_ride">Electric Vehicle</SelectItem>
                        <SelectItem value="bike_share">Bike Share Integration</SelectItem>
                        <SelectItem value="carpooling">Carpooling</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Reward Points</label>
                    <Input type="number" placeholder="Points per action" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Duration</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Program duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ongoing">Ongoing</SelectItem>
                        <SelectItem value="1month">1 Month</SelectItem>
                        <SelectItem value="3months">3 Months</SelectItem>
                        <SelectItem value="6months">6 Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea placeholder="Describe the program and its environmental impact..." />
                  </div>
                  <div className="md:col-span-2">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Launch Eco Program
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Referral System Overview</CardTitle>
                <CardDescription>
                  Track referral performance and user acquisition
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {offers.find(o => o.type === 'referral')?.usageCount || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Successful Referrals</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">$1,240</div>
                    <div className="text-sm text-muted-foreground">Rewards Distributed</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">67%</div>
                    <div className="text-sm text-muted-foreground">Conversion Rate</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">8.2</div>
                    <div className="text-sm text-muted-foreground">Avg Referrals/User</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create Referral Campaign</CardTitle>
                  <CardDescription>
                    Design new referral codes and incentives
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Campaign Name</label>
                    <Input placeholder="Enter campaign name" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm font-medium">Referrer Reward</label>
                      <Input type="number" placeholder="$10" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Referee Reward</label>
                      <Input type="number" placeholder="$5" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Referral Code</label>
                    <div className="flex gap-2">
                      <Input placeholder="INVITE2024" />
                      <Button variant="outline" onClick={generateReferralCode}>
                        Generate
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Campaign Duration</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1week">1 Week</SelectItem>
                        <SelectItem value="1month">1 Month</SelectItem>
                        <SelectItem value="3months">3 Months</SelectItem>
                        <SelectItem value="ongoing">Ongoing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    Launch Referral Campaign
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Referrers</CardTitle>
                  <CardDescription>
                    Users who bring the most referrals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: "Sarah Johnson", referrals: 24, rewards: "$240" },
                      { name: "Mike Chen", referrals: 18, rewards: "$180" },
                      { name: "Emma Davis", referrals: 15, rewards: "$150" },
                      { name: "Alex Rodriguez", referrals: 12, rewards: "$120" },
                      { name: "Lisa Wang", referrals: 10, rewards: "$100" }
                    ].map((user, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.referrals} referrals</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-green-600">{user.rewards}</div>
                          <div className="text-xs text-muted-foreground">earned</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
