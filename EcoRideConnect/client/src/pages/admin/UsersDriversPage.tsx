import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ArrowLeft,
  Search,
  Filter,
  MoreHorizontal,
  UserX,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Mail,
  MapPin,
  Car,
  Star,
  AlertTriangle,
  Shield,
  Eye,
  Edit,
  Trash2,
  Download,
  Plus,
  Users,
  Navigation,
  FileText,
  Ban,
  UserCheck
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'rider' | 'driver';
  status: 'active' | 'suspended' | 'pending';
  joinDate: string;
  lastActive: string;
  totalRides: number;
  rating: number;
  location: string;
  avatar?: string;
  kycStatus?: 'pending' | 'approved' | 'rejected';
  complaints?: number;
  earnings?: number;
  vehicleType?: string;
}

interface Complaint {
  id: string;
  userId: string;
  userName: string;
  type: 'safety' | 'payment' | 'behavior' | 'vehicle' | 'other';
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  assignedTo?: string;
}

export default function UsersDriversPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Mock users data
  const users: User[] = [
    {
      id: 'user_001',
      name: 'Amit Sharma',
      email: 'amit.sharma@email.com',
      phone: '+91 98765 43210',
      type: 'rider',
      status: 'active',
      joinDate: '2024-01-15',
      lastActive: '2024-10-18',
      totalRides: 45,
      rating: 4.8,
      location: 'Bangalore',
      avatar: '/api/avatars/user_001.jpg'
    },
    {
      id: 'user_002',
      name: 'Priya Singh',
      email: 'priya.singh@email.com',
      phone: '+91 87654 32109',
      type: 'driver',
      status: 'active',
      joinDate: '2024-02-10',
      lastActive: '2024-10-18',
      totalRides: 234,
      rating: 4.9,
      location: 'Mumbai',
      kycStatus: 'approved',
      complaints: 2,
      earnings: 125000,
      vehicleType: 'sedan'
    },
    {
      id: 'user_003',
      name: 'Raj Kumar',
      email: 'raj.kumar@email.com',
      phone: '+91 76543 21098',
      type: 'driver',
      status: 'pending',
      joinDate: '2024-10-15',
      lastActive: '2024-10-17',
      totalRides: 0,
      rating: 0,
      location: 'Delhi',
      kycStatus: 'pending',
      complaints: 0,
      earnings: 0,
      vehicleType: 'hatchback'
    },
    {
      id: 'user_004',
      name: 'Sarah Khan',
      email: 'sarah.khan@email.com',
      phone: '+91 65432 10987',
      type: 'rider',
      status: 'suspended',
      joinDate: '2024-03-20',
      lastActive: '2024-10-10',
      totalRides: 89,
      rating: 3.2,
      location: 'Chennai',
      complaints: 3
    }
  ];

  // Mock complaints data
  const complaints: Complaint[] = [
    {
      id: 'complaint_001',
      userId: 'user_002',
      userName: 'Priya Singh (Driver)',
      type: 'safety',
      description: 'Driver was overspeeding and talking on phone during ride',
      status: 'investigating',
      priority: 'high',
      createdAt: '2024-10-17',
      assignedTo: 'Admin Team'
    },
    {
      id: 'complaint_002',
      userId: 'user_004',
      userName: 'Sarah Khan (Rider)',
      type: 'behavior',
      description: 'Rider was rude and used inappropriate language',
      status: 'resolved',
      priority: 'medium',
      createdAt: '2024-10-15'
    },
    {
      id: 'complaint_003',
      userId: 'user_001',
      userName: 'Amit Sharma (Rider)',
      type: 'payment',
      description: 'Payment not received for completed ride',
      status: 'open',
      priority: 'urgent',
      createdAt: '2024-10-18'
    }
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesType = activeTab === 'users' || user.type === activeTab.slice(0, -1);
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getKYCColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSuspendUser = (userId: string) => {
    toast({
      title: "User Suspended",
      description: "User has been suspended successfully",
    });
  };

  const handleApproveKYC = (userId: string) => {
    toast({
      title: "KYC Approved ✅",
      description: "Driver verification has been approved",
    });
  };

  const handleRejectKYC = (userId: string) => {
    toast({
      title: "KYC Rejected",
      description: "Driver verification has been rejected",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setLocation("/admin")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-serif text-2xl font-bold">Users & Drivers Management</h1>
              <p className="text-sm text-muted-foreground">Manage user accounts, KYC verification & complaints</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Users</p>
                <h3 className="text-3xl font-bold text-primary">{users.filter(u => u.type === 'rider').length}</h3>
                <p className="text-xs text-green-600">+12% this month</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Active Drivers</p>
                <h3 className="text-3xl font-bold text-orange-600">{users.filter(u => u.type === 'driver' && u.status === 'active').length}</h3>
                <p className="text-xs text-green-600">+8% this month</p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                <Navigation className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Pending KYC</p>
                <h3 className="text-3xl font-bold text-yellow-600">{users.filter(u => u.kycStatus === 'pending').length}</h3>
                <p className="text-xs text-muted-foreground">Need review</p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                <FileText className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Open Complaints</p>
                <h3 className="text-3xl font-bold text-red-600">{complaints.filter(c => c.status === 'open').length}</h3>
                <p className="text-xs text-red-600">Urgent: {complaints.filter(c => c.priority === 'urgent').length}</p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <TabsList className="grid w-full md:w-auto grid-cols-4">
              <TabsTrigger value="users">All Users</TabsTrigger>
              <TabsTrigger value="riders">Riders</TabsTrigger>
              <TabsTrigger value="drivers">Drivers</TabsTrigger>
              <TabsTrigger value="complaints">Complaints</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>

          {/* Users/Riders/Drivers Tables */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rides</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.location}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">{user.email}</div>
                          <div className="text-sm text-muted-foreground">{user.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {user.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.totalRides}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span>{user.rating.toFixed(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(user.lastActive).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setSelectedUser(user)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>User Details</DialogTitle>
                              </DialogHeader>
                              {selectedUser && (
                                <div className="space-y-4">
                                  <div className="flex items-center gap-4">
                                    <Avatar className="h-16 w-16">
                                      <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
                                      <AvatarFallback>{selectedUser.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                                      <p className="text-muted-foreground">{selectedUser.type}</p>
                                      <Badge className={getStatusColor(selectedUser.status)}>
                                        {selectedUser.status}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">Email</label>
                                      <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Phone</label>
                                      <p className="text-sm text-muted-foreground">{selectedUser.phone}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Location</label>
                                      <p className="text-sm text-muted-foreground">{selectedUser.location}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Join Date</label>
                                      <p className="text-sm text-muted-foreground">{new Date(selectedUser.joinDate).toLocaleDateString()}</p>
                                    </div>
                                  </div>

                                  {selectedUser.kycStatus && (
                                    <div className="border-t pt-4">
                                      <h4 className="font-medium mb-2">KYC Status</h4>
                                      <div className="flex items-center justify-between">
                                        <Badge className={getKYCColor(selectedUser.kycStatus)}>
                                          {selectedUser.kycStatus}
                                        </Badge>
                                        <div className="flex gap-2">
                                          <Button size="sm" onClick={() => handleApproveKYC(selectedUser.id)}>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Approve
                                          </Button>
                                          <Button size="sm" variant="destructive" onClick={() => handleRejectKYC(selectedUser.id)}>
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Reject
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          {user.status !== 'suspended' && (
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => handleSuspendUser(user.id)}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="riders">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rider</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Rides</TableHead>
                    <TableHead>Average Rating</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.filter(u => u.type === 'rider').map((rider) => (
                    <TableRow key={rider.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={rider.avatar} alt={rider.name} />
                            <AvatarFallback>{rider.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{rider.name}</div>
                            <div className="text-sm text-muted-foreground">{rider.location}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">{rider.email}</div>
                          <div className="text-sm text-muted-foreground">{rider.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(rider.status)}>
                          {rider.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{rider.totalRides}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span>{rider.rating.toFixed(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(rider.joinDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="drivers">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rides</TableHead>
                    <TableHead>Earnings</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.filter(u => u.type === 'driver').map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={driver.avatar} alt={driver.name} />
                            <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{driver.name}</div>
                            <div className="text-sm text-muted-foreground">{driver.location}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">{driver.email}</div>
                          <div className="text-sm text-muted-foreground">{driver.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">{driver.vehicleType}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getKYCColor(driver.kycStatus || 'pending')}>
                          {driver.kycStatus || 'pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(driver.status)}>
                          {driver.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{driver.totalRides}</TableCell>
                      <TableCell>₹{driver.earnings?.toLocaleString() || '0'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span>{driver.rating.toFixed(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {driver.kycStatus === 'pending' && (
                            <>
                              <Button size="sm" onClick={() => handleApproveKYC(driver.id)}>
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleRejectKYC(driver.id)}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="complaints">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Complaint ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((complaint) => (
                    <TableRow key={complaint.id}>
                      <TableCell className="font-mono text-sm">{complaint.id}</TableCell>
                      <TableCell className="font-medium">{complaint.userName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {complaint.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(complaint.priority)}>
                          {complaint.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {complaint.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(complaint.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{complaint.assignedTo || 'Unassigned'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setSelectedComplaint(complaint)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-xl">
                              <DialogHeader>
                                <DialogTitle>Complaint Details</DialogTitle>
                              </DialogHeader>
                              {selectedComplaint && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">Complaint ID</label>
                                      <p className="text-sm text-muted-foreground font-mono">{selectedComplaint.id}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">User</label>
                                      <p className="text-sm text-muted-foreground">{selectedComplaint.userName}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Type</label>
                                      <Badge variant="secondary" className="capitalize mt-1">
                                        {selectedComplaint.type}
                                      </Badge>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Priority</label>
                                      <Badge className={getPriorityColor(selectedComplaint.priority) + " mt-1"}>
                                        {selectedComplaint.priority}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium">Description</label>
                                    <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded-lg">
                                      {selectedComplaint.description}
                                    </p>
                                  </div>

                                  <div className="flex gap-2">
                                    <Button className="flex-1">
                                      <UserCheck className="h-4 w-4 mr-2" />
                                      Assign to Me
                                    </Button>
                                    <Button variant="outline" className="flex-1">
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Mark Resolved
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
