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
  Users, 
  Phone, 
  Calendar,
  Eye,
  Edit,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Lead, Project } from '../../../../shared/types';

export function LeadsListPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLeads();
    fetchProjects();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads');
      const data = await response.json();
      if (data.success) {
        setLeads(data.data.leads || []);
      }
    } catch (error) {
      console.error('Lead\'ler yüklenirken hata:', error);
    } finally {
      setLoading(false);
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

  const startWebRTCCall = async (leadId: number) => {
    try {
      const response = await fetch('/api/calls/outbound', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lead_id: leadId }),
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

  const filteredLeads = leads.filter(lead =>
    lead.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.phone_e164?.includes(searchQuery) ||
    lead.source?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
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
              <p className="mt-2 text-sm text-gray-500">Lead'ler yükleniyor...</p>
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
            <h1 className="text-2xl font-bold">Lead'ler</h1>
            <p className="text-sm text-gray-500">
              Müşteri adaylarını yönetin ve WebRTC ile AI görüşmeleri başlatın
            </p>
          </ToolbarHeading>
          <ToolbarActions>
            <Button asChild>
              <Link to="/crm/leads/new">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Lead
              </Link>
            </Button>
          </ToolbarActions>
        </Toolbar>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Lead ara (isim, telefon, kaynak)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeads.map((lead) => (
            <Card key={lead.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-green-500 mr-3" />
                  <div>
                    <h3 className="font-semibold text-lg">{lead.full_name}</h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(lead.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => startWebRTCCall(lead.id)}
                    title="Kendimi Ara (WebRTC)"
                  >
                    <Phone className="w-4 h-4 text-blue-500" />
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/crm/leads/${lead.id}`}>
                      <Eye className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/crm/leads/${lead.id}/edit`}>
                      <Edit className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {lead.phone_e164 && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    {lead.phone_e164}
                  </div>
                )}

                {lead.project_id && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Proje:</span> {getProjectName(lead.project_id)}
                  </div>
                )}

                {lead.source && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Kaynak:</span> {lead.source}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Badge variant={lead.consent_kvkk ? "default" : "secondary"}>
                    {lead.consent_kvkk ? 'KVKK Onaylı' : 'KVKK Bekliyor'}
                  </Badge>
                  
                  {lead.utm && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/crm/leads/${lead.id}`}>
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <Badge variant="outline">
                    ID: {lead.id}
                  </Badge>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/crm/leads/${lead.id}`}>
                      Detayları Gör
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredLeads.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Henüz lead yok
            </h3>
            <p className="text-gray-500 mb-6">
              İlk lead'inizi oluşturarak başlayın
            </p>
            <Button asChild>
              <Link to="/crm/leads/new">
                <Plus className="w-4 h-4 mr-2" />
                İlk Lead'i Oluştur
              </Link>
            </Button>
          </div>
        )}
      </Container>
    </Fragment>
  );
}
