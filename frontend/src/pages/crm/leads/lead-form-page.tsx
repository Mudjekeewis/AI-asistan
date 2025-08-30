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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Save, 
  ArrowLeft, 
  Users,
  Phone,
  Building2,
  Globe,
  FileText,
  Code
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Lead, Project } from '../../../../shared/types';

export function LeadFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [lead, setLead] = useState<Partial<Lead>>({
    full_name: '',
    phone_e164: '',
    source: '',
    consent_kvkk: false,
    consent_text: '',
    project_id: undefined,
    utm: {}
  });

  const isEditing = !!id;

  useEffect(() => {
    fetchProjects();
    if (isEditing) {
      fetchLead();
    }
  }, [id]);

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

  const fetchLead = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/leads/${id}`);
      const data = await response.json();
      if (data.success) {
        setLead(data.data);
      }
    } catch (error) {
      console.error('Lead yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = isEditing ? `/api/leads/${id}` : '/api/leads';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lead),
      });

      const data = await response.json();
      if (data.success) {
        navigate('/crm/leads');
      } else {
        alert('Hata: ' + data.message);
      }
    } catch (error) {
      console.error('Lead kaydedilirken hata:', error);
      alert('Lead kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof Lead, value: any) => {
    setLead(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Fragment>
        <PageNavbar />
        <Container>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Lead yükleniyor...</p>
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
            <h1 className="text-2xl font-bold">
              {isEditing ? 'Lead\'i Düzenle' : 'Yeni Lead'}
            </h1>
            <p className="text-sm text-gray-500">
              {isEditing ? 'Lead bilgilerini güncelleyin' : 'Yeni müşteri adayı oluşturun'}
            </p>
          </ToolbarHeading>
          <ToolbarActions>
            <Button variant="outline" asChild>
              <Link to="/crm/leads">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Geri
              </Link>
            </Button>
          </ToolbarActions>
        </Toolbar>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sol Kolon */}
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Temel Bilgiler
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="full_name">Ad Soyad *</Label>
                    <Input
                      id="full_name"
                      value={lead.full_name}
                      onChange={(e) => handleChange('full_name', e.target.value)}
                      placeholder="Müşteri adayının adı ve soyadı"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone_e164">Telefon</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="phone_e164"
                        value={lead.phone_e164 || ''}
                        onChange={(e) => handleChange('phone_e164', e.target.value)}
                        placeholder="+90 5XX XXX XX XX"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="source">Kaynak</Label>
                    <Select 
                      value={lead.source || undefined} 
                      onValueChange={(value) => handleChange('source', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Lead kaynağını seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="webform">Web Form</SelectItem>
                        <SelectItem value="ads">Reklam</SelectItem>
                        <SelectItem value="social">Sosyal Medya</SelectItem>
                        <SelectItem value="referral">Referans</SelectItem>
                        <SelectItem value="cold">Soğuk Arama</SelectItem>
                        <SelectItem value="other">Diğer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="project_id">Proje</Label>
                    <Select 
                      value={lead.project_id?.toString() || undefined} 
                      onValueChange={(value) => handleChange('project_id', value ? parseInt(value) : undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Proje seçin (opsiyonel)" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            </div>

            {/* Sağ Kolon */}
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  KVKK & Onaylar
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="consent_kvkk"
                      checked={lead.consent_kvkk}
                      onCheckedChange={(checked) => handleChange('consent_kvkk', checked)}
                    />
                    <Label htmlFor="consent_kvkk">KVKK Aydınlatma Metni Onayı</Label>
                  </div>

                  <div>
                    <Label htmlFor="consent_text">KVKK Metni</Label>
                    <Textarea
                      id="consent_text"
                      value={lead.consent_text || ''}
                      onChange={(e) => handleChange('consent_text', e.target.value)}
                      placeholder="KVKK aydınlatma metni..."
                      rows={4}
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  UTM Parametreleri
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="utm_source">UTM Source</Label>
                    <Input
                      id="utm_source"
                      value={(lead.utm as any)?.source || ''}
                      onChange={(e) => handleChange('utm', { ...lead.utm, source: e.target.value })}
                      placeholder="google, facebook, instagram..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="utm_medium">UTM Medium</Label>
                    <Input
                      id="utm_medium"
                      value={(lead.utm as any)?.medium || ''}
                      onChange={(e) => handleChange('utm', { ...lead.utm, medium: e.target.value })}
                      placeholder="cpc, email, social..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="utm_campaign">UTM Campaign</Label>
                    <Input
                      id="utm_campaign"
                      value={(lead.utm as any)?.campaign || ''}
                      onChange={(e) => handleChange('utm', { ...lead.utm, campaign: e.target.value })}
                      placeholder="yaz_kampanyasi_2024..."
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Code className="w-5 h-5 mr-2" />
                  Sistem Bilgileri
                </h3>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Lead ID:</span>
                    <span className="font-mono">{lead.id || 'Yeni'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Oluşturulma:</span>
                    <span>{lead.created_at ? new Date(lead.created_at).toLocaleDateString('tr-TR') : '-'}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <Button variant="outline" asChild>
              <Link to="/crm/leads">İptal</Link>
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Kaydediliyor...' : (isEditing ? 'Güncelle' : 'Oluştur')}
            </Button>
          </div>
        </form>
      </Container>
    </Fragment>
  );
}
