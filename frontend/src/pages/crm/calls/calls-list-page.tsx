import { Fragment, useState, useEffect } from 'react';
import { PageNavbar } from '@/pages/account';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
} from '@/partials/common/toolbar';
import { Container } from '@/components/common/container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Phone, 
  PhoneCall,
  PhoneOff,
  Clock,
  Calendar,
  Eye,
  Play,
  Users,
  MessageSquare,
  FileText,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Call, Lead, Project } from '../../../../shared/types';

export function CallsListPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCalls();
    fetchLeads();
    fetchProjects();
  }, []);

  const fetchCalls = async () => {
    try {
      const response = await fetch('/api/calls');
      const data = await response.json();
      if (data.success) {
        setCalls(data.data.calls || []);
      }
    } catch (error) {
      console.error('Görüşmeler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads');
      const data = await response.json();
      if (data.success) {
        setLeads(data.data.leads || []);
      }
    } catch (error) {
      console.error('Lead\'ler yüklenirken hata:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      if (data.success) {
        setProjects(data.data.projects || []);
      }
    } catch (error) {
      console.error('Projeler yüklenirken hata:', error);
    }
  };

  const startNewCall = async () => {
    try {
      const response = await fetch('/api/calls/outbound', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lead_id: null }), // Genel görüşme
      });

      const data = await response.json();
      if (data.success) {
        // Yeni sekmede WebRTC client'ı aç
        window.open(data.data.session_url, '_blank');
      } else {
        alert('Görüşme başlatılırken hata: ' + data.message);
      }
    } catch (error) {
      console.error('WebRTC görüşme başlatılırken hata:', error);
      alert('Görüşme başlatılırken hata oluştu');
    }
  };

  const getCallStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Aktif</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Tamamlandı</Badge>;
      case 'failed':
        return <Badge variant="destructive">Başarısız</Badge>;
      case 'missed':
        return <Badge variant="secondary">Cevapsız</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCallStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <PhoneCall className="w-4 h-4 text-green-500" />;
      case 'completed':
        return <Phone className="w-4 h-4 text-blue-500" />;
      case 'failed':
        return <PhoneOff className="w-4 h-4 text-red-500" />;
      case 'missed':
        return <PhoneOff className="w-4 h-4 text-gray-500" />;
      default:
        return <Phone className="w-4 h-4 text-gray-500" />;
    }
  };

  const filteredCalls = calls.filter(call => {
    const lead = leads.find(l => l.id === call.lead_id);
    const project = projects.find(p => p.id === call.project_id);
    
    return (
      call.session_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      call.status?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getLeadName = (leadId?: number) => {
    if (!leadId) return 'Genel Görüşme';
    const lead = leads.find(l => l.id === leadId);
    return lead?.full_name || 'Bilinmeyen';
  };

  const getProjectName = (projectId?: number) => {
    if (!projectId) return '-';
    const project = projects.find(p => p.id === projectId);
    return project?.name || '-';
  };

  if (loading) {
    return (
      <Fragment>
        <PageNavbar />
        <Container>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Görüşmeler yükleniyor...</p>
            </div>
          </div>
        </Container>
      </Fragment>
    );
  }

  return (
    <Fragment>
      <PageNavbar />
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <h1 className="text-2xl font-bold">Görüşmeler</h1>
            <p className="text-sm text-gray-500">
              WebRTC görüşme geçmişini inceleyin ve yeni görüşmeler başlatın
            </p>
          </ToolbarHeading>
          <ToolbarActions>
            <Button onClick={startNewCall}>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Görüşme
            </Button>
          </ToolbarActions>
        </Toolbar>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Görüşme ara (session ID, müşteri, proje, durum)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredCalls.map((call) => (
            <Card key={call.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  {getCallStatusIcon(call.status)}
                  <div className="ml-3">
                    <h3 className="font-semibold text-lg">
                      {getLeadName(call.lead_id)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Session: {call.session_id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getCallStatusBadge(call.status)}
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/crm/calls/${call.id}`}>
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Button>
                    {call.status === 'active' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => window.open(`/webrtc-client/client.html?call_id=${call.session_id}`, '_blank')}
                        title="Görüşmeye Katıl"
                      >
                        <Play className="w-4 h-4 text-green-500" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{formatDate(call.created_at)}</span>
                </div>
                
                {call.duration && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{formatDuration(call.duration)}</span>
                  </div>
                )}

                {call.lead_id && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{getLeadName(call.lead_id)}</span>
                  </div>
                )}

                {call.project_id && (
                  <div className="flex items-center text-sm text-gray-600">
                    <FileText className="w-4 h-4 mr-2" />
                    <span>{getProjectName(call.project_id)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  {call.transcript && (
                    <div className="flex items-center">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      <span>Transkript mevcut</span>
                    </div>
                  )}
                  {call.summary && (
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      <span>Özet mevcut</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    ID: {call.id}
                  </Badge>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/crm/calls/${call.id}`}>
                      Detayları Gör
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredCalls.length === 0 && (
          <div className="text-center py-12">
            <Phone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Henüz görüşme yok
            </h3>
            <p className="text-gray-500 mb-6">
              İlk WebRTC görüşmenizi başlatarak AI asistanınızı test edin
            </p>
            <Button onClick={startNewCall}>
              <Plus className="w-4 h-4 mr-2" />
              İlk Görüşmeyi Başlat
            </Button>
          </div>
        )}
      </Container>
    </Fragment>
  );
}
