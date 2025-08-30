import { Fragment, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
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
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  ArrowLeft, 
  Building2,
  Calendar,
  DollarSign,
  MapPin,
  FileText,
  Code,
  Plus,
  Trash2,
  Upload,
  Download
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Project } from '../../../../shared/types';

interface FaqItem {
  question: string;
  answer: string;
}

interface DocumentFile {
  name: string;
  url: string;
  size?: string;
  type: string;
}

export function ProjectFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [project, setProject] = useState<Partial<Project>>({
    name: '',
    description: '',
    price_range: '',
    delivery_date: '',
    address: '',
    docs_url: '',
    faq_json: {}
  });

  const isEditing = !!id;

  useEffect(() => {
    if (isEditing) {
      fetchProject();
    }
  }, [id]);

  // Tema değişikliğini dinle
  useEffect(() => {
    // Tema değiştiğinde component'i yeniden render et
  }, [theme]);

  // FAQ işlemleri
  const addFaqItem = () => {
    setFaqItems([...faqItems, { question: '', answer: '' }]);
  };

  // İlk yüklemede boş FAQ ekle
  useEffect(() => {
    if (!isEditing && faqItems.length === 0) {
      addFaqItem();
    }
  }, [isEditing]);

  const removeFaqItem = (index: number) => {
    setFaqItems(faqItems.filter((_, i) => i !== index));
  };

  const updateFaqItem = (index: number, field: 'question' | 'answer', value: string) => {
    const updatedItems = [...faqItems];
    updatedItems[index][field] = value;
    setFaqItems(updatedItems);
  };

  // Doküman işlemleri
  const addDocument = () => {
    setDocuments([...documents, { name: '', url: '', type: 'pdf' }]);
  };

  // İlk yüklemede boş doküman ekle
  useEffect(() => {
    if (!isEditing && documents.length === 0) {
      addDocument();
    }
  }, [isEditing]);

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const updateDocument = (index: number, field: 'name' | 'url' | 'type', value: string) => {
    const updatedDocs = [...documents];
    updatedDocs[index][field] = value;
    setDocuments(updatedDocs);
  };

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${id}`);
      const data = await response.json();
      if (data.success) {
        const projectData = data.data;
        setProject(projectData);
        
        // Mevcut FAQ'ları yükle
        if (projectData.faq_json && Object.keys(projectData.faq_json).length > 0) {
          const faqArray = Object.values(projectData.faq_json).map((faq: any) => ({
            question: faq.question || '',
            answer: faq.answer || ''
          }));
          setFaqItems(faqArray);
        }
        
        // Mevcut dokümanları yükle
        if (projectData.docs_json && Object.keys(projectData.docs_json).length > 0) {
          const docsArray = Object.values(projectData.docs_json).map((doc: any) => ({
            name: doc.name || '',
            url: doc.url || '',
            type: doc.type || 'pdf'
          }));
          setDocuments(docsArray);
        }
      }
    } catch (error) {
      console.error('Proje yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // FAQ'ları JSON formatına çevir
      const faqJson = faqItems.reduce((acc, faq, index) => {
        if (faq.question && faq.answer) {
          acc[`soru${index + 1}`] = {
            question: faq.question,
            answer: faq.answer
          };
        }
        return acc;
      }, {} as any);

      // Dokümanları JSON formatına çevir
      const docsJson = documents.reduce((acc, doc, index) => {
        if (doc.name && doc.url) {
          acc[`doc${index + 1}`] = {
            name: doc.name,
            url: doc.url,
            type: doc.type
          };
        }
        return acc;
      }, {} as any);

      const projectData = {
        ...project,
        faq_json: faqJson,
        docs_json: docsJson
      };

      const url = isEditing ? `/api/projects/${id}` : '/api/projects';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      const data = await response.json();
      if (data.success) {
        navigate('/crm/projects');
      } else {
        alert('Hata: ' + data.message);
      }
    } catch (error) {
      console.error('Proje kaydedilirken hata:', error);
      alert('Proje kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof Project, value: any) => {
    setProject(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Fragment>
        <PageNavbar />
        <Container>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Proje yükleniyor...</p>
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
              {isEditing ? 'Projeyi Düzenle' : 'Yeni Proje'}
            </h1>
            <p className="text-sm text-gray-500">
              {isEditing ? 'Proje bilgilerini güncelleyin' : 'AI asistanın kullanacağı yeni proje oluşturun'}
            </p>
          </ToolbarHeading>
          <ToolbarActions>
            <Button variant="outline" asChild>
              <Link to="/crm/projects">
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
                  <Building2 className="w-5 h-5 mr-2" />
                  Temel Bilgiler
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Proje Adı *</Label>
                    <Input
                      id="name"
                      value={project.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="Proje adını girin"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Açıklama</Label>
                    <Textarea
                      id="description"
                      value={project.description || ''}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder="Proje açıklamasını girin"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="price_range">Fiyat Aralığı</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="price_range"
                        value={project.price_range || ''}
                        onChange={(e) => handleChange('price_range', e.target.value)}
                        placeholder="Örn: 10.000 - 50.000 TL"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="delivery_date">Teslim Tarihi</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="delivery_date"
                        type="date"
                        value={project.delivery_date || ''}
                        onChange={(e) => handleChange('delivery_date', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Adres</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="address"
                        value={project.address || ''}
                        onChange={(e) => handleChange('address', e.target.value)}
                        placeholder="Proje adresini girin"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Sağ Kolon */}
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Dokümantasyon
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label>Proje Dokümanları</Label>
                                         <div className="space-y-3">
                       {documents.map((doc, index) => (
                         <div key={index} className={`border rounded-lg p-3 ${
                           theme === 'dark' 
                             ? 'bg-zinc-800 border-zinc-700' 
                             : 'bg-gray-50 border-gray-200'
                         }`}>
                           <div className="flex items-center justify-between mb-2">
                             <span className="text-sm font-medium">Doküman {index + 1}</span>
                             <Button
                               type="button"
                               variant="ghost"
                               size="sm"
                               onClick={() => removeDocument(index)}
                               className="text-red-500 hover:text-red-700"
                             >
                               <Trash2 className="w-4 h-4" />
                             </Button>
                           </div>
                           <Input
                             placeholder="Doküman adı (örn: Teknik Şartname)"
                             value={doc.name}
                             onChange={(e) => updateDocument(index, 'name', e.target.value)}
                             className="mb-2"
                           />
                           <Input
                             placeholder="PDF URL (örn: https://example.com/doc.pdf)"
                             value={doc.url}
                             onChange={(e) => updateDocument(index, 'url', e.target.value)}
                             className="mb-2"
                           />
                           <div className="flex items-center space-x-2">
                             <Badge variant="outline" className="text-xs">
                               {doc.type.toUpperCase()}
                             </Badge>
                             <span className={`text-xs ${
                               theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'
                             }`}>
                               AI asistan bu dokümanı müşteriye gönderebilir
                             </span>
                           </div>
                         </div>
                       ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addDocument}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Yeni Doküman Ekle
                      </Button>
                    </div>
                                         <p className={`text-xs mt-2 ${
                       theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'
                     }`}>
                       AI asistan müşteri istediğinde bu dokümanları paylaşabilir
                     </p>
                     
                     {/* AI Entegrasyonu Bilgisi */}
                     <div className={`mt-4 p-3 rounded-lg border ${
                       theme === 'dark' 
                         ? 'bg-blue-900/20 border-blue-700/50' 
                         : 'bg-blue-50 border-blue-200'
                     }`}>
                       <div className="flex items-start space-x-2">
                         <div className={`w-2 h-2 rounded-full mt-2 ${
                           theme === 'dark' ? 'bg-blue-400' : 'bg-blue-500'
                         }`}></div>
                         <div>
                           <h4 className={`text-sm font-medium ${
                             theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
                           }`}>
                             🤖 AI Asistan Entegrasyonu
                           </h4>
                           <p className={`text-xs mt-1 ${
                             theme === 'dark' ? 'text-blue-200' : 'text-blue-600'
                           }`}>
                             Bu dokümanlar WebRTC görüşmelerinde AI asistanın sistem prompt'una dahil edilir. 
                             Müşteri doküman istediğinde AI otomatik olarak bu linkleri paylaşabilir.
                           </p>
                         </div>
                       </div>
                     </div>
                   </div>

                   <div>
                     <Label>SSS (Sık Sorulan Sorular)</Label>
                                         <div className="space-y-3">
                       {faqItems.map((faq, index) => (
                         <div key={index} className={`border rounded-lg p-3 ${
                           theme === 'dark' 
                             ? 'bg-zinc-800 border-zinc-700' 
                             : 'bg-gray-50 border-gray-200'
                         }`}>
                           <div className="flex items-center justify-between mb-2">
                             <span className="text-sm font-medium">Soru {index + 1}</span>
                             <Button
                               type="button"
                               variant="ghost"
                               size="sm"
                               onClick={() => removeFaqItem(index)}
                               className="text-red-500 hover:text-red-700"
                             >
                               <Trash2 className="w-4 h-4" />
                             </Button>
                           </div>
                           <Input
                             placeholder="Soru metni (örn: Proje ne kadar sürer?)"
                             value={faq.question}
                             onChange={(e) => updateFaqItem(index, 'question', e.target.value)}
                             className="mb-2"
                           />
                           <Textarea
                             placeholder="Cevap metni (örn: Proje yaklaşık 3-6 ay sürmektedir)"
                             value={faq.answer}
                             onChange={(e) => updateFaqItem(index, 'answer', e.target.value)}
                             rows={3}
                           />
                         </div>
                       ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addFaqItem}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Yeni Soru Ekle
                      </Button>
                    </div>
                                                              <p className={`text-xs mt-2 ${
                       theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'
                     }`}>
                       AI asistan müşterilerle konuşurken bu soru-cevap çiftlerini kullanır
                     </p>
                     
                     {/* AI Entegrasyonu Bilgisi */}
                     <div className={`mt-4 p-3 rounded-lg border ${
                       theme === 'dark' 
                         ? 'bg-green-900/20 border-green-700/50' 
                         : 'bg-green-50 border-green-200'
                     }`}>
                       <div className="flex items-start space-x-2">
                         <div className={`w-2 h-2 rounded-full mt-2 ${
                           theme === 'dark' ? 'bg-green-400' : 'bg-green-500'
                         }`}></div>
                         <div>
                           <h4 className={`text-sm font-medium ${
                             theme === 'dark' ? 'text-green-300' : 'text-green-700'
                           }`}>
                             💬 AI Asistan SSS Entegrasyonu
                           </h4>
                           <p className={`text-xs mt-1 ${
                             theme === 'dark' ? 'text-green-200' : 'text-green-600'
                           }`}>
                             Bu SSS'ler AI asistanın sistem prompt'una dahil edilir. 
                             Müşteri bu soruları sorduğunda AI otomatik olarak hazır cevapları verebilir.
                           </p>
                         </div>
                       </div>
                     </div>
                   </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Code className="w-5 h-5 mr-2" />
                  Sistem Bilgileri
                </h3>
                
                                 <div className={`space-y-2 text-sm ${
                   theme === 'dark' ? 'text-zinc-300' : 'text-gray-600'
                 }`}>
                   <div className="flex justify-between">
                     <span>Proje ID:</span>
                     <span className="font-mono">{project.id || 'Yeni'}</span>
                   </div>
                   <div className="flex justify-between">
                     <span>Oluşturulma:</span>
                     <span>{project.created_at ? new Date(project.created_at).toLocaleDateString('tr-TR') : '-'}</span>
                   </div>
                 </div>
              </Card>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <Button variant="outline" asChild>
              <Link to="/crm/projects">İptal</Link>
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
