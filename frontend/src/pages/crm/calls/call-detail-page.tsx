import { Fragment, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageNavbar } from '@/pages/account';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
} from '@/partials/common/toolbar';
import { Container } from '@/components/common/container';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Phone, 
  PhoneCall,
  PhoneOff,
  Clock,
  Calendar,
  Users,
  FileText,
  MessageSquare,
  Play,
  Download,
  Copy,
  ExternalLink,
  Building2,
  MapPin,
  DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Call, Lead, Project } from '../../../../shared/types';

export function CallDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [call, setCall] = useState<Call | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCallDetails();
    }
  }, [id]);

  const fetchCallDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/calls/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setCall(data.data);
        
        // Lead bilgilerini getir
        if (data.data.lead_id) {
          const leadResponse = await fetch(`/api/leads/${data.data.lead_id}`);
          const leadData = await leadResponse.json();
          if (leadData.success) {
            setLead(leadData.data);
          }
        }
        
        // Proje bilgilerini getir
        if (data.data.project_id) {
          const projectResponse = await fetch(`/api/projects/${data.data.project_id}`);
          const projectData = await projectResponse.json();
          if (projectData.success) {
            setProject(projectData.data);
          }
        }
      }
    } catch (error) {
      console.error('Görüşme detayları yüklenirken hata:', error);
    } finally {
      setLoading(false);
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
        return <PhoneCall className="w-6 h-6 text-green-500" />;
      case 'completed':
        return <Phone className="w-6 h-6 text-blue-500" />;
      case 'failed':
        return <PhoneOff className="w-6 h-6 text-red-500" />;
      case 'missed':
        return <PhoneOff className="w-6 h-6 text-gray-500" />;
      default:
        return <Phone className="w-6 h-6 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Burada bir toast notification eklenebilir
  };

  const downloadTranscript = () => {
    if (!call?.transcript) return;
    
    const blob = new Blob([call.transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${call.session_id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const joinCall = () => {
    if (call?.session_id) {
      window.open(`/webrtc-client/client.html?call_id=${call.session_id}`, '_blank');
    }
  };

  if (loading) {
    return (
      <Fragment>
        <PageNavbar />
        <Container>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Görüşme detayları yükleniyor...</p>
            </div>
          </div>
        </Container>
      </Fragment>
    );
  }

  if (!call) {
    return (
      <Fragment>
        <PageNavbar />
        <Container>
          <div className="text-center py-12">
            <Phone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Görüşme bulunamadı
            </h3>
            <p className="text-gray-500 mb-6">
              Aradığınız görüşme mevcut değil veya silinmiş olabilir
            </p>
            <Button asChild>
              <Link to="/crm/calls">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Görüşmelere Dön
              </Link>
            </Button>
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
            <div className="flex items-center">
              {getCallStatusIcon(call.status)}
              <div className="ml-3">
                <h1 className="text-2xl font-bold">Görüşme Detayları</h1>
                <p className="text-sm text-gray-500">
                  Session ID: {call.session_id}
                </p>
              </div>
            </div>
          </ToolbarHeading>
          <ToolbarActions>
            <div className="flex items-center space-x-2">
              {call.status === 'active' && (
                <Button onClick={joinCall}>
                  <Play className="w-4 h-4 mr-2" />
                  Görüşmeye Katıl
                </Button>
              )}
              <Button variant="outline" asChild>
                <Link to="/crm/calls">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Geri
                </Link>
              </Button>
            </div>
          </ToolbarActions>
        </Toolbar>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol Kolon - Görüşme Bilgileri */}
          <div className="lg:col-span-2 space-y-6">
            {/* Görüşme Özeti */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Phone className="w-5 h-5 mr-2" />
                Görüşme Bilgileri
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Durum:</span>
                  {getCallStatusBadge(call.status)}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Başlangıç:</span>
                  <span className="text-sm">{formatDate(call.created_at)}</span>
                </div>
                
                {call.duration && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Süre:</span>
                    <span className="text-sm">{formatDuration(call.duration)}</span>
                  </div>
                )}
                
                {call.ended_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Bitiş:</span>
                    <span className="text-sm">{formatDate(call.ended_at)}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Transkript */}
            {call.transcript && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Görüşme Transkripti
                  </h3>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(call.transcript)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Kopyala
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={downloadTranscript}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      İndir
                    </Button>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {call.transcript}
                  </pre>
                </div>
              </Card>
            )}

            {/* Özet */}
            {call.summary && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Görüşme Özeti
                </h3>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm leading-relaxed">
                    {call.summary}
                  </p>
                </div>
              </Card>
            )}

            {/* Tool Calls */}
            {call.tool_calls && call.tool_calls.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <ExternalLink className="w-5 h-5 mr-2" />
                  AI Aksiyonları
                </h3>
                
                <div className="space-y-3">
                  {call.tool_calls.map((toolCall, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{toolCall.function_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {toolCall.status}
                        </Badge>
                      </div>
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                        {JSON.stringify(toolCall.arguments, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sağ Kolon - İlişkili Bilgiler */}
          <div className="space-y-6">
            {/* Müşteri Bilgileri */}
            {lead && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Müşteri Bilgileri
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Ad Soyad:</span>
                    <p className="text-sm">{lead.full_name}</p>
                  </div>
                  
                  {lead.phone_e164 && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Telefon:</span>
                      <p className="text-sm">{lead.phone_e164}</p>
                    </div>
                  )}
                  
                  {lead.source && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Kaynak:</span>
                      <p className="text-sm">{lead.source}</p>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-sm font-medium text-gray-600">KVKK Onayı:</span>
                    <Badge variant={lead.consent_kvkk ? "default" : "secondary"} className="ml-2">
                      {lead.consent_kvkk ? 'Onaylı' : 'Bekliyor'}
                    </Badge>
                  </div>
                  
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link to={`/crm/leads/${lead.id}`}>
                      Müşteri Detayları
                    </Link>
                  </Button>
                </div>
              </Card>
            )}

            {/* Proje Bilgileri */}
            {project && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  Proje Bilgileri
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Proje Adı:</span>
                    <p className="text-sm">{project.name}</p>
                  </div>
                  
                  {project.description && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Açıklama:</span>
                      <p className="text-sm">{project.description}</p>
                    </div>
                  )}
                  
                  {project.price_range && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Fiyat Aralığı:</span>
                      <p className="text-sm flex items-center">
                        <DollarSign className="w-3 h-3 mr-1" />
                        {project.price_range}
                      </p>
                    </div>
                  )}
                  
                  {project.address && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Adres:</span>
                      <p className="text-sm flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {project.address}
                      </p>
                    </div>
                  )}
                  
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link to={`/crm/projects/${project.id}`}>
                      Proje Detayları
                    </Link>
                  </Button>
                </div>
              </Card>
            )}

            {/* Sistem Bilgileri */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Sistem Bilgileri
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Görüşme ID:</span>
                  <span className="font-mono">{call.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Session ID:</span>
                  <span className="font-mono text-xs">{call.session_id}</span>
                </div>
                {call.openai_thread_id && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">OpenAI Thread:</span>
                    <span className="font-mono text-xs">{call.openai_thread_id}</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </Fragment>
  );
}
